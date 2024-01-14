require('dotenv').config();
const { Client, Events, GatewayIntentBits } = require('discord.js');

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

client.on("messageCreate", (message) => {
	if (message.author.bot) {
		return;
	}

	if(message.content === "Hello") {
		message.reply("Hello");
	}
})

client.login(process.env.TOKEN);