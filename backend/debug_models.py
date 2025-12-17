import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# 1. Point explicitly to the .env file in the parent directory
# This says: "Go up one level from this file to find .env"
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

api_key = os.getenv('GEMINI_API_KEY')

print("--- DIAGNOSTIC START ---")
print(f"Looking for .env at: {env_path}")

# 2. Check if Key exists
if not api_key:
    print("❌ ERROR: API Key is None! The script cannot find your .env file.")
else:
    print(f"✓ API Key found: {api_key[:6]}...{api_key[-4:]}")

# 3. Configure and List Models
try:
    if api_key:
        genai.configure(api_key=api_key)
        
        print("\nAttempting to list available models...")
        models = list(genai.list_models())
        
        found_any = False
        for m in models:
            # We check if the model supports 'generateContent' (Chat)
            if 'generateContent' in m.supported_generation_methods:
                print(f"✓ AVAILABLE: {m.name}")
                found_any = True
                
        if not found_any:
            print("\n❌ NO CHAT MODELS FOUND. Your API Key works, but has no access to models.")
            print("Action: Go to Google Cloud Console and enable 'Generative Language API'.")
            
except Exception as e:
    print(f"\nCRITICAL ERROR: {e}")

print("--- DIAGNOSTIC END ---")