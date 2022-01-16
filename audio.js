const Discord = require("discord.js");
const DiscordVoice = require('@discordjs/voice');
const speech = require('@google-cloud/speech');
const { OpusEncoder } = require('@discordjs/opus');
const fs = require('fs');
const ytdl = require('ytdl-core');


const client = new Discord.Client({intents: ["GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILDS"]});
const speechClient = new speech.SpeechClient(); 
const config = require("./config.json");
const player = DiscordVoice.createAudioPlayer();
stream = null;

function joinVoice(channel){
    return connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
    });
}

client.on("ready", () => {
    console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
    client.user.setActivity(`Farting on all of humanity`);
});

client.on("message", async message => {
    if(message.author.bot) return; 
    if(!message.content.startsWith(config.prefix)) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const channel = message.member.voice.channel; 
    
    if(command === "ping") {
        const m = await message.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
    }
    
    if(command === "join") {
        if (!message.member.voice.channel) return message.reply('Please join a voice channel first!');
        if ((message.member.voice.channel.members.filter((e) => client.user.id === e.user.id).size > 0)) return message.reply(`I'm already in your voice channel!`);
    
        if (!message.member.voice.channel.joinable) return message.reply(`I don't have permission to join that voice channel!`);
        if (!message.member.voice.channel.speakable) return message.reply(`I don't have permission to speak in that voice channel!`);

        if (channel) {
            const connection = await channel.join();

            const receiver = connection.receiver.createStream(message.member, {
                mode: "pcm",
                end: "silence"
              });
            const writer = receiver.pipe(fs.createWriteStream('audio/user_audio'));
            writer.on('finish', () => {
                channel.leave();
                message.channel.send('It went quiet, so I left...');
            });
            
        }
        
        
    }

    //play youtube video
    if(command === "play"){
        if ((message.member.voice.channel.members.filter((e) => client.user.id === e.user.id).size == 0)){
            if (channel) {
                const connection = await channel.join();
            }
        } 

        const url = args[0];

        if(!url) return message.reply('No url');
        const stream = ytdl(url, {filter: 'audioonly'});
        const resource = DiscordVoice.createAudioResource(stream);

        player.play(resource);
        const connection = getVoiceConnection(channel.guild.id);
        connection.subscribe(player);
        message.reply('Playing music');
    }

    //stop player
    if(command === "stop"){
        player.stop();
    }

    //leave call
    if(command === "leave") {
        if ((message.member.voice.channel.members.filter((e) => client.user.id === e.user.id).size == 0)) return message.reply(`I already left`);
        const connection = client.getVoiceConnection(channel.guild.id);

        connection.leave();    
    }
    
    if(command === "record"){
        if(!channel) return message.channel.send('Join a VC first!');

        const connection = joinVoice(channel);
        const receiver = new DiscordVoice.VoiceReceiver(connection);
        stream = receiver.subscribe("165218817025245186");
        stream.pipe(fs.createWriteStream('user_audio'))
        console.log()
        stream.on('data', data => {
            let chunk;
            console.log('Stream is readable (new data received in buffer)');
            
        });
    }

    if(command === "pause"){
        stream.pause();
        console.log("CALLED")

        
        stream.on('end', () => {
            console.log('Reached end of stream.');
        });
    }
    if(command === "test"){
        console.log("start");
        const ffmpeg = require('ffmpeg');

        try {
            console.log("process start");
            var process = new ffmpeg('audio/user_audio');
            
            process.then(function (audio) {
                audio.fnExtractSoundToMP3('audio/file.mp3', function (error, file) {
                if (!error) console.log('Audio File: ' + file);
                });
            }, function (err) {
                console.log('Error: ' + err);      
            });
            } catch (e) {
            console.log(e);
            }
        console.log("process end");
    }
});



client.login(config.token);