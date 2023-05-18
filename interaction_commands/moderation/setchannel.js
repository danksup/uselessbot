const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription('Set the channel for welcome messages')
        .addChannelOption(option => option.setName('channel').setDescription('The channel for welcome messages').setRequired(true)),
    async execute(interaction) {
        try {
            const channel = interaction.options.getChannel('channel');

            if (!channel) {
                return await interaction.reply('Please mention the channel first');
            }

            db.set(`welchannel_${interaction.guildId}`, channel.id);

            return await interaction.reply(`${channel} is now set as the welcome channel.`);
        } catch (error) {
            console.error(error);
        }
    },
};
