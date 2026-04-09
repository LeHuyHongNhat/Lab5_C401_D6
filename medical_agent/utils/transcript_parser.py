import json


SPEAKER_LABEL = {
    "doctor": "Bác sĩ",
    "patient": "Bệnh nhân",
}


def parse_transcript(path: str) -> str:
    """
    Đọc file raw_transcript.json và chuyển thành chuỗi hội thoại
    có nhãn speaker để đưa vào LLM.

    Input : đường dẫn đến raw_transcript.json
    Output: chuỗi dạng "Bác sĩ: ...\nBệnh nhân: ..."
    """
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    lines = []
    for turn in data.get("turns", []):
        speaker = SPEAKER_LABEL.get(turn["speaker"], turn["speaker"])
        lines.append(f"{speaker}: {turn['text']}")

    return "\n".join(lines)


def load_transcript_raw(path: str) -> dict:
    """Đọc raw transcript JSON dưới dạng dict."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
