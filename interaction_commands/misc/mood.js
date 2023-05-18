const { SlashCommandBuilder } = require('discord.js');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const Discord = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mood')
    .setDescription('Analyzes the mood of a sentence.')
    .addStringOption(option => 
      option.setName('sentence')
      .setDescription('The sentence to analyze.')
      .setRequired(true)),
      category: 'miscellaneous',
      async execute(interaction) {
        const input = interaction.options.getString('sentence');
        //console.log('input:', input);
        const result = sentiment.analyze(input);
        //console.log('result:', result);
        const { score = 0, comparative = 0, tokens = [], words = [], positive = [], negative = [] } = result || {};
        const total = positive.length + negative.length + (words.length - (positive.length + negative.length));
        const positivePercent = total > 0 ? ((positive.length / total) * 100).toFixed(2) : 0;
        const negativePercent = total > 0 ? ((negative.length / total) * 100).toFixed(2) : 0;
        const neutralPercent = total > 0 ? (((words.length - (positive.length + negative.length)) / total) * 100).toFixed(2) : 0;    
        const topWords = tokens.slice(0, 5).join(', ');
      
        const embed = new Discord.EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Mood Analysis')
          .setDescription(`Analyzing the mood of: ${input}`)
          .addFields(
            { name: 'Positive', value: `${positivePercent}%`, inline: true },
            { name: 'Negative', value: `${negativePercent}%`, inline: true },
            { name: 'Neutral', value: `${neutralPercent}%`, inline: true },
            { name: 'Score', value: `${score} (${comparative})` },
            { name: 'Top Words', value: topWords },
          );
        await interaction.reply({ embeds: [embed] });
      }      
};
