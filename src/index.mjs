// VERSION 1.0.1

import { config } from 'dotenv';
config();
import fs from 'fs';
import { Client, Events, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder, PermissionsBitField, GuildMemberManager } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import { chat } from './openai.mjs';
import { channel } from 'diagnostics_channel';

import { getDevelopers } from './developer.mjs'; //To add a suitable dev to the order

logToFile("Bot Started up!")
console.log('Current working directory:', process.cwd());
//SUPABASE--------------------------------------------------------------------------------



const supabaseUrl = 'https://rvydqlglkydpzfqhodsl.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)



const client = new Client({
	intents: 
	[
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	] 
	
});


function generateToken() {
    let stringVars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567980';
    let token = '';
  
    for (let i = 0; i < 5; i++) {
      let randomIndex = Math.floor(Math.random() * stringVars.length);
      token += stringVars[randomIndex];
    }

    console.log(token)
    return token;
  }

async function createOrderSupabase(channel_id, customer) {
    try {
        var price = 0
        var currency = "⏣"
        var priority = 3
        var paid = false
        var company = "acf97810-b59e-4fb1-a434-a72484b9b9d0"
        var devs = ""
        var details = "Details not added yet"
        var product = "-----"

        // Add the order to supabase
        const insert = await supabase
            .from('orders')
            .insert({ product, customer, price, currency, priority, paid, company, devs, details, channel_id })
            .select();

        console.log('Supabase Insert Success:', insert.data);
        logToFile(`${customer} created the order #${insert.data[0].id} \t Channel ID: ${channel_id} `)

        return insert
    } catch (error) {
        console.error('Supabase Insert Error:', error.message);
        logToFile(`${customer} failed to create an order due to the error: ${error.message}`)
        return error
    }
}



client.once(Events.ClientReady, readyClient => {
	console.log(`${readyClient.user.tag} is online!`);
    var horizon = client.guilds.cache.get("1175179078110826607")
    client.user.setActivity({ name: 'over the Horizon', type: 3 });
});
client.on("interactionCreate", interaction => {
	if(!interaction.isChatInputCommand()) return;

	switch(interaction.commandName) {
		case "order":
			const create = new ButtonBuilder()
			.setCustomId('create')
			.setLabel('Create An Order')
			.setStyle(ButtonStyle.Primary);


		const row = new ActionRowBuilder()
			.addComponents(create);

			interaction.reply({content: `Want to make an order? Click here!`, components: [row]});
			logToFile(`${interaction.user.username} used the create order command`)
			break;
	}
})
//CREATE ORDER--------------------------------------------------------------------------------------------------
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    switch (interaction.customId) {
        case "create":
            // Create a new channel
            const channel = await interaction.guild.channels.create({
                name: `order-${interaction.user.username}`,
                type: 0,
            });
            let channelID = channel.id;
            let user = interaction.user.username;
            let data = await createOrderSupabase(channelID, user);

            channel.name = `#${data.data[0].id}-${interaction.user.username}`

            await channel.setParent(interaction.guild.channels.cache.find(channel => channel.name === "Orders"));
            let orderID = data.data[0].id;
            await channel.permissionOverwrites.set([
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
                }, {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
                },
            ]);

            await interaction.reply({ content: `Thanks! Your order channel is ready! ${channel}`, ephemeral: true });
            
            await channel.send({ content: `Hi there! ${interaction.user}. Thanks for making an order! Just so you know, I store data about this order on my database!` });
            // const aiMessage = await chat("[System] Customer has made an order, You are now interacting with the customer. Ask them what they are looking for and about their order", channelID, user)
            // await channel.send({ content: aiMessage });
            // Add order to file
            addOrderToFile(channel.id, interaction.user.username, interaction.user.id, orderID);


            /* Send a message in the new order chat */
            

            // Add the user order to supabase

            //setupOrder(channel);
            break;
            
    }
});

//Message in order channel

