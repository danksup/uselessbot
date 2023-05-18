const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, EmbedBuilder } = require('discord.js');
const natural = require('natural');
const wiki = require('wikijs').default;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wikipedia')
        .setDescription('Search Wikipedia for a given query')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The query to search for on Wikipedia')
                .setRequired(true)),
                category: 'utils',
                async execute(interaction) {
                    await interaction.deferReply()
                    const query = interaction.options.getString('query');
                
                    try {
                        const pageList = await wiki().search(query, 10);
                        if (pageList.results.length === 0) {
                            await interaction.editReply(`No results found for "${query}" on Wikipedia.`);
                            return;
                        }
                        const results = await Promise.all(pageList.results.map(async (result) => {
                            const page = await wiki().page(result);
                            const percentage = Math.round(natural.JaroWinklerDistance(query.toLowerCase(), result.toLowerCase()) * 10000) / 100;
                            return { title: page.raw.title, url: page.raw.fullurl, percentage };
                        }));
                
                        const sortedResults = results.sort((a, b) => b.percentage - a.percentage);
                        const embed = new EmbedBuilder()
                            .setColor(255)
                            .setTitle(`Wikipedia Results for "${query}"`)
                            .setDescription(sortedResults.map((result) => `${result.percentage}% - [${result.title}](${result.url})`).join('\n'));
                
                        await interaction.editReply({ embeds: [embed] });
                    } catch (error) {
                        console.error(error);
                        await interaction.editReply('An error occurred while searching for the query on Wikipedia.');
                    }
                }
                
};
