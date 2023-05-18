const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Starts a giveaway')
        .addStringOption(option =>
            option.setName('prize')
                .setDescription('Giveaway prize')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Giveaway duration in minutes')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('winners')
                    .setDescription('Number of winners')
                    .setRequired(false))
        .addIntegerOption(option =>
            option.setName('maxparticipants')
                .setDescription('Maximum number of participants')
                .setRequired(false)),

    async execute(interaction) {
        const winners = interaction.options.getInteger('winners') || 1;
        const prize = interaction.options.getString('prize');
        const duration = interaction.options.getInteger('duration');
        let maxParticipants = interaction.options.getInteger('maxparticipants');
        if(!maxParticipants){
            maxParticipants = 'No limit'
        }

        let numParticipants = 0;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Giveaway!')
            .addFields(
                { name: 'Host', value: `<@${interaction.user.id}>` },
                { name: 'Prize', value: prize },
                { name: 'Winners', value: winners.toString() },
                { name: 'Duration', value: `${duration} minutes` },
                { name: 'Max Participant', value: String(maxParticipants) || 'Not defined' },
                { name: 'Participants', value: String(numParticipants)}
            )
            .setTimestamp()
            .setFooter({text:`Click the button to enter the giveaway.`});

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('giveawayButton')
                    .setLabel('🎉')
                    .setStyle('Primary')
            );
        interaction.reply({content: 'Success', ephemeral: true})
        const giveawayMessage = await interaction.channel.send({ embeds: [embed], components: [row] });

        const filter = (interaction) => interaction.customId === 'giveawayButton' && interaction.user.id !== giveawayMessage.author.id;
        const collector = giveawayMessage.createMessageComponentCollector({ filter, time: duration * 60000 });

        const participants = new Set();

        collector.on('collect', async (button) => {
            if (maxParticipants && participants.size >= maxParticipants) {
                await button.reply({ content: `Sorry, the maximum number of participants (${maxParticipants}) has been reached.`, ephemeral: true });
                return;
            }

            participants.add(button.user.id);
            numParticipants = participants.size;

            const updatedEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Giveaway!')
            .addFields(
                { name: 'Host', value: `<@${interaction.user.id}>` },
                { name: 'Prize', value: prize },
                { name: 'Winners', value: winners.toString() },
                { name: 'Duration', value: `${duration} minutes` },
                { name: 'Max Participant', value: String(maxParticipants) || 'Not defined' },
                { name: 'Participants', value: String(numParticipants)}
            )
            .setTimestamp()
            .setFooter({text:`Click the button to enter the giveaway.`});

            await button.update({ embeds: [updatedEmbed], components: [row] });
            //await interaction.reply({ content: 'You have entered the giveaway!', ephemeral: true });
        });

        collector.on('end', async () => {
            if (participants.size < winners) {
                await interaction.channel.send(`Not enough participants entered the giveaway. The required number of participants was ${winners}, but only ${participants.size} participated.`);
                return;
            }

            const selectedWinners = [];

            for (let i = 0; i < winners; i++) {
                const randomIndex = Math.floor(Math.random() * participants.size);
                const winnerId = Array.from(participants)[randomIndex];
                const winner = await interaction.guild.members.fetch(winnerId);
                selectedWinners.push(winner.toString());
                participants.delete(winnerId);
            }

            const winnersEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Giveaway Results!')
                .setDescription(`Congratulations to ${selectedWinners.join(', ')}! You have won **${prize}**!`)
                .setTimestamp()
                .setFooter({text: 'Congratulations!'});

            await interaction.channel.send({ embeds: [winnersEmbed]});
            await giveawayMessage.edit({components: []})
        });
    },
};
