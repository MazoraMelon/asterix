import { config } from 'dotenv';
config();
import fs from 'fs';
import { Client, Events, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import { chat } from './openai.mjs';
import { channel } from 'diagnostics_channel';

logToFile("Bot Started up!")
console.log('Current working directory:', process.cwd());
//SUPABASE--------------------------------------------------------------------------------

const supabaseUrl = 'https://rvydqlglkydpzfqhodsl.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)


const developers = [
    {
        userId: '562685530790428692', // Replace with the actual Discord user ID
        username: 'mazora_',
        role: 'Scripter', // You can add additional information like roles
    },
    {
        userId: '694054568417558541', // Replace with another Discord user ID
        username: 'flippyy_',
        role: 'Clothing',
    },
    {
        userId: '993187573553954896', // Replace with another Discord user ID
        username: 'ell1998123',
        role: 'Livery',
    },
    {
        userId: '1038480998876332122', // Replace with another Discord user ID
        username: 'kylan_.',
        role: 'Logo',
    },
    {
        userId: '1114164984499421194', // Replace with another Discord user ID
        username: 'tomextraz',
        role: 'Modeler',
    }
];



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

    if (insert.error) {
        console.error('Supabase Insert Error:', insert.error.message);
        logToFile(`${customer} failed to create an order due to the error: ${insert.error.message}`)
    } else {
        console.log('Supabase Insert Success:', insert.data);
        logToFile(`${customer} created the order #${insert.data[0].id} \t Channel ID: ${channel_id} `)
    }
    return insert
}

client.once(Events.ClientReady, readyClient => {
	console.log(`${readyClient.user.tag} is online!`);
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
            

            // Add order to file
            addOrderToFile(channel.id, interaction.user.username, interaction.user.id, orderID);


            /* Send a message in the new order chat
            await channel.send({ content: `Hi there! ${interaction.user}. Thanks for making an order! Just so you know, I store data about this order on my database!` });
            const aiMessage = await chat("[System] Customer has made an order, can you interact with them please, reply to this message as if you are talking to the customer", channelID, user)
            await channel.send({ content: aiMessage });
            */

            // Add the user order to supabase

            //setupOrder(channel);
            break;
            
    }
});

//Message in order channel
async function setupOrder(channel) {
    const script = new ButtonBuilder()
        .setCustomId('scriptbutton')
        .setLabel('Script')
        .setStyle(ButtonStyle.Primary);
    const model = new ButtonBuilder()
        .setCustomId('modelbutton')
        .setLabel('Model')
        .setStyle(ButtonStyle.Primary);
    const clothing = new ButtonBuilder()
        .setCustomId('clothingbutton')
        .setLabel('Clothing')
        .setStyle(ButtonStyle.Primary);
    const livery = new ButtonBuilder()
        .setCustomId('liverybutton')
        .setLabel('Livery')
        .setStyle(ButtonStyle.Primary);
    const logo = new ButtonBuilder()
        .setCustomId('logobutton')
        .setLabel('Logo')
        .setStyle(ButtonStyle.Primary);

    // Limit the number of components in a single row
    const row = new ActionRowBuilder()
        .addComponents(script, model, clothing, livery, logo); // Adjust as needed

    // Send a message in the channel
    await channel.send({ content: 'What type of order is this?', components: [row] });
    await channel.send("If you are looking for something else like an advert ignore this message")
}
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
                addDeveloper(interaction.channel, "Scripter");
                break;
            case "modelbutton":
                await interaction.channel.setName(`${interaction.user.username}-model`); 
                addDeveloper(interaction.channel, "Modeler");
                break;
            case "clothingbutton":
                await interaction.channel.setName(`${interaction.user.username}-clothing`); 
                addDeveloper(interaction.channel, "Clothing");
                break;
            case "liverybutton":
                await interaction.channel.setName(`${interaction.user.username}-livery`); 
                addDeveloper(interaction.channel, "Livery");
                break;
            case "logobutton":
                await interaction.channel.setName(`${interaction.user.username}-logo`); 
                addDeveloper(interaction.channel, "Logo");
                break;
            default:
                break;
        }
    }
});

