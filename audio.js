const Discord = require("discord.js");
const DiscordVoice = require('@discordjs/voice');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const speech = require('@google-cloud/speech');
const { OpusEncoder } = require('@discordjs/opus');
const fs = require('fs');
const ytdl = require('ytdl-core');


const client = new Discord.Client({intents: ["GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILDS"]});
const speechClient = new speech.SpeechClient(); 
const config = require("./config.json");
const player = DiscordVoice.createAudioPlayer();
const encoder = new OpusEncoder(48000, 2);


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

        var voice = joinVoice(channel);
        
        // const connection2 = getVoiceConnection(channel.guild.id);
        
        // connection2.on('voiceStateUpdate', (user, speaking) => { 
        //     console.log("THSIASIHORHWVOAEUVHLSIDGH,SDFKS")
        //     if (user.bot) return; 
        //     if (!speaking) return;
        //     console.log(user);


        //     const audio = connection.receiver.createStream(user, { mode: 'pcm' }); 

        //     const audioFileName = './recordings/' + user.id + '_' + Date.now() + '.pcm';

        //     audio.pipe(fs.createWriteStream(audioFileName));
            
        //     audio.on('end', async () => {
        //         fs.stat(audioFileName, async (err, stat) => { 
        //             if (!err && stat.size) {
        //                 const file = fs.readFileSync(audioFileName);
        //                 const audioBytes = file.toString('base64');
        //                 const audio = {
        //                 content: audioBytes,
        //             };
        //             const config = {
        //                 encoding: 'LINEAR16',
        //                 sampleRateHertz: 48000,
        //                 languageCode: 'en-US',
        //                 audioChannelCount: 2,
        //             };
        //             const request = {
        //                 audio: audio,
        //                 config: config,
        //             };
        //             const [response] = await speechClient.recognize(request);
        //             const transcription = response.results
        //                 .map(result => result.alternatives[0].transcript)
        //                 .join('\n');
        //             message.reply(transcription);
        //         }
        //         });
        //     });

        // });
    }

    //play youtube video
    if(command === "play"){
        if ((message.member.voice.channel.members.filter((e) => client.user.id === e.user.id).size == 0)){
            joinVoice(channel);
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
        const connection = getVoiceConnection(channel.guild.id);
        connection.destroy();    
    }
    
    if(command === "record"){
        if(!channel) return message.channel.send('Join a VC first!');

        const connection = joinVoice(channel);
        const receiver = new DiscordVoice.VoiceReceiver(connection);

        // const writer = receiver.pipe(fs.createWriteStream('./audio/recording.pcm'));
        // writer.on('finish', () => {
        //     channel.leave();
        //     message.channel.send('It went quiet, so I left...');
        // });


        // const ffmpeg = require('ffmpeg');

        // try {
        //     var process = new ffmpeg('./audio/recording.pcm');
        //     process.then(function (audio) {
        //         audio.fnExtractSoundToMP3('./audio/file.mp3', function (error, file) {
        //         if (!error) console.log('Audio File: ' + file);
        //         });
        // }, function (err) {
        //     console.log('Error: ' + err);      
        // });
        // } catch (e) {
        //     console.log(e);
        // }
    }
});

client.login(config.token);