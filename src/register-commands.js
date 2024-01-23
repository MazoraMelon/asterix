require("dotenv").config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: "order",
        description: "Creates an order chat with the devs of Undersea"
    },
    {
        name: "close",
        description: "Close your order chat with the devs of Undersea"
    },
    {
        name: "developer",
        description: "Add a developer of a type to the cat"
    }
];
console.log("Nice")
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
