import threading
import requests
import time
import sys

class VoiceProcessor:
    """
    TODO:   - take audio stream as input, provides transcription data
            - test two apps connected to assemblyapi websocket
    """
    RT_ENDPOINT = "wss://api.assemblyai.com/v2/realtime/ws"
    _key 

    HEADERS = {
        "authorization": apiAA,
        "content-type": "application/json"
    }

    def  __init__(self):
        
        pass