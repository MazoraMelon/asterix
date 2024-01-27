require('dotenv').config();
const fs = require('fs'); 
const { Client, Events, GatewayIntentBits, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder, permissionOverwrites, PermissionsBitField } = require('discord.js');

logToFile("Bot Started up!")
console.log('Current working directory:', process.cwd());
//SUPABASE--------------------------------------------------------------------------------
const { createClient } = require('@supabase/supabase-js');
const { log } = require('console');
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

			interaction.reply({content: `Create an order`, components: [row]});
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

            await channel.setParent(interaction.guild.channels.cache.find(channel => channel.name === "Orders"));

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
            addOrderToFile(channel.id, interaction.user.username, interaction.user.id);


            // Send a message in the new order chat
            await channel.send({ content: `Hi there! ${interaction.user}. Thanks for making an order! Just so you know, I store data about this order on my database!` });

            // Add the user order to supabase
            let channelID = channel.id;
            let user = interaction.user.username;
            createOrderSupabase(channelID, user)

            // After 3 seconds delete the channel

            break;
            
    }
});

//ORDER CLOSE----------------------------------------------------------------------------------------------------
client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;

        

        switch (commandName) {
            case "close":
                var userid = await findUserByChannelId(interaction.channelId);
                // Perms
                if (!interaction.member.roles.cache.some(role => role.name === "Developer")) {
                    await interaction.reply("You do not have permission to use this command", { ephemeral: true });
                    break;
                }

                if (!userid) {
                    await interaction.reply("Command used in an invalid channel", { ephemeral: true });
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

            interaction.reply("This feature isn't availible just yet");
            break;
                // Check the user roles
                if (!interaction.member.roles.cache.some(role => role.name === "Founder")) {
                    await interaction.reply("You do not have permission to use this command.", { ephemeral: true });
                    break;
                }
            // Check the channels user using src/storage/orders.json
            var userid = await findUserByChannelId(interaction.channelId);

            if (userid === null) {
                await interaction.reply("This command was used in an invalid channel.", { ephemeral: true });
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
    fs.writeFile('src/storage/orders.json', JSON.stringify(orders, null, 3), 'utf8', (err) => {
        if (err) {
            console.error('Error writing orders file:', err);
        } else {
            console.log('Orders written to file successfully.');
        }
    });
}
function addOrderToFile(channel_id, user, user_id) {
    const orders = readOrdersFromFile();

    const newOrder = { channel_id, user, user_id };
    orders.push(newOrder);

    writeOrdersToFile(orders);
}

function findUserByChannelId(channel_id) {
    const orders = readOrdersFromFile();
    const order = orders.find(order => order.channel_id === channel_id);
    return order ? order.user_id : null;
}


client.login(process.env.TOKEN);