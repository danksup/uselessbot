const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const items = require('../../items.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sell')
        .setDescription('Sell items.')
        .addIntegerOption(option => option.setName('id').setDescription('The ID of the item to sell').setRequired(true))
        .addIntegerOption(option => option.setName('quantity').setDescription('The quantity of the item to sell').setRequired(true)),
        category: 'currency',
        async execute(interaction) {
        const userAccount = await db.get(`user_${interaction.user.id}.profile`);
        if (!userAccount) {
            return interaction.reply(`You need to create a profile first. Type /start to get started!`);
        }

        const itemID = interaction.options.getInteger('id').toString();
        const quantity = interaction.options.getInteger('quantity');

        const item = items.find(item => item.id === itemID);

        // Check if the item exists
        if (!item) {
            return interaction.reply(`Item ID \`${itemID}\` not found.`);
        }

        const userInventory = await db.get(`user_${interaction.user.id}.inventory`) || {};

        if (!userInventory[itemID] || userInventory[itemID] < quantity) {
            return interaction.reply(`You don't have enough ${item.name} to sell. You currently have ${userInventory[itemID] || 0} ${item.name} in your inventory.`);
        }

        const totalPrice = quantity * item.price;

        userInventory[itemID] -= quantity;

        await db.set(`user_${interaction.user.id}.inventory`, userInventory);
        await db.add(`user_${interaction.user.id}.coin`, totalPrice);

        const remainingQuantity = userInventory[itemID] || 0;
        return interaction.reply(`You sold ${quantity} ${item.name} for ${totalPrice} coin. Now you have ${remainingQuantity} ${item.name} left.`);

    },
};
