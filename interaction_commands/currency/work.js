const { SlashCommandBuilder } = require('@discordjs/builders');
const { QuickDB } = require('quick.db');
const jobs = require('../../worklist.json');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work your assigned job.'),
    category: 'currency',
    async execute(interaction) {
      const userAccount = await db.get(`user_${interaction.user.id}.profile`);
      if (!userAccount) {
        return interaction.reply(`You need to create a profile first. Type /start to get started!`);
      }
    
      const userID = interaction.user.id;
    
      // Check if user has a job
      const currentJob = await db.get(`user_${userID}.job`);
      if (!currentJob) {
        return interaction.reply({ content: 'You do not have a job. Apply for a job using /workapply.', ephemeral: true });
      }
    
      const jobCooldown = await db.get(`user_${userID}.job_cooldown`);
      if (jobCooldown !== undefined && jobCooldown > Date.now()) {
        const remainingTimeInSeconds = Math.ceil((jobCooldown - Date.now()) / 1000);
        let remainingTimeString = '';
    
        // Display cooldown time in hours, minutes, or seconds depending on its duration
        if (remainingTimeInSeconds >= 3600) {
          const hours = Math.floor(remainingTimeInSeconds / 3600);
          remainingTimeString = `${hours} hour${hours > 1 ? 's' : ''}`;
        } else if (remainingTimeInSeconds >= 60) {
          const minutes = Math.floor(remainingTimeInSeconds / 60);
          remainingTimeString = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
          remainingTimeString = `${remainingTimeInSeconds} second${remainingTimeInSeconds > 1 ? 's' : ''}`;
        }
    
        return interaction.reply({ content: `You have just worked. You need to wait for ${remainingTimeString} more before working again.`, ephemeral: true });
      } else if (jobCooldown && jobCooldown <= Date.now()) {
        // If cooldown has already expired, remove the cooldown
        await db.delete(`user_${userID}.job_cooldown`);
      }
    
      // Get job information
      const job = jobs.find(j => j.id === currentJob);
      if (!job) {
        return interaction.reply({ content: 'Your current job is invalid. Please apply for a new job using /workapply.', ephemeral: true });
      }
      const jobSalary = parseInt(job.salary);
    
      // Calculate earnings and update user balance and cooldown
      const earnings = jobSalary; // unnecessary but I'm too lazy
      db.add(`user_${userID}.coin`, earnings);
      db.set(`user_${userID}.job_cooldown`, Date.now() + (job.cooldown * 1000));
    
      return interaction.reply(`You have earned ${earnings} coins from your ${job.name} job. Keep up the good work!`);
    },
};
