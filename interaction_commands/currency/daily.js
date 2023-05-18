const { SlashCommandBuilder } = require('discord.js');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ms = require('ms')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('daily')
		.setDescription('Claim your daily to get some coins'),
        category: 'currency',
	async execute(interaction) {
		let userAccount = await db.get(`user_${interaction.user.id}.profile`)
        if(!userAccount){
            return interaction.reply(`You need to create a profile first. Type /start to get started!`)
        }
        const timeout = 86400000; 
	    const cooldown = await db.get(`user_${userAccount.id}.cooldown_daily`);

	if (cooldown !== null && timeout - (Date.now() - cooldown) > 0) {
		const time = ms(timeout - (Date.now() - cooldown));
		interaction.reply(`Sorry you must wait **${time}** before using this command again!`);
	} else {
        const user = interaction.user
        let coin = 20000;
        db.add(`user_${user.id}.coin`, coin)
        const dailyEmbed = new discord.EmbedBuilder()
        .setTitle(`${user.username}`)
        .setDescription(`you claimed your daily and recieved ${coin} coins`)
        .setTimestamp()
        interaction.reply({embeds:[dailyEmbed]})
		db.set(`user_${userAccount.id}.cooldown_daily`, Date.now());
        }
	},
};