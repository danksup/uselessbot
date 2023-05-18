const { SlashCommandBuilder } = require('@discordjs/builders');
const { QuickDB } = require('quick.db');
const db =new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('workresign')
    .setDescription('Resign from your current job.'),
    category: 'currency',
  async execute(interaction) {
    const userAccount = await db.get(`user_${interaction.user.id}.profile`);
    if (!userAccount) {
      return interaction.reply(`You need to create a profile first. Type /start to get started!`);
    }
    const userID = interaction.user.id;
    const currentJob = await db.get(`user_${userID}.job`);

    // Check if user has a job to resign from
    if (!currentJob) {
      return interaction.reply({ content: 'You are not currently employed.', ephemeral: true });
    }

    const resignCooldown = await db.get(`user_${userID}.job_resign_cooldown`);
    const currentTime = Date.now();

    // Check if user is on resign cooldown
    if (resignCooldown && currentTime < resignCooldown) {
      const timeLeft = resignCooldown - currentTime;
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);
      let timeLeftString = '';
      if (hoursLeft > 0) {
        timeLeftString += `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}`;
      }
      if (minutesLeft > 0) {
        timeLeftString += ` ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`;
      }
      if (secondsLeft > 0) {
        timeLeftString += ` ${secondsLeft} second${secondsLeft > 1 ? 's' : ''}`;
      }
      return interaction.reply({ content: `You cannot resign from your job for another ${timeLeftString}.`, ephemeral: true });
    }

    // Resign from job and set resign cooldown
    db.delete(`user_${userID}.job`);
    db.set(`user_${userID}.job_resign_cooldown`, currentTime + (2 * 60 * 60 * 1000)); // 2 hour cooldown in milliseconds
    return interaction.reply('You have resigned from your job.');
  },
};
