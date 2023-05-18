const { SlashCommandBuilder, SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const math = require('mathjs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calc')
        .setDescription('Perform a mathematical calculation or integration/differentiation.')
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('eval')
            .setDescription('Evaluate a mathematical expression.')
            .addStringOption(option => 
                option.setName('expression')
                .setDescription('The mathematical expression to evaluate.')
                .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('integrate')
            .setDescription('Integrate a mathematical expression with respect to a variable.')
            .addStringOption(option => 
                option.setName('expression')
                .setDescription('The mathematical expression to integrate.')
                .setRequired(true))
            .addStringOption(option => 
                option.setName('variable')
                .setDescription('The variable with respect to which to integrate.')
                .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName('differentiate')
            .setDescription('Differentiate a mathematical expression with respect to a variable.')
            .addStringOption(option => 
                option.setName('expression')
                .setDescription('The mathematical expression to differentiate.')
                .setRequired(true))
            .addStringOption(option => 
                option.setName('variable')
                .setDescription('The variable with respect to which to differentiate.')
                .setRequired(true))),
    category: 'miscellaneous',
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const expression = interaction.options.getString('expression');
        let variable;

        try {
            let result;
            if (subcommand === 'eval') {
                result = math.evaluate(expression).toString();
            } else if (subcommand === 'integrate') {
                variable = interaction.options.getString('variable');
                result = 'no'
                // result = math.integrate(expression, variable).toString();
            } else if (subcommand === 'differentiate') {
                variable = interaction.options.getString('variable');
                result = math.derivative(expression, variable).toString();
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Calculation Result')
                .setDescription(`Expression: \`${expression}\`\nOperation: \`${subcommand}\`${variable ? ` with respect to \`${variable}\`` : ''}\n\nResult: \`${result}\``);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Calculation Error')
                .setDescription(`There was an error performing the calculation:\n\n\`${error.message}\``);

            await interaction.reply({ embeds: [embed] });
        }
    },
};
