import json
import sys
import os

from openai import OpenAI

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.system_prompt import SYSTEM_PROMPT
from agent.schemas import MedicalRecord
from tools.get_patient_info import get_patient_info
from tools.lookup_icd_code import lookup_icd_code, TOOL_DEFINITION as LOOKUP_ICD_TOOL
from config import MODEL_NAME, OPENAI_API_KEY


_client = OpenAI(api_key=OPENAI_API_KEY)

# get_patient_info không còn là tool của LLM — gọi trực tiếp từ Python
TOOLS = [LOOKUP_ICD_TOOL]

_TOOL_FUNCTIONS = {
    "lookup_icd_code": lookup_icd_code,
}


def _execute_tool(tool_call) -> str:
    """Thực thi một tool call và trả về kết quả dạng JSON string."""
    name = tool_call.function.name
    args = json.loads(tool_call.function.arguments)

    print(f"  → [Tool] {name}({args})")

    if name in _TOOL_FUNCTIONS:
        result = _TOOL_FUNCTIONS[name](**args)
    else:
        result = {"error": f"Tool '{name}' không tồn tại"}

    return json.dumps(result, ensure_ascii=False)


def run_agent(transcript: str, patient_id: str) -> MedicalRecord:
    """
    Chạy Medical Agent theo vòng lặp ReAct.

    patient_id được lấy từ metadata của session (gán lúc đăng ký khám),
    không trích xuất từ hội thoại. Thông tin bệnh nhân được pre-fetch
    và inject vào context trước khi gửi cho LLM.

    Input : transcript  — chuỗi hội thoại có nhãn speaker
            patient_id  — mã bệnh nhân nội bộ từ session metadata
    Output: MedicalRecord (Pydantic model, đã validate)
    """
    # Pre-fetch thông tin bệnh nhân — gọi trực tiếp, không qua LLM
    print(f"  → [Pre-fetch] get_patient_info(patient_id='{patient_id}')")
    patient_info = get_patient_info(patient_id)
    patient_context = json.dumps(patient_info, ensure_ascii=False, indent=2)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"## Thông tin bệnh nhân (từ hệ thống đăng ký):\n"
                f"```json\n{patient_context}\n```\n\n"
                f"## Hội thoại khám bệnh:\n"
                f"{transcript}\n\n"
                f"Hãy điền đầy đủ hồ sơ y tế dựa trên thông tin trên."
            ),
        },
    ]

    step = 0
    while True:
        step += 1
        print(f"\n[Agent] Bước {step}: Gọi LLM...")

        response = _client.beta.chat.completions.parse(
            model=MODEL_NAME,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            response_format=MedicalRecord,
            temperature=0,
        )

        message = response.choices[0].message

        assistant_msg = {"role": "assistant", "content": message.content}
        if message.tool_calls:
            assistant_msg["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": tc.type,
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in message.tool_calls
            ]
        messages.append(assistant_msg)

        # Không còn tool call → message.parsed là MedicalRecord đã validate
        if not message.tool_calls:
            print("[Agent] Hoàn thành. Output đã được validate bởi Pydantic.")
            return message.parsed

        # Thực thi tool calls và trả kết quả lại
        for tool_call in message.tool_calls:
            result_str = _execute_tool(tool_call)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result_str,
            })
