const cron = require('node-cron');
const { loadData, saveData } = require('./storage');
const {
  isCurfewActive,
  getMsUntilCurfewEnd,
  getSydneyDateStr,
  getSydneyAbbreviation,
} = require('./timezone');

/**
 * Start all scheduled cron jobs.
 * @param {import('discord.js').Client} client
 */
function startScheduler(client) {
  // Reset message counts and timedOut flags every day at midnight Sydney time.
  cron.schedule('0 0 * * *', resetMessageCounts, {
    timezone: 'Australia/Sydney',
  });

  // Check curfews every minute.
  cron.schedule('* * * * *', () => checkCurfews(client));

  console.log(`[Scheduler] Started — timezone: Australia/Sydney (${getSydneyAbbreviation()})`);
}

/**
 * Reset daily message counts and clear timedOut flags for all tracked users.
 */
function resetMessageCounts() {
  const data = loadData('messageLimits');
  let changed = false;

  for (const guildId of Object.keys(data)) {
    for (const userId of Object.keys(data[guildId])) {
      data[guildId][userId].count = 0;
      data[guildId][userId].timedOut = false;
      changed = true;
    }
  }

  if (changed) {
    saveData('messageLimits', data);
    console.log('[Scheduler] Daily message counts reset');
  }
}

/**
 * Iterate through all guilds and users with curfews.
 * If a user's curfew time has been reached and they haven't been enforced today,
 * time them out until 9:00 AM Sydney time.
 * @param {import('discord.js').Client} client
 */
async function checkCurfews(client) {
  const data = loadData('curfews');
  const todayStr = getSydneyDateStr();
  let changed = false;

  for (const [guildId, users] of Object.entries(data)) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    for (const [userId, curfewData] of Object.entries(users)) {
      // Already enforced today — skip.
      if (curfewData.lastCurfewDate === todayStr) continue;

      // Curfew time not yet reached — skip.
      if (!isCurfewActive(curfewData.hour, curfewData.minute)) continue;

      try {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) continue;

        // Never time out admins.
        if (member.permissions.has('Administrator')) continue;

        const msUntilEnd = getMsUntilCurfewEnd();
        await member.timeout(msUntilEnd, `Curfew (${curfewData.time} ${getSydneyAbbreviation()})`);

        curfewData.lastCurfewDate = todayStr;
        changed = true;

        // Attempt a DM notification.
        try {
          await member.user.send(
            `Your curfew of **${curfewData.time} ${getSydneyAbbreviation()}** has been reached in **${guild.name}**.\n` +
            `You have been timed out and will be able to chat again at **9:00 AM ${getSydneyAbbreviation()}**.`
          );
        } catch {
          // User has DMs disabled — silently skip.
        }

        console.log(
          `[Curfew] Timed out ${member.user.tag} in "${guild.name}" until 9:00 AM ${getSydneyAbbreviation()}`
        );
      } catch (err) {
        console.error(`[Curfew] Failed to timeout user ${userId} in guild ${guildId}:`, err.message);
      }
    }
  }

  if (changed) {
    saveData('curfews', data);
  }
}

module.exports = { startScheduler };
