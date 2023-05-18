const { SlashCommandBuilder } = require('@discordjs/builders');
const discord = require('discord.js');
const { createCanvas } = require('canvas');
const raf = require('raf');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('plane')
    .setDescription('Displays plane(literally) flying on top of clouds and sea'),
    category: 'secret',
    async execute(interaction) {
      // Acknowledge the interaction
      await interaction.deferReply();
    
      const canvas = createCanvas(400, 400);
      const ctx = canvas.getContext('2d');
      let planeX = 0;
      let attachment;
    
      // set the animation loop interval to 50ms
      const interval = 1000;
    
      // define the animation loop function
      function draw() {
        // clear the canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // draw sea
        const seaHeight = 100; // adjust the height of the sea as needed
        const seaY = canvas.height - seaHeight;
        ctx.fillStyle = '#0099ff';
        ctx.fillRect(0, seaY, canvas.width, seaHeight);

        // draw clouds above the sea
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * (canvas.height - seaHeight);
          const radius = Math.random() * 40 + 20;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = '#cccccc';
          ctx.fill();
        }

        // draw plane above the clouds and sea
        const planeWidth = 50;
        const planeHeight = 50;
        const planeY = (canvas.height - seaHeight) / 2 - planeHeight / 2;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(planeX, planeY, planeWidth, planeHeight);

        
        // update plane position for next frame
        planeX += 5;
        if (planeX > canvas.width) {
          planeX = -planeWidth;
        }
        
        // send the updated canvas image in a reply
        attachment = new discord.AttachmentBuilder(canvas.toBuffer(), { name: 'planes.png' });
        const embed = new discord.EmbedBuilder()
          .setTitle('Planes flying between clouds')
          .setColor('#0099ff')
          .setImage('attachment://planes.png')
          .setFooter({ text: 'Click the button below to stop the animation.' });
        interaction.editReply({ embeds: [embed], files: [attachment] });
        
        // request next frame
        setTimeout(() => {
          if (stopped) {
            return;
          }
          raf(draw);
        }, interval);
      }      
    
      // start the animation loop
      let stopped = false;
      draw();
    
      // add button to stop the animation
      const stopButton = new discord.ButtonBuilder()
        .setCustomId('stop')
        .setLabel('Stop')
        .setStyle('Danger');
      const row = new discord.ActionRowBuilder().addComponents(stopButton);
      interaction.editReply({ components: [row] });
    
      // handle button interaction
      const filtercomponent = (buttoninteraction) => buttoninteraction.customId === 'stop';
      const collector = interaction.channel.createMessageComponentCollector({ filter:filtercomponent, time: 60000 });
      collector.on('collect', (buttoninteraction) => {
        stopped = true;
        const stoppedEmbed = new discord.EmbedBuilder()
          .setTitle('Planes flying between clouds')
          .setColor('#0099ff')
          .setDescription('The animation has been stopped.')
          .setImage('attachment://planes.png');
        buttoninteraction.update({ embeds: [stoppedEmbed], files: [attachment], components: [] });
        collector.stop();
      });
    },    
};