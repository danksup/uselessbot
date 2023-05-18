const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('Login to the system.')
        .addStringOption(option =>
            option.setName('password')
                .setDescription('Your password.')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to login as.')
                .setRequired(false)),
                category: 'others',
    async execute(interaction) {
        const password = interaction.options.getString('password');
        const user = interaction.options.getUser('user') || interaction.user;
        const storedPassword = await db.get(`user_${user.id}.password`);

        if (password !== storedPassword) {
            return interaction.reply({ content: 'Incorrect password.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Confirm Password')
            .setDescription(`Your password is ${password}. Are you sure you want to login as ${user.username}?`);
        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_login')
            .setLabel('Confirm')
            .setStyle('Success');
        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_login')
            .setLabel('Cancel')
            .setStyle('Danger');
        const buttonRow = new ActionRowBuilder()
            .addComponents(confirmButton, cancelButton);

        let hasAgreed = false; // add variable to track whether the user has agreed

        try {
            const message = await interaction.reply({ embeds: [embed], components: [buttonRow], ephemeral: true });
            const filter = i => (i.customId === 'confirm_login' || i.customId === 'cancel_login') && i.user.id === interaction.user.id;
            while (!hasAgreed) { // loop until the user has agreed
                const response = await message.awaitMessageComponent({ filter, time: 10000 });

                if (response.customId === 'cancel_login') {
                    const cancelledEmbed = new EmbedBuilder()
                        .setDescription('Login cancelled.')
                    await response.update({ embeds: [cancelledEmbed], components: [] });
                    hasAgreed = true; // update variable to true when the user cancels
                } else if (response.customId === 'confirm_login') {
                    const newEmbed = new EmbedBuilder()
                        .setDescription('idk what to implement')
                    await response.update({ embeds: [newEmbed], components: [] });
                    hasAgreed = true; // update variable to true when the user agrees
                }
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occurred while waiting for your confirmation.', ephemeral: true });
        }
    }
};
