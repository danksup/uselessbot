const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { bypassUsersID } = require('../../bypassperms.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-announcement')
        .setDescription('delete announcement'),
    async execute(interaction) {

        let announcementdb =  await db.get(`announcement`);
        if (!bypassUsersID.includes(interaction.user.id)) {
            return interaction.reply('You have no permission to use this');
        } else if(!announcementdb){
            return interaction.reply("There are no announcement to delete.")
        
        } else {
            const confirmationEmbed = new discord.EmbedBuilder()
                .setTitle("Confirmation")
                .setDescription(`Are you sure you want to delete the current announcement?`);

            const row = new discord.ActionRowBuilder()
                .addComponents(
                    new discord.ButtonBuilder()
                        .setCustomId('confirm-delannouncement')
                        .setLabel('Yes')
                        .setStyle('Success'),
                    new discord.ButtonBuilder()
                        .setCustomId('cancel-delannouncement')
                        .setLabel('No')
                        .setStyle('Secondary')
                );
            const msg = await interaction.reply({ embeds: [confirmationEmbed], components: [row] });
                
            let status = 'expired'; 
                
            const filter = i => i.customId === 'confirm-delannouncement' || i.customId === 'cancel-delannouncement';
                
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
                
            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    // If the interaction is not from the target user, send an ephemeral message saying this is not for them
                    await i.reply({ content: 'This is not for you.', ephemeral: true });
                    return;
                }
                if (i.customId === 'confirm-delannouncement') {
                    status = 'accepted'; 
                    db.delete(`announcement`);
                    const successEmbed = new discord.EmbedBuilder()
                        .setTitle("Success")
                        .setDescription(`Announcement has been deleted.`)
                        .setColor("#00FF00");
                    await i.update({ embeds: [successEmbed], components: [] });
                } else if (i.customId === 'cancel-delannouncement') {
                    status = 'cancelled'; 
                    const cancelEmbed = new discord.EmbedBuilder()
                        .setTitle("Cancelled")
                        .setDescription(`Announcement deletion is cancelled`)
                        .setColor("#FF0000");
                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });
                
            collector.on('end', async collected => {
                if (msg.deleted) return;
                if (status === 'accepted') {
                    const cancelEmbed = new discord.EmbedBuilder()
                        .setTitle("Success")
                        .setDescription(`Announcement has been deleted.`)
                        .setColor("#00FF00");
                    await msg.edit({ embeds: [cancelEmbed], components: [] });
                } else if (status === 'cancelled') {
                    const successEmbed = new discord.EmbedBuilder()
                        .setTitle("Cancelled")
                        .setDescription(`Announcement deletion is cancelled`)
                        .setColor("#FF0000");
                    await msg.edit({ embeds: [successEmbed], components: [] });
                } else {
                    const expiredEmbed = new discord.EmbedBuilder()
                        .setTitle("Expired")
                        .setDescription(`Expired as there's no response. Announcement deletion is cancelled`);
                    await msg.edit({ embeds: [expiredEmbed], components: [] });
                }
            })
        }
    }
}
