const { Client, Intents } = require("discord.js");
const config = require("./config.json")
const {Translate} = require("@google-cloud/translate").v2;
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const util = require("util");
const axios = require("axios")

const projectId = "angular-unison-338316"
const keyFilename = "angular-unison-338316-0c8e7e275407.json"
const translate = new Translate({projectId, keyFilename});
const tts = new textToSpeech.TextToSpeechClient({projectId, keyFilename});

//global variables for searching on youtube
var ytcounter = 0;
var ytsearch = "";
var ytlink = "";

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});

//initializing discord bot
client.once("ready", () => {
    console.log("Logged in");
});

//function to convert a string to mp3 using google's text-to-speech API
async function texttomp3(text, message){
    const request = {
        input: {text: text},
        voice: {languageCode: "en_US", ssmlGender: "FEMALE"},
        audioConfig: {audioEncoding: "MP3"},
      };
    
    const [response] = await tts.synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    writeFile("output.mp3", response.audioContent, "binary");
    const m = message.channel.send("Message successfully converted to speech at output.mp3");
}

//function to search youtube with a key phrase and check if results are correct
function youtubesearch(search, message){
    axios.get("https://serpapi.com/search.json?engine=youtube&search_query=" + search + "&api_key=" + config.search_token).then(resp =>{
        const video = resp.data.video_results[ytcounter];
        ytlink = video.link;
        ytsearch = search;
        const output = "Title of video is "  + video.title + " by " + video.channel.name + ". Is this correct? (?y/?n)";
        const m = message.channel.send(output);
        texttomp3(output, message);
    });
}

//checking any message that is sent
client.on("message", async message =>{
    //bot's own messages are ignored
    if(message.author.bot) return; 
    //commands must start with correct prefix
    if(!message.content.startsWith(config.prefix)) return;
    //removes prefix and converts string into tokens
    const tokens = message.content.slice(config.prefix.length).trim().split(" ");
    const keyword = tokens[0].toLowerCase();

    //test ping
    if(keyword == "ping"){
        const m = await message.channel.send("pong");
    }
    else if(keyword == "tts"){
        const text = tokens.slice(1).join(" ");
        texttomp3(text, message);
    }
    //format of translate is ?translate, target language (2 letters), phrase to translate (?translate fr hello world)
    else if(keyword == "translate"){
        const text = tokens.slice(2).join(" ");
        const target = tokens[1];
        let [translations] = await translate.translate(text, target);
        const m = await message.channel.send(translations.toString());
    }
    //format of weather is ?weather cityName, will write mp3 file on top of sending a message
    else if(keyword == "weather"){
        const city = tokens[1];
        axios.get("http://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=metric&appid=" + config.weather_token).then(resp =>{
            const output = "The temperature is " + resp.data.main.temp + " degrees Celcius, it feels like " + resp.data.main.feels_like + " degrees Celcius, and the weather is " 
            + resp.data.weather[0].description + ".";
            const m = message.channel.send(output);
            texttomp3(output, message);
        });
    }
    //searches google with keyphrase, if knowledge graph is available then reads it off, otherwise
    //reads snippet of first organic (not ads) result, also writes mp3
    else if(keyword == "search"){
        const searchText = tokens.slice(1).join(" ");
        axios.get("https://serpapi.com/search.json?engine=google&q=" + searchText + "&api_key=" + config.search_token).then(resp =>{
            if(!(typeof resp.data.knowledge_graph === "undefined") && !(typeof resp.data.knowledge_graph.title === "undefined") && !(typeof resp.data.knowledge_graph.description === "undefined")){
                const output = resp.data.knowledge_graph.description;
                const m = message.channel.send(output);
                texttomp3(output, message);
            }
            else{
                const output = resp.data.organic_results[0].snippet
                const m = message.channel.send(output);
                texttomp3(output, message);
            }
        });
    }
    else if(keyword == "ytsearch"){
        const search = tokens.slice(1).join(" ");
        youtubesearch(search, message);
    }
    else if(keyword == "y"){
        if (ytlink == ""){
            const output = "Please search for a youtube video first. "
            const m = await message.channel.send(output);
            texttomp3(output, message);
        }
        else{
            const m = await message.channel.send(ytlink);
            ytlink = "";
            ytcounter = 0;
        }
    }
    else if(keyword == "n"){
        if (ytlink == ""){
            const output = "Please search for a youtube video first. "
            const m = await message.channel.send(output);
            texttomp3(output, message);
        }
        else{
            ytcounter = ytcounter + 1;
            youtubesearch(ytsearch, message);
        }
    }
});

client.login(config.discord_token);