const discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    name: "setprefix",
    category: "moderation",
    description: "change the default prefix to a new one",
    usage: "setprefix <newPrefix>",
    aliases: [],
    run: (bot, message, args) => {
        if(!message.member.permissions.has('MANAGE_SERVER')) return message.channel.send(`**${message.author.username}**, You dont have the permission to use this command!`)

        if(!args[0]) return message.channel.send(`**${message.author.username}**, Please provide the prefix you want to use`)
        
        if(args[0].length > 3) return message.channel.send(`**${message.author.username}**, The new prefix can only be 3 characters or less`)

        if(args[1]) return message.channel.send(`**${message.author.username}**, The prefix can't have spaces`)
        
        db.set(`prefix_${message.guild.id}`, args[0])
        message.channel.send(`Successfully set the prefix to ${args[0]}`)
    }
}