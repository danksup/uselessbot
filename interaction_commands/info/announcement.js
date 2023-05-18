const { SlashCommandBuilder } = require('discord.js');
const discord = require('discord.js')
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('announcement')
		.setDescription('See the current information about the bot.'),
        category: 'info',
	async execute(interaction) {
		let announcementdb =  await db.get(`announcement`);
        if(!announcementdb){
            await interaction.reply("No announcement exists so far.")
        }else{
            const announcementEmbed = new discord.EmbedBuilder()
            .setTitle('Announcement')
            .setDescription(announcementdb)
            .setTimestamp()
            interaction.reply({embeds: [announcementEmbed]})
        }
	},
};