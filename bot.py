from click import pass_context
import discord
from discord.ext import commands

TOKEN = 'OTMwNTkyNjEwOTgzMjMxNTU5.Yd4H6A.fAbTU6LYKv2eE3hIzJZL3i17wgg'

intents = discord.Intents.default()
bot = commands.Bot(command_prefix = '#', intents=intents)


@bot.command(pass_context = True)
async def join(ctx):
    if(ctx.author.voice):
        channel = ctx.message.author.voice.channel
        await channel.connect()

@bot.command(pass_context = True)
async def leave(ctx):
    await ctx.voice_client.disconnect()
    await ctx.send("I farted on bryant")

@bot.event
async def on_ready():
    print('Logged on as {0.user}!'.format(bot))

@bot.event
async def on_message(message):
    print('Message from {0.author}: {0.content}'.format(message))
    channel = bot.get_channel(396839721227124736)
    print(channel)
    await bot.process_commands(message)
    
#396839721227124736
bot.run(TOKEN)