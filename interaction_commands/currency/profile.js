const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const jobs = require('../../worklist.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Displays information about a user\'s currency profile.')
        .addUserOption(option => option.setName('user').setDescription('The user to display information about.')),
        category: 'currency',
        async execute(interaction) {
        const userAccount = await db.get(`user_${interaction.user.id}.profile`);
        if (!userAccount) {
            return interaction.reply(`You need to create a profile first. Type /start to get started!`);
        }
        const user = interaction.options.getUser('user') || interaction.user;
        let currentJobId = await db.get(`user_${user.id}.job`);
        let currentJobName = "No job";
        
        const exp = await db.get(`user_${user.id}.exp`);
        let level = Math.floor(0.1 * Math.sqrt(exp));

        if (currentJobId) {
            const currentJob = jobs.find(j => j.id === currentJobId);
            if (currentJob) {
                currentJobName = currentJob.name;
            }
        }

        const embed = new discord.EmbedBuilder()
        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
            .addFields(
                {
                    name: 'Level',
                    value: `${level.toString()}(exp: ${exp})`,
                },
                {
                    name: 'Job',
                    value: currentJobName,
                }
            )
            .setColor('#7289DA')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
