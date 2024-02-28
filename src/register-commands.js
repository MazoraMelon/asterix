require("dotenv").config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: "order",
        description: "Create an order with the Horizon team"
    },
    {
        name: "close",
        description: "Close an order with the Horizon team"
    },
    {
        name: "developer",
        description: "Add a developer of a type to the chat"
    },
    {
        name: "charge",
        description: "Charge the customer using Horizon Pay",
        options: [
            {
                name: "amount",
                description: "Amount of credits to charge",
                type: ApplicationCommandOptionType.Number,
                required: true
            }
        ]
    },
    {
        name: "closesupport",
        description: "Close a support ticket"
    },
    {
        name: "remove",
        description: "Remove the order from the Horizon database"
    },
    {
        name: "send",
        description: "Send a message in the channel",
        options: [
            {
                name: "message",
                description: "The message to send",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
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
