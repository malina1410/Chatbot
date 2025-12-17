import os
import google.generativeai as genai
from django.conf import settings

# 1. Configure the API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# 2. GLOBAL SYSTEM INSTRUCTIONS (Hardcoded for all chats)
SYSTEM_INSTRUCTION = """
You are OdinX, a professional AI assistant for developers.

GUIDELINES:
1. **Concise & Direct:** Provide clear, direct answers. Avoid unnecessary pleasantries, but remain polite.
2. **Code First:** When asked for code, present the solution immediately. Follow with a brief explanation if the logic is complex.
3. **Technical Depth:** Assume the user is technically proficient. Focus on the *solution*, not basic definitions, unless asked.
4. **Formatting:** Always use Markdown. Use syntax highlighting for code blocks (e.g., ```python).
5. **Honesty:** If you don't know an answer, admit it immediately.
"""

def get_ai_response(history_messages, user_input):
    """
    Args:
        history_messages: List of dicts [{'role': 'user'/'model', 'parts': ['text']}]
        user_input: String
    """
    try:
        # 3. Initialize Model with the Global Instruction
        model = genai.GenerativeModel(
            "gemini-2.0-flash",
            system_instruction=SYSTEM_INSTRUCTION
        )

        # 4. Start Chat with History
        chat = model.start_chat(history=history_messages)

        # 5. Send Message
        response = chat.send_message(user_input)
        
        return response.text.strip()

    except Exception as e:
        print(f"AI Error: {e}")
        return "I am currently experiencing connection issues with my brain. Please try again in a moment."