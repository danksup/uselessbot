const { SlashCommandBuilder } = require('discord.js');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ms = require('ms')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('beg')
		.setDescription('Beg to get some coins'),
        category: 'currency',
	async execute(interaction) {
        let userAccount = await db.get(`user_${interaction.user.id}.profile`)
        if(!userAccount){
            return interaction.reply(`You need to create a profile first. Type /start to get started!`)
        }
        const timeout = 35000; 
	    const cooldown = await db.get(`user_${userAccount.id}.cooldown_beg`);

	if (cooldown !== null && timeout - (Date.now() - cooldown) > 0) {
		const time = ms(timeout - (Date.now() - cooldown));
		return interaction.reply(`Sorry you must wait **${time}** before using this command again!`);
	} else {
        const user = interaction.user
        let coin = Math.floor(Math.random() * (2000 - 100 + 1) + 100);
        db.add(`user_${user.id}.coin`, coin)
        const begEmbed = new discord.EmbedBuilder()
        .setTitle(`${user.username}`)
        .setDescription(`You have begged and recieved ${coin} coins`)
        .setTimestamp()
        await interaction.reply({embeds:[begEmbed]})
		db.set(`user_${userAccount.id}.cooldown_beg`, Date.now());
        }
	},
};