// Check if they have been pressed
client.on("interactionCreate", async (interaction) => {
    // Check if the buttons from setup have been pressed
    if (interaction.isButton()) {
        const customId = interaction.customId;
        let channel = interaction.channelId
        switch (customId) {
            case "scriptbutton":
                // Name the channel "Script"
                await interaction.channel.setName(`${interaction.user.username}-script`);
                addDeveloper(interaction.channel, "Scripter", interaction);
                break;
            case "modelbutton":
                await interaction.channel.setName(`${interaction.user.username}-model`); 
                addDeveloper(interaction.channel, "Modeler", interaction);
                break;
            case "clothingbutton":
                await interaction.channel.setName(`${interaction.user.username}-clothing`); 
                addDeveloper(interaction.channel, "Clothing", interaction);
                break;
            case "liverybutton":
                await interaction.channel.setName(`${interaction.user.username}-livery`); 
                addDeveloper(interaction.channel, "Liveries", interaction);
                break;
            case "logobutton":
                await interaction.channel.setName(`${interaction.user.username}-logo`); 
                addDeveloper(interaction.channel, "Logo", interaction);
                break;
            default:
                break;
        }
    }
});

async function addDeveloper(channel, type, interaction) {
    let devID = await getDevelopers(type);
    // String the devid
    devID = devID.toString(); 
    console.log(devID)
    const developer = client.users.cache.get(devID);

    if (!developer) {
     console.error(`Developer ${devID} not found`);
    } else {
        await interaction.reply({ content: `This order has been sent to ${developer}!`, ephemeral: true });
    }
    console.log(developer);
}



//ORDER CLOSE----------------------------------------------------------------------------------------------------
client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;

        

        switch (commandName) {
            case "close":
              try {
                let data = await supabase
                .from('orders')
                .select()
                .eq('channel_id', interaction.channelId)
                .single();
            
                if (data.data === null) {
                    console.log("Used in a non order")
                    if (interaction.channel.parent.name === "Orders") {
                        const channel = await interaction.guild.channels.fetch(interaction.channelId);
                        const attachment = new AttachmentBuilder('./src/img/Stripe.png', { name: 'Stripe.png' });
                        await interaction.reply({ content: "This order has been closed!"})
                        await interaction.channel.send( { files: [attachment] })
                        await channel.permissionOverwrites.set([
                            {
                                id: interaction.guild.roles.everyone.id,
                                deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
                            },
                            // {
                            //     id: userid.id,
                            //     deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
                            // },
                            
                        ]);
                        // await userid.send("Your order has been closed! Thanks for working with us!");
                        channel.setParent(interaction.guild.channels.cache.find(channel => channel.name === "Archive"));
                    } else {
                        await interaction.reply({ content:"This is not an order channel", ephemeral: true });
                        logToFile(`${interaction.user.username} tried to close an order in an invalid channel \t ${interaction.channel.name}`)
                    }
                    break;
                }
                var userid = data.data.customer
                console.log(userid)
              } catch (error) {
                console.error('Supabase Select Error:', error.message);
              }
                // Perms
                if (!interaction.member.roles.cache.some(role => role.name === "Developer")) {
                    await interaction.reply({ content:"You do not have permission to use this command", ephemeral: true });
                    break;
                }

                // userid = await client.users.fetch(userid);
                const channel = await interaction.guild.channels.fetch(interaction.channelId);
                await interaction.reply("This order has been closed!")
                logToFile(`${userid} closed the order \t Channel ID: ${interaction.channelId} `)
                await channel.permissionOverwrites.set([
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
                    },
                    // {
                    //     id: userid.id,
                    //     deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
                    // },
                    
                ]);
                // await userid.send("Your order has been closed! Thanks for working with us!");
                channel.setParent(interaction.guild.channels.cache.find(channel => channel.name === "Archive"));
                break;


            default:
                break;
        }
    }
});



