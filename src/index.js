require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ── Validate environment ───────────────────────────────────────────────────────
if (!process.env.DISCORD_TOKEN) {
  console.error('[Error] DISCORD_TOKEN is not set. Check your .env file.');
  process.exit(1);
}
if (!process.env.CLIENT_ID) {
  console.error('[Error] CLIENT_ID is not set. Check your .env file.');
  process.exit(1);
}

// ── Create client ──────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// ── Load commands ──────────────────────────────────────────────────────────────
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[Warning] ${file} is missing "data" or "execute" — skipped.`);
  }
}

// ── Load events ────────────────────────────────────────────────────────────────
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  const handler = (...args) => event.execute(...args, client);
  if (event.once) {
    client.once(event.name, handler);
  } else {
    client.on(event.name, handler);
  }
}

// ── Login ──────────────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error('[Error] Failed to log in:', err.message);
  process.exit(1);
});
