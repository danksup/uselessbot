const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const randomWords = require('random-words');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('random-word')
        .setDescription('Generates random words')
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('The number of random words to generate')
                .setRequired(true)
                .setMinValue(2)
                .setMaxValue(100))
        .addBooleanOption(option => 
            option.setName('embed')
                .setDescription('If true, words will be sent embedded'))
        .addBooleanOption(option => 
            option.setName('alphabetize')
                .setDescription('If true, words will be alphabetized'))
        .addBooleanOption(option => 
            option.setName('repeat')
                .setDescription('If true, the same word may be generated multiple times'))
        .addStringOption(option =>
            option.setName('first-letter')
                .setDescription('If specified, only words starting with this letter will be generated')
                .setMaxLength(1)),
                category: 'miscellaneous',
    async execute(interaction) {
        const number = interaction.options.getInteger('number');
        const embed = interaction.options.getBoolean('embed');
        const alphabetize = interaction.options.getBoolean('alphabetize');
        const repeat = interaction.options.getBoolean('repeat');
        const firstLetter = interaction.options.getString('first-letter')?.toLowerCase();

        let words = [];
        while (words.length < number) {
            let newWords;
            if (repeat) {
                newWords = randomWords({ exactly: number - words.length });
            } else {
                newWords = randomWords({ exactly: number - words.length, unique: true });
            }
            if (firstLetter) {
                words = words.concat(newWords.filter(word => word.startsWith(firstLetter)));
            } else {
                words = words.concat(newWords);
            }
        }

        if (alphabetize) {
            words.sort();
        }

        if (embed) {
            const embed = new EmbedBuilder()
                .setDescription(words.join(' '))
                .setTimestamp()
                .setColor(0xff0000);

            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply(words.join(' '));
        }
    },
};
