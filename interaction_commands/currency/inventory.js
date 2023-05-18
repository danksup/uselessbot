const { SlashCommandBuilder } = require('discord.js');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ComponentType } = require('discord.js');
const items = require('../../items.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('See the list of all commands or specific info of a command')
        .addUserOption(option => option.setName('user').setDescription('The user to display information about.')),
        category: 'currency',
        async execute(interaction) {

        let mention = interaction.options.getUser('user')
        if (mention) {
        let mentionAccount = await db.get(`user_${mention.id}.profile`)
        if (!mentionAccount) {
            return interaction.reply(`This person doesn't have a profile yet.`)
        }
        } else {
        let userAccount = await db.get(`user_${interaction.user.id}.profile`)
        if (!userAccount) {
            return interaction.reply(`You need to create a profile first. Type /start to get started!`)
        }
        }

        const user = interaction.options.getUser('user') || interaction.user;
        const userInventory = await db.get(`user_${user.id}.inventory`);
        if (!userInventory) {
        return interaction.reply('inventory is empty.');
        }
        let totalPrice = 0;
        const inventoryStrings = [];
        for (const [itemId, quantity] of Object.entries(userInventory)) {
            if (quantity === 0) {
                continue; // Skip kalau jumlah 0
            }
            inventoryStrings.push(`${getItemNameById(itemId, quantity)}\n`);
        }

        if (inventoryStrings.length === 0) {
            return interaction.reply(`${user.username}'s inventory is empty.`);
        }
        

        function getItemNameById(id, quantity) {
            const item = items.find(item => item.id === id);
            if (!item) {
              // Remove item from user's inventory if it is not found in the items array
              db.delete(`user_${user.id}.inventory.${id}`);
              return `item${id}`;
            }
            //console.log(item);
            const itemPrice = item.price * quantity;
            totalPrice += itemPrice;
            if (item) {
              return ` **ID:** \`${item.id}\`\n **Name:** ${item.name} - **Quantity:** ${quantity} - **Type:** ${item.itemtype} - **Price:** ${item.price} coin - **Total:** ${itemPrice} coin - **Buyable:** ${item.buyable}`;
            } else {
              return `item${id}`;
            }
          }
          
        
          

        const PAGE_SIZE = 5;
        const numPages = Math.ceil(inventoryStrings.length / PAGE_SIZE);

        let page = 0;
        const pageString = () => `Page ${page + 1} of ${numPages}`;

        const getCurrentPage = () => inventoryStrings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
        const currentPageString = () => getCurrentPage().join('\n');

        const prevmsg = new ButtonBuilder()
        .setCustomId('prevmsg')
        .setLabel('◀️')
        .setStyle(ButtonStyle.Primary)

        const nextmsg = new ButtonBuilder()
        .setCustomId('nextmsg')
        .setLabel('▶️')
        .setStyle(ButtonStyle.Primary)

        const closemsg = new ButtonBuilder()
        .setCustomId('closemsg')
        .setLabel('❌')
        .setStyle(ButtonStyle.Danger)


        const rowmsg = new ActionRowBuilder()
        .addComponents(prevmsg, nextmsg, closemsg);


        const embed = new discord.EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`${user.username}'s inventory`)
        .setDescription(currentPageString())
        .setFooter({ text: `${pageString()} | Inventory worth: ${totalPrice}` });;

        const messageOptionsmsg = { embeds: [embed], components: [rowmsg] };
        const inventoryMessagemsg = await interaction.reply(messageOptionsmsg);

        const collector = inventoryMessagemsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i=> {
            if (i.user.id !== interaction.user.id) {
                // If the interaction is not from the target user, send an ephemeral message saying this is not for them
                await i.reply({ content: 'This is not for you.', ephemeral: true });
                return;
            }
            switch (i.customId) {
                case 'prevmsg':
                page--;
                break;
                case 'nextmsg':
                page++;
                break;
                case 'closemsg':
                    try {
                    await inventoryMessagemsg.delete();
                    } catch (err) {
                    console.error('Error deleting message:', err);
                    }
                    return;
                
            }

            page = Math.max(0, Math.min(numPages - 1, page));

            const newInventoryString = currentPageString();
            const newEmbed = new discord.EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${user.username}'s inventory`)
                .setDescription(newInventoryString)
                .setFooter({text: `${pageString()} | Inventory worth: ${totalPrice}`});

            await i.update({ embeds: [newEmbed] });
            });
            collector.on('end', async() => {
                try {
                    const message = await inventoryMessagemsg.fetch();
                    if (message) {
                    await message.edit({ components: [] });
                    }
                } catch (error) {
                    console.error('meow');
                }
            });
        
	},
};