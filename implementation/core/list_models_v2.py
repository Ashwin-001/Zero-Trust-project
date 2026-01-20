import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get('GEMINI_API_KEY')
client = genai.Client(api_key=api_key)

try:
    print("Listing available models...")
    for model in client.models.list(config={}):
        print(f"Model: {model.name}")
except Exception as e:
    print(f"Error: {e}")
