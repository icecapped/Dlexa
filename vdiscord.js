const Discord = require("discord.js");
const console = require("console");
const fs = require("fs");
const ws = require("ws");
const axios = require('axios');
const EventEmitter = require('events')

const TOKEN_ENDPOINT = "https://api.assemblyai.com/v2/realtime/token";
const RT_ENDPOINT  = "wss://api.assemblyai.com/v2/realtime/ws?sample_rate=48000&token="
const FRAMES_PER_BUFFER = 48000 //1 fps


class VDiscord {
    static client;
    static keys;

    static emitter = new EventEmitter();

    constructor(client){
        this.users = new Map();
        this.buffer = Buffer.alloc(0);
        this.keys = fs.readFileSync("keys.txt", "utf8").split("\n");

        this.keyphrase = "bob";

        for(let i = 0; i < this.keys.length; i++){
            this.keys[i] = this.keys[i].trim();
        }
        console.log(this.keys);

        console.log("Initializing discord");
        this.initDiscord(client);

        //console.log("Initializing assemblyai")
        //this.initAssembly();
    }


    initDiscord(client){
        this.discord = client;

        client.emitter
    }

    initAssembly(){
        //receive transcription handling
        this.ws.onmessage = (message) => {
            //if(message.data == undefined);
            const info = JSON.parse(message.data);
            console.log("Transcription received. " + info)

            //TODO: parse transcription 
            this.parseTranscript(info.text);
        };
        console.log("Finished assembly ai initialization");
    }

    async newToken(){
        const response = await axios.post(TOKEN_ENDPOINT, // use account token to get a temp user token
        { expires_in: 3600 }, // can set a TTL timer in seconds. (TODO: refresh tokens)
        { headers: { authorization: "678413c8390c4594a5e172101e216bad" } }); // AssemblyAI API Key goes here
        console.log("DATA: ", response.data.token);
        return response.data.token;
    }

    //assembly 'message' event calls parse function which sends data to bot
    async parseTranscript(text){
        //parse message
        let keyloc = text.indexOf(keyphrase);

        if(keyloc == -1) return;

        //go through every command
        if(text.includes("ready")){

        }
        //make required arguments
        //emit event using cleint
    }


    //discord 'join' event calls send function which starts sending audio
    async sendAudio(chunk, username){
        this.buffer = Buffer.concat([this.buffer, chunk]);

        if(this.buffer.length / 2 >= FRAMES_PER_BUFFER){
            console.log("1 second")

            if(!this.users.has(username)){
                let promise = this.newToken();
                promise.then((value) =>{
                    let endpoint = RT_ENDPOINT + value;
                    var rtSocket = new ws.WebSocket(endpoint);

                    rtSocket.onmessage = (message) => {
                        const info = JSON.parse(message.data);
                        //console.log("Transcription received. ", info)
                        console.log(info.text);
                    }
                    console.log("NEW USER: ", username, "||", endpoint);
                    this.users.set(username, rtSocket);
                });

                this.users.set(username, null);
            }

            let slice = this.buffer.slice(0, FRAMES_PER_BUFFER*2);
            this.buffer = this.buffer.slice(FRAMES_PER_BUFFER * 2);

            const data = new Int16Array(slice);
            const ndata = new Int16Array(data.length/2);
            
            for (let i = 0; i < FRAMES_PER_BUFFER*2; i+=2) {
                ndata[i] = data[i * 2]
                ndata[i + 1] = data[i * 2 + 1]
            }
            
            const mono = Buffer.from(ndata, "binary");
            fs.appendFileSync("testfile",mono);

            //console.log(mono)
            //send data to api

            //endpoint = RT_ENDPOINT + this.users.get(username);
            //rtSocket = new WebSocket(endpoint);

            //wait for websocket to open
            while(this.users.get(username) == null || this.users.get(username).readyState == 0){
                await new Promise(r => setTimeout(r, 100));

            }
            //console.log(this.users.get(username).readyState);
            let response = await this.users.get(username).send(JSON.stringify({
                audio_data: mono.toString('base64'), 
                word_boost: [this.keyphrase],
                format_text: false
            }));
            //console.log("response: " + response); //  + "  ws:",this.ws
        }
    }

    //manually flushes/pushes buffer
    async finished(username){
        let slice = this.buffer.slice(0);
        this.buffer = this.buffer.slice(buffer.length);

        const data = new Int16Array(slice);
        const ndata = new Int16Array(data.length/2);
        
        for (let i = 0; i < slice.length; i+=2) {
            ndata[i] = data[i * 2]
            ndata[i + 1] = data[i * 2 + 1]
        }
        
        const mono = Buffer.from(ndata, "binary");

        this.users.get(username).send(JSON.stringify({
            audio_data: mono.toString('base64'), 
            word_boost: [this.keyphrase],
            format_text: false
        }));

        
    }

}

console.log("asd")


module.exports = VDiscord;