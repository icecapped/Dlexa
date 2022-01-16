const config = require("./config.json")
const {Translate} = require("@google-cloud/translate").v2;
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const util = require("util");
const axios = require("axios")

class utilities{
    //translate, weather, tts, google search


    translateText(text, target) {
        let [translations] = translate.translate(text, target);
        console.log(translations);
    }

    async texttomp3(tts, text, message){
        const request = {
            input: {text: text},
            voice: {languageCode: "en_US", ssmlGender: "FEMALE"},
            audioConfig: {audioEncoding: "MP3"},
          };

        const [response] = await tts.synthesizeSpeech(request);
        const writeFile = util.promisify(fs.writeFile);
        writeFile("audio/output.mp3", response.audioContent, "binary");
        const m = message.channel.send("Message successfully converted to speech at output.mp3");
    }

    //function to search youtube with a key phrase and check if results are correct
    youtubesearch(search, message){
        axios.get("https://serpapi.com/search.json?engine=youtube&search_query=" + search + "&api_key=" + config.search_token).then(resp =>{
            const video = resp.data.video_results[ytcounter];
            ytlink = video.link;
            ytsearch = search;
            const m = message.channel.send("Title of video is "  + video.title + " by " + video.channel.name + ". Is this correct? (?y/?n)");
        });
    }

    async respondToMessage(message){
        const projectId = "angular-unison-338316"
        const keyFilename = "angular-unison-338316-0c8e7e275407.json"
        const translate = new Translate({projectId, keyFilename});
        const tts = new textToSpeech.TextToSpeechClient({projectId, keyFilename});
        var ytcounter = 0;
        var ytsearch = "";
        var ytlink = "";    

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
            this.texttomp3(tts, text, message);
        }
        else if(keyword == "translate"){
            const text = tokens.slice(2).join(" ");
            const target = tokens[1];
            let [translations] =  await translate.translate(text, target);
            const m = await message.channel.send(translations.toString());
        }
        else if(keyword == "weather"){
            try{
                const city = tokens[1];
                axios.get("http://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=metric&appid=" + config.weather_token).then(resp =>{
                    const output = "Temp is " + resp.data.main.temp + " C, feels like " + resp.data.main.feels_like + " C, " + resp.data.weather[0].description + ".";
                    const m = message.channel.send(output);
                    this.texttomp3(tts, output, message);
                });
            }
            catch(err){
                console.log(err);
            }

        }
        else if(keyword == "search"){
            try{
                const searchText = tokens.slice(1).join(" ");
                axios.get("https://serpapi.com/search.json?engine=google&q=" + searchText + "&api_key=" + config.search_token).then(resp =>{
                    if(!(typeof resp.data.knowledge_graph === "undefined") && !(typeof resp.data.knowledge_graph.title === "undefined") && !(typeof resp.data.knowledge_graph.description === "undefined")){
                        const output = resp.data.knowledge_graph.description;
                        const m = message.channel.send(output);
                        this.texttomp3(tts, output, message);
                    }
                    else{
                        const output = resp.data.organic_results[0].snippet
                        const m = message.channel.send(output);
                        this.texttomp3(tts, output, message);
                    }
                });
            }
            catch(err){
                console.log(err);
            }

        }
        else if(keyword == "ytsearch"){
            const search = tokens.slice(1).join(" ");
            this.youtubesearch(search, message);
        }
        else if(keyword == "y"){
            if (ytlink == ""){
                const m = await message.channel.send("Please search for a youtube video first. ");
            }
            else{
                const m = await message.channel.send(ytlink);
                ytlink = "";
                ytcounter = 0;
            }
        }
        else if(keyword == "n"){
            if (ytlink == ""){
                const m = await message.channel.send("Please search for a youtube video first. ");
            }
            else{
                ytcounter = ytcounter + 1;
                this.youtubesearch(ytsearch, message);
            }
        }
    }
}

module.exports = utilities 