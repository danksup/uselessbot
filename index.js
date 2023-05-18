const {
    token,
    default_prefix,
    openai_token
} = require("./config.json")
const {
    badwords
} = require("./data.json")
const discord = require("discord.js")
const {
    QuickDB
} = require("quick.db");
const db = new QuickDB();
const {
    Client,
    Collection,
    Events,
    GatewayIntentBits
} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const {
    PermissionsBitField
} = require('discord.js');
const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});
const {
    bypassUsersID
} = require('./bypassperms.json');

const {
    Configuration,
    OpenAIApi
} = require('openai');
const configuration = new Configuration({
    apiKey: openai_token,
});
const openai = new OpenAIApi(configuration);
const items = require('./items.json');

//slash command dir/////////////////////////////////////////////////////////////////////////////////////////////////////////
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'interaction_commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
           // console.log(`[INFO] Loaded command ${command.data.name} in category ${command.category}`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

//button handler (wip)////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// client.buttons = new Collection();
// const buttonFolders = fs.readdirSync('./buttons');

// for (const folder of buttonFolders) {
//     const buttonFiles = fs.readdirSync(`./buttons/${folder}`).filter(file => file.endsWith('.js'));
//     for (const file of buttonFiles) {
//         const button = require(`./buttons/${folder}/${file}`);
//         client.buttons.set(button.data.id, button);
//     }
// }

// bot.on(Events.InteractionCreate, async i => {
//     if(i.isButton()) {
//         const button = client.buttons.get(i.customId);
//         console.log(`button: ${button}`)
//         if(!button) return console.log('no button');

//         try {
//             await button.execute(i);
//         } catch (error) {
//             console.error(error);
//             await i.reply({ content: 'There was an error while executing the button script !', ephemeral: true});
//         }
//     } else {
//         return;
//     }
// })
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




//slash command listener////////////////////////////////////////////////////////////////////////////////////////////////////
bot.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) {
        return;
    }
    let userblacklist = interaction.user;
    if (!bypassUsersID.includes(userblacklist.id)) {
        let blacklisted = await db.get(`blacklist_${userblacklist.id}`);
        if (blacklisted) {
            return interaction.reply({
                content: 'You are banned from using this bot.',
                ephemeral: true
            });
        }
    }
    
    //console.log(`interaction.commandName:\n${interaction.commandName}`)
    const command = client.commands.get(interaction.commandName);
    //console.log({command})
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        const category = command.category;
        const { guildId } = interaction;
        const isEnabled = await db.get(`commands_${guildId}.${category}`);
        
        if (isEnabled !== false) {
            await command.execute(interaction, bot);//vital banget cok. gak ada satu line ini, code g jalan
        } else {
          interaction.reply(`The "${category}" category is disabled in this server.`);
        }

        let usercheck = await db.get(`user_${interaction.user.id}.profile`)
        if (usercheck) {
            let expboost = await db.get(`user_${interaction.user.id}.expBoost`)
            if (!expboost) {
                expboost = 0
            }
            const exp = await db.get(`user_${interaction.user.id}.exp`);
            const level = Math.floor(0.1 * Math.sqrt(exp));

            const expamount = Math.floor(Math.random() * 25 * (level/4)) + 1 + expboost;
            
            const coinamount = Math.floor(Math.random() * 5) + 1;

            const currentExp = await db.get(`user_${interaction.user.id}.exp`);
            db.set(`user_${interaction.user.id}.exp`, currentExp + expamount);
            db.add(`user_${interaction.user.id}.coin`, coinamount);

            //console.log(`expboost: ${expboost}\nexpamountraw: ${expamount - expboost} expamounttotal: ${expamount}`)//lihat dulu pls kalau buka

            const lastRewardLevel = await db.get(`user_${interaction.user.id}.last_reward_level`) || 0;
            let rewards = [];

            for (let i = lastRewardLevel + 1; i <= level && i <= 5000; i++) {
                if (i % 5 === 0) {
                  const item = '1';
                  const quantity = 10;
                  const userInventory = await db.get(`user_${interaction.user.id}.inventory`) || {};
                  const itemName = getItemNameById(item);
                  userInventory[item] = (userInventory[item] || 0) + quantity;
                  await db.set(`user_${interaction.user.id}.inventory`, userInventory);
                  rewards.push(`${quantity} ${itemName}s`);
                } else if (i > lastRewardLevel && i <= level && i <= 5000) {
                  const coins = i * 1000;
                  db.add(`user_${interaction.user.id}.coin`, coins);
                  rewards.push(`${coins} coins`);
                }
              }
              
            if (rewards.length > 0) {
            const totalReward = rewards.length > 1 ? rewards.reduce((prev, curr) => prev + curr) : rewards[0];
            let message = `Congratulations, ${interaction.user}! You have reached level ${level} and earned ${rewards.join(' and ')}.`;
            if (rewards.length > 1) {
                message += ` You also got the rewards from the previous levels: ${totalReward}.`;
            }
            db.set(`user_${interaction.user.id}.last_reward_level`, level);
            interaction.channel.send(message);
            }

        }
    } catch (error) {
        const channel = interaction.client.channels.cache.get('1104279717806358568');
                const errorembed = new discord.EmbedBuilder()
                .setTitle('error (from index.js)')
                .setDescription(`an error has occured:\n\`\`\`${error}\`\`\``)
                .setTimestamp()
        channel.send({embeds:[ errorembed]})
        console.error(error);
    }
});
//snipe command handler for slash command ///////////////////////////////////////////////////////////////////////////////////////////////////////
client.snipes = new Map();
client.on('messageDelete', function(message, channel) {
    bot.snipes.set(message.channel.id, {
        content: message.content,
        author: message.author.tag,
        image: message.attachments.first() ? message.attachments.first().proxyURL : null
    });
});
//snipe command handler///////////////////////////////////////////////////////////////////////////////////////////////////////////////
bot.snipes = new Map()
bot.on('messageDelete', function(message, channel) {
    bot.snipes.set(message.channel.id, {
        content: message.content,
        author: message.author.tag,
        image: message.attachments.first() ? message.attachments.first().proxyURL : null
    })
})
//welcome message handler///////////////////////////////////////////////////////////////////////////////////////////////////

