const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { bypassUsersID } = require('../../bypassperms.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addexp')
        .setDescription('exp.')
        .addIntegerOption(option => option.setName('amount').setDescription('exp.').setRequired(true))
        .addUserOption(option => option.setName('user').setDescription('Target to exp.')),
        
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user
        if(!user){
            interaction.reply('That user can\'t be found.')
        }
        const amount = interaction.options.getInteger('amount');

        if (!bypassUsersID.includes(interaction.user.id)) {
            return interaction.reply('You have no permission to use this');
        } else {
            const confirmationEmbed = new discord.EmbedBuilder()
                .setTitle("Confirmation")
                .setDescription(`Are you sure you want to add ${amount} to ${user.username}'s exp?`);

            const row = new discord.ActionRowBuilder()
                .addComponents(
                    new discord.ButtonBuilder()
                        .setCustomId('confirm-addexp')
                        .setLabel('Yes')
                        .setStyle('Success'),
                    new discord.ButtonBuilder()
                        .setCustomId('cancel-addexp')
                        .setLabel('No')
                        .setStyle('Secondary')
                );
            const msg = await interaction.reply({ embeds: [confirmationEmbed], components: [row] });
                
            let status = 'expired'; 
                
            const filter = i => i.customId === 'confirm-addexp' || i.customId === 'cancel-addexp';
                
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
                
            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    // If the interaction is not from the target user, send an ephemeral message saying this is not for them
                    await i.reply({ content: 'This is not for you.', ephemeral: true });
                    return;
                }
                if (i.customId === 'confirm-addexp') {
                    status = 'accepted'; 
                    db.add(`user_${user.id}.exp`, amount);
                    const successEmbed = new discord.EmbedBuilder()
                        .setTitle("Success")
                        .setDescription(`${amount} exp have been added to ${user.username}'s balance.`)
                        .setColor("#00FF00");
                    await i.update({ embeds: [successEmbed], components: [] });
                } else if (i.customId === 'cancel-addexp') {
                    status = 'cancelled'; 
                    const cancelEmbed = new discord.EmbedBuilder()
                        .setTitle("Cancelled")
                        .setDescription(`No amount is added to ${user.username}'s exp`)
                        .setColor("#FF0000");
                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });
                
            collector.on('end', async collected => {
                if (msg.deleted) return;
                if (status === 'accepted') {
                    const cancelEmbed = new discord.EmbedBuilder()
                        .setTitle("Success")
                        .setDescription(`${amount} exp have been added to ${user.username}'s.`)
                        .setColor("#00FF00");
                    await msg.edit({ embeds: [cancelEmbed], components: [] });
                } else if (status === 'cancelled') {
                    const successEmbed = new discord.EmbedBuilder()
                        .setTitle("Cancelled")
                        .setDescription(`No exp is added to ${user.username}'s`)
                        .setColor("#FF0000");
                    await msg.edit({ embeds: [successEmbed], components: [] });
                } else {
                    const expiredEmbed = new discord.EmbedBuilder()
                        .setTitle("Expired")
                        .setDescription(`Expired as there's no response. No exp is added to ${user.username}'s.`);
                    await msg.edit({ embeds: [expiredEmbed], components: [] });
                }
            })
        }
    }
}
