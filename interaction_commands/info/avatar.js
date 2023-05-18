const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { bypassUsersID } = require('../../bypassperms.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Displays avatar of a user.')
        .addUserOption(option => option.setName('user').setDescription('The user to display information about.')),
        category: 'info',
        async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;

        const embed = new discord.EmbedBuilder()
        .setTitle(`${user.username}'s avatar`)
        .setImage(user.displayAvatarURL({size: 2048, dynamic: true}))
        await interaction.reply({ embeds: [embed] });
    },
};
