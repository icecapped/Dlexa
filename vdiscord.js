const Discord = require("discord.js");
const console = require("console");
const fs = require("fs");
const ws = require("ws");

const RT_ENDPOINT  = "wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000"
const FRAMES_PER_BUFFER = 12000 //4 fps


static class VDiscord {
    static client;
    static keys;

    static ws;

    static buffer = Buffer.alloc(0);

    constructor(){
        this.keys = fs.readFileSync("keys.txt", "utf8").split("\n");
        for(let i = 0; i < this.keys.length; i++){
            this.keys[i] = this.keys[i].trim();
        }

        console.log("Initializing discord");
        this.initDiscord();

        console.log("Initializing assemblyai")
        this.initAssembly();
    }


    initDiscord(client){
        this.client = new Discord.Client({intents: ["GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILDS"]});

        this.client.on("ready", () => {
            console.log(`Bot has started, with ${this.client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
            this.client.user.setActivity(`Farting on all of humanity`);
        });
        
        console.log("Finished discord initialization")
    }

    initAssembly(){
        console.log(this.keys);
        this.ws = new ws.WebSocket(RT_ENDPOINT+"&token="+this.keys[1]);

        //receive transcription handling
        this.ws.on('message',(message) => {
            if(message.data == undefined) return;
            const info = JSON.parse(message.data);
            console.log("Transcription received. Type: " + data.message_type)

            //parse transcription
        });
        console.log("Finished assembly ai initialization");
    }

    //assembly 'message' event calls parse function which sends data to bot
    async parseTranscript(){

    }

    //discord 'join' event calls send function which starts sending audio
    async sendAudio(chunk){
        this.buffer.write(chunk, "binary");

        if(this.buffer.length / 4 >= FRAMES_PER_BUFFER){
            const data = new Int16Array(buffer);
            const ndata = new Int16Array(data.length/2);

            for (let i = 0, j = 0; i < FRAMES_PER_BUFFER * 4; i+=4) {
                ndata[j++] = data[i]
                ndata[j++] = data[i+1]
            }
            
            this.buffer = this.buffer.slice(FRAMES_PER_BUFFER * 4)
            const mono = Buffer.from(ndata, "binary");


            //send data to api
        }
    }

    //stops send function
    async stopAudio(){

    }

}

console.log("asd")

var thing = new VDiscord();