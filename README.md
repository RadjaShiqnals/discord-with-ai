# Discord AI Assistant Bot

A Discord bot that uses Google's Gemini AI to respond to user queries with both text and image capabilities.

## 🌟 Features

- `/ask` slash command to ask questions to Gemini AI
- Traditional `!ask` prefix command support
- Special commands like `!jawa` for custom responses
- Server restriction to only work in authorized Discord servers
- Response formatting with the original question included
- Support for long responses split into multiple messages

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.9.0 or higher)
- A Discord account with a [registered application](https://discord.com/developers/applications)
- A [Google AI Studio](https://makersuite.google.com/app/apikey) API key for Gemini

### Installation

1. Clone the repository
```bash
git clone https://github.com/RadjaShiqnals/discord-with-ai.git
cd discord-with-ai
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your credentials
nano .env  # or use your favorite text editor
```

4. Configure the `.env` file with your tokens and server IDs
```
DISCORD_BOT_TOKEN="your_discord_bot_token_here"
GEMINI_API_KEY="your_gemini_api_key_here"
ALLOWED_GUILD_IDS="server_id_1,server_id_2,server_id_3"
```

5. Start the bot
```bash
node index.js
```

## 💻 Usage

### Slash Commands

- `/ask question:[your question]` - Ask a question to the AI

### Prefix Commands

- `!ask [your question]` - Ask a question to the AI
- `!jawa` - Get a custom response from the bot

## ⚙️ Configuration

### Environment Variables

| Variable | Description |
| --- | --- |
| `DISCORD_BOT_TOKEN` | Your Discord bot token |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `GUILD_ID` | (Legacy) Single allowed server ID |
| `ALLOWED_GUILD_IDS` | Comma-separated list of allowed server IDs |

### AI Model Configuration

The bot uses the `gemini-2.0-flash-lite` model, which is the most cost-effective option for general text generation. Model parameters can be adjusted in the `generationConfig` object in `index.js`.

## 🔒 Security

- The bot is restricted to specific Discord servers defined in your environment variables
- Safety settings are implemented to prevent harmful content
- Environment variables are used for sensitive information and not committed to the repository

## 📚 Dependencies

- [discord.js](https://discord.js.org/) - Discord API client
- [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) - Google's Gemini AI interface
- [dotenv](https://www.npmjs.com/package/dotenv) - Environment variable management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👨‍💻 Author

- **RadjaShiqnals** - [GitHub Profile](https://github.com/RadjaShiqnals)

## 🙏 Credits

- [Google Gemini AI](https://ai.google.dev/) for the powerful AI model
- [Discord.js](https://discord.js.org/) for the Discord API wrapper
- [GitHub Copilot](https://github.com/features/copilot) for assistance in development

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## ⚠️ Disclaimer

This bot uses AI-generated content. While safety measures are in place, the bot may occasionally produce unexpected or inaccurate responses. Always review AI-generated content before making important decisions based on it.
