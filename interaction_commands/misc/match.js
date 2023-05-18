const { SlashCommandBuilder } = require('@discordjs/builders');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { MessageEmbed, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('match')
    .setDescription('Calculates the match percentage between two users.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('random')
        .setDescription('Match the author with a random user.')
        .addBooleanOption(option =>
            option.setName('bot')
              .setDescription('Include bots in the random match.')
              .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('users')
        .setDescription('Match two specified users.')
        .addUserOption(option =>
          option.setName('user1')
            .setDescription('The first user to match.')
            .setRequired(true))
        .addUserOption(option =>
          option.setName('user2')
            .setDescription('The second user to match.'))),
            category: 'miscellaneous',
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;

    if (subcommand === 'random') {
      const user1 = interaction.user;
      const includeBots = interaction.options.getBoolean('bot');
      if (!guild) {
        return interaction.reply('This command can only be used in a server.');
      }
      await guild.members.fetch(); // Fetch all members including offline ones

      const users = guild.members.cache.filter(member => includeBots || !member.user.bot).filter(member => member.id !== user1.id);

      const randomUser = users.random().user;

      const key = [user1.id, randomUser.id].sort().join(':');
      const previousMatch = await db.get(key);

      let matchPercentage;
      if (previousMatch) {
        matchPercentage = previousMatch;
      } else {
        matchPercentage = Math.floor(Math.random() * 101);
        db.set(key, matchPercentage);
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Match Percentage')
        .setDescription(`${user1.username} and ${randomUser.username} are ${matchPercentage}% compatible!`)
        .addFields(
          { name: 'User 1', value: user1.toString(), inline: true },
          { name: 'User 2', value: randomUser.toString(), inline: true },
        );

      interaction.reply({ embeds: [embed] });
                } else if (subcommand === 'users') {
                  const user1 = interaction.options.getUser('user1');
                  let user2 = interaction.options.getUser('user2');
                  
                  if (!user2) {
                    user2 = interaction.user;
                  }
              
                  if (user1.id === user2.id) {
                    return interaction.reply('You cannot match with yourself!');
                  }
              
                  const key = [user1.id, user2.id].sort().join(':');
                  const previousMatch =await db.get(key);
              
                  let matchPercentage;
                  if (previousMatch) {
                    matchPercentage = previousMatch;
                  } else {
                    matchPercentage = Math.floor(Math.random() * 101);
                    db.set(key, matchPercentage);
                  }
              
                  const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Match Percentage')
                    .setDescription(`${user1.username} and ${user2.username} are ${matchPercentage}% compatible!`)
                    .addFields(
                      { name: 'User 1', value: user1.toString(), inline: true },
                      { name: 'User 2', value: user2.toString(), inline: true },
                    );
              
                  interaction.reply({ embeds: [embed] });
                }
              },              
};
