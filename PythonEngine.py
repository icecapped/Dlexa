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
    keys = open("keys.txt")