const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pudidi')
    .setDescription('Calculates time dilation and time elapsed for a given velocity and distance')
    .addIntegerOption(option => option.setName('velocity').setDescription('Velocity of the observer in meters per second').setRequired(true))
    .addIntegerOption(option => option.setName('distance').setDescription('Distance traveled by the observer in meters').setRequired(true)),
    category: 'secret',
    async execute(interaction) {
    // Get the velocity and distance from the user's input
    const velocity = interaction.options.getInteger('velocity');
    const distance = interaction.options.getInteger('distance');

    // Calculate the time dilation factor
    const speedOfLight = 299792458; // speed of light in meters per second
    const timeDilationFactor = Math.sqrt(1 - (velocity ** 2 / speedOfLight ** 2));

    // Calculate the time elapsed
    const timeElapsed = distance / (velocity * timeDilationFactor);
    if (isNaN(timeElapsed)) {
        await interaction.reply('The velocity and distance provided result in a time elapsed that is too high to be calculated with this formula. Please provide lower values.');
        return;
      }

    // Reply with the results
    await interaction.reply(`For an observer traveling at ${velocity} m/s for a distance of ${distance} meters, time dilation factor is ${timeDilationFactor.toFixed(4)} and time elapsed is ${timeElapsed.toFixed(4)} seconds.`);
  },
};
