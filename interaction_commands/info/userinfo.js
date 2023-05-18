const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { bypassUsersID } = require('../../bypassperms.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Displays information about a user.')
        .addUserOption(option => option.setName('user').setDescription('The user to display information about.')),
        category: 'info',
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);
        let blstatus = await db.get(`blacklist_${user.id}`)
        if (bypassUsersID.includes(user.id)) {
            blstatus = 'Bot Owner';
          } else if (user.bot) {
            blstatus = 'A bot';
          } else if (blstatus === true) {
            blstatus = 'Banned';
          } else {
            blstatus = 'Not banned';
          }

        const embed = new discord.EmbedBuilder()
        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
            .addFields(
                {
                    name: 'User ID',
                    value: user.id,
                },
                {name:'Ban Status', value: `${blstatus}`},
                {
                    name: 'Roles',
                    value: member.roles.cache.map((role) => role.toString()).join(', '),
                },
                {
                    name: 'Joined Server',
                    value: new Date(member.joinedTimestamp).toLocaleDateString(),
                },
                {
                    name: 'Account Created',
                    value: new Date(user.createdTimestamp).toLocaleDateString(),
                },
            )
            .setColor('#7289DA')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
