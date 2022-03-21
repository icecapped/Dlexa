const Discord = require("discord.js");
const console = require("console");
const fs = require("fs");
const ws = require("ws");
const axios = require('axios');
const EventEmitter = require('events');

const config = require("./config.json");
const TOKEN_ENDPOINT = "https://api.assemblyai.com/v2/realtime/token";
const RT_ENDPOINT  = "wss://api.assemblyai.com/v2/realtime/ws?sample_rate=48000&token="
const FRAMES_PER_BUFFER = 48000 //1 fps? actually a lot faster

const COMMANDS = [
    "death",
    "definitely",
    "deafen",
    "deaf",
    "defin",
    "undeffin",
    "undeffin",
    "undeafen",
    "undeffin",
    "undeathin",
    "undeathined",
    "undefined",
    "undefinly",
    "undefin",
    "skip",
    "stop",
    "leave",
    "translate",
    "weather"
];

class VDiscord {
    static client;
    static keys;
    

    static emitter = new EventEmitter();

    constructor(client){
        const speech = require("@google-cloud/speech");
        const projectId = "angular-unison-338316";
        const keyFilename = "angular-unison-338316-0c8e7e275407.json";
        this.googleClient = new speech.SpeechClient({ projectId, keyFilename });
        this.users = new Map();
        this.lookup = new Map();
        this.buffers = new Map();
        this.snapshots = new Map();

        this.keyphrase = "alexa";

        console.log("Initializing discord");
        this.initDiscord(client);

        //console.log("Initializing assemblyai")
        //this.initAssembly();
    }


    initDiscord(client){
        this.discord = client;
    }

    initAssembly(){
        /*
        //receive transcription handling
        this.ws.onmessage = (message) => {
            //if(message.data == undefined);
            const info = JSON.parse(message.data);
            const id = 
            console.log("Transcription received. " + info)


            this.parseTranscript(info.text);
        };
        console.log("Finished assembly ai initialization");*/
    }

    async newToken(){
        const response = await axios.post(TOKEN_ENDPOINT, // use account token to get a temp user token
        { expires_in: 3600 }, // can set a TTL timer in seconds. (TODO: system for refreshing tokens)
        { headers: { authorization: config.assembly_token } }); // AssemblyAI API Key goes here
        console.log("DATA: ", response.data.token);
        return response.data.token;
    }

    //assembly 'message' event calls parse function which sends data to bot
    async parseTranscript(rtext, endpoint){
        //parse message
        //check for keyphrase
        let text = rtext;
        if(text.includes(this.snapshots.get(endpoint)))
            text = rtext.substring(this.snapshots.get(endpoint).length);
        
        
        let keyloc = text.toLowerCase().indexOf(this.keyphrase);
        if(keyloc == -1) return;

        //check for valid command
        let message = null;
        for(const str of COMMANDS){
            if(text.includes(str)){
                message = str;
                break;
            }
        }

        
        if(message == null) return;
        /*
        Attempt at fabricating DiscordMessage object. does not work
        TODO: make 

        console.log(this.discord.yep);
        messageObject = new Discord.Message(this.discord, {
            id: this.discord.yep,
            content: config.prefix + message,
            author: null,
            pinned: false,
            tts: null,
            embeds: null,
            attachments: null,
            nonce: "",
            channel: this.discord.chan,
            guild: this.discord.guild,
            member: this.lookup.get(endpoint)
        }, this.discord.chan)
        */
        this.discord.emit("voice", message, this.lookup.get(endpoint));

        this.snapshots.set(endpoint, rtext);
        console.log(this.snapshots.get())
        //make required arguments
        //emit event using cleint
    }

