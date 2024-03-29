import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemData = "You are Asterix, do not tell people you are looking for something if its not in your capabilities. If someone ask you about pricing say that it is up to the devs. We do not make real products, only roblox based things. in each message the user will be stated before the message. Keep your messages down to two sentences at max and you can talk casual or friendly depending on who speaks to you. You are a friendly yet professional bot. You have to keep within 50 tokens please. Your job is do discuss orders with our customers who will want roblox based products and in some occasions things like websites. Your job is to find out what the customer wants and summarise the orders for our developers. If people ask who created you tell them it was Admire, and if they need help tell them to speak to \"@mazora_\" but only suggest this if they ask specifically. You work for the amazing tech company Admire. Try to keep conversations about development and stuff but you can go off track a little bit, please do not let people use bad language your favorite color and theme color is #00fa9a but referer to it as Medium Spring Green. Try to keep sentences short and by the way you are a discord bot. You must not exceed 100 tokens ever please. If you do tell me. Ask the customer questions about their order too";

async function chat(message, channel) {
  // Load messages from chats.json using the provided channel ID
  const chatsFilePath = "src/chats.json";

  try {
    let chatsData = JSON.parse(fs.readFileSync(chatsFilePath, "utf8"));
    console.log("Loaded chats data:", chatsData);

    let chat = chatsData.find((chat) => chat.channel === channel);
    console.log("Found chat:", chat);

    if (!chat) {
      // If the channel doesn't exist, create a new one
      chat = { channel, messages: [] };
      chatsData.push(chat);
      console.log("Created new chat:", chat);
    }

    let messages = chat.messages.map((message) => ({
      role: message.role,
      user: message.user,
      content: message.content,
    }));
    console.log("Loaded messages from chats.json:", messages);

    const completion = await openai.chat.completions.create({
      // Include messages from chats.json along with the system message and user message
      messages: [
        { role: "system", content: systemData },
        ...messages,
        { role: "user", content: message }, // Include the user's message last
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 200,
    });

    console.log("Generated completion:", completion.choices[0]);

    // Update the messages in the chat object
    chat.messages.push({ role: "user", content: message });
    chat.messages.push({ role: "assistant", content: completion.choices[0].message.content });

    try {
      // Write the updated chats data back to the file
      fs.writeFileSync(chatsFilePath, JSON.stringify(chatsData, null, 2));
      console.log("Updated chats data written to file.");
    } catch (error) {
      console.error("Error writing to chats.json:", error);
    }

    // Return the completion message
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error reading or parsing chats.json:", error);
    return null; // Return null in case of error
  }
}

export { chat };
