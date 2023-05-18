const { SlashCommandBuilder } = require('discord.js');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ComponentType } = require('discord.js');
const items = require('../../items.json');
const { bypassUsersID } = require('../../bypassperms.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('one-of-every-item')
        .setDescription('Add one of each item to the user\'s inventory'),
    async execute(interaction) {
        if(!bypassUsersID.includes(interaction.user.id)){
            return interaction.reply('You dont have permission to use this.')
        }
        const user = interaction.user;
        const userInventory = await db.get(`user_${user.id}.inventory`) || {};
        for (const item of items) {
            if (!item) {
                continue;
            }
            if (userInventory[item.id]) {
                userInventory[item.id]++;
            } else {
                userInventory[item.id] = 1;
            }
        }
        db.set(`user_${user.id}.inventory`, userInventory);
        interaction.reply(`One of each item has been added to ${user.username}'s inventory.`);
    },
};
