const Discord = require("discord.js");
const DiscordVoice = require('@discordjs/voice');
const { OpusEncoder } = require('@discordjs/opus');
const fs = require('fs');
const ytdl = require('ytdl-core');
const VDiscord = require('./vdiscord.js');
const utilities = require('./index.js');

const client = new Discord.Client({intents: ["GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILDS"]});
const config = require("./config.json");
const queue = new Map();
const controller = new VDiscord(client);
const utils = new utilities();

var chan = null;
var guild = null;
var yep = null;

async function play(connection, url) {
    connection.play(await ytdl(url, {filter: 'audioonly'}), { type: 'opus' });
}

client.on("ready", () => {
    console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
    client.user.setActivity(`Use $ for commands.`);
});

client.on("message", async message => {
    if(!message.content.startsWith(config.prefix)) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const channel = message.member.voice.channel;
    guild = message.guild;
    yep = message.id;

    if(command === "deafen"){
        message.member.voice.setDeaf(true)
    }
    

    if(command === "undeafen"){
        message.member.voice.setDeaf(false)
    }

    //use utils
    utils.respondToMessage(message, client);
    if(command === "ping") {
        const m = await message.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
    }
    
    if(command === "join") {
        if (!channel) return message.reply('Please join a voice channel first!');
        if ((channel.members.filter((e) => client.user.id === e.user.id).size > 0)) return message.reply(`I'm already in your voice channel!`);
    
        if (!channel.joinable) return message.reply(`I don't have permission to join that voice channel!`);
        if (!channel.speakable) return message.reply(`I don't have permission to speak in that voice channel!`);

        if (channel) {
            const connection = await channel.join();
            chan = message.channel;
        } 
    }

    const serverQueue = queue.get(message.guild.id);

    if (command === "play") {
        execute(message, serverQueue);
        return;
      } else if (command === "skip") {
        skip(message, serverQueue);
        return;
      } else if (command === "stop") {
        stop(message, serverQueue);
        return;
      } 

    //leave call
    if(command === "leave") {
        if ((message.member.voice.channel.members.filter((e) => client.user.id === e.user.id).size == 0)) return message.reply(`I already left`);
        channel.leave();    
    }
    
    if(command === "record"){
        if(!channel) return message.channel.send('Join a VC first!');
        if ((channel.members.filter((e) => client.user.id === e.user.id).size == 0)) return message.reply('Join a VC');

        const connection = client.voice.connections.get(message.member.guild.id);
        channel.members.forEach((memberVC) => {
            if(!memberVC.user.bot){
                console.log(memberVC.user.username)
                const receiver = connection.receiver.createStream(memberVC, {
                    mode: "pcm",
                    end: "manual"
                });
                receiver.on('data', data => {
                    //console.log("debug: " + data)
                    controller.sendAudio(data, memberVC);
                });


                message.channel.send('Recording for ' + memberVC.user.username);
                const writer = receiver.pipe(fs.createWriteStream('audio/'+memberVC.user.username+'audio'));
                writer.on('finish', () => {
                    message.channel.send('Done for ' + memberVC.user.username);
                });
            }
        })
    }
});


client.on("voice", async (message, member) => {
    console.log(message , " : " , member.user.username );
    //const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = message;
    const channel = member.voice.channel;

    if(command === "death" || command === "deafen" || command === "deaf" || command === "definitely" || command === "defin"){
        member.voice.setDeaf(true)
    }
    else if(command === "undeafen" || command === "undeafin" || command === "undefin" || command === "undefinly" || command === "undeafined" || command === "undeffin" || command === "undefined"){
        member.voice.setDeaf(false)
    }
    
    //use utils
    utils.respondToVoice(message, member, client);
    const serverQueue = queue.get(member.guild.id);


    if (command === "skip") {
        v_skip(message, serverQueue);
        return;
    } else if (command === "stop") {
        v_stop(message, serverQueue);
        return;
    } 

    //leave call
    if(command === "leave") {
        if ((member.voice.channel.members.filter((e) => client.user.id === e.user.id).size == 0)) return message.reply(`I already left`);
        channel.leave();    
    }
    
});

async function execute(message, serverQueue) {
    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send("You need to be in a voice channel to play music!");
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send("I need the permissions to join and speak in your voice channel!");
    }
  
    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
     };
  
    if (!serverQueue) {
        const queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true
        };
  
        queue.set(message.guild.id, queueContruct);
    
        queueContruct.songs.push(song);
    
        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
      serverQueue.songs.push(song);
      return message.channel.send(`${song.title} has been added to the queue!`);
    }
}
  
function skip(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to stop the music!");
    if (!serverQueue)
        return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();
}

function v_skip(serverQueue) {
    if (!serverQueue)return;
    serverQueue.connection.dispatcher.end();
}

function v_stop(serverQueue) {
    if (!serverQueue)return;
      
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to stop the music!");
      
    if (!serverQueue)return message.channel.send("There is no song that I could stop!");
      
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}
  
function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
  
    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {

            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}



client.login(config.token);