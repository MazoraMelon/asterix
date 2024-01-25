require('dotenv').config();
const { Client, Events, GatewayIntentBits, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder, permissionOverwrites, PermissionsBitField } = require('discord.js');

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

            await channel.setParent(interaction.guild.channels.cache.find(channel => channel.name === "orders"));

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

            // Send a message in the new order chat
            await channel.send({ content: `Hi there! ${interaction.user}. Thanks for making an order! Just so you know, I store data about this order on my database!` });

            break;
            
    }
});

//ORDER CLOSE----------------------------------------------------------------------------------------------------
client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;

        switch (commandName) {
            case "close":
                const channel = await interaction.guild.channels.cache.find(channel => channel.name === `order-${interaction.user.username}`);
                await interaction.user.send("Your order has been closed! Thanks for working with us!");
                await channel.setParent(interaction.guild.channels.cache.find(channel => channel.name === "archive"));

                await channel.permissionOverwrites.set([
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
                    }, {
                        id: interaction.user.id,
                        deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
                    },
                ]);
                break;

            default:
                break;
        }
    }
});





//SUPABASE--------------------------------------------------------------------------------

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://rvydqlglkydpzfqhodsl.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)


//CHARGE CUSTOMER-----------------------------------------------------------------
client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        const { commandName } = interaction;

        switch (commandName) {
            case "charge":

                let user = "mazora_";

                // Check if the user already exists in the 'customers' table
                const existingUserData = await supabase
                    .from('customers')
                    .select('*')
                    .eq('discordid', user);

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
                        await interaction.user.send(`Put this token into the payment to pay! ||${token}|| https://www.roblox.com/games/16078251436/Admire-Pay`);
                        await interaction.reply(` The user has recieved their payment token, please do not share it! :)`);
                    } else {
                        await interaction.reply(`Your account has been linked so this should be easy! Enter this game as: **${token}**! https://www.roblox.com/games/16078251436/Admire-Pay`);
                    }
                } else {
                    // User doesn't exist, insert the new data

                    let token = generateToken();
                    await interaction.user.send(`Your account token is ||${token}|| put this into the game to pay! https://www.roblox.com/games/16078251436/Admire-Pay`);
                    await interaction.reply(` The customer for this order has recieved a DM of their token, please do not share it! :) https://www.roblox.com/games/16078251436/Admire-Pay`);
                    

                    const insert = await supabase
                        .from('customers')
                        .insert([{ discordid: user, token: ("_" + token) }])
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



client.login(process.env.TOKEN);