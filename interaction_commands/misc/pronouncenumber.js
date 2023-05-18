const { SlashCommandBuilder } = require('@discordjs/builders');
const { number } = require('mathjs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pronouncenumber')
        .setDescription('Pronounce a number.')
        .addIntegerOption(option => option.setName('integer').setDescription('The number to pronounce.').setRequired(true)),
        category: 'miscellaneous',
    async execute(interaction) {
        const integer = interaction.options.getInteger('integer');
        const numberInWords = numberToWords(integer);

        interaction.reply(`${integer}\nPronounced number: ${numberInWords}`);
    }
};

function numberToWords(number) {
    // Implement a function that converts a number to words
    // You can use a library like `number-to-words` or implement your own function
    // Here's an example implementation using the `number-to-words` package:
    const numberInWords = require('number-to-words').toWords(number);
    return numberInWords.charAt(0).toUpperCase() + numberInWords.slice(1);
}
