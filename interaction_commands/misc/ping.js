const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Shows the latecy'),
	category: 'miscellaneous',
	async execute(interaction, bot) {
		return interaction.reply(`${bot.ws.ping}ms.`);
	},
};