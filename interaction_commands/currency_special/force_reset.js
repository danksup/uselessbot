const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { bypassUsersID } = require('../../bypassperms.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forcereset')
        .setDescription('Reset the user\' profile.')
        .addUserOption(option => option.setName('user').setDescription('Target to reset.').setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user')
        if (!bypassUsersID.includes(interaction.user.id)) {
            return interaction.reply('You have no permission to use this');
        } else {
            const confirmationEmbed = new discord.EmbedBuilder()
                .setTitle("Confirmation")
                .setDescription(`Are you sure you want to reset ${user.username}'s profile?`);

            const row = new discord.ActionRowBuilder()
                .addComponents(
                    new discord.ButtonBuilder()
                        .setCustomId('confirm-forcereset')
                        .setLabel('Yes')
                        .setStyle('Danger'),
                    new discord.ButtonBuilder()
                        .setCustomId('cancel-forcereset')
                        .setLabel('No')
                        .setStyle('Secondary')
                );
            const msg = await interaction.reply({ embeds: [confirmationEmbed], components: [row] });
                
            let status = 'expired'; 
                
            const filter = i => i.customId === 'confirm-forcereset' || i.customId === 'cancel-forcereset';
                
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
                
            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    // If the interaction is not from the target user, send an ephemeral message saying this is not for them
                    await i.reply({ content: 'This is not for you.', ephemeral: true });
                    return;
                }
                if (i.customId === 'confirm-forcereset') {
                    status = 'accepted'; 
                    const data = Object.values(await db.all())
                        .filter(entry => entry.id.startsWith(`user_${user.id}`));

                    data.forEach(async entry => {
                        await db.delete(entry.id);
                        //console.log(data.length)
                    });

                    const successEmbed = new discord.EmbedBuilder()
                        .setTitle("Success")
                        .setDescription(`${user.username}'s profile has been reset.`)
                        .setColor("#00FF00");
                    await i.update({ embeds: [successEmbed], components: [] });
                } else if (i.customId === 'cancel-forcereset') {
                    status = 'cancelled'; 
                    const cancelEmbed = new discord.EmbedBuilder()
                        .setTitle("Cancelled")
                        .setDescription(`${user.username}'s profile reset has been cancelled.`)
                        .setColor("#FF0000");
                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });
                
            collector.on('end', async collected => {
                if (msg.deleted) return;
                if (status === 'cancelled') {
                    const cancelEmbed = new discord.EmbedBuilder()
                        .setTitle("Cancelled")
                        .setDescription(`${user.username}'s profile reset has been cancelled.`)
                        .setColor("#FF0000");
                    await msg.edit({ embeds: [cancelEmbed], components: [] });
                } else if (status === 'accepted') {
                    const successEmbed = new discord.EmbedBuilder()
                        .setTitle("Success")
                        .setDescription(`${user.username}'s profile has been reset.`)
                        .setColor("#00FF00");
                    await msg.edit({ embeds: [successEmbed], components: [] });
                } else {
                    const expiredEmbed = new discord.EmbedBuilder()
                        .setTitle("Expired")
                        .setDescription(`${user.username}'s profile reset confirmation has expired.`);
                    await msg.edit({ embeds: [expiredEmbed], components: [] });
                }
            })
        }
    }
}
