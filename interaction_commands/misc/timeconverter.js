const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, EmbedBuilder } = require('discord.js');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('convert-time')
        .setDescription('Converts a given amount of time from one unit to another')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('The amount of time to convert')
                .setRequired(true))
                .addStringOption(option =>
                    option.setName('from')
                        .setDescription('The unit to convert from')
                        .setRequired(true)
                        .addChoices({ name: 'Seconds', value: 'seconds' })
                        .addChoices({ name: 'Minutes', value: 'minutes' })
                        .addChoices({ name: 'Hours', value: 'hours' })
                        .addChoices({ name: 'Days', value: 'days' }))
                .addStringOption(option =>
                    option.setName('to')
                        .setDescription('The unit to convert to')
                        .setRequired(true)
                        .addChoices({ name: 'Seconds', value: 'seconds' })
                        .addChoices({ name: 'Minutes', value: 'minutes' })
                        .addChoices({ name: 'Hours', value: 'hours' })
                        .addChoices({ name: 'Days', value: 'days' })),
                        category: 'miscellaneous',
    async execute(interaction) {
        const time = interaction.options.getString('time');
        const fromUnit = interaction.options.getString('from');
        const toUnit = interaction.options.getString('to');

        const fromMilliseconds = moment.duration(Number(time), fromUnit).asMilliseconds();
        const convertedTime = moment.duration(fromMilliseconds).as(toUnit);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(`Time Conversion`)
            .setDescription(`**${time} ${fromUnit}** is equal to **${convertedTime} ${toUnit}**`);

        interaction.reply({ embeds: [embed] });
    },
};
