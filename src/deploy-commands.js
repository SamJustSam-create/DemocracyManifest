/**
 * deploy-commands.js
 *
 * Run this once (or after adding/changing a command) to register slash commands with Discord.
 *
 *   npm run register
 *
 * If GUILD_ID is set in .env, commands are registered to that guild instantly.
 * If GUILD_ID is not set, commands are registered globally (up to 1 hour to propagate).
 */
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error('[Error] DISCORD_TOKEN and CLIENT_ID must be set in .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash command(s)...`);

    if (process.env.GUILD_ID) {
      // Guild-scoped: registers instantly — good for development/testing.
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`Done — commands registered to guild ${process.env.GUILD_ID} (instant).`);
    } else {
      // Global: takes up to 1 hour to appear in all servers — use for production.
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('Done — commands registered globally (up to 1 hour to propagate).');
    }
  } catch (err) {
    console.error('[Error] Failed to register commands:', err);
    process.exit(1);
  }
})();
