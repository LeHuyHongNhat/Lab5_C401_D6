import os
import json
from datetime import date
from openai import OpenAI
from dotenv import load_dotenv

from medical_agent.agent.schemas import MedicalRecord, PatientInfo
from medical_agent.tools.lookup_icd_code import lookup_icd_code

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv()
PROVIDER = os.getenv("LLM_PROVIDER")
API_KEY = os.getenv("LLM_API_KEY")
MODEL = os.getenv("LLM_MODEL")

# load system prompt
with open(os.path.join(BASE_DIR, "prompts/system_prompt.txt"), "r", encoding="utf-8") as f:
    system_prompt = f.read()

# load few-shot
with open(os.path.join(BASE_DIR, "few_shot/examples.json"), "r", encoding="utf-8") as f:
    examples = json.load(f)


# ==============================
# BUILD MESSAGE
# ==============================
def build_messages(user_input):
    messages = [{"role": "system", "content": system_prompt}]

    for ex in examples:
        messages.append({"role": "user", "content": ex["input"]})
        messages.append({
            "role": "assistant",
            "content": json.dumps(ex["output"], ensure_ascii=False)
        })

    messages.append({"role": "user", "content": user_input})
    return messages


# ==============================
# CALL LLM → JSON
# ==============================
def generate_json(user_input):
    messages = build_messages(user_input)

    if PROVIDER in ["openai", "openrouter"]:
        client_kwargs = {"api_key": API_KEY}
        if PROVIDER == "openrouter":
            client_kwargs["base_url"] = "https://openrouter.ai/api/v1"
        client = OpenAI(**client_kwargs)
    else:
        raise Exception("Provider không hỗ trợ")

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.2
    )

    content = response.choices[0].message.content

    try:
        return json.loads(content)
    except:
        print("❌ JSON parse lỗi, raw output:")
        print(content)
        return None


# ==============================
# ADD ICD (POST-PROCESS)
# ==============================
def enrich_icd(data):
    diagnosis = data["visit"].get("chan_doan")

    if not diagnosis:
        data["visit"]["chan_doan_icd"] = None
        return data

    icd_codes = []

    for diag in diagnosis.split(";"):
        diag_clean = diag.lower().strip()
        icd = lookup_icd_code(diag_clean)

        if icd.get("icd_code"):
            icd_codes.append(icd["icd_code"])

    icd_codes = list(set(icd_codes))

    data["visit"]["chan_doan_icd"] = ", ".join(icd_codes) if icd_codes else None

    return data


# ==============================
# BUILD MEDICAL RECORD
# ==============================
def build_medical_record(patient_info, llm_json):
    llm_json["patient"] = patient_info

    # set ngày khám nếu LLM không trả
    if not llm_json["visit"].get("ngay_kham"):
        llm_json["visit"]["ngay_kham"] = str(date.today())

    return MedicalRecord(**llm_json)


# ==============================
# LOAD FILE
# ==============================
def load_input_from_file(file_name):
    path = os.path.join(BASE_DIR, file_name)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


# ==============================
# MAIN
# ==============================
if __name__ == "__main__":
    input_text = load_input_from_file("test_input.txt")

    # 1. gọi LLM → JSON
    llm_json = generate_json(input_text)

    if not llm_json:
        exit()

    print("\n=== RAW JSON FROM LLM ===")
    print(json.dumps(llm_json, indent=2, ensure_ascii=False))

    # 2. enrich ICD
    llm_json = enrich_icd(llm_json)

    # 3. patient info (từ FE)
    patient_info = {
        "name": "Nguyễn Văn A",
        "dob": "2000-01-01"
    }

    # 4. build MedicalRecord
    medical_record = build_medical_record(patient_info, llm_json)

    print("\n=== FINAL JSON ===")
    print(
        medical_record.model_dump_json(
            indent=2,
            ensure_ascii=False,
            exclude_none=True
        )
    )