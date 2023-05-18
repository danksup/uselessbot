const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB(); // replace with your own database library

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Check your current level')
        .addUserOption(option => option.setName('user').setDescription('The user to check the level for')),
        category: 'currency',
        async execute(interaction) {
      let mention = interaction.options.getUser('user')
      if (mention) {
          let mentionAccount = await db.get(`user_${mention.id}.profile`)
          if (!mentionAccount) {
              return interaction.reply(`This person doesn't have a profile yet.`)
          }
      } else {
          let userAccount = await db.get(`user_${interaction.user.id}.profile`)
          if (!userAccount) {
              return interaction.reply(`You need to create a profile first. Type /start to get started!`)
          }
      }
        const user = interaction.options.getUser('user') || interaction.user; // get the user to check the level for, or default to the command user
        const exp = await db.get(`user_${user.id}.exp`);
        let level = Math.floor(0.1 * Math.sqrt(exp)); // calculate level based on experience points
        if (level > 5000) level = 5000; // cap level at 5000
        const expNeeded = level === 5000 ? 'Max' : (level + 1) ** 2 * 100 - exp; // calculate experience points needed for next level or show "Max" if user has reached the maximum level

        let nextMultipleOfFive = (Math.ceil((level + 1) / 5) * 5);
        const expNeededMultipleOfFive = nextMultipleOfFive ** 2 * 100 - exp; // calculate experience points needed to reach next level that is a multiple of 5

        const embed = new discord.EmbedBuilder()
            .setColor('#0099ff')
            .setDescription(`They are currently level ${level === 5000 ? '5000(Max)' : level} with ${exp} experience points.\n${level === 5000 ? '' : `They need ${expNeeded} more experience points to reach level ${level + 1}.`} ${level === 5000 ? '' : `Experience points needed for max level: ${(5000 ** 2) * 100 - exp}`}`);

        if (nextMultipleOfFive <= 5000) {
            embed.addFields({name:`Experience needed for level ${nextMultipleOfFive}:`, value:expNeededMultipleOfFive.toString(),inline: true});
        }

        if (user.id === interaction.user.id) {
            embed.setAuthor({name:`${user.username}'s Level`,iconURL: user.displayAvatarURL()});
        } else {
            embed.setAuthor({name:`${user.username}'s Level`,iconURL: user.displayAvatarURL()})
                .setFooter({text: `Requested by ${interaction.user.username}`, iconURL:interaction.user.displayAvatarURL()});
        }

        await interaction.reply({ embeds: [embed] });
    },
};
