const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { bypassUsersID } = require('../../bypassperms.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removeblacklist')
        .setDescription('Remove all users from the blacklist.'),
    async execute(interaction) {
        await interaction.deferReply()
        try {
            if (!bypassUsersID.includes(interaction.user.id)) {
                return await interaction.editReply('You have no permission to use this command.');
            }

            const data = Object.values(await db.all())
            .filter(entry => entry.id.startsWith('blacklist_'))
            data.forEach(async entry => {
                await db.delete(entry.id);
            });

            return await interaction.editReply(`Removed ${data.length} user(s) from the blacklist.`);
        } catch (error) {
            console.error(error);
        }
    }
};
