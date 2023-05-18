const discord = require("discord.js");
const { version } = require('../../package.json')
const { utc } = require('moment')
const os = require('os')
const ms = require('ms')
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const {version: djsversion } = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Displays information about the bot.'),
        category: 'info',
    execute: (interaction) => {
        const core = os.cpus()[0];
        const BotEmbed = new discord.EmbedBuilder()
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .addFields(
            { name: 'Client', value: `${interaction.client.user.tag} (${interaction.client.user.id}` },
            { name: 'Commands', value: `${interaction.client.commands.size} (base commands only)` },
            { name: 'Servers', value: `${interaction.client.guilds.cache.size.toLocaleString()}` },
            { name: 'Users', value: `${interaction.client.guilds.cache.reduce((a, b) => a + b.memberCount, 0).toLocaleString()}` },
            { name: 'Channels', value: `${interaction.client.channels.cache.size.toLocaleString()}` },
            { name: 'Creation Date', value: `${utc(interaction.client.user.createdTimestamp).format(`Do MMMM YYYY HH:mm:ss`)}` },
            { name: 'Node.js', value: `${process.version}` },
            { name: 'Version', value: `${version}` },
            { name: 'Discord.js', value: `v${djsversion}` }
        )
        .addFields(
            { name: 'Platform', value: `${process.platform}` },
            { name: 'Uptime', value: `${ms(os.uptime()*1000,{long:true})}` },
            { name: 'CPU', value: `Cores: ${os.cpus().length} \nModel:  ${core.model} \n Speed: ${core.speed}MHz` }
        )
        .setTimestamp();

        interaction.reply({ embeds:[BotEmbed]})
    }
}
