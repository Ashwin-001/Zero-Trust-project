import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print("API Key not found in .env")
    exit(1)

client = genai.Client(api_key=api_key)

try:
    print("Listing available models...")
    for m in client.models.list():
        # Print the name directly
        print(f"Model: {m.name}")
        # Try to print useful attributes if they exist, safely
        try:
             print(f" - Display Name: {getattr(m, 'display_name', 'N/A')}")
        except: pass

except Exception as e:
    print(f"Error listing models: {e}")
