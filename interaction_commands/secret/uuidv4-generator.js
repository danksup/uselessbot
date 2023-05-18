const { SlashCommandBuilder } = require('@discordjs/builders');
const { v4: uuidv4} = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uuid')
        .setDescription('Generates a random UUID.'),
        category: 'secret',
    async execute(interaction) {
            const uuid = uuidv4();
            await interaction.reply(`Here's your random UUID: ${uuid}`);
    },
};