//CHARGE CUSTOMER-----------------------------------------------------------------
client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;

        switch (commandName) {
            case "charge":
            // interaction.reply("This feature isn't ready just yet");
            // break;
            // Check the channels user using src/storage/orders.json
            
            // Update the price of the order in supabase

            // Get price from command options

            let price = interaction.options.getNumber('amount');

                if (price < 0 || price > 200) {
                    interaction.reply("The price of your order must be between 0 and 200. And must be incemented by 10. Contact mazora_ for a custom price");
                    break;
                }

            try {
                const data = await supabase
                .from('orders')
                .update({ price:  price })
                .eq('channel_id', interaction.channelId)
                .select();
                console.log('Supabase Payment Update Success:', data);
                var username = data.data[0].customer
            } catch (error) {
                console.error('Supabase Update Error:', error.message);
                await interaction.reply({ content: "This command was used in an invalid channel.", ephemeral: true });
            }
            // Get ht
                // Check if the user already exists in the 'customers' table
                const existingUserData = await supabase
                    .from('customers')
                    .select('*')
                    .eq('discordid', username);

                if (existingUserData.error) {
                    console.error('Supabase Select Error:', existingUserData.error.message);
                    return;
                }


                if (existingUserData.data && existingUserData.data.length > 0) {
                    // User already exists, handle accordingly
                    console.log('User already exists in the table:', existingUserData.data);
                    console.log(existingUserData.data[0].token);
                    let token = existingUserData.data[0].token;


                    // Check if the first letter of the token is an underscore
                    if (token.startsWith('_')) {
                        token = token.slice(1); // Remove the underscore
                        await interaction.channel.send(`Put this token into the payment to pay! ||${token}|| https://www.roblox.com/games/15535791419`);
                        await interaction.reply(` Use this token! :)`);
                    } else {
                        await interaction.reply(`Your account has been linked so this should be easy! Enter this game as: **${token}**! https://www.roblox.com/games/15535791419`);
                    }
                } else {
                    // User doesn't exist, insert the new data

                    let token = generateToken();
                    await interaction.channel.send(`Your account token is ||${token}|| put this into the game to pay! https://www.roblox.com/games/15535791419`);
                    

                    const insert = await supabase
                        .from('customers')
                        .insert([{ discordid: username, token: ("_" + token) }])
                        .select();

                    if (insert.error) {
                        console.error('Supabase Insert Error:', insert.error.message);
                    } else {
                        console.log('Supabase Insert Success:', insert.data);
                    }
                    logToFile(`A payment request was made by ${interaction.user.username} \t Channel ID: ${interaction.channel.id} ${interaction.channel.name}`)
                }
                break;
        }
    }
});


function logToFile(content) {
    // Get the current date and time
    const timestamp = new Date().toISOString();
  
    // Format the log entry
    const logEntry = `${timestamp} - ${content}\n`;
  
    // Append the log entry to the log.txt file
    fs.appendFile('src/storage/log.txt', logEntry, (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
      }
    });
  }
  
function readOrdersFromFile() {
    try {
        const data = fs.readFileSync('src/storage/orders.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading orders file:', err);
        return [];
    }
}
function writeOrdersToFile(orders) {
    fs.writeFile('src/storage/orders.json', JSON.stringify(orders, null, 4), 'utf8', (err) => {
        if (err) {
            console.error('Error writing orders file:', err);
        } else {
            console.log('Orders written to file successfully.');
        }
    });
}
function addOrderToFile(channel_id, user, user_id, order_id) {
    const orders = readOrdersFromFile();

    const newOrder = { channel_id, user, user_id, order_id };
    orders.push(newOrder);

    writeOrdersToFile(orders);
}

function findUserByChannelId(channel_id) {
    const orders = readOrdersFromFile();
    const order = orders.find(order => order.channel_id === channel_id);
    return order ? order.user_id : null;
}
function findOrderIDByChannelId(channel_id) {
    const orders = readOrdersFromFile();
    const order = orders.find(order => order.channel_id === channel_id);
    return order ? order.order_id : null;
}

// Remove from database command
client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;
    switch (commandName) {
        case 'remove':

            const username = "mazora_"; // Replace with the actual username


            console.log(`Removing order from ${interaction.channelId}`);
        const channel_id = interaction.channelId;
        // Delete from supabase
        const deleteOrder = await supabase
            .from('orders')
            .delete()
            .eq('channel_id', channel_id)
            .select();

        if (deleteOrder.error) {
            console.error('Supabase Delete Error:', deleteOrder.error.message);
            interaction.reply({ content: 'Faild to remove order from database.', ephemeral: false });
        } else {
            console.log('Supabase Delete Success:', deleteOrder.data);
            interaction.reply({ content: 'Order was successfully removed from database.', ephemeral: false });
}}}});

