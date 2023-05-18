const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setmessage')
        .setDescription('Set the message for the welcome channel')
        .addStringOption(option => option.setName('message').setDescription('The welcome message').setRequired(true)),
    async execute(interaction) {
        try {
            const welMessage = interaction.options.getString('message');
            
            if (!welMessage) {
                return await interaction.reply('Please provide the welcome message!');
            }
            
            if (welMessage.length > 512) {
                return await interaction.reply('The message cannot exceed 512 characters!');
            }
            
            db.set(`welmessage_${interaction.guildId}`, welMessage);
            
            return await interaction.reply(`${welMessage} is now set as the welcome message.`);
        } catch (error) {
            console.error(error);
        }
    },
};
