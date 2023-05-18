const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const quiz = require('../../quiz.json');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quiz')
    .setDescription('Choose the correct answer and get some rewards'),
    category: 'currency',
  async execute(interaction) {
    // Select a random question from the quiz JSON file
    const question = quiz[Math.floor(Math.random() * quiz.length)];

    // Create an embed with the question and possible answers
    const embed = new EmbedBuilder()
      .setTitle(question.question)
      .setDescription(
        question.answers.map((answer, index) => `${index + 1}) ${answer}`).join('\n')
      )

    // Create buttons for each answer
    const buttons = question.answers.map((answer, index) => 
      new ButtonBuilder()
        .setCustomId(index.toString())
        .setLabel(answer)
        .setStyle('Primary')
    );

    // Create an action row to contain the buttons
    const row = new ActionRowBuilder()
      .addComponents(buttons);

    // Send the embed and buttons to the channel
    await interaction.reply({ embeds: [embed], components: [row] });

    // Wait for a user to click a button
    const filterbutton = (i) => i.customId === question.correct.toString() && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter: filterbutton, time: 15000 });

    // Handle the user's answer
    collector.on('collect', async (i) => {
      if (!i.isButton() || i.message.interaction.id !== interaction.id) return;
        // Disable all buttons and remove the action row
        for (const button of buttons) {
          button.setDisabled(true);
        }
        row.setComponents(buttons);
      
        // Display a message indicating whether the user was correct
        const resultEmbed = new EmbedBuilder()
          .setTitle(i.customId === question.correct.toString() ? 'Correct!' : 'Incorrect!')
          .setDescription(`The correct answer was ${question.answers[question.correct]}.`)
          .setColor(i.customId === question.correct.toString() ? '#00FF00' : '#FF0000');
      
        await i.update({ embeds: [resultEmbed], components: [row] });
        if (i.customId === question.correct.toString()) {
          // Give the user a reward (e.g. coins)
          const reward = 500; // 100 coins as an example
          const user = interaction.user;
          const key = `user_${interaction.user.id}.coin`
          const currentCoins = await db.get(key) || 0;
          db.set(key, currentCoins + reward);
          
          // Send a message to let the user know they've earned a reward
          await interaction.followUp(`Congratulations! You earned ${reward} coins for answering the question correctly.`);
        }

        collector.stop()
      });
      
      // Handle the case when the user clicks a wrong button
      const wrongCollector = interaction.channel.createMessageComponentCollector({
        filter: (i) => i.customId !== question.correct.toString() && i.user.id === interaction.user.id,
        time: 15000,
      });
      
      wrongCollector.on('collect', async (i) => {
        if (!i.isButton() || i.message.interaction.id !== interaction.id) return;
        // Display a message indicating that the user's answer was wrong
        const resultEmbed = new EmbedBuilder()
          .setTitle('Incorrect!')
          .setDescription(`The correct answer was ${question.answers[question.correct]}.`)
          .setColor('#FF0000');
          // Disable all buttons and remove the action row
        for (const button of buttons) {
          button.setDisabled(true);
        }
        row.setComponents(buttons);

      
        await i.update({ embeds: [resultEmbed], components: [row] });
      
        // End the collector
        wrongCollector.stop();
      });
  }
};