async function addDeveloper(channel, type) {
    const developer = developers.find(dev => dev.role === type);
    if (!developer) {
        console.log(`No developer found with type ${type}`);
        return;
    }

    console.log(`Adding ${developer.username} to ${channel.name}`);

    try {
        const developerDiscord = await client.users.fetch(developer.userId);
        console.log(`Fetched user: ${developerDiscord.username} (${developerDiscord.id})`);
        await channel.permissionOverwrites.edit([
            {
                id: developerDiscord,
                allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
            },
        ]);
        channel.send(`Hi ${developer.username}! You have been added to the ${type} channel!`);
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}


// Find out order type






//ORDER CLOSE----------------------------------------------------------------------------------------------------
client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;

        

        switch (commandName) {
            case "close":
                var userid = await findUserByChannelId(interaction.channelId);
                // Perms
                if (!interaction.member.roles.cache.some(role => role.name === "Developer")) {
                    await interaction.reply({ content:"You do not have permission to use this command", ephemeral: true });
                    break;
                }

                if (!userid) {
                    await interaction.reply({ content: "Command used in an invalid channel",  ephemeral: true });
                    break;
                }
                userid = await client.users.fetch(userid);
                const channel = await interaction.guild.channels.fetch(interaction.channelId);
                await interaction.reply("This order has been closed!")
                await channel.permissionOverwrites.set([
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
                    }, {
                        id: userid.id,
                        deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
                    },
                    
                ]);
                await userid.send("Your order has been closed! Thanks for working with us!");
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

            interaction.reply("This feature isn't ready just yet");
            break;
                // Check the user roles
                if (!interaction.member.roles.cache.some(role => role.name === "Founder")) {
                    await interaction.reply({ content: "You do not have permission to use this command.",  ephemeral: true });
                    break;
                }
            // Check the channels user using src/storage/orders.json
            var userid = await findUserByChannelId(interaction.channelId);

            if (userid === null) {
                await interaction.reply({ content: "This command was used in an invalid channel.", ephemeral: true });
                console.log("Null")
                break;
            }
            userid = await client.users.fetch(userid);
            username = userid.username;
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

                    console.log(userid.username)
                    // Check if the first letter of the token is an underscore
                    if (token.startsWith('_')) {

                        token = token.slice(1); // Remove the underscore
                        await userid.send(`Put this token into the payment to pay! ||${token}|| https://www.roblox.com/games/16078251436/Admire-Pay`);
                        await interaction.reply(` The user has recieved their payment token, please do not share it! :)`);
                    } else {
                        await interaction.reply(`Your account has been linked so this should be easy! Enter this game as: **${token}**! https://www.roblox.com/games/16078251436/Admire-Pay`);
                    }
                } else {
                    // User doesn't exist, insert the new data

                    let token = generateToken();
                    await userid.send(`Your account token is ||${token}|| put this into the game to pay! https://www.roblox.com/games/16078251436/Admire-Pay`);
                    await interaction.reply(` The customer for this order has recieved a DM of their token, please do not share it! :) https://www.roblox.com/games/16078251436/Admire-Pay`);
                    

                    const insert = await supabase
                        .from('customers')
                        .insert([{ discordid: username, token: ("_" + token) }])
                        .select();

                    if (insert.error) {
                        console.error('Supabase Insert Error:', insert.error.message);
                    } else {
                        console.log('Supabase Insert Success:', insert.data);
                    }
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

            // Check if the user executing the command is "mazora_"
            if (interaction.user.username !== username) {
                await interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
                return; // Exit the function if the user is not "mazora_"
            }

            console.log(`Removing order from ${interaction.channelId}`);
        const channel_id = interaction.channelId;
        const orderID = findOrderIDByChannelId(channel_id);
        interaction.reply({ content: 'Order removing', ephemeral: true });
        // Delete from supabase
        const deleteOrder = await supabase
            .from('orders')
            .delete()
            .eq('id', orderID)
            .select();

        if (deleteOrder.error) {
            console.error('Supabase Delete Error:', deleteOrder.error.message);
        } else {
            console.log('Supabase Delete Success:', deleteOrder.data);
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

/* client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    // If the message channel category is in orders
    if (message.channel.parentId === '1205573955029565440') {
        await message.channel.sendTyping();
        console.log(`Sending message ${message.content} in ${message.channel.name}`);
        const completionMessage = await chat(message.content, message.channel.id);
        await message.channel.send(completionMessage);
    }
})
*/

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    // If message is not a reply
    // if (!message.reference) {
    //     return;
    // }
    if (message.channel.id === '1205218735829418075') {
        // This is the AI Chat
        const channel = message.channel;
        console.log(`Received message in ${channel.name}: ${message.content}`);
        await channel.sendTyping();
        try {
            const completionMessage = await chat(message.content, channel.id, message.author.username);
            await message.channel.send(completionMessage);
        } catch (error) {
            console.error('Error processing message:', error);
            // Handle the error, such as logging or sending an error message to the channel
            await message.channel.send('An error occurred while processing your message.');
        }    }
});

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
