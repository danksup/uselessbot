const { SlashCommandBuilder } = require('discord.js');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ms = require('ms')
const items = require('../../items.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fish')
		.setDescription('Try your luck at fishing and catch a random fish or item to add to your inventory'),
        category: 'currency',
        async execute(interaction) {
        let userAccount = await db.get(`user_${interaction.user.id}.profile`)
        if(!userAccount){
            return interaction.reply(`You need to create a profile first. Type /start to get started!`)
        }
        const timeout = 0; 
	    const cooldown = await db.get(`user_${userAccount.id}.cooldown_fish`);

	    if (cooldown !== null && timeout - (Date.now() - cooldown) > 0) {
		    const time = ms(timeout - (Date.now() - cooldown));
		    return interaction.reply(`Sorry you must wait **${time}** before using this command again!`);
	    } else {
            const user = interaction.user
            const fishIds = ['14', '15', '16', '17', '18', '19']; // Add the trash id (19) to the array
            const fishProbabilities = [0.3, 0.25, 0.15, 0.1, 0.08, 0.07]; // Set the highest probability to the trash

            // Randomly select a fish or trash
            const randomNum = Math.random();
            let itemId;
            if (randomNum < fishProbabilities[0]) {
                itemId = fishIds[0];
            } else if (randomNum < fishProbabilities[0] + fishProbabilities[1]) {
                itemId = fishIds[1];
            } else if (randomNum < fishProbabilities[0] + fishProbabilities[1] + fishProbabilities[2]) {
                itemId = fishIds[2];
            } else if (randomNum < fishProbabilities[0] + fishProbabilities[1] + fishProbabilities[2] + fishProbabilities[3]) {
                itemId = fishIds[3];
            } else if (randomNum < fishProbabilities[0] + fishProbabilities[1] + fishProbabilities[2] + fishProbabilities[3] + fishProbabilities[4]) {
                itemId = fishIds[4];
            } else {
                itemId = fishIds[5];
            }

            // Update the user's inventory with the selected item
            const userInventory = await db.get(`user_${user.id}.inventory`) || {};
            
            userInventory[itemId] = (userInventory[itemId] || 0) + 1;
            await db.set(`user_${user.id}.inventory`, userInventory);

            // Return a message with the item name
            const itemName = getItemNameById(itemId);
            await interaction.reply(`You caught a ${itemName}!`);

            db.set(`user_${userAccount.id}.cooldown_fish`, Date.now());
        }
	},
};
function getItemNameById(id) {
    const item = items.find(item => item.id === id);
    return item ? item.name : null;
  }