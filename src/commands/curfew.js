const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadData, saveData } = require('../utils/storage');
const { parseCurfewTime, getSydneyAbbreviation } = require('../utils/timezone');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('curfew')
    .setDescription('Manage curfew times for users (AEST/AEDT — Australia/Sydney)')
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
    .addStringOption((opt) =>
      opt
        .setName('time')
        .setDescription('Curfew time in HH:MM format e.g. 22:00 (AEST/AEDT — required for set/modify)')
    ),

  async execute(interaction) {
    const action = interaction.options.getString('action');
    const targetUser = interaction.options.getUser('user');
    const timeStr = interaction.options.getString('time');
    const guildId = interaction.guildId;
    const tz = getSydneyAbbreviation();

    const data = loadData('curfews');
    if (!data[guildId]) data[guildId] = {};

    const existing = data[guildId][targetUser.id];

    // ── set ──────────────────────────────────────────────────────────────────
    if (action === 'set') {
      if (!timeStr) {
        return interaction.reply({
          content: 'You must provide a `time` when using `set` (e.g. `22:00`).',
          ephemeral: true,
        });
      }

      const parsed = parseCurfewTime(timeStr);
      if (!parsed) {
        return interaction.reply({
          content: 'Invalid time format. Please use HH:MM — for example `22:00` or `21:30`.',
          ephemeral: true,
        });
      }

      if (existing) {
        return interaction.reply({
          content:
            `<@${targetUser.id}> already has a curfew at **${existing.time} ${tz}**. ` +
            `Use \`/curfew modify\` to change it.`,
          ephemeral: true,
        });
      }

      data[guildId][targetUser.id] = {
        time: timeStr,
        hour: parsed.hour,
        minute: parsed.minute,
        lastCurfewDate: null,
      };
      saveData('curfews', data);

      return interaction.reply({
        content:
          `Set a curfew for <@${targetUser.id}> at **${timeStr} ${tz}**.\n` +
          `They will be timed out at that time each night and may chat again at **9:00 AM ${tz}**.`,
        ephemeral: true,
      });
    }

    // ── modify ───────────────────────────────────────────────────────────────
    if (action === 'modify') {
      if (!timeStr) {
        return interaction.reply({
          content: 'You must provide a `time` when using `modify` (e.g. `22:00`).',
          ephemeral: true,
        });
      }

      const parsed = parseCurfewTime(timeStr);
      if (!parsed) {
        return interaction.reply({
          content: 'Invalid time format. Please use HH:MM — for example `22:00` or `21:30`.',
          ephemeral: true,
        });
      }

      if (!existing) {
        return interaction.reply({
          content:
            `<@${targetUser.id}> doesn't have a curfew yet. ` +
            `Use \`/curfew set\` to create one.`,
          ephemeral: true,
        });
      }

      const oldTime = existing.time;
      data[guildId][targetUser.id] = {
        ...existing,
        time: timeStr,
        hour: parsed.hour,
        minute: parsed.minute,
        lastCurfewDate: null,
      };
      saveData('curfews', data);

      return interaction.reply({
        content: `Updated curfew for <@${targetUser.id}> from **${oldTime} ${tz}** → **${timeStr} ${tz}**.`,
        ephemeral: true,
      });
    }

    // ── remove ───────────────────────────────────────────────────────────────
    if (action === 'remove') {
      if (!existing) {
        return interaction.reply({
          content: `<@${targetUser.id}> doesn't have a curfew.`,
          ephemeral: true,
        });
      }

      delete data[guildId][targetUser.id];
      saveData('curfews', data);

      return interaction.reply({
        content: `Removed the curfew from <@${targetUser.id}>.`,
        ephemeral: true,
      });
    }
  },
};
