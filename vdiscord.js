const Discord = require("discord.js");
const console = require("console");
const fs = require("fs");
const ws = require("ws");

const RT_ENDPOINT  = "wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000"
const FRAMES_PER_BUFFER = 3200


//Voice-based wrapper for discord.js
class VDiscord {
    static client = new Discord.Client({intents: ["GUILD_MESSAGES", "GUILD_VOICE_STATES", "GUILDS"]});
    static keys;

    active;

    constructor(){
        this.initDiscord();

        keys = fs.readFileSync("keys.txt", "utf8").split("\n");
    }


    initDiscord(){
        client.on("ready", () => {
            console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
            client.user.setActivity(`Farting on all of humanity`);
        });

        
    }

    initAssembly(){
        
    }

    async run(){

    }
}

console.log("asd")