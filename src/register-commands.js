require("dotenv").config();
const { REST, Routes } = require('discord.js');

const commands = [
    {
        name: "Hey",
        description: "Reply with hey"
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Registering Slash Commands...");
        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                 process.env.GUILD_ID),
            { body: commands }
        )
        console.log("Slash commands were registered");
    } catch (error) {
        console.error(`Error registering slash commands: ${error.message}`);
    }
})();
