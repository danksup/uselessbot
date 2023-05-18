const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const items = require('../../items.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start your currency profile.'),
        category: 'currency',
    async execute(interaction) {
        let user = await db.get(`user_${interaction.user.id}`)
        if(!user){
            const confirmationEmbed = new discord.EmbedBuilder()
            .setTitle("Confirmation")
            .setDescription(`Are you sure you want to create your profile?`);

        const row = new discord.ActionRowBuilder()
            .addComponents(
                new discord.ButtonBuilder()
                    .setCustomId('confirm-create')
                    .setLabel('Yes')
                    .setStyle('Success'),
                new discord.ButtonBuilder()
                    .setCustomId('cancel-create')
                    .setLabel('No')
                    .setStyle('Secondary')
            );
        const msg = await interaction.reply({ embeds: [confirmationEmbed], components: [row] });
            
        let status = 'expired'; 
            
        const filter = i => i.customId === 'confirm-create' || i.customId === 'cancel-create';
            
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
            
        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                // If the interaction is not from the target user, send an ephemeral message saying this is not for them
                await i.reply({ content: 'This is not for you.', ephemeral: true });
                return;
            }
            if (i.customId === 'confirm-create') {
                status = 'accepted'; 
                db.set(`user_${interaction.user.id}`, { coin: 0, bank: 0, exp: 0, profile: true})
                //add apple when created
                const item = '1';
                const quantity = 1
                const userInventory = await db.get(`user_${interaction.user.id}.inventory`) || {};
            
                userInventory[item] = (userInventory[item] || 0) + quantity;
                await db.set(`user_${interaction.user.id}.inventory`, userInventory);
    
                const successEmbed = new discord.EmbedBuilder()
                    .setTitle("Success")
                    .setDescription(`Your profile has been create. Make sure to read /guideline`)
                    .setColor("#00FF00");
                await i.update({ embeds: [successEmbed], components: [] });
            } else if (i.customId === 'cancel-create') {
                status = 'cancelled'; 
                const cancelEmbed = new discord.EmbedBuilder()
                    .setTitle("Cancelled")
                    .setDescription(`Your profile creation has been cancelled.`)
                    .setColor("#FF0000");
                await i.update({ embeds: [cancelEmbed], components: [] });
            }
        });
            
        collector.on('end', async collected => {
            if (msg.deleted) return;
            if (status === 'cancelled') {
                const cancelEmbed = new discord.EmbedBuilder()
                    .setTitle("Cancelled")
                    .setDescription(`Your profile creation has been cancelled.`)
                    .setColor("#FF0000");
                await msg.edit({ embeds: [cancelEmbed], components: [] });
            } else if (status === 'accepted') {
                const successEmbed = new discord.EmbedBuilder()
                    .setTitle("Success")
                    .setDescription(`Your profile has been created. Make sure to read /guideline`)
                    .setColor("#00FF00");
                await msg.edit({ embeds: [successEmbed], components: [] });
            } else {
                const expiredEmbed = new discord.EmbedBuilder()
                    .setTitle("Expired")
                    .setDescription(`Your profile creation confirmation has expired.`);
                await msg.edit({ embeds: [expiredEmbed], components: [] });
            }
        })
        } else {
            return interaction.reply(`${interaction.user.username}, you have already created a profile!`)
        }
           
    }
}