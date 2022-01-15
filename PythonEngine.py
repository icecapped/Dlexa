import requests
import time
import sys
import os
import discord
from discord.ext import commands
from voiceprocessor import VoiceProcessor

#############
# API Keys
#############
W_DIR = os.getcwd()

def retrieveAPIKeys() -> tuple:
    """
    Retrieves API keys from a text file. 

    [0]: Discord API 
    [1]: AssemblyAI API
    """
    
    keyFile = open(W_DIR + "\keys.txt")
    keys = keyFile.readlines()
    keys = [item.rstrip() for item in keys]
    return keys

_keys = retrieveAPIKeys()




##############
# Discord Bot
##############
intents = discord.Intents.default()
bot = commands.Bot(command_prefix = '#', intents = intents)

apiDisc = _keys[0]

@bot.event
async def on_ready():
    print('Logged on as {0.user}!'.format(bot))

@bot.event
async def on_message(message):
    print('Message from {0.author}: {0.content}'.format(message))
    channel = bot.get_channel(396839721227124736)
    print(channel)
    await bot.process_commands(message)

bot.run(apiDisc)