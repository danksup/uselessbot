const { SlashCommandBuilder } = require('discord.js');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ComponentType } = require('discord.js');
const jobs = require('../../worklist.json');

const itemsPerPage = 10;

function getPage(pageNumber) {
  const start = (pageNumber - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return jobs.slice(start, end);
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName('worklist')
    .setDescription ('List all jobs')
    .addIntegerOption(option =>
        option.setName('id')
        .setDescription('The ID of the item to view the full description of')
        .setRequired(false)),
        category: 'currency',
    async execute(interaction) {
        const userAccount = await db.get(`user_${interaction.user.id}`);
        if (!userAccount) {
            return interaction.reply(`You need to create a profile first. Type /start to get started!`);
        }
        const fulldesc = interaction.options.getInteger('id');
        if(fulldesc !== null){
            const job = jobs.find(item => item.id === fulldesc.toString());
            if (!job) {
                return interaction.reply(`Item ID \`${fulldesc}\` not found.`);
            }
            const messageEmbed = new discord.EmbedBuilder()
            //.setColor('RANDOM')
            .setTitle(`ID: \`${job.id}\``)
            .setDescription(job.desc)
            .addFields({name:'Name', value:job.name})
            .addFields({name:'Salary', value:`${job.salary} coin`})
            .addFields({name:'Level Requirement',value: job.lvl_req})
            //.setThumbnail(item.iconurl)
          return interaction.reply({
            embeds: [messageEmbed]
          });
            
        }else{
            
        let currentPage = 1;

        const totaljobs = jobs.length;
        const jobList = getPage(currentPage);
        const jobRows = jobList.map(job => `**ID:** ${job.id}\n**Name:** ${job.name}\n**Salary:** ${job.salary} coin\n**Level requirement:** ${job.lvl_req}\n`).join('\n');


        const messageEmbed = new discord.EmbedBuilder()
        //.setColor('RANDOM')
        .setTitle(`Available Jobs`)
        .setDescription(jobRows)
        .setFooter({text: `Page ${currentPage} of ${Math.ceil(jobs.length / itemsPerPage)}`});

        const components = totaljobs > itemsPerPage ? [createActionRow(currentPage)] : [];
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
        if (i.customId === 'previousjoblist' && currentPage > 1) {
            currentPage--;
        } else if (i.customId === 'nextjoblist' && currentPage < Math.ceil(jobs.length / itemsPerPage)) {
            currentPage++;
        }

        const jobList = getPage(currentPage);
        const jobRows = jobList.map(job => `**ID:** ${job.id}\n**Name:** ${job.name}\n**Salary:** ${job.salary} coin\n**Level requirement:** ${job.lvl_req}\n`).join('\n');

        const newMessageEmbed = new discord.EmbedBuilder()
        //.setColor('RANDOM')
        .setTitle(`Available Jobs`)
        .setDescription(jobRows)
        .setFooter({text: `Page ${currentPage} of ${Math.ceil(jobs.length / itemsPerPage)}`});

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
        .setCustomId('previousjoblist')
        .setLabel('Previous')
        .setStyle('Primary');
        row.addComponents(previousButton);
    }
    if (currentPage < Math.ceil(jobs.length / itemsPerPage)) {
        const nextButton = new ButtonBuilder()
        .setCustomId('nextjoblist')
        .setLabel('Next')
        .setStyle('Primary');
        row.addComponents(nextButton);
    }
    return row;
}
