const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB(); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commands')
    .setDescription('Enable or disable a category of commands')
    .addSubcommand((subcommand) => 
        subcommand
            .setName('enable')
            .setDescription('Enable a category of commands')
            .addStringOption((option) => 
                option
                    .setName('category')
                    .setDescription('The category to enable')
                    .setRequired(true)
                    .addChoices(
                      { name: 'Others', value: 'others' },
                      { name: 'Moderation', value: 'moderation' },
                      { name: 'Miscellaneous', value: 'miscellaneous' },
                      { name: 'Currency', value: 'currency' },
                      { name: 'Utility', value: 'utils' },
                      { name: 'Infomartion', value: 'info' }
                    )))
    .addSubcommand((subcommand) => 
        subcommand
            .setName('disable')
            .setDescription('Disable a category of commands')
            .addStringOption((option) => 
                option
                    .setName('category')
                    .setDescription('The category to disable')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Others', value: 'others' },
                        { name: 'Moderation', value: 'moderation' },
                        { name: 'Miscellaneous', value: 'miscellaneous' },
                        { name: 'Currency', value: 'currency' },
                        { name: 'Utility', value: 'utils' },
                        { name: 'Infomartion', value: 'info' },
                        { name: 'Secret', value: 'secret' }
                    ))),
                    category: 'bypass',
                    async execute(interaction) {
                        const { guildId } = interaction;
                        //console.log(guildId)
                      
                        // Check if the user has permission to use this command
                        if (!interaction.member.permissions.has([PermissionsBitField.Flags.Administrator])) {
                          return interaction.reply('You do not have permission to use this command.');
                        }
                      
                        // Get the subcommand and options
                        const subcommand = interaction.options.getSubcommand();
                        const category = interaction.options.getString('category');

                        const validCategories = ['others', 'moderation', 'miscellaneous', 'currency', 'utils', 'info', 'secret'];
                        if (!validCategories.includes(category)) {
                          return interaction.reply('Invalid category.');
                        }
                      
                        // Check if the category is already enabled or disabled
                        const isEnabled = await db.get(`commands_${guildId}.${category}`);
                        const alreadyEnabled = isEnabled === true;
                        const alreadyDisabled = isEnabled === false;
                      
                        // Set the value in the database based on the subcommand
                        switch (subcommand) {
                          case 'enable':
                            if (alreadyEnabled) {
                              return interaction.reply(`The "${category}" category is already enabled.`);
                            }
                            await db.set(`commands_${guildId}.${category}`, true);
                            await interaction.reply(`The "${category}" category has been enabled.`);
                            break;
                      
                          case 'disable':
                            if (alreadyDisabled) {
                              return interaction.reply(`The "${category}" category is already disabled.`);
                            }
                            await db.set(`commands_${guildId}.${category}`, false);
                            await interaction.reply(`The "${category}" category has been disabled.`);
                            break;
                      
                          default:
                            interaction.reply('Invalid subcommand.');
                        }
                      }
                      
};
