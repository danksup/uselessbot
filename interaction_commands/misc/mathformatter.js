const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('latex')
    .setDescription('Converts LaTeX math expressions to images.')
    .addStringOption(option =>
      option.setName('expression')
        .setDescription('The LaTeX math expression to convert.')
        .setRequired(true)),
        category: 'miscellaneous',
  async execute(interaction) {
    interaction.reply('coming soon')
  },
};
