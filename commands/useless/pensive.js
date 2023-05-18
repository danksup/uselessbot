const discord = require("discord.js");
const db = require('quick.db')

module.exports = {
    name: "pensive",
    category: "useless",
    description: "pensive",
    usage: "pensive",
    aliases: [],
    run: (bot, message, args) => {
        message.channel.send('https://cdn.discordapp.com/emojis/737102853252055091.gif?size=64')
    }
}