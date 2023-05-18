const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { bypassUsersID } = require('../../bypassperms.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forceresetall')
        .setDescription('Reset all user profiles.'),
    async execute(interaction) {
        const user = interaction.options.getUser('user')
        if (!bypassUsersID.includes(interaction.user.id)) {
            return interaction.reply('You have no permission to use this');
        }
        const confirmationEmbed = new discord.EmbedBuilder()
            .setTitle("Confirmation")
            .setDescription("Are you sure you want to reset all user profiles? This action cannot be undone.");

        const row = new discord.ActionRowBuilder()
            .addComponents(
                new discord.ButtonBuilder()
                    .setCustomId('confirm-forceresetall')
                    .setLabel('Yes')
                    .setStyle('Danger'),
                new discord.ButtonBuilder()
                    .setCustomId('cancel-forceresetall')
                    .setLabel('No')
                    .setStyle('Secondary')
            );
        const msg = await interaction.reply({ embeds: [confirmationEmbed], components: [row] });

        let status = 'expired';

        const filter = i => i.customId === 'confirm-forceresetall' || i.customId === 'cancel-forceresetall';

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                // If the interaction is not from the target user, send an ephemeral message saying this is not for them
                await i.reply({ content: 'This is not for you.', ephemeral: true });
                return;
            }
            if (i.customId === 'confirm-forceresetall') {
                status = 'accepted';
                
                const data = Object.values(await db.all())
                .filter(entry => entry.id.startsWith('user_'))
                data.forEach(async entry => {
                    await db.delete(entry.id);
                });

                const successEmbed = new discord.EmbedBuilder()
                    .setTitle("Success")
                    .setDescription("All user profiles have been reset.")
                    .setColor("#00FF00");
                await i.update({ embeds: [successEmbed], components: [] });
            } else if (i.customId === 'cancel-forceresetall') {
                status = 'cancelled';
                const cancelEmbed = new discord.EmbedBuilder()
                    .setTitle("Cancelled")
                    .setDescription("Resetting all user profiles has been cancelled.")
                    .setColor("#FF0000");
                await i.update({ embeds: [cancelEmbed], components: [] });
            }
        });

        collector.on('end', async collected => {
            if (msg.deleted) return;
            if (status === 'cancelled') {
                const cancelEmbed = new discord.EmbedBuilder()
                    .setTitle("Cancelled")
                    .setDescription("Resetting all user profiles has been cancelled.")
                    .setColor("#FF0000");
                await msg.edit({ embeds: [cancelEmbed], components: [] });
            } else if (status === 'accepted') {
                const successEmbed = new discord.EmbedBuilder()
                    .setTitle("Success")
                    .setDescription("All user profiles have been reset.")
                    .setColor("#00FF00");
                await msg.edit({ embeds: [successEmbed], components: [] });
            } else {
                const expiredEmbed = new discord.EmbedBuilder()
                    .setTitle("Expired")
                    .setDescription("Reset all user profiles confirmation has expired.");
                await msg.edit({ embeds: [expiredEmbed], components: [] });
            }
        })
    }
}
