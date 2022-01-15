import requests
import time
import sys

ENDPOINT = "https://api.assemblyai.com/v2/transcript"

HEADERS = {
    "authorization": sys.argv[0],
    "content-type": "application/json"
}


# API Keys
def retrieveAPIKeys() -> tuple:
    """
    Retrieves API keys from a text file. 

    [0]: Discord API 
    [1]: AssemblyAI API
    """
    
    keyFile = open("keys.txt")
    keys = keyFile.readLines()
    keys = [item.rstrip() for item in keys]

    print (keys)

retrieveAPIKeys()