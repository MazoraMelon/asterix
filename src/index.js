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
//ADD DEVELOPER-----------------------------------------------------------------
client.on("interactionCreate", async (interaction) => {
    
})

client.login(process.env.TOKEN);