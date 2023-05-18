const { SlashCommandBuilder } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const discord = require('discord.js')
const { QuickDB } = require("quick.db");
const { ComponentType } = require('discord.js');
const {default_prefix} = require('../../config.json')

const db = new QuickDB();
module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View the list of available commands'),
        category: 'bypass',
    async execute(interaction) {
        let prefix = await db.get(`prefix_${interaction.guild.id}`)
        if(!prefix){
            prefix = default_prefix
        }
        const categories = {
            'Currency': ['balance','beg','buy','daily','fish','Inventory', 'list','leaderboard','level','profile','reset','reset','sell', 'start','trade', 'use', 'work'].sort(),
            'Info': ['blacklist','announcement', 'avatar', 'botinfo','`Help`', 'serverinfo', 'Userinfo', 'snipe'].sort(),
            'Miscellaneous': ['giveaway','ping', 'poll', 'pronouncenumber', 'say', 'time-converter', '2-option-poll', 'time-converter', 'match','random-words', 'calc', 'mood'].sort(),
            'Moderation': ['kick', 'prune','`commands`'].sort(),
            'Others': ['login', 'password'].sort(),
            'Utils': ['wikipedia', 'youtube'].sort()
        };

        const categoryNames = Object.keys(categories);

        let currentPage = 0;
        const getCurrentPage = () => categoryNames[currentPage];

        const selectMenuOptions = categoryNames.map(catName => ({
            label: catName,
            value: catName
        }));

        const selectMenu = new discord.StringSelectMenuBuilder()
            .setCustomId('category_select')
            .setPlaceholder('Select a category...')
            .addOptions(selectMenuOptions);

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

            const generateEmbed = async (catName) => {
                const commands = categories[catName];
                const commandList = commands.join(', ');
                const catNameLower = catName.toLowerCase();
                // console.log(`commands_${interaction.guildId}_${catNameLower}`)
                // console.log(commandList);
                const isEnabled = await db.get(`commands_${interaction.guildId}.${catNameLower}`);
                const color = isEnabled === undefined || isEnabled ? 0x00ff00 : 0xff0000; // green for enabled/undefined, red for disabled
                const statusIcon = isEnabled === undefined || isEnabled ? '🟩' : '🟥'; // icon to show the status
                return new discord.EmbedBuilder()
                    .setColor(color)
                    .setTitle(`${statusIcon} ${catName} commands`)
                    .setDescription(`List of commands in the ${catName} category:\n\n${commandList}`)
                    .setFooter({
                        text: `${statusIcon} indicates that the ${catName} category is ${isEnabled === undefined ? 'enabled' : isEnabled ? 'enabled' : 'disabled'}.\n\`Highlighted\` commands can't be disabled.\nNote that some slash commands may not be included here.`
                      });
            };
            

        const messageOptions = { embeds: [await generateEmbed(getCurrentPage())], components: [row] };
        const helpMessage = await interaction.reply(messageOptions);

        const collector = helpMessage.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: 'This is not for you.', ephemeral: true });
                return;
            }

            const selectedCatName = i.values[0];
            currentPage = categoryNames.indexOf(selectedCatName);

            const newEmbed = await generateEmbed(selectedCatName);
            await i.update({ embeds: [newEmbed] });
        });

        collector.on('end', async() => {
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