bot.on("guildMemberAdd", async member => {
    let chx = await db.get(`welchannel_${member.guild.id}`);
    let welMessage = await db.get(`welmessage_${member.guild.id}`);

    if (chx === null) {
        return;
    }

    let welcomeEmbed = new discord.EmbedBuilder()
        .setTitle(`${member.user.username} just joined the server`)
        .setDescription(welMessage || `Welcome to ${member.guild.name}.`)
        .setThumbnail(member.user.avatarURL())
        .setTimestamp();

    try {
        await bot.channels.cache.get(chx).send({
            embeds: [welcomeEmbed]
        });
    } catch (error) {
        console.error(error);
    }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//collections////////////////////////////////////////////////////////////////////////////////////////////////////

bot.commands = new discord.Collection();
bot.aliases = new discord.Collection();

//base command handler///////////////////////////////////////////////////////////////////////////////////////////////////

["command"].forEach(handler => {
    require(`./handlers/${handler}`)(bot)
})

//bot activity//////////////////////////////////////////////////////////////////////////////////////////////////////

bot.on("ready", () => {
    console.log("bot is active")
    bot.user.setActivity("Something")
})

//bad words handler//////////////////////////////////////////////////////////////////////////////////////////////////////

bot.on("messageCreate", async message => {
    if (message.channel.id === '831088882732892160') {
        if (message.author.bot) return;
        if (message.content.startsWith('!')) return;
        //console.log(message)

        let conversationLog = [{
            role: 'system',
            content: 'You are an evil chatbot.'
        }];

        try {
            await message.channel.sendTyping();

            let prevMessages = await message.channel.messages.fetch({
                limit: 15
            });
            prevMessages.reverse();

            prevMessages.forEach((msg) => {
                if (message.content.startsWith('!')) return;
                if (msg.author.id !== bot.user.id && message.author.bot) return;
                if (msg.author.id !== message.author.id) return;

                conversationLog.push({
                    role: 'user',
                    content: msg.content,
                });
            });

            const result = await openai.createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    prompt: conversationLog,
                    //max_tokens: 256, // limit token usage
                })
                .catch((error) => {
                    console.log(`OPENAI ERR: ${error}`);
                });

            message.reply(result.data.choices[0].message);
            console.log(`client responded ${message.author.username} with ${result.data.choices[0].text}`)
        } catch (error) {
            console.log(`ERR: ${error}`);
        }
    }
    //ni/////////////////////////////////////////////////////////////////////////////////////////////////////////////
    if (message.channel.type == "dm") return;
    if (message.author.bot) return;

    if (message.guild.id === '531064852307902477') {
        if (!message.member.permissions.has([PermissionsBitField.Flags.Administrator])) {
            let confirm = false;

            var i
            for (let i = 0; i < badwords.length; i++) {
                if (message.content.toLowerCase().includes(badwords[i].toLowerCase()))
                    confirm = true;
            }

            if (confirm) {
                message.delete()
                return message.channel.send(`${message.author.username}, You are not allowed to say that!`)
            }
        }
    }

    //base command listener//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
    let prefix = await db.get(`prefix_${message.guild.id}`);
    if (prefix === null) prefix = default_prefix;

    if (!message.guild) return;
    if (!message.content.startsWith(prefix)) return;

    if (!message.member) message.member = await message.guild.members.fetch(message);

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmdName = args.shift().toLowerCase();
    // let userblacklist = message.author;
    // var i
    // for (let i = 0; i < bypassUsersID.length; i++) {
    //     if (!bypassUsersID.includes(userblacklist.id)) {
    //         let blacklisted = await db.get(`blacklist_${userblacklist.id}`);
    //         if (blacklisted && message.content.startsWith(prefix) && cmdName.length !== 0) {
    //             return message.channel.send('You are banned from using the bot.');
    //         }
    //     }
    // }
    // if(!message.guild.me.permissions.has("VIEW_CHANNEL" && "SEND_MESSAGES")) return;

    if (cmdName.length === 0) return;
    const change = new discord.EmbedBuilder()
    .setDescription('Hey there! Our bot has been updated with some awesome new features! Instead of typing prefix to use commands, you can now use the the slash command feature.\n\nGo ahead and try it out by typing "/help" in the chat! We can\'t wait for you to see what else our bot can do.')
    .setColor(255)

    try {
        let cmd = bot.commands.get(cmdName) || bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName))
        if (cmd)
            return message.channel.send({embeds: [change]})
            //cmd.run(bot, message, args);
    } catch (e) {
        return message.channel.send(`Uh oh, An error has occured while executing the command. If this happens for more then hours, please consider to contact us by typing \`${prefix}server\`! \nThe error:\`\n${e.message}\``)
            .then(console.log(e))
    }
})

