import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from Lab5_C401_D6.src.tool.soap_ai.utils.formatter import validate_soap

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# load prompt
with open("prompts/system_prompt.txt", "r", encoding="utf-8") as f:
    system_prompt = f.read()

# load few-shot
with open("few_shot/examples.json", "r", encoding="utf-8") as f:
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

    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=messages,
        temperature=0.3
    )

    result = response.choices[0].message.content

    if not validate_soap(result):
        return "⚠️ Output không đúng format SOAP!"

    return result


if __name__ == "__main__":
    print("Nhập hội thoại (gõ exit để thoát)\n")

    while True:
        user_input = input("Bạn:\n")

        if user_input.lower() == "exit":
            break

        output = generate_soap(user_input)

        print("\n=== SOAP ===")
        print(output)
        print("\n-----------------\n")