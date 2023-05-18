const { SlashCommandBuilder } = require('discord.js');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();


module.exports = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('See your or other users balance')
		.addUserOption(option => option.setName('user').setDescription('The user to display information about.')),
        category: 'currency',
        async execute(interaction) {

        let mention = interaction.options.getUser('user')
        if(mention){
            let mentionAccount = await db.get(`user_${mention.id}.profile`)
            if(!mentionAccount){
            return interaction.reply(`This person doesn't have a profile yet.`)
        }
    }
    else{
        let userAccount = await db.get(`user_${interaction.user.id}.profile`)
        if(!userAccount){
            return interaction.reply(`You need to create a profile first. Type /start to get started!`)
        }
    }
            const user = interaction.options.getUser('user') || interaction.user
            let coin = await db.get(`user_${user.id}.coin`)
            let bank =await db.get(`user_${user.id}.bank`)
    
            const balEmbed = new discord.EmbedBuilder()
                .setTitle(`${user.username}'s balance`)
                .setDescription(`Coin: ${coin}\nBank: ${bank}\nTotal: ${coin + bank}`)
                .setTimestamp()
			
            await interaction.reply({embeds:[balEmbed]})
	},
};