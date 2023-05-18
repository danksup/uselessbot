const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const { google } = require('googleapis');
const { youtube_token } = require('../../config.json');

const youtube = google.youtube({
  version: 'v3',
  auth: youtube_token
});

const MAX_RESULTS_PER_PAGE = 10;
const MAX_PAGES = 5;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('youtube')
    .setDescription('Search for a YouTube video')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('The query to search for on YouTube')
        .setRequired(true)),
        category: 'utils',
  async execute(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString('query');

    try {
      const results = await youtube.search.list({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: MAX_RESULTS_PER_PAGE * MAX_PAGES
      });

      if (results.data.items.length === 0) {
        await interaction.editReply(`No results found for "${query}" on YouTube.`);
        return;
      }

      const pages = Math.ceil(results.data.items.length / MAX_RESULTS_PER_PAGE);
      const embeds = [];
      for (let i = 0; i < pages; i++) {
        const startIndex = i * MAX_RESULTS_PER_PAGE;
        const endIndex = startIndex + MAX_RESULTS_PER_PAGE;
        const items = results.data.items.slice(startIndex, endIndex);

        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle(`YouTube Results for "${query}" (Page ${i + 1}/${pages})`)
          .setDescription(items.map((item, index) => `${startIndex + index + 1}. [${item.snippet.title}](${`https://www.youtube.com/watch?v=${item.id.videoId}`})`).join('\n'));

        embeds.push(embed);
      }

      let currentPage = 0;
      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev-link')
            .setLabel('Previous')
            .setStyle('Primary')
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next-link')
            .setLabel('Next')
            .setStyle('Primary')
            .setDisabled(pages === 1),
          new ButtonBuilder()
            .setCustomId('stop-link')
            .setLabel('Stop')
            .setStyle('Danger')
        );

      const message = await interaction.editReply({ embeds: [embeds[currentPage]], components: [buttons] });

      const filter = i => i.user.id === interaction.user.id;
      const collector = message.createMessageComponentCollector({ filter:filter, componentType: ComponentType.Button, time: 60000 });

      collector.on('collect', async i => {

        if (i.customId === 'prev-link') {
          currentPage--;
        } else if (i.customId === 'next-link') {
          currentPage++;
        } else {
          collector.stop();
          message.delete()
        }

        if (currentPage < 0) {
          currentPage = 0;
        } else if (currentPage >= pages) {
          currentPage = pages - 1;
        }

        const newButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('prev-link')
              .setLabel('Previous')
              .setStyle('Primary')
              .setDisabled(currentPage === 0),
              new ButtonBuilder()
                .setCustomId('next-link')
                .setLabel('Next')
                .setStyle('Primary')
                .setDisabled(currentPage === pages - 1),
              new ButtonBuilder()
                .setCustomId('stop-link')
                .setLabel('Stop')
                .setStyle('Danger')
            );
            try{
                await i.update({ embeds: [embeds[currentPage]], components: [newButtons] });
            }catch{
                console.log('meow')
            }
         
        });
      
        collector.on('end', async () => {
            try{
                await message.edit({ components: [] });
            }catch{
                console.log('meow')
            }
          
        });
      } catch (error) {
        console.error(error);
      }
    }
}      
