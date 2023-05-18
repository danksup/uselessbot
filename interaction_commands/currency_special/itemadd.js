const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const items = require('../../items.json');
const { bypassUsersID } = require('../../bypassperms.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('additem')
        .setDescription('add item')
        .addIntegerOption(option => option.setName('id').setDescription('The ID of the item to add').setRequired(true))
        .addIntegerOption(option => option.setName('quantity').setDescription('The quantity of the item to add').setRequired(true))
        .addUserOption(option => option.setName('user').setDescription('The User')),
    async execute(interaction) {
        if(!bypassUsersID.includes(interaction.user.id)){
            return interaction.reply('You dont have permission to use this.')
        }
        const item = interaction.options.getInteger('id').toString();
        const user = interaction.options.getUser('user') || interaction.user;
        const quantity = interaction.options.getInteger('quantity');
    
        // Check if the user provided the required arguments
        if (!item || isNaN(quantity)) {
          return interaction.reply("please provide an item ID and quantity.");
        }
    
        // Retrieve the user's inventory from the database
        const userInventory = await db.get(`user_${user.id}.inventory`) || {};
    
        // Get the item name based on the item ID
        const itemName = getItemNameById(item);
    
        // Check if the item exists
        if (!itemName) {
          return interaction.reply(`item ID \`${item}\` not found.`);
        }
    
        // Update the user's inventory with the new item quantity
        userInventory[item] = (userInventory[item] || 0) + quantity;
        await db.set(`user_${user.id}.inventory`, userInventory);
    
        // Send a confirmation message
        return interaction.reply(`added ${quantity} ${itemName}(s) to ${user.username} inventory.`);
    },
};
function getItemNameById(id) {
    const item = items.find(item => item.id === id);
    return item ? item.name : null;
  }
