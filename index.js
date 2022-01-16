const { Client, Intents } = require("discord.js");
const config = require("./config.json")
const {Translate} = require("@google-cloud/translate").v2;
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const util = require("util");
const axios = require("axios")

const projectId = "angular-unison-338316"
const keyFilename = "C:\\Users\\Jeffery\\Desktop\\deltahacks\\angular-unison-338316-0c8e7e275407.json"
const translate = new Translate({projectId, keyFilename});
const tts = new textToSpeech.TextToSpeechClient({projectId, keyFilename});


async function translateText(text, target) {
    let [translations] = await translate.translate(text, target);
    console.log(translations);
  }

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});

client.once("ready", () => {
    console.log("Logged in");
});

client.on("message", async message =>{
    if(message.author.bot) return; 
    //?translate fr hello world
    if(!message.content.startsWith(config.prefix)) return;
    //[translate, fr, hello, world]
    const tokens = message.content.slice(config.prefix.length).trim().split(" ");
    const keyword = tokens[0].toLowerCase();

    if(keyword == "ping"){
        const m = await message.channel.send("pong");
    }
    else if(keyword == "tts"){
        const text = tokens.slice(1).join(" ");
        const request = {
            input: {text: text},
            voice: {languageCode: "en_US", ssmlGender: "FEMALE"},
            audioConfig: {audioEncoding: "MP3"},
          };
        
        const [response] = await tts.synthesizeSpeech(request);
        const writeFile = util.promisify(fs.writeFile);
        await writeFile("output.mp3", response.audioContent, "binary");
        const m = await message.channel.send("Message successfully converted to speech at output.mp3")
    }
    else if(keyword == "translate"){
        const text = tokens.slice(2).join(" ");
        const target = tokens[1];
        let [translations] = await translate.translate(text, target);
        const m = await message.channel.send(translations.toString());
    }
    else if(keyword == "weather"){
        const city = tokens[1];
        axios.get("http://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=metric&appid=" + config.weather_token).then(resp =>{
            const m = message.channel.send("Temp is " + resp.data.main.temp + " C, feels like " + resp.data.main.feels_like + " C, " + resp.data.weather[0].description + ".");
        })
    }
    else if(keyword == "search"){
        axios.get("https://serpapi.com/search.json?engine=google&q=Coffee&api_key=8" + config.search_token).then(resp =>{
            console.log(resp.data);
        })
    }
});

client.login(config.discord_token);