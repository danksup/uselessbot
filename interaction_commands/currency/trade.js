const {SlashCommandBuilder} = require('discord.js');
const {QuickDB} = require("quick.db");
const db = new QuickDB();
const items = require('../../items.json');
const discord = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('Trade items with another user')
        .addUserOption(option => option.setName('user').setDescription('The user to trade with.').setRequired(true))
        .addIntegerOption(option => option.setName('offered_item').setDescription('The item to offer.').setRequired(true))
        .addIntegerOption(option => option.setName('offered_quantity').setDescription('The quantity of the item to offer.').setRequired(true))
        .addIntegerOption(option => option.setName('requested_item').setDescription('The item to request.').setRequired(true))
        .addIntegerOption(option => option.setName('requested_quantity').setDescription('The quantity of the item to request.').setRequired(true)),
        category: 'currency',
        async execute(interaction) {
        let mention = interaction.options.getUser('user')
        if (mention) {
            let mentionAccount = await db.get(`user_${mention.id}.profile`)
            if (!mentionAccount) {
                return interaction.reply(`This person doesn't have a profile yet.`)
            }
        } else {
            let userAccount = await db.get(`user_${interaction.user.id}.profile`)
            if (!userAccount) {
                return interaction.reply(`You need to create a profile first. Type /start to get started!`)
            }
        }

        // Get the user to trade with
        const targetUser = interaction.options.getUser('user');

        // Get the items to offer and request
        const offeredItem = interaction.options.getInteger('offered_item').toString();
        const offeredQuantity = interaction.options.getInteger('offered_quantity');
        const requestedItem = interaction.options.getInteger('requested_item').toString();
        const requestedQuantity = interaction.options.getInteger('requested_quantity');

        //get name by id
        const itemNameOffered = getItemNameById(offeredItem);
        const itemNameRequested = getItemNameById(requestedItem);

        // TODO: Implement the trade logic
        const userInventory = await db.get(`user_${interaction.user.id}.inventory`) || {};
        const userInventoryTarget = await db.get(`user_${targetUser.id}.inventory`) || {};

        //embed nya dong
        const confirmationEmbed = new discord.EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Trade Confirmation')
            .setDescription(`You have offered to trade **${offeredQuantity} ${itemNameOffered}** for **${requestedQuantity} ${itemNameRequested}** with ${targetUser.username}. Please confirm or cancel the trade.`)
            .setTimestamp();

        const row = new discord.ActionRowBuilder()
            .addComponents(
                new discord.ButtonBuilder()
                .setCustomId('confirm-trade')
                .setLabel('Confirm')
                .setStyle('Primary'),
                new discord.ButtonBuilder()
                .setCustomId('cancel-trade')
                .setLabel('Cancel')
                .setStyle('Secondary')
            );

        // Send the confirmation message with buttons to the user who initiated the trade
        await interaction.reply({
            embeds: [confirmationEmbed],
            components: [row]
        });

        // Wait for user to confirm or cancel the trade
        const userfilterfirst = i => (i.customId === 'confirm-trade' || i.customId === 'cancel-trade') && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
            filter: userfilterfirst,
            time: 60000
        });

        collector.on('collect', async i => {

            if (i.customId === 'cancel-trade') {
                // User cancelled the trade
                const cancelEmbed = new discord.EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Trade Cancelled')
                    .setDescription('You have cancelled the trade.')
                    .setTimestamp();

                // Edit the confirmation message to show that the trade has been cancelled
                await interaction.editReply({
                    embeds: [cancelEmbed],
                    components: []
                });
            } else if (i.customId === 'confirm-trade') {
                // User confirmed the trade
                const targetEmbed = new discord.EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Trade Request')
                    .setDescription(`${interaction.user} has sent you a trade request to trade **${offeredQuantity} ${itemNameOffered}** for your **${requestedQuantity} ${itemNameRequested}**. Please accept or decline the request.`)
                    .setTimestamp();

                const targetRow = new discord.ActionRowBuilder()
                    .addComponents(
                        new discord.ButtonBuilder()
                        .setCustomId('accept-trade')
                        .setLabel('Accept')
                        .setStyle('Success'),
                        new discord.ButtonBuilder()
                        .setCustomId('decline-trade')
                        .setLabel('Decline')
                        .setStyle('Danger')
                    );

                // Send the trade request message with buttons to the target user
                await interaction.channel.send({
                    embeds: [targetEmbed],
                    components: [targetRow]
                });
            }
        });
        const filter2 = i => (i.customId === 'accept-trade' || i.customId === 'decline-trade') && i.user.id === targetUser.id;
        const collector2 = interaction.channel.createMessageComponentCollector({
            filter: filter2,
            time: 60000
        });

        collector2.on('collect', async i => {

            if (i.customId === 'accept-trade') {
                userInventory[offeredItem] -= offeredQuantity;
                userInventory[requestedItem] = (userInventory[requestedItem] || 0) + requestedQuantity;
                userInventoryTarget[requestedItem] -= requestedQuantity;
                userInventoryTarget[offeredItem] = (userInventoryTarget[offeredItem] || 0) + offeredQuantity;
                await db.set(`user_${interaction.user.id}.inventory`, userInventory);
                await db.set(`user_.${targetUser.id}.inventory`, userInventoryTarget);

                // Send a confirmation message to both users
                const confirmationEmbed = new discord.EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Trade Confirmed')
                    .setDescription(`${targetUser.username} has accepted your trade request to trade **${requestedQuantity} ${itemNameRequested}** for **${offeredQuantity} ${itemNameOffered}**.`)
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [confirmationEmbed],
                    components: []
                });

                const targetConfirmationEmbed = new discord.EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Trade Confirmed')
                    .setDescription(`You have accepted a trade request to trade **${requestedQuantity} ${itemNameRequested}** for **${offeredQuantity} ${itemNameOffered}** with ${interaction.user.username}.`)
                    .setTimestamp();

                await i.message.edit({
                    embeds: [targetConfirmationEmbed],
                    components: []
                });
            } else if (i.customId === 'decline-trade') {
                // User declined the trade
                const declineEmbed = new discord.EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Trade Declined')
                    .setDescription(`${targetUser.username} has declined your trade request to trade **${requestedQuantity} ${itemNameRequested}** for **${offeredQuantity} ${itemNameOffered}**.`)
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [declineEmbed],
                    components: []
                });

                const targetDeclineEmbed = new discord.EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Trade Declined')
                    .setDescription(`You have declined a trade request to trade **${requestedQuantity} ${itemNameRequested}** for **${offeredQuantity} ${itemNameOffered}** with ${interaction.user.username}.`)
                    .setTimestamp();

                await i.message.edit({
                    embeds: [targetDeclineEmbed],
                    components: []
                });
            }
        });


        collector.on('end', async () => {
            try {
                await interaction.editReply({
                    components: []
                });
            } catch {

            }
            console.log('meow')
        });


        collector2.on('end', async () => {
            try {
                // Remove the buttons from the original message
                await interaction.editReply({
                    components: []
                });
            } catch {
                console.log('meow')
            }
        });
    },
}

function getItemNameById(id) {
    const item = items.find(item => item.id === id);
    return item ? item.name : null;
}