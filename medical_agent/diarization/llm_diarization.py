"""
Diarization fallback: dùng LLM để gán nhãn speaker từ raw text.

Dùng khi:
  - Không có GPU để chạy pyannote
  - Muốn demo nhanh mà không cài thêm thư viện nặng
  - STT output là plain text không có timestamp

Luồng:
  raw_text.txt (plain text, không biết ai nói)
      │
      ▼
  LLM gán nhãn [DOCTOR] / [PATIENT] theo ngữ cảnh
      │
      ▼
  Parse → turns: [{speaker, text}]
      │
      ▼
  raw_transcript.json
"""

import json
import re
import sys
import os
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from openai import OpenAI
from config import OPENAI_API_KEY, MODEL_NAME


_LABEL_PROMPT = """\
Bạn nhận được đoạn văn bản từ cuộc hội thoại giữa bác sĩ và bệnh nhân, \
được chuyển tự động từ âm thanh sang text (chưa biết ai đang nói).

Nhiệm vụ: Gán nhãn [DOCTOR] hoặc [PATIENT] cho từng câu dựa trên ngữ cảnh.

Quy tắc gán nhãn:
- [DOCTOR] : hỏi bệnh, nhận xét lâm sàng, chẩn đoán, chỉ định xét nghiệm, kê đơn, dặn dò
- [PATIENT]: mô tả triệu chứng, trả lời câu hỏi, kể bệnh sử, hỏi thắc mắc về bệnh

Định dạng trả về — mỗi câu trên một dòng, bắt đầu bằng nhãn:
[DOCTOR] <nội dung>
[PATIENT] <nội dung>

Chỉ trả về văn bản đã gán nhãn, không giải thích thêm.
---
{raw_text}"""


def _call_llm(raw_text: str) -> str:
    """Gửi raw text đến LLM và nhận về text đã gán nhãn speaker."""
    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": _LABEL_PROMPT.format(raw_text=raw_text),
            }
        ],
        temperature=0,
    )
    return response.choices[0].message.content.strip()


def _parse_labeled_text(labeled_text: str) -> list:
    """
    Parse text đã gán nhãn thành danh sách turns.

    Input:
        [DOCTOR] Chào anh, anh đến vì lý do gì?
        [PATIENT] Dạ tôi bị đau đầu 2 tuần nay.

    Output:
        [{"speaker": "doctor", "text": "Chào anh, anh đến vì lý do gì?"},
         {"speaker": "patient", "text": "Dạ tôi bị đau đầu 2 tuần nay."}]
    """
    pattern = re.compile(r"^\[(DOCTOR|PATIENT)\]\s*(.+)$", re.IGNORECASE)
    turns = []
    current_speaker = None
    current_text = []

    for line in labeled_text.splitlines():
        line = line.strip()
        if not line:
            continue

        match = pattern.match(line)
        if match:
            # Lưu turn trước đó
            if current_speaker and current_text:
                turns.append({
                    "speaker": current_speaker,
                    "text": " ".join(current_text).strip(),
                })
            current_speaker = match.group(1).lower()
            current_text = [match.group(2).strip()]
        else:
            # Dòng tiếp theo không có nhãn → nối vào turn hiện tại
            if current_speaker:
                current_text.append(line)

    # Lưu turn cuối
    if current_speaker and current_text:
        turns.append({
            "speaker": current_speaker,
            "text": " ".join(current_text).strip(),
        })

    return turns


def diarize_with_llm(
    raw_text: str,
    session_id: str,
    patient_id: str,
    recorded_at: str,
) -> dict:
    """
    Gán nhãn speaker bằng LLM từ raw text không có timestamp.

    Args:
        raw_text    : Văn bản hội thoại thô (output của STT, chưa biết ai nói)
        session_id  : ID phiên khám
        patient_id  : Mã bệnh nhân nội bộ
        recorded_at : Thời gian ghi âm ISO format

    Returns:
        dict — cấu trúc raw_transcript.json
    """
    print("[LLM Diarization] Đang gán nhãn speaker...")
    labeled_text = _call_llm(raw_text)
    print("[LLM Diarization] Xong.\n")
    print("--- Kết quả gán nhãn ---")
    print(labeled_text)
    print("-" * 40)

    turns = _parse_labeled_text(labeled_text)

    if not turns:
        raise ValueError(
            "Không parse được turns từ output của LLM.\n"
            f"Output nhận được:\n{labeled_text}"
        )

    transcript = {
        "session_id": session_id,
        "patient_id": patient_id,
        "recorded_at": recorded_at,
        "diarization_method": "llm-fallback",
        "turns": turns,
    }
    return transcript


def diarize_from_file(
    txt_path: str,
    session_id: str,
    patient_id: str,
    recorded_at: str,
) -> dict:
    """
    Đọc raw text từ file .txt rồi diarize bằng LLM.

    Args:
        txt_path: Đường dẫn file .txt chứa hội thoại thô
    """
    with open(txt_path, "r", encoding="utf-8") as f:
        raw_text = f.read()
    return diarize_with_llm(raw_text, session_id, patient_id, recorded_at)


def save_transcript(transcript: dict, output_path: str) -> None:
    """Lưu transcript ra file JSON."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(transcript, f, ensure_ascii=False, indent=2)
    print(f"[Diarization] Đã lưu transcript: {output_path}")
