const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reset your currency profile.'),
        category: 'currency',
    async execute(interaction) {
        const userAccount = await db.get(`user_${interaction.user.id}`);
        if (!userAccount) {
            return interaction.reply(`You need to create a profile first. Type /start to get started!`);
        }
            const confirmationEmbed = new discord.EmbedBuilder()
                .setTitle("Confirmation")
                .setDescription(`Are you sure you want to reset your profile?`);

            const row = new discord.ActionRowBuilder()
                .addComponents(
                    new discord.ButtonBuilder()
                        .setCustomId('confirm-reset')
                        .setLabel('Yes')
                        .setStyle('Danger'),
                    new discord.ButtonBuilder()
                        .setCustomId('cancel-reset')
                        .setLabel('No')
                        .setStyle('Secondary')
                );
            const msg = await interaction.reply({ embeds: [confirmationEmbed], components: [row] });
                
            let status = 'expired'; 
                
            const filter = i => i.customId === 'confirm-reset' || i.customId === 'cancel-reset';
                
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
                
            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    // If the interaction is not from the target user, send an ephemeral message saying this is not for them
                    await i.reply({ content: 'This is not for you.', ephemeral: true });
                    return;
                }
                if (i.customId === 'confirm-reset') {
                    status = 'accepted'; 
                    const data = Object.values(await db.all())
                        .filter(entry => entry.id.startsWith(`user_${interaction.user.id}`));

                    data.forEach(async entry => {
                        await db.delete(entry.id);
                        //console.log(data.length)
                    });

                    const successEmbed = new discord.EmbedBuilder()
                        .setTitle("Success")
                        .setDescription(`Your profile has been reset.`)
                        .setColor("#00FF00");
                    await i.update({ embeds: [successEmbed], components: [] });
                } else if (i.customId === 'cancel-reset') {
                    status = 'cancelled'; 
                    const cancelEmbed = new discord.EmbedBuilder()
                        .setTitle("Cancelled")
                        .setDescription(`Your profile reset has been cancelled.`)
                        .setColor("#FF0000");
                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });
                
            collector.on('end', async collected => {
                if (msg.deleted) return;
                if (status === 'cancelled') {
                    const cancelEmbed = new discord.EmbedBuilder()
                        .setTitle("Cancelled")
                        .setDescription(`Your profile reset has been cancelled.`)
                        .setColor("#FF0000");
                    await msg.edit({ embeds: [cancelEmbed], components: [] });
                } else if (status === 'accepted') {
                    const successEmbed = new discord.EmbedBuilder()
                        .setTitle("Success")
                        .setDescription(`Your profile has been reset.`)
                        .setColor("#00FF00");
                    await msg.edit({ embeds: [successEmbed], components: [] });
                } else {
                    const expiredEmbed = new discord.EmbedBuilder()
                        .setTitle("Expired")
                        .setDescription(`Your profile reset confirmation has expired.`);
                    await msg.edit({ embeds: [expiredEmbed], components: [] });
                }
            })
    }
}