    async googleAudio(chunk, user){
        let username = user.user.username;
        if(!this.users.has(user)){
            this.buffers.set(user, Buffer.alloc(0));
            this.users.set(user, null);
        }
        this.buffers.set(user, Buffer.concat([this.buffers.get(user), chunk]));
        if(this.buffers.get(user).length / 2 >= FRAMES_PER_BUFFER){}
        let new_buffer = await this.convert_audio(chunk);
        const bytes = new_buffer.toString('base64'); 
        const audio = {
            content: bytes,
        };
        const config = {
            encoding: "LINEAR16",
            sampleRateHertz: 48000,
            languageCode: "en-US",
        };
        const request = {
            audio: audio,
            config: config,
        };
        
        // Detects speech in the audio file
        const [response] = await this.googleClient.recognize(request);
        const transcription = response.results
            .map((result) => result.alternatives[0].transcript)
            .join("\n");
        console.log(`Transcription: ${transcription}`);
    }

    //discord 'join' event calls send function which starts sending audio
    async sendAudio(chunk, user){
        let username = user.user.username;
        if(!this.users.has(user)){
            let promise = this.newToken();
            promise.then((value) =>{
                let endpoint = RT_ENDPOINT + value;
                var rtSocket = new ws.WebSocket(endpoint);

                rtSocket.onmessage = (message) => {
                    const info = JSON.parse(message.data);
                    
                    //print transcript for debug
                    console.log(info.text)
                    

                    if(typeof info.text != "undefined" && info.message_type == 'PartialTranscript')
                        this.parseTranscript(info.text, endpoint);
                    
                }
                console.log("NEW USER: ", username, "||", endpoint);
                this.users.set(user, rtSocket);
                this.lookup.set(endpoint, user);
            });

            this.buffers.set(user, Buffer.alloc(0));
            this.users.set(user, null);
        }

        this.buffers.set(user, Buffer.concat([this.buffers.get(user), chunk]));

        if(this.buffers.get(user).length / 2 >= FRAMES_PER_BUFFER){

            let slice = this.buffers.get(user).slice(0, FRAMES_PER_BUFFER*2);
            this.buffers.set(user, this.buffers.get(user).slice(FRAMES_PER_BUFFER * 2));

            const data = new Int16Array(slice);
            const ndata = new Int16Array(data.length/2);
            
            for (let i = 0; i < FRAMES_PER_BUFFER*2; i+=2) {
                ndata[i] = data[i * 2]
                ndata[i + 1] = data[i * 2 + 1]
            }
            
            const mono = Buffer.from(ndata, "binary");
            //fs.appendFileSync("testfile",mono);
            //Audio bitstream debugging

            //Wait for websocket to open
            while(this.users.get(user) == null || this.users.get(user).readyState == 0){
                await new Promise(r => setTimeout(r, 100));
            }

            //Send audio stream to AssemblyAI
            let response = await this.users.get(user).send(JSON.stringify({
                audio_data: mono.toString('base64'), 
                word_boost: [this.keyphrase, "deafen", "undeafen", "undeafin"],
                format_text: false
            }));
        }
    }

    //manually flushes/pushes buffer
    async finished(user){
        let slice = this.buffers.get(user).slice(0);
        this.buffers.get(user) = this.buffers.get(user).slice(buffer.length);

        const data = new Int16Array(slice);
        const ndata = new Int16Array(data.length/2);
        
        for (let i = 0; i < slice.length; i+=2) {
            ndata[i] = data[i * 2]
            ndata[i + 1] = data[i * 2 + 1]
        }
        
        const mono = Buffer.from(ndata, "binary");

        this.users.get(user).send(JSON.stringify({
            audio_data: mono.toString('base64'), 
            word_boost: [this.keyphrase],
            format_text: false
        }));        
    }
    async convert_audio(input) {
        try {
          // stereo to mono channel
          const data = new Int16Array(input);
          const ndata = new Int16Array(data.length / 2);
          for (let i = 0, j = 0; i < data.length; i += 4) {
            ndata[j++] = data[i];
            ndata[j++] = data[i + 1];
          }
          return Buffer.from(ndata);
        } catch (e) {
          console.log(e);
          console.log("convert_audio: " + e);
          throw e;
        }
      }

}


module.exports = VDiscord;