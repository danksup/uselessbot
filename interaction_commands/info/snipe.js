const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('Displays the latest deleted message.'),
        category: 'info',
    async execute(interaction) {
        const snipe = interaction.client.snipes.get(interaction.channel.id);
        if (!snipe) return interaction.reply('There are no recently deleted messages in this channel.');

        const snipeEmbed = new discord.EmbedBuilder()
            .setTitle(snipe.author)
            .setDescription(snipe.content)
            .setTimestamp();

        if (snipe.image) {
            snipeEmbed.setImage(snipe.image);
        }

        return interaction.reply({ embeds: [snipeEmbed] });
    },
};
