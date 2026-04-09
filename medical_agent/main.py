import json
import sys
from pathlib import Path
from datetime import datetime

# Thêm thư mục gốc vào path để import đúng
sys.path.insert(0, str(Path(__file__).parent))

from utils.transcript_parser import parse_transcript, load_transcript_raw
from utils.validator import validate_record
from agent.medical_agent import run_agent

BASE_DIR = Path(__file__).parent
INPUT_PATH = BASE_DIR / "input" / "raw_transcript.json"
OUTPUT_DIR = BASE_DIR / "output"


def main():
    print("=" * 50)
    print("   Medical Agent — Tổng hợp hồ sơ bệnh án")
    print("=" * 50)

    # ── Bước 1: Parse transcript ─────────────────────
    print("\n[1/3] Đọc và parse transcript...")
    raw = load_transcript_raw(INPUT_PATH)
    transcript = parse_transcript(INPUT_PATH)

    patient_id = raw.get("patient_id")
    if not patient_id:
        raise ValueError("Thiếu patient_id trong file transcript. Vui lòng thêm trường 'patient_id'.")

    print(f"  Session ID : {raw.get('session_id')}")
    print(f"  Patient ID : {patient_id}")
    print(f"  Recorded at: {raw.get('recorded_at')}")
    print(f"  Số lượt thoại: {len(raw.get('turns', []))}")
    print("\n--- Hội thoại ---")
    print(transcript)
    print("-" * 40)

    # ── Bước 2: Chạy agent ───────────────────────────
    print("\n[2/3] Chạy Medical Agent (ReAct)...")
    record = run_agent(transcript, patient_id)

    # Chuyển Pydantic model → dict để hiển thị và lưu
    record_dict = record.model_dump()

    print("\n--- Output của Agent ---")
    print(json.dumps(record_dict, ensure_ascii=False, indent=2))
    print("-" * 40)

    # ── Bước 3: Validate & lưu ──────────────────────
    print("\n[3/3] Validate và lưu output...")
    is_valid, missing = validate_record(record_dict)

    if is_valid:
        print("  ✓ Output hợp lệ — đủ các trường bắt buộc.")
    else:
        print(f"  ⚠ Còn thiếu trường: {missing}")

    OUTPUT_DIR.mkdir(exist_ok=True)
    output_file = OUTPUT_DIR / f"record_{raw.get('session_id', 'unknown')}.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(record_dict, f, ensure_ascii=False, indent=2)

    print(f"  ✓ Đã lưu hồ sơ tại: {output_file}")
    print("\n" + "=" * 50)


if __name__ == "__main__":
    main()
