const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { bypassUsersID } = require('../../bypassperms.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('push-announcement')
        .setDescription('push announcement')
        .addStringOption( option => option.setName('string').setDescription('string').setRequired(true)),
    async execute(interaction) {
        let string = interaction.options.getString('string')

        let announcementdb =  await db.get(`announcement`);
        if (!bypassUsersID.includes(interaction.user.id)) {
            return interaction.reply('You have no permission to use this');
        } else {
            const confirmationEmbed = new discord.EmbedBuilder()
                .setTitle("Confirmation")
                .setDescription(`Are you sure you want to announce: \n${string}`);

            const row = new discord.ActionRowBuilder()
                .addComponents(
                    new discord.ButtonBuilder()
                        .setCustomId('confirm-announcement')
                        .setLabel('Yes')
                        .setStyle('Success'),
                    new discord.ButtonBuilder()
                        .setCustomId('cancel-announcement')
                        .setLabel('No')
                        .setStyle('Secondary')
                );
            const msg = await interaction.reply({ embeds: [confirmationEmbed], components: [row] });
                
            let status = 'expired'; 
                
            const filter = i => i.customId === 'confirm-announcement' || i.customId === 'cancel-announcement';
                
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
                
            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    // If the interaction is not from the target user, send an ephemeral message saying this is not for them
                    await i.reply({ content: 'This is not for you.', ephemeral: true });
                    return;
                }
                if (i.customId === 'confirm-announcement') {
                    status = 'accepted'; 
                    db.set(`announcement`, string);
                    const successEmbed = new discord.EmbedBuilder()
                        .setTitle("Success")
                        .setDescription(`\`\`\`${string}\`\`\`\n has been announced.`)
                        .setColor("#00FF00");
                    await i.update({ embeds: [successEmbed], components: [] });
                } else if (i.customId === 'cancel-announcement') {
                    status = 'cancelled'; 
                    const cancelEmbed = new discord.EmbedBuilder()
                        .setTitle("Cancelled")
                        .setDescription(`Announcement is cancelled`)
                        .setColor("#FF0000");
                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });
                
            collector.on('end', async collected => {
                if (msg.deleted) return;
                if (status === 'accepted') {
                    const cancelEmbed = new discord.EmbedBuilder()
                        .setTitle("Success")
                        .setDescription(`\`\`\`${string}\`\`\`\n has been announced.`)
                        .setColor("#00FF00");
                    await msg.edit({ embeds: [cancelEmbed], components: [] });
                } else if (status === 'cancelled') {
                    const successEmbed = new discord.EmbedBuilder()
                        .setTitle("Cancelled")
                        .setDescription(`Announcement is cancelled`)
                        .setColor("#FF0000");
                    await msg.edit({ embeds: [successEmbed], components: [] });
                } else {
                    const expiredEmbed = new discord.EmbedBuilder()
                        .setTitle("Expired")
                        .setDescription(`Expired as there's no response. Announcement is cancelled`);
                    await msg.edit({ embeds: [expiredEmbed], components: [] });
                }
            })
        }
    }
}
