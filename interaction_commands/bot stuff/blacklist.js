const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { bypassUsersID } = require('../../bypassperms.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botban')
        .setDescription('Manage the blacklist.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the blacklist.')
                .addUserOption(option => option.setName('user').setDescription('The user to add to the blacklist.').setRequired(false))
                .addStringOption(option => option.setName('id').setDescription('The ID of the user to add to the blacklist.').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the blacklist.')
                .addUserOption(option => option.setName('user').setDescription('The user to remove from the blacklist.').setRequired(false))
                .addStringOption(option => option.setName('id').setDescription('The ID of the user to remove from the blacklist.').setRequired(false))
        ),
    async execute(interaction) {
        try {
            if (!bypassUsersID.includes(interaction.user.id)) {
                return await interaction.reply('You have no permission to use this command.');
            }
            const subcommand = interaction.options.getSubcommand();
            let user = interaction.options.getUser('user');
            const id = interaction.options.getString('id');
            if (id && !user) {
                // If the user is not on the server, use the provided ID to create a User object
                let userObj = await interaction.client.users.fetch(id);
                if (!userObj) {
                    return await interaction.reply('Invalid user ID.');
                }
                user = userObj;
            }
            if (!user && !id) {
                return await interaction.reply('Invalid options.');
            }
            if (user && user.id === interaction.user.id) {
                return await interaction.reply("You can't blacklist yourself!");
            }
            let blacklisted = await db.get(`blacklist_${user.id}`);
            switch (subcommand) {
                case 'add':
                    if (blacklisted) {
                        return await interaction.reply(`${user.username} is already blacklisted.`);
                    } else {
                        await db.set(`blacklist_${user.id}`, true);
                        return await interaction.reply(`${user.username} has been blacklisted.`);
                    }
                case 'remove':
                    if (!blacklisted) {
                        return await interaction.reply(`${user.username} is not blacklisted.`);
                    } else {
                        await db.set(`blacklist_${user.id}`, false);
                        return await interaction.reply(`${user.username} has been removed from the blacklist.`);
                    }
            }
        } catch (error) {
            console.error(error);
        }
    }
}
