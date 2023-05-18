const { SlashCommandBuilder } = require('@discordjs/builders');
const discord= require('discord.js');
const {QuickDB} = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Displays a leaderboard for coins or experience. (for now all data will show global scope)')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Select whether to show coins or experience.')
                .setRequired(true)
                .addChoices({name:'Coins', value:'coin'})
                .addChoices({name:'Experience', value:'exp'})
        )
        .addStringOption(option =>
            option.setName('scope')
                .setDescription('Select whether to show the leaderboard for the current server or globally.')
                .setRequired(true)
                .addChoices({name:'Server', value:'server'})
                .addChoices({name:'Global', value:'global'})
        ),
        category: 'currency',
    async execute(interaction) {
        await interaction.deferReply()
        const userAccount = await db.get(`user_${interaction.user.id}.profile`);
        if (!userAccount) {
            return interaction.reply(`You need to create a profile first. Type /start to get started!`);
        }
        const type = interaction.options.getString('type') === 'coin' ? 'coin' : 'exp';
        const scope = interaction.options.getString('scope');
        const data = Object.values(await db.all())
        .filter(entry => entry.id.startsWith('user_'))
        .sort((a, b) => b.value[type] - a.value[type])
        .slice(0, 10)
        .map(entry => ({ id: entry.id, value: entry.value }));
    
        //console.log(data.length);

        const embed = new discord.EmbedBuilder()
        .setTitle(`${type === 'coin' ? 'Coins' : 'Experience'} Leaderboard - ${scope === 'server' ? interaction.guild.name : 'Global'}`)
            .setDescription(`Top 10 users with the most ${type === 'coin' ? 'coins' : 'experience'}.`);
        
        const userPromises = [];
        for (const d of data) {
            userPromises.push(interaction.client.users.fetch(d.id.slice(5)));
        }
        const users = await Promise.all(userPromises);
        
        for (let i = 0; i < data.length; i++) {
            const value = data[i].value;
            const coins = value && value.coin;
            const exp = value && value.exp;
            const typeValue = type === 'coin' ? coins : exp;
            const typeString = type === 'coin' ? 'coins' : 'experience';
            embed.addFields({ name: `#${i + 1} - ${users[i].tag}`, value: `${typeValue || 0} ${typeString}` });
        }
        
        
        const row = new discord.ActionRowBuilder()
            .addComponents(
                new discord.StringSelectMenuBuilder()
                    .setCustomId('leaderboard_select')
                    .setPlaceholder('Select type')
                    .addOptions([
                        {
                            label: 'Coins',
                            description: 'Sort by coins',
                            value: 'coins',
                            emoji: '💰'
                        },
                        {
                            label: 'Experience',
                            description: 'Sort by experience',
                            value: 'exp',
                            emoji: '🎓'
                        }
                    ])
            );
        
        const messageOptions = { embeds: [embed], components: [row] };
        const helpMessage = await interaction.editReply(messageOptions);
        const messageId = helpMessage.id;
        
        const filtercomponent = i => i.customId === 'leaderboard_select' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter:filtercomponent, time: 60000 });

            collector.on('collect', async i => {
            const newType = i.values[0] === 'coins' ? 'coin' : 'exp';
            const newData = Object.values(await db.all())
                .filter(entry => entry.id.startsWith('user_'))
                .sort((a, b) => b.value[newType] - a.value[newType])
                .slice(0, 10)
                .map(entry => ({ id: entry.id, value: entry.value }));

            const newTitle = `${newType === 'coin' ? 'Coins' : 'Experience'} Leaderboard - ${scope === 'server' ? interaction.guild.name : 'Global'}`;
            const newDescription = `Top 10 users with the most ${newType === 'coin' ? 'coins' : 'experience'}.`;

            const userPromises = [];
            for (const d of newData) {
                userPromises.push(interaction.client.users.fetch(d.id.slice(5)));
            }
            const newUsers = await Promise.all(userPromises);

            const newEmbed = new discord.EmbedBuilder()
                .setTitle(newTitle)
                .setDescription(newDescription);

            for (let i = 0; i < newData.length; i++) {
                const newValue = newData[i].value;
                const newTypeValue = newValue && newValue[newType];
                const newTypeString = newType === 'coin' ? 'coins' : 'experience';
                newEmbed.addFields({ name: `#${i + 1} - ${newUsers[i].tag}`, value: `${newTypeValue || 0} ${newTypeString}` });
            }

            try {
                const message = await i.channel.messages.fetch(messageId);
                await message.edit({ embeds: [newEmbed] });
            } catch (error) {
                console.log(error)
               //await i.followUp({content:'Please run this code again.', ephemeral: true})
            }
            });

            collector.on('end', async () => {
                try {
                    const message = await helpMessage.fetch();
                    if (message) {
                        await message.edit({ components: [] });
                    }
                } catch (error) {
                    console.error('meow');
                }
            });

    },
};
