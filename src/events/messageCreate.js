const { loadData, saveData } = require('../utils/storage');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignore bots and DMs.
    if (message.author.bot) return;
    if (!message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    const data = loadData('messageLimits');
    const userData = data[guildId]?.[userId];
    if (!userData) return;

    // Already timed out today — nothing more to do.
    if (userData.timedOut) return;

    // Administrators are exempt.
    if (message.member?.permissions.has('Administrator')) return;

    // Increment the message count.
    userData.count = (userData.count ?? 0) + 1;

    if (userData.count >= userData.limit) {
      try {
        await message.member.timeout(24 * 60 * 60 * 1000, `Daily message limit of ${userData.limit} reached`);
        userData.timedOut = true;

        console.log(
          `[MessageLimit] Timed out ${message.author.tag} in "${message.guild.name}" ` +
          `(${userData.count}/${userData.limit} messages)`
        );

        // Attempt a DM notification.
        try {
          await message.author.send(
            `You have used all **${userData.limit}** of your daily messages in **${message.guild.name}**.\n` +
            `You have been timed out for **24 hours**. Your limit resets at midnight (AEST/AEDT).`
          );
        } catch {
          // User has DMs disabled — silently skip.
        }
      } catch (err) {
        console.error(
          `[MessageLimit] Failed to timeout ${message.author.tag} in "${message.guild.name}":`,
          err.message
        );
      }
    }

    saveData('messageLimits', data);
  },
};
