const { SlashCommandBuilder, MessageEmbed, EmbedBuilder } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('password')
        .setDescription('Manage your password.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new password.')
                .addBooleanOption(option =>
                    option.setName('dm')
                        .setDescription('Send the password in DMs instead of a reply.')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete your current password.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('see')
                .setDescription('See your current password.')
                .addBooleanOption(option =>
                    option.setName('dm')
                        .setDescription('Send the password in DMs instead of a reply.')
                        .setRequired(false))),
                        category: 'others',
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const existingPassword = await db.get(`user_${interaction.user.id}.password`);

            if (existingPassword) {
                return interaction.reply({content:'You already have a currency system password. Delete it first before creating a new one.', ephemeral:true});
            }

            const password = uuidv4();
            db.set(`user_${interaction.user.id}.password`, password);

            try {
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Password')
                    .setDescription(`${password}`)
                    .setFooter({ text: 'NEVER SHARE YOUR PASSWORD' });
                const isDm = interaction.options.getBoolean('dm');
                if (isDm) {
                    await interaction.user.send({ embeds: [embed] });
                    await interaction.reply({ content: 'I have sent your new password to your DMs.', ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            } catch {
                await interaction.reply({ content: 'I was unable to send your password to your DMs. Please make sure your DMs are enabled and try again.', ephemeral: true });
            }
        } else if (subcommand === 'delete') {
            const existingPassword = await db.get(`user_${interaction.user.id}.password`);

            if (!existingPassword) {
                return interaction.reply({ content: 'You do not have a currency system password to delete.', ephemeral: true });
            }

            db.delete(`user_${interaction.user.id}.password`);
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Currency System Password')
                .setDescription('Your currency system password has been deleted.')
                .setFooter({ text: 'NEVER SHARE YOUR PASSWORD' });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (subcommand === 'see') {
            const password = await db.get(`user_${interaction.user.id}.password`);

            if (!password) {
                return interaction.reply({ content: 'You do not have a password.', ephemeral: true });
            }

            try {
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Password')
                    .setDescription(`${password}`)
                    .setFooter({ text: 'NEVER SHARE YOUR PASSWORD' });
                const isDm = interaction.options.getBoolean('dm');
                if (isDm) {
                    await interaction.user.send({ embeds: [embed] });
                    await interaction.reply({ content: 'I have sent your password to your DMs.', ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            } catch {
                await interaction.reply({ content: 'I was unable to send your password to your DMs. Please make sure your DMs are enabled and try again.', ephemeral: true });
            }
        }
    }
}
