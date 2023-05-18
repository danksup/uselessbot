const discord = require("discord.js");
const db = require('quick.db')

module.exports = {
    name: "help",
    category: "useless",
    description: "help",
    usage: "help",
    aliases: [],
    run: (bot, message, args) => {
        message.channel.send('https://cdn.discordapp.com/emojis/737102853252055091.gif?size=64')
    }
}