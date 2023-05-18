const { SlashCommandBuilder } = require('discord.js');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ComponentType } = require('discord.js');
const items = require('../../items.json');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('use')
        .setDescription('Use an item from your inventory')
        .addIntegerOption(option => option.setName('id').setDescription('The ID of the item to use').setRequired(true))
        .addIntegerOption(option => option.setName('quantity').setDescription('The quantity of the item to use')),
        category: 'currency',
        async execute(interaction) {
        let prefix = await db.get(`prefix_${interaction.guildId}`)
        if (!prefix) {
            prefix = '*'
        }

        const userAccount = await db.get(`user_${interaction.user.id}.profile`);
        if (!userAccount) {
            return interaction.reply(`You need to create a profile first. Type ${prefix}start to get started!`);
        }

        const item = interaction.options.getInteger('id').toString();
        const quantity = interaction.options.getInteger('quantity') || 1;
        let expamount = Number(quantity) * 10000

        const userInventory = await db.get(`user_${interaction.user.id}.inventory`);
        if (!userInventory) {
            return interaction.reply('Your inventory is empty.');
        }

        const itemName = getItemNameById(item);

        // Check if the item exists
        if (!itemName) {
        return interaction.reply(`item ID \`${item}\` not found.`);
        }

        const itemQuantity = userInventory[item];
        if (!itemQuantity || itemQuantity < quantity) {
            return interaction.reply(`You don't have enough ${itemName}(s) in your inventory.`);

        }
        if (item === '1') {
            const embed1 = new discord.EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Item Used')
            .setDescription(`${interaction.user.username} used ${quantity} ${itemName}(s).`)
            //.setThumbnail({ url: item.image });

            interaction.reply({ embeds: [embed1] });
            userInventory[item] = (userInventory[item] || 0) - quantity;
            await db.set(`user_${interaction.user.id}.inventory`, userInventory);
            return;
        }else if(item ==='14'){
            const embed3 = new discord.EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Item Used')
            .setDescription(`${interaction.user.username} used ${quantity} ${itemName}(s). ${expamount} has been added to your exp.`)
            db.add(`user_${interaction.user.id}.exp`, expamount)
            //.setThumbnail({ url: item.image });

            interaction.reply({ embeds: [embed3] });
            userInventory[item] = (userInventory[item] || 0) - quantity;
            await db.set(`user_${interaction.user.id}.inventory`, userInventory);
            return;
        }else if (item === '20') {
            let expboost = 100;
            const boostActive = await db.get(`user_${interaction.user.id}.expBoosta`);
            
            if (boostActive) {
                const boostTime = await db.get(`user_${interaction.user.id}.expBoostTime`);
                const remainingTime = Math.max(0, boostTime - Date.now());
                const remainingMinutes = Math.ceil(remainingTime / 60000);
                return interaction.reply(`You already have an exp boost active. It will expire in ${remainingMinutes} minutes.`);
            }
            
            const embed3 = new discord.EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Item Used')
                .setDescription(`${interaction.user.username} used ${quantity} ${itemName}(s). Exp boost i now active for an hour`)
                //.setThumbnail({ url: item.image });
        
            interaction.reply({ embeds: [embed3] });
            userInventory[item] = (userInventory[item] || 0) - quantity;
            await db.set(`user_${interaction.user.id}.inventory`, userInventory);
        
            // Set the user's temporary exp boost status to true
            await db.set(`user_${interaction.user.id}.expBoosta`, true);
            await db.set(`user_${interaction.user.id}.expBoostTime`, Date.now() + 3600000);
            // Add the temporary exp boost to the user's account
            await db.add(`user_${interaction.user.id}.expBoost`, expboost);
        
            // Check if exp boost has timed out and clear the interval
            setInterval(async () => {
                const users = await db.all(); // get all user data from the database
                for (const user of users) {
                  const boostActive = await db.get(`user_${user.id}.expBoosta`);
                  if (boostActive) {
                    const boostTime = await db.get(`user_${user.id}.expBoostTime`);
                    if (boostTime <= Date.now()) { // if boost has expired, remove boost status and subtract boost amount from user's account
                      await db.delete(`user_${user.id}.expBoosta`);
                      await db.delete(`user_${user.id}.expBoostTime`);
                      const expBoostAmount = await db.get(`user_${user.id}.expBoost`);
                      if (expBoostAmount) {
                        await db.subtract(`user_${user.id}.expBoost`, expBoostAmount);
                      }
                    }
                  }
                }
              }, 60000); // run every minute              
        }else {
            interaction.reply('You can\'t use this item.');
        }

        
    },
};
function getItemNameById(id) {
    const item = items.find(item => item.id === id);
    return item ? item.name : null;
  }
