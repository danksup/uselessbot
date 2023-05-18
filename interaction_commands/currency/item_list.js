const { SlashCommandBuilder } = require('discord.js');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ComponentType } = require('discord.js');
const items = require('../../items.json');

const choices = items.map(item => ({
    name: item.name,
    value: parseInt( item.id)
}));

const itemsPerPage = 10;

function getPage(pageNumber) {
  const start = (pageNumber - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return items.slice(start, end);
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName('list')
    .setDescription ('List all items')
    .addIntegerOption(option =>
        option.setName('id')
        .setDescription('The ID of the item to view the full description of')
        .setRequired(false)
        .addChoices(...choices)),
        category: 'currency',
    async execute(interaction) {
        const userAccount = await db.get(`user_${interaction.user.id}.profile`);
        if (!userAccount) {
            return interaction.reply(`You need to create a profile first. Type /start to get started!`);
        }
        const fulldesc = interaction.options.getInteger('id');
        if(fulldesc !== null){
            const userInventory = await db.get(`user_${interaction.user.id}.inventory`) || {};
            const item = items.find(item => item.id === fulldesc.toString());
            if (!item) {
                return interaction.reply(`Item ID \`${fulldesc}\` not found.`);
            }
            let description = `${item.desc}\n\n`;
            if (userInventory[item.id]) {
            description += `You have ${userInventory[item.id]} ${item.name} in your inventory`;
            } else {
            description += `You do not have any ${item.name} in your inventory`;
            }
            const messageEmbed = new discord.EmbedBuilder()
            //.setColor('RANDOM')
            .setTitle(`ID: \`${item.id}\``)
            .setDescription(description)
            .addFields({name:'Name', value:item.name})
            .addFields({name:'Price', value:`${item.price} coin`})
            .addFields({name:'Type',value: item.itemtype})
            .addFields({name:'Buyable',value: item.buyable})
            .addFields({name:'Item Type',value: item.itemtype})
            .setThumbnail(item.iconurl)
          return interaction.reply({
            embeds: [messageEmbed]
          });
            
        }else{
            
        let currentPage = 1;

        const totalItems = items.length;
        const itemList = getPage(currentPage);
        const itemRows = itemList.map(item => `**ID:** ${item.id}\n**Name:** ${item.name}\n**Price:** ${item.price} coin\n**Type:** ${item.itemtype}\n **Buyable:** ${item.buyable}\n`).join('\n');


        const messageEmbed = new discord.EmbedBuilder()
        //.setColor('RANDOM')
        .setTitle(`Page ${currentPage}`)
        .setDescription(itemRows)
        .setFooter({text: `Page ${currentPage} of ${Math.ceil(items.length / itemsPerPage)}`});

        const components = totalItems > itemsPerPage ? [createActionRow(currentPage)] : [];
        const message = await interaction.reply({
        embeds: [messageEmbed],
        components: components
        });

        const collector = message.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        componentType: ComponentType.Button,
        time: 60000
        });

        collector.on('collect', async i => {
        if (i.customId === 'previouslist' && currentPage > 1) {
            currentPage--;
        } else if (i.customId === 'nextlist' && currentPage < Math.ceil(items.length / itemsPerPage)) {
            currentPage++;
        }

        const itemList = getPage(currentPage);
        const itemRows = itemList.map(item => `**ID:** ${item.id}\n**Name:** ${item.name}\n**Price:** ${item.price} coin\n**Type:** ${item.itemtype}\n **Buyable:** ${item.buyable}\n`).join('\n');

        const newMessageEmbed = new discord.EmbedBuilder()
        //.setColor('RANDOM')
        .setTitle(`Page ${currentPage}`)
        .setDescription(itemRows)
        .setFooter({text: `Page ${currentPage} of ${Math.ceil(items.length / itemsPerPage)}`});

        await i.update({
            embeds: [newMessageEmbed],
            components: [createActionRow(currentPage)],
            fetchReply: true
        });
        });

        collector.on('end', collected => {
        if (collected.size === 0) {
            message.edit({ components: [] });
        }
        });
        }
        
    }
    };

    function createActionRow(currentPage) {
    const row = new ActionRowBuilder();
    if (currentPage > 1) {
        const previousButton = new ButtonBuilder()
        .setCustomId('previouslist')
        .setLabel('Previous')
        .setStyle('Primary');
        row.addComponents(previousButton);
    }
    if (currentPage < Math.ceil(items.length / itemsPerPage)) {
        const nextButton = new ButtonBuilder()
        .setCustomId('nextlist')
        .setLabel('Next')
        .setStyle('Primary');
        row.addComponents(nextButton);
    }
    return row;
}
