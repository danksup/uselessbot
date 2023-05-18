const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder
} = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage the list of blacklisted users')
        .addSubcommand(subcommand =>
            subcommand
            .setName('list')
            .setDescription('List all blacklisted users')
        )
        .addSubcommand(subcommand =>
            subcommand
            .setName('check')
            .setDescription('Check if a user is blacklisted')
            .addStringOption(option =>
                option.setName('user')
                .setDescription('The user ID to check')
                .setRequired(true)
            )
        ),
        category: 'info',
    async execute(interaction) {
        await interaction.deferReply()
        const blacklistedUserIds = Object.values(await db.all())
            .filter(entry => entry.id.startsWith('blacklist_'))
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(entry => entry.id.slice(10));

        if(blacklistedUserIds.length === 0){
            return interaction.editReply('No user is blacklisted')
        }

        if (interaction.options.getSubcommand() === 'list') {
            const itemsPerPage = 10;
            const totalPages = Math.ceil(blacklistedUserIds.length / itemsPerPage);
            let page = interaction.options.getInteger('page') || 1;
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;

            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, blacklistedUserIds.length);

            const embed = new EmbedBuilder()
                .setTitle('List of Blacklisted Users')
                .setDescription(`Showing page ${page} of ${totalPages}`)
                .setColor('#ff0000');

            for (let i = startIndex; i < endIndex; i++) {
                const userId = blacklistedUserIds[i];
                const user = await interaction.client.users.fetch(userId);
                embed.addFields({name:user.tag,value: userId,inline: true});
            }

            const buttons = [];
            if (page > 1) buttons.push(new ButtonBuilder().setCustomId('previous-blacklist').setLabel('Previous').setStyle('Primary'));
            if (page < totalPages) buttons.push(new ButtonBuilder().setCustomId('next-blacklist').setLabel('Next').setStyle('Primary'));

            if (buttons.length > 0) {
                const row = new ActionRowBuilder().addComponents(buttons);
                interaction.editReply({
                    embeds: [embed],
                    components: [row]
                });
                const filter = i => i.user.id === interaction.user.id && (i.customId === 'previous-blacklist' || i.customId === 'next-blacklist');
                const collector = interaction.channel.createMessageComponentCollector({
                    filter:filter,
                    time: 30000
                });
                collector.on('collect', async i => {
                    if (i.customId === 'previous-blacklist') page--;
                    if (i.customId === 'next-blacklist') page++;
                    await i.deferUpdate();
                  
                    const startIndex = (page - 1) * itemsPerPage;
                    const endIndex = Math.min(startIndex + itemsPerPage, blacklistedUserIds.length);
                  
                    const newEmbed = new EmbedBuilder()
                      .setTitle('List of Blacklisted Users')
                      .setDescription(`Showing page ${page} of ${totalPages}`)
                      .setColor('#ff0000');
                  
                    for (let i = startIndex; i < endIndex; i++) {
                      const userId = blacklistedUserIds[i];
                      const user = await interaction.client.users.fetch(userId);
                      newEmbed.addFields({name:user.tag,value: userId, inline:true});
                    }
                  
                    const newButtons = [];
                    if (page > 1) newButtons.push(new ButtonBuilder().setCustomId('previous-blacklist').setLabel('Previous').setStyle('Primary'));
                    if (page < totalPages) newButtons.push(new ButtonBuilder().setCustomId('next-blacklist').setLabel('Next').setStyle('Primary'));
                    const newRow = new ActionRowBuilder().addComponents(newButtons);
                  
                    i.editReply({
                      embeds: [newEmbed],
                      components: [newRow]
                    });
                  });
                  
                collector.on('end', () => {
                    const newButtons = buttons.map(button => button.setDisabled(true));
                    const newRow = new ActionRowBuilder().addComponents(newButtons);
                    interaction.editReply({
                        components: [newRow]
                    });
                });
            } else {
                interaction.editReply({
                    embeds: [embed]
                });
            }
        } else if (interaction.options.getSubcommand() === 'check') {
            const userId = interaction.options.getString('user');
            if (blacklistedUserIds.includes(userId)) {
                interaction.editReply({
                    content: 'The user is blacklisted.',
                    ephemeral: true
                });
            } else {
                interaction.editReply({
                    content: 'The user is not blacklisted.',
                    ephemeral: true
                });
            }
        }
    },
};