//spam/spammy/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
bot.on("messageCreate", async mes => {
    if (mes.channel.type == "dm") return;
    const spamarg = mes.content.slice("").trim().split(/ +/g)
    if (mes.channel.id === '830235509477474354') {
        if (spamarg[0] != `spam`) {
            mes.delete()
        } else {
            mes.react("<:YELLOW:828118727374405663> ")
            db.add(`spam_${mes.author.id}`, 1)
        }
    }
    if (mes.channel.id == "830626473357344829") {
        let userwe = mes.mentions.users.first() || mes.author;
        let spammy = await db.get(`spam_${userwe.id}`);
        if (!spammy) {
            spammy = 0;
        }
        if (spamarg[0] != "spammy") {
            if (mes.author.id == "727842349094535248") return;
            mes.delete();
        } else {
            return mes.channel.send(`${userwe} has \`${spammy}\` spammy`);
        }
    }
})
//prefix listener/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
bot.on("messageCreate", async msg => {
    if (msg.channel.type == "dm") return;
    if (msg.author.bot) return;
    let prefix = await db.get(`prefix_${msg.guild.id}`);
    if (prefix === null) prefix = default_prefix;

    let prefix2 = '*'

    const args2 = msg.content.slice(prefix2.length).trim().split(/ +/g);
    const cmdName2 = args2.shift().toLowerCase();

    switch (cmdName2) {
        case "prefix":
            msg.channel.send(`My prefix is ${prefix}`);
            break;
    }
})
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function getItemNameById(id) {
    const item = items.find(item => item.id === id);
    return item ? item.name : null;
  }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
bot.login(token)