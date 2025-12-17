import os
import google.generativeai as genai
from django.conf import settings

# 1. Configure the API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# 2. Define the Bot's Persona (The System Instruction)
SYSTEM_INSTRUCTION = """
You are a helpful, professional AI assistant for a portfolio project.
- Keep answers concise and relevant.
- Do not engage in illegal or unethical discussions.
- If you don't know something, admit it.
"""

def get_ai_response(history_messages, user_input):
    """
    Args:
        history_messages: List of dicts [{'role': 'user'/'model', 'parts': ['text']}]
        user_input: String
    """
    try:
        # 3. Initialize Model
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_INSTRUCTION
        )

        # 4. Start Chat with History
        chat = model.start_chat(history=history_messages)

        # 5. Send Message
        response = chat.send_message(user_input)
        
        return response.text.strip()

    except Exception as e:
        # Log the error (in a real app, use logging)
        print(f"AI Error: {e}")
        return "I am currently experiencing connection issues with my brain. Please try again in a moment."