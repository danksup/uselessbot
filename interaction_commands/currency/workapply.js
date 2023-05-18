const { SlashCommandBuilder } = require('@discordjs/builders');
const { QuickDB } = require("quick.db");
const jobs = require('../../worklist.json');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('workapply')
    .setDescription('Apply for a job.')
    .addIntegerOption(option => 
      option.setName('jobid')
      .setDescription('The ID of the job you want to apply for.')
      .setRequired(true)),
  cooldown: 7200, // 2 hours cooldown in seconds
  category: 'currency',
  async execute(interaction) {
    const userAccount = await db.get(`user_${interaction.user.id}.profile`);
    if (!userAccount) {
      return interaction.reply(`You need to create a profile first. Type /start to get started!`);
    }
    
    const jobID = interaction.options.getInteger('jobid').toString();

    // Check if jobID is valid
    const job = jobs.find(j => j.id === jobID);
    if (!job) {
      return interaction.reply({ content: 'Invalid job ID.', ephemeral: true });
    }

    const userID = interaction.user.id;

    // Check if user has already applied for a job
    const currentJob = await db.get(`user_${userID}.job`);
    if (currentJob) {
      return interaction.reply({ content: 'You have already applied for a job.', ephemeral: true });
    }

    // Check if user meets the level requirement for the job
    const exp = await db.get(`user_${userID}.exp`);
    const level = Math.floor(0.1 * Math.sqrt(exp));
    if (level < job.lvl_req) {
      return interaction.reply({ content: `You need to be at least level ${job.lvl_req} to apply for this job.`, ephemeral: true });
    }

    // Check if user is on cooldown
    const cooldownEnd = await db.get(`user_${userID}.jobapply_cooldown`);
    if (cooldownEnd && cooldownEnd > Date.now()) {
      const remainingTime = cooldownEnd - Date.now();
      let timeMessage = "";
      if (remainingTime >= 3600000) {
        const hours = Math.floor(remainingTime / 3600000);
        timeMessage += `${hours} hour${hours > 1 ? 's' : ''}`;
        remainingTime %= 3600000;
      }
      if (remainingTime >= 60000) {
        const minutes = Math.floor(remainingTime / 60000);
        if (timeMessage) {
          timeMessage += ", ";
        }
        timeMessage += `${minutes} minute${minutes > 1 ? 's' : ''}`;
        remainingTime %= 60000;
      }
      if (remainingTime >= 1000) {
        const seconds = Math.floor(remainingTime / 1000);
        if (timeMessage) {
          timeMessage += ", ";
        }
        timeMessage += `${seconds} second${seconds > 1 ? 's' : ''}`;
      }
      return interaction.reply(`You have just applied for jobs. You need to wait ${timeMessage} before you can apply again.`);
    }

    // Apply for the job and set cooldown
    db.set(`user_${userID}.job`, jobID);
    db.set(`user_${userID}.jobapply_cooldown`, Date.now() + (this.cooldown * 1000));
    return interaction.reply(`You have applied for the ${job.name} job. Good luck!`);
  },
};
