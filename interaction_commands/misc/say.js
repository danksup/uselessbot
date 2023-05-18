const { SlashCommandBuilder } = require('@discordjs/builders');
const db = require('quick.db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Say command')
    .addUserOption(option => option.setName('user').setDescription('The user to say the message as').setRequired(true))
    .addStringOption(option => option.setName('message').setDescription('The message to say').setRequired(true)),
    category: 'miscellaneous',
    async execute(interaction) {
    interaction.reply({ content: 'Success', ephemeral: true });
    const sayauthor = interaction.options.getUser('user');
    const say = interaction.options.getString('message');

    if (!say || !sayauthor) return;

    const channel = interaction.channel;
        channel.createWebhook({
            name: sayauthor.username,
            avatar: sayauthor.displayAvatarURL({ dynamic: true })
        })
        .then(async webhook => {
          await webhook.send(say, {
                username: sayauthor.username,
                avatarURL: sayauthor.displayAvatarURL({ dynamic: true })
            })
            webhook.delete();
        })     
        .catch((e) => {
            console.log(e)
            return interaction.channel.send(`an error has occured: \n\`${e.message}\``)
            
        })
    }
}
