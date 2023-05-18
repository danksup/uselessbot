const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const items = require('../../items.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy items. Use /list to see available items to buy')
        .addIntegerOption(option => option.setName('id').setDescription('The ID of the item to buy').setRequired(true))
        .addIntegerOption(option => option.setName('quantity').setDescription('The quantity of the item to buy').setRequired(true)),
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

        if (item.buyable === "no") {
            return interaction.reply(`You cannot buy this item.`);
        }


        const totalPrice = quantity * item.price;
        const coinbal = await db.get(`user_${interaction.user.id}.coin`) || 0;

        if (totalPrice > coinbal) {
            const maxQuantity = Math.floor(coinbal / item.price);
            if (maxQuantity === 0) {
              return interaction.reply(`You don't have enough coin in your balance. You can't even buy one. You only have ${coinbal} coins, while you need ${totalPrice} coins to buy ${quantity} ${item.name}.`);
            }
            return interaction.reply(`You don't have enough coin in your balance to buy ${quantity} ${item.name}. You can buy a maximum of ${maxQuantity} ${item.name} with your current balance of ${coinbal} coins.`);
          }

        const userInventory = await db.get(`user_${interaction.user.id}.inventory`) || {};

        if (userInventory[itemID]) {
            userInventory[itemID] += quantity;
        } else {
            userInventory[itemID] = quantity;
        }

        await db.set(`user.${interaction.user.id}.inventory`, userInventory);
        await db.sub(`user_${interaction.user.id}.coin`, totalPrice);

        return interaction.reply(`You bought ${quantity} ${item.name} for ${totalPrice} coins. Now you have ${coinbal - totalPrice} coins`);
    },
};
