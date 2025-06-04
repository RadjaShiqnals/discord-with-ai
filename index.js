require('dotenv').config();
const { Client, GatewayIntentBits, Partials, REST, Routes, ApplicationCommandOptionType } = require('discord.js');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const MODEL_NAME = "gemini-2.0-flash-lite"; // Most cost-effective model

// Read allowed guild IDs from environment variable
// Format in .env: ALLOWED_GUILD_IDS=id1,id2,id3
const ALLOWED_GUILD_IDS = process.env.ALLOWED_GUILD_IDS 
    ? process.env.ALLOWED_GUILD_IDS.split(',').map(id => id.trim())
    : [];

// For backward compatibility, add GUILD_ID if it exists
if (process.env.GUILD_ID && !ALLOWED_GUILD_IDS.includes(process.env.GUILD_ID)) {
    ALLOWED_GUILD_IDS.push(process.env.GUILD_ID);
}

// Ensure we have at least one guild ID
if (ALLOWED_GUILD_IDS.length === 0) {
    console.warn('Warning: No allowed guild IDs specified. The bot will not respond to any servers.');
}

// Set proper client options to ensure slash commands work correctly
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Define slash commands - ensure there's only ONE /ask command
const commands = [
    {
        name: 'ask',
        description: 'Ask the AI a question',
        options: [
            {
                name: 'question',
                description: 'The question you want to ask',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    }
    // DO NOT add a second 'ask' command without options here
];

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
        
        console.log('Started registering commands in allowed guilds only.');
        
        // First, get existing commands to check what needs to be cleaned up
        for (const guildId of ALLOWED_GUILD_IDS) {
            const existingCommands = await rest.get(
                Routes.applicationGuildCommands(client.user.id, guildId)
            );
            
            console.log(`Found ${existingCommands.length} existing commands in guild ${guildId}`);
            
            // If there are duplicate commands, delete them all first
            if (existingCommands.length > 1) {
                console.log(`Cleaning up duplicate commands in guild ${guildId}`);
                for (const cmd of existingCommands) {
                    await rest.delete(
                        Routes.applicationGuildCommand(client.user.id, guildId, cmd.id)
                    );
                    console.log(`Deleted command ${cmd.name} (${cmd.id})`);
                }
            }
            
            // Register fresh commands
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guildId),
                { body: commands }
            );
            console.log(`Successfully registered commands in guild ID: ${guildId}`);
        }
        
        // Remove any global commands to ensure bot only works in specific servers
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [] }  // Empty array to remove all global commands
        );
        console.log('Successfully removed all global commands.');
    } catch (error) {
        console.error('Error managing application commands:', error);
    }
    
    console.log(`Bot is ready and restricted to ${ALLOWED_GUILD_IDS.length} specific servers.`);
});

client.on('messageCreate', async message => {
    // Check if message is from an allowed guild
    if (!message.guild || !ALLOWED_GUILD_IDS.includes(message.guild.id)) {
        return; // Silently ignore messages from unauthorized guilds
    }
    
    if (message.author.bot) return;

    const prefix = "!";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ask') {
        if (!args.length) {
            return message.reply('Please provide a question.');
        }
        const prompt = args.join(' ');
        try {
            await message.channel.sendTyping();
            const result = await model.generateContent([prompt], {
                generationConfig,
                safetySettings,
            });
            const response = result.response;
            const text = response.text();
            if (text.length > 2000) {
                const chunks = text.match(/[\s\S]{1,2000}/g) || [];
                for (const chunk of chunks) {
                    await message.reply(chunk);
                }
            } else {
                await message.reply(text);
            }
        } catch (error) {
            console.error('Error generating text with Gemini:', error);
            message.reply('Sorry, I encountered an error trying to answer your question.');
        }
    } else if (command === 'jawa') {
        message.reply("Jawa! Jawa! Jawa!");
    }
});

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    
    // Check if interaction is from an allowed guild
    if (!interaction.guild || !ALLOWED_GUILD_IDS.includes(interaction.guild.id)) {
        // Handle unauthorized guild
        await interaction.reply({
            content: "This bot is restricted to specific servers only.",
            ephemeral: true
        });
        return;
    }
    
    const { commandName, options } = interaction;
    
    if (commandName === 'ask') {
        const question = options.getString('question');
        
        // Ensure question is not empty
        if (!question || question.trim() === '') {
            await interaction.reply({
                content: "Please provide a question to ask.",
                ephemeral: true
            });
            return;
        }
        
        try {
            await interaction.deferReply();
            
            const result = await model.generateContent([question], {
                generationConfig,
                safetySettings,
            });
            
            const response = result.response;
            const text = response.text();
            
            // Format the response to include the original question
            const formattedResponse = `> **Question:** ${question}\n\n**Answer:**\n${text}`;
            
            if (formattedResponse.length > 2000) {
                // Split into multiple messages if too long
                // First chunk should include the question
                const questionPart = `> **Question:** ${question}\n\n**Answer:**\n`;
                const textChunks = text.match(/[\s\S]{1,1950}/g) || []; // Smaller chunks to account for question text
                
                // First message with question and first part of answer
                await interaction.editReply(`${questionPart}${textChunks[0]}`);
                
                // Send remaining chunks as follow-ups
                for (let i = 1; i < textChunks.length; i++) {
                    await interaction.followUp(`**Answer (continued):**\n${textChunks[i]}`);
                }
            } else {
                await interaction.editReply(formattedResponse);
            }
        } catch (error) {
            console.error('Error generating text with Gemini:', error);
            await interaction.editReply(`Sorry, I encountered an error trying to answer your question: "${question}"`);
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});