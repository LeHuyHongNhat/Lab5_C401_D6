import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from soap_ai.utils.formatter import validate_soap

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv()
PROVIDER = os.getenv("LLM_PROVIDER")
API_KEY = os.getenv("LLM_API_KEY")
MODEL = os.getenv("LLM_MODEL")

# load prompt
with open(os.path.join(BASE_DIR, "prompts/system_prompt.txt"), "r", encoding="utf-8") as f:
    system_prompt = f.read()

# load few-shot
with open(os.path.join(BASE_DIR, "few_shot/examples.json"), "r", encoding="utf-8") as f:
    examples = json.load(f)

def build_messages(user_input):
    messages = [{"role": "system", "content": system_prompt}]

    for ex in examples:
        messages.append({"role": "user", "content": ex["input"]})
        messages.append({"role": "assistant", "content": ex["output"]})

    messages.append({"role": "user", "content": user_input})

    return messages

def generate_soap(user_input):
    messages = build_messages(user_input)

    if PROVIDER == "openai":
        
        client = OpenAI(api_key=API_KEY)

    elif PROVIDER == "openrouter":
        
        client = OpenAI(
            api_key=API_KEY,
            base_url="https://openrouter.ai/api/v1"
        )

    else:
        return "❌ Provider không hỗ trợ"

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.3
    )

    result = response.choices[0].message.content

    if not validate_soap(result):
        return "⚠️ Output không đúng format SOAP!"
    return result

def load_input_from_file(file_name):
    path = os.path.join(BASE_DIR, file_name)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()
    
if __name__ == "__main__":
    
    
        input_text = load_input_from_file("test_input.txt")
        

        output = generate_soap(input_text)

        print("\n=== SOAP ===")
        print(output)
        print("\n-----------------\n")