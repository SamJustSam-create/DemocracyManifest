const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadData, saveData } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('messagelimit')
    .setDescription('Manage daily message limits for users')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addStringOption((opt) =>
      opt
        .setName('action')
        .setDescription('What to do')
        .setRequired(true)
        .addChoices(
          { name: 'set', value: 'set' },
          { name: 'remove', value: 'remove' },
          { name: 'modify', value: 'modify' }
        )
    )
    .addUserOption((opt) =>
      opt.setName('user').setDescription('The target user').setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName('amount')
        .setDescription('Maximum messages allowed per day (required for set/modify)')
        .setMinValue(1)
    ),

  async execute(interaction) {
    const action = interaction.options.getString('action');
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guildId;

    const data = loadData('messageLimits');
    if (!data[guildId]) data[guildId] = {};

    const existing = data[guildId][targetUser.id];

    // ── set ──────────────────────────────────────────────────────────────────
    if (action === 'set') {
      if (!amount) {
        return interaction.reply({
          content: 'You must provide an `amount` when using `set`.',
          ephemeral: true,
        });
      }

      if (existing) {
        return interaction.reply({
          content:
            `<@${targetUser.id}> already has a message limit of **${existing.limit}** messages/day. ` +
            `Use \`/messagelimit modify\` to change it.`,
          ephemeral: true,
        });
      }

      data[guildId][targetUser.id] = { limit: amount, count: 0, timedOut: false };
      saveData('messageLimits', data);

      return interaction.reply({
        content: `Set a daily message limit of **${amount}** messages for <@${targetUser.id}>.`,
        ephemeral: true,
      });
    }

    // ── modify ───────────────────────────────────────────────────────────────
    if (action === 'modify') {
      if (!amount) {
        return interaction.reply({
          content: 'You must provide an `amount` when using `modify`.',
          ephemeral: true,
        });
      }

      if (!existing) {
        return interaction.reply({
          content:
            `<@${targetUser.id}> doesn't have a message limit yet. ` +
            `Use \`/messagelimit set\` to create one.`,
          ephemeral: true,
        });
      }

      const oldLimit = existing.limit;
      data[guildId][targetUser.id].limit = amount;
      saveData('messageLimits', data);

      return interaction.reply({
        content: `Updated message limit for <@${targetUser.id}> from **${oldLimit}** → **${amount}** messages/day.`,
        ephemeral: true,
      });
    }

    // ── remove ───────────────────────────────────────────────────────────────
    if (action === 'remove') {
      if (!existing) {
        return interaction.reply({
          content: `<@${targetUser.id}> doesn't have a message limit.`,
          ephemeral: true,
        });
      }

      delete data[guildId][targetUser.id];
      saveData('messageLimits', data);

      return interaction.reply({
        content: `Removed the message limit from <@${targetUser.id}>.`,
        ephemeral: true,
      });
    }
  },
};
