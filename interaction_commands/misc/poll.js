const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll with multiple choices')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The question for the poll')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('The first option for the poll')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('The second option for the poll')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('The third option for the poll')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('The fourth option for the poll')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option5')
                .setDescription('The fifth option for the poll')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option6')
                .setDescription('The sixth option for the poll')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option7')
                .setDescription('The seventh option for the poll')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option8')
                .setDescription('The eighth option for the poll')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('option9')
                .setDescription('The ninth option for the poll')
                .setRequired(false)),
                category: 'miscellaneous',
    async execute(interaction) {
        await interaction.deferReply()
        const question = interaction.options.getString('title');
        const option1 = interaction.options.getString('option1');
        const option2 = interaction.options.getString('option2');
        const option3 = interaction.options.getString('option3');
        const option4 = interaction.options.getString('option4');
        const option5 = interaction.options.getString('option5');
        const option6 = interaction.options.getString('option6');
        const option7 = interaction.options.getString('option7');
        const option8 = interaction.options.getString('option8');
        const option9 = interaction.options.getString('option9');
        const choices = [option1, option2, option3, option4, option5, option6, option7, option8, option9].filter(Boolean);

        if (choices.length < 2 || choices.length > 9) {
            return interaction.reply('Options should be between 2 and 9');
        }

        const emojis = [
            '1️⃣',
            '2️⃣',
            '3️⃣',
            '4️⃣',
            '5️⃣',
            '6️⃣',
            '7️⃣',
            '8️⃣',
            '9️⃣'
        ];

        const content = choices.map((choice, index) => `${emojis[index]} ${choice}`).join('\n');

        const pollEmbed = {
            color: 255,
            title: question,
            description: content,
            timestamp: new Date(),
            footer: {
                text: `Made by ${interaction.user.username}`
            }
        };

        const message = await interaction.editReply({ embeds: [pollEmbed], fetchReply: true });

        for (let i = 0; i < choices.length; i++) {
            await message.react(emojis[i]);
        }
    }
};
