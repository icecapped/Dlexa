const Discord = require("discord.js");
const DiscordVoice = require('@discordjs/voice')
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice')
const speech = require('@google-cloud/speech');
const fs = require('fs');
const ytdl = require('ytdl-core');


const client = new Discord.Client({intents: ["GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILDS"]});
const speechClient = new speech.SpeechClient(); 
const config = require("./config.json");
const player = DiscordVoice.createAudioPlayer();
const listener = new DiscordVoice.VoiceReceiver();



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

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
        });
        const connection2 = getVoiceConnection(channel.guild.id);
        
        connection2.on('voiceStateUpdate', (user, speaking) => { 
            console.log("THSIASIHORHWVOAEUVHLSIDGH,SDFKS")
            if (user.bot) return; 
            if (!speaking) return;
            console.log(user);


            // const audio = connection.receiver.createStream(user, { mode: 'pcm' }); 

            // const audioFileName = './recordings/' + user.id + '_' + Date.now() + '.pcm';

            // audio.pipe(fs.createWriteStream(audioFileName));
            
            // audio.on('end', async () => {
            //     fs.stat(audioFileName, async (err, stat) => { 
            //         if (!err && stat.size) {
            //             const file = fs.readFileSync(audioFileName);
            //             const audioBytes = file.toString('base64');
            //             const audio = {
            //             content: audioBytes,
            //         };
            //         const config = {
            //             encoding: 'LINEAR16',
            //             sampleRateHertz: 48000,
            //             languageCode: 'en-US',
            //             audioChannelCount: 2,
            //         };
            //         const request = {
            //             audio: audio,
            //             config: config,
            //         };
            //         const [response] = await speechClient.recognize(request);
            //         const transcription = response.results
            //             .map(result => result.alternatives[0].transcript)
            //             .join('\n');
            //         message.reply(transcription);
            //     }
            //     });
            // });

        });
    }
    if(command === "play"){
        if ((message.member.voice.channel.members.filter((e) => client.user.id === e.user.id).size == 0)) return message.reply(`I'm not in a channel`);
        const resource = DiscordVoice.createAudioResource('track.mp3');
        player.play(resource);
        const connection = getVoiceConnection(channel.guild.id);

        // Play "track.mp3" across two voice connections
        connection.subscribe(player);
    }

    if(command === "play1"){
        if ((message.member.voice.channel.members.filter((e) => client.user.id === e.user.id).size == 0)) return message.reply(`I'm not in a channel`);
        const url = args[0];

        if(!url) return message.reply('No url');
        const stream = ytdl(url, {filter: 'audioonly'});
        const resource = DiscordVoice.createAudioResource(stream);

        player.play(resource)
    }

    if(command === "leave") {
        if ((message.member.voice.channel.members.filter((e) => client.user.id === e.user.id).size == 0)) return message.reply(`I already left`);
        const connection = getVoiceConnection(channel.guild.id);
        connection.destroy();        
    }
  
});

client.login(config.token);