client.on('interactionCreate', async interaction => {
    // On send command
    if (interaction.isCommand()) {
        const { commandName } = interaction;
        switch (commandName) {
            case 'send':
                // Only allow the user mazora_ to use this command
                if (interaction.user.username !== 'mazora_') {
                    interaction.reply({ content: 'You are not authorized to use this command. :slight_smile:', ephemeral: true });
                    break;
                }
                interaction.reply({ content: 'Sending Message', ephemeral: true });
                let message = interaction.options.getString('message');
                interaction.channel.send({ content: message });
        }
    }
})
// ----------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------AI-MODULE----------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;


        fs.appendFileSync('src/storage/messages.txt', `${message.channel.name}- ${message.timecreated}- ${message.author.username}: ${message.content}\n`);

    if (message.content == "!file") {
        const attachment = new AttachmentBuilder('./src/img/Stripe.png', { name: 'Stripe.png' });
        await message.channel.send({ files: [attachment]})
        message.delete();
    }

    if (message.channel.parentId === '1196534179605794887') {
        try {
            // await message.channel.sendTyping();
            // console.log(`Sending message ${message.content} in ${message.channel.name}`);
            // const completionMessage = await chat(message.content, message.channel.id);
            // await message.channel.send(completionMessage);
        } catch (error) {
            console.error('Error occurred:', error.message);
        }
    }
})


client.on(Events.MessageUpdate, async (oldmessage, newmessage) => {
    if (oldmessage.author.bot) return;
    fs.appendFileSync('src/storage/messages.txt', `${newmessage.channel.name}- ${newmessage.timecreated}- "${oldmessage}" was edited to "${newmessage}" by ${newmessage.author.username}`);
})

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    // If message is not a reply
    // if (!message.reference) {
    //     return;
    // }
    console.log(`Sending message ${message.content} in ${message.channel.name}`);
    if (message.channel.id === '1205218735829418075') {
        // This is the AI Chat
        let messageContent = await message.content;
        const channel = message.channel;
        console.log(`Received message in ${channel.name}: ${message.content}`);
        await channel.sendTyping();
        try {
            // const completionMessage = await chat(messageContent, channel.id, message.author.username); 
            console.log(`Completion message: ${completionMessage}`);
            await message.channel.send(completionMessage);
        } catch (error) {
            console.error('Error processing message:', error);
            // Handle the error, such as logging or sending an error message to the channel
            await message.channel.send('An error occurred while processing your message.');
        }    }
});

// ----------------------------------------------------------------------------------------------------------------------
// --------------------------------------------Developer Module----------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------

client.on(Events.InteractionCreate, async interaction => {
    switch (interaction.commandName) {
        case 'developer':
            console.log(`Developer button pressed in ${interaction.channel.name}`);
            await interaction.reply({
                content: 'What type of order is this??',
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('scriptbutton')
                                .setLabel('Scripter')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('modelbutton')
                                .setLabel('Modeler')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('clothingbutton')
                                .setLabel('Clothing')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('liverybutton')
                                .setLabel('Liveries')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId('otherbutton')
                                .setLabel('Other')
                                .setStyle(ButtonStyle.Primary),
                        ),
            ],
        })
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    switch (interaction.customId) {
        case 'scriptbutton':
            console.log('Scripter button pressed');
            break;
        case 'modelbutton':
            console.log('Modeler button pressed');
            break;
        case 'clothingbutton':
            console.log('Clothing button pressed');
            break;
        case 'liverybutton':
            console.log('Livery button pressed');
            break;
        case 'otherbutton':
            console.log('Other button pressed');
            break;
    }
})
// ----------------------------------------------------------------------------------------------------------------------
// -----------------------------------------------Clear Tickets----------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------

// Clear Tickets
// Cycle through all of the servers channels and send am essage asking if they want the channel deleted
// If the user says yes, delete the channel
// If the user says no, don't delete the channel


client.on('interactionCreate', async interaction => {
    try {
        if (!interaction.isButton()) return;
        const channel = interaction.channel;
        if (!channel) {
            console.error('Channel is undefined');
            return;
        }
        if (interaction.customId === 'delete') {
            console.log('Deleting channel');
            await channel.delete();
        } else if (interaction.customId === 'no') {
            console.log('Not deleting channel');
            await interaction.reply({ content: 'Channel not deleted' });
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
    }
});

function getUserFromID(id) {
    return client.users.cache.get(id);
}


client.login(process.env.TOKEN);

async function deleteOrdersWithProduct() {
    // Get all orders with the product "-----"
    const { data, error } = await supabase
        .from('orders')
        .delete()
        .match({ product: '-----' });

    if (error) {
        console.error('Supabase Delete Error:', error.message);
    } else {
        console.log('Supabase Delete Success:', data);
    }
}
