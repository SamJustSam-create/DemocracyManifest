# DemocracyManifest

## Commands

| Command | Who can use | Description |
|---|---|---|
| `/messagelimit [set/remove/modify] [user] [amount]` | Moderators | Manage a user's daily message limit. On limit reached: 24 h timeout. Counts reset at midnight AEST/AEDT. |
| `/curfew [set/remove/modify] [user] [time]` | Moderators | Manage a user's nightly curfew (HH:MM, AEST/AEDT). Timed out at curfew time until 9:00 AM. |
| `/ping` | Everyone | Show bot latency and uptime. |
| `/help` | Everyone | List all commands. |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A Discord application and bot token — create one at [discord.com/developers/applications](https://discord.com/developers/applications)

### Required bot permissions

When adding the bot to your server, ensure it has:
- **Send Messages**
- **Read Message History**
- **Moderate Members** (required for timeouts)

The bot's role must be **above** any role belonging to users you want to moderate.

---

## Local development setup

```bash
# 1. Clone / open the project folder
cd DemocracyManifest

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
```

Edit `.env`:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
GUILD_ID=your_test_guild_id_here   # set this for instant command registration during dev
```

```bash
# 4. Register slash commands with Discord (run once, then re-run when you change commands)
npm run register

# 5. Start the bot (with auto-restart on file changes)
npm run dev

# Or without nodemon:
npm start
```

The bot will log in and the scheduler will start automatically.

---

## Railway deployment (production)

### First deployment

1. Push your code to a GitHub repository (make sure `.env` is in `.gitignore` — it is).

2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select this repo.

3. In Railway, open the project → **Variables** tab and add:

   | Variable | Value |
   |---|---|
   | `DISCORD_TOKEN` | Your bot token |
   | `CLIENT_ID` | Your application client ID |
   | `GUILD_ID` | *(leave empty for global commands)* |

4. Railway will auto-detect `npm start` from `package.json` and deploy.

5. Once deployed, run command registration **once** from your local machine with your production token:

   ```bash
   # In your local .env, remove GUILD_ID (or leave it empty) for global commands
   npm run register
   ```

### Persistent data on Railway

To persist data across deploys, add a **Railway Volume**:

1. Railway dashboard → your service → **Volumes** → **Add Volume**.
2. Mount path: `/app/data`
3. Update `src/utils/storage.js` — change the `DATA_DIR` line to:

   ```js
   const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
   ```

4. Add `DATA_DIR=/app/data` to Railway's Variables tab.

---

## Project structure

```
├── src/
│   ├── index.js               # Bot entry point
│   ├── deploy-commands.js     # Slash command registration script
│   ├── commands/
│   │   ├── messagelimit.js    # /messagelimit command
│   │   ├── curfew.js          # /curfew command
│   │   ├── ping.js            # /ping command
│   │   └── help.js            # /help command
│   ├── events/
│   │   ├── ready.js           # Bot ready — starts scheduler
│   │   ├── interactionCreate.js  # Routes slash commands
│   │   └── messageCreate.js   # Counts messages, enforces limits
│   └── utils/
│       ├── storage.js         # JSON read/write helpers
│       ├── timezone.js        # AEST/AEDT (Australia/Sydney) helpers
│       └── scheduler.js       # Daily reset + curfew cron jobs
├── data/                      # Runtime JSON storage (gitignored)
├── .env.example
├── railway.toml
└── package.json
```
