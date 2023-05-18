const { ButtonBuilder, EmbedBuilder, ActionRowBuilder, DiscordAPIError } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('2-option-poll')
        .setDescription('Creates a 2-option poll')
        .addStringOption(option => option.setName('title').setDescription('The title of the poll').setRequired(true))
        .addStringOption(option => option.setName('description').setDescription('The description of the poll').setRequired(true))
        .addIntegerOption(option => option.setName('duration').setDescription('The duration of the poll in minutes').setRequired(true))
        .addBooleanOption(option => option.setName('one-time').setDescription('If true, users can only vote once'))
        .addStringOption(option => option.setName('button-type').setDescription('The type of button to use').setRequired(false)
            .addChoices({name:'Yes/No',value: 'yes-no'})
            .addChoices({name:'Confirm/Deny',value: 'confirm-deny'})
            .addChoices({name:'Agree/Disagree',value: 'agree-disagree'})
            .addChoices({name:'Checklist/Cross',value: 'checklist-cross'})
        ),
        category: 'miscellaneous',
    async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const oneTime = interaction.options.getBoolean('one-time');
        const duration = interaction.options.getInteger('duration');
        const buttonType = interaction.options.getString('button-type');
        const creationTime = moment();
        let voters = [];

        // Create a message embed
        const pollEmbed = new EmbedBuilder()
        .setColor(255)
        .setTitle(title)
        .setDescription(description)
        .addFields(
            { name: 'Yes', value: '0', inline: true },
            { name: 'No', value: '0', inline: true },
            { name: 'Total', value: '0', inline: true },
            { name: 'Status', value: `One-time vote: ${oneTime ? 'Yes' : 'No'}\nTime remaining: ${duration} minutes`, inline: false }
        )
        .setTimestamp();

        let button1Text, button2Text;
        switch (buttonType) {
            case 'yes-no':
                button1Text = 'Yes';
                button2Text = 'No';
                break;
            case 'confirm-deny':
                button1Text = 'Confirm';
                button2Text = 'Deny';
                break;
            case 'agree-disagree':
                button1Text = 'Agree';
                button2Text = 'Disagree';
                break;
            case 'checklist-cross':
                button1Text = '✅';
                button2Text = '❌';
                break;
            default:
                // Default to 'Yes/No' buttons if no button type is specified or an invalid type is chosen
                button1Text = 'Yes';
                button2Text = 'No';
                break;
        }

        // Create the action row
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('yes-button')
                    .setLabel(button1Text)
                    .setStyle('Success'),
                new ButtonBuilder()
                    .setCustomId('no-button')
                    .setLabel(button2Text)
                    .setStyle('Danger')
            );

        // Send the poll message
        const pollMessage = await interaction.reply({ embeds: [pollEmbed], components: [actionRow], fetchReply: true });

        // Count the votes
        let yesCount = 0;
        let noCount = 0;

        const filter = i => (i.customId === 'yes-button' || i.customId === 'no-button') && i.user.id !== pollMessage.author.id;
        const collector = pollMessage.createMessageComponentCollector({ filter:filter, time: duration * 60000 });
        collector.on('collect', async i => {
            if (oneTime) {
                if (voters.includes(i.user.id)) {
                    return i.reply({ content: 'You have already voted in this poll.', ephemeral: true })
                } else {
                    voters.push(i.user.id);
                }
            }
            
            if (i.customId === 'yes-button') {
                yesCount++;
            } else if (i.customId === 'no-button') {
                noCount++;
            }
              
            const total = yesCount + noCount;
            const remainingTime = moment.duration(duration * 60000 - moment().diff(creationTime));
            const formattedRemainingTime = remainingTime.humanize();
            const newPollEmbed = new EmbedBuilder()
            .setColor(255)
            .setTitle(title)
            .setDescription(description)
            .addFields(
              { name: 'Yes', value: yesCount.toString(), inline: true },
              { name: 'No', value: noCount.toString(), inline: true },
              { name: 'Total', value: total.toString(), inline: true },
              { name: 'Status', value: `One-time vote: ${oneTime ? 'Yes' : 'No'}\nTime remaining: ${formattedRemainingTime}`, inline: false }
            )
            .setTimestamp();
        
          // Update the message with the new EmbedBuilder object
          await i.update({ embeds: [newPollEmbed], components: [actionRow] });
        });
        collector.on('end', async () => {
           try{ 
            const endedEmbed = new EmbedBuilder()
                .setColor(255)
                .setTitle(title)
                .setDescription(description)
                .addFields(
                    { name: 'Yes', value: yesCount.toString(), inline: true },
                    { name: 'No', value: noCount.toString(), inline: true },
                    { name: 'Total', value: (yesCount + noCount).toString(), inline: true },
                    { name: 'Status', value: `Poll has ended. One-time vote: ${oneTime ? 'Yes' : 'No'}`, inline: false }
                )
                .setTimestamp();
        
            await pollMessage.edit({ embeds: [endedEmbed], components: [] });}
            catch(error){
                if(error instanceof DiscordAPIError && error.code === 10008){
                    const deletedendedEmbed = new EmbedBuilder()
                    .setColor(255)
                    .setTitle(title)
                    .setDescription(description)
                    .addFields(
                        { name: 'Yes', value: yesCount.toString(), inline: true },
                        { name: 'No', value: noCount.toString(), inline: true },
                        { name: 'Total', value: (yesCount + noCount).toString(), inline: true },
                        { name: 'Status', value: `Poll has been deleted. One-time vote: ${oneTime ? 'Yes' : 'No'}`, inline: false }
                    )
                    .setTimestamp();
                    interaction.channel.send({embeds: [deletedendedEmbed]})
                }else{
                    console.log(meow)
                }
            }
        });
        
    },
};
