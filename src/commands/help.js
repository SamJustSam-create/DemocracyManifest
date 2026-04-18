const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getSydneyAbbreviation } = require('../utils/timezone');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available commands'),

  async execute(interaction) {
    const tz = getSydneyAbbreviation();

    const embed = new EmbedBuilder()
      .setTitle('Available Commands')
      .setColor(0x5865f2)
      .addFields(
        {
          name: '/messagelimit [set/remove/modify] [user] [amount]',
          value:
            '**set** — create a daily message limit. When reached the user is timed out for **24 hours** and counts reset at midnight ' + tz + '.\n' +
            '**modify** — change an existing limit.\n' +
            '**remove** — remove the limit entirely.',
        },
        {
          name: '/curfew [set/remove/modify] [user] [time]',
          value:
            `**set** — create a nightly curfew in **${tz}** time (HH:MM, e.g. \`22:00\`). User is timed out at that time until **9:00 AM ${tz}**.\n` +
            '**modify** — change an existing curfew time.\n' +
            '**remove** — remove the curfew entirely.',
        },
        {
          name: '/ping',
          value: 'Check bot latency and uptime.',
        },
        {
          name: '/help',
          value: 'Show this message.',
        }
      )
      .setFooter({ text: `All times use Australia/Sydney (currently ${tz})` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
