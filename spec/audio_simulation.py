"""
audio_simulation.py
====================
Giả lập luồng xử lý audio cho Clinical Scribe Agent.
Mục đích: Demo hackathon khi không thể record live 2 người nói.

Hai chế độ:
  Mode A — TEXT SIMULATION: Nhận mock transcript JSON → giả lập delay STT → output
  Mode B — AUDIO FILE:       Nhận file .wav/.mp3 thật → chạy Whisper local → diarize → output

Cách chạy:
  python audio_simulation.py --mode text --scenario 1
  python audio_simulation.py --mode audio --file recording.wav
"""

import json
import time
import argparse
import sys
from pathlib import Path

# ── Màu terminal để demo đẹp hơn ─────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RED    = "\033[91m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

MOCK_FILE = Path(__file__).parent / "mock_transcripts.json"


# ═════════════════════════════════════════════════════════════════════════════
# MODE A — TEXT SIMULATION
# ═════════════════════════════════════════════════════════════════════════════

def load_scenario(scenario_index: int) -> dict:
    """Load 1 scenario từ mock_transcripts.json."""
    with open(MOCK_FILE, encoding="utf-8") as f:
        scenarios = json.load(f)
    if scenario_index < 1 or scenario_index > len(scenarios):
        print(f"{RED}Lỗi: Chỉ có {len(scenarios)} scenario (1-{len(scenarios)}){RESET}")
        sys.exit(1)
    return scenarios[scenario_index - 1]


def simulate_stt_stream(turns: list, words_per_second: float = 3.0) -> str:
    """
    Giả lập STT stream từng turn hội thoại.
    In ra màn hình như đang nhận transcript real-time.
    Trả về full transcript string.
    """
    print(f"\n{BOLD}{'─'*60}{RESET}")
    print(f"{BOLD}🎙️  ĐANG GHI ÂM & CHUYỂN VĂN BẢN (Real-time STT Simulation){RESET}")
    print(f"{BOLD}{'─'*60}{RESET}\n")

    full_transcript_lines = []

    for turn in turns:
        speaker = turn["speaker"]
        text    = turn["text"]

        # Chọn màu và nhãn theo speaker
        if speaker == "doctor":
            label = f"{GREEN}[BÁC SĨ]{RESET}"
        elif speaker == "patient":
            label = f"{CYAN}[BỆNH NHÂN]{RESET}"
        elif speaker == "family":
            label = f"{YELLOW}[NGƯỜI NHÀ ⚠️]{RESET}"
        else:
            label = f"[{speaker.upper()}]"

        # Tính delay dựa trên độ dài câu (simulate real-time)
        word_count = len(text.split())
        delay = word_count / words_per_second

        # In label trước
        print(f"  {label} ", end="", flush=True)

        # Simulate typing effect từng từ
        words = text.split()
        for i, word in enumerate(words):
            print(word, end="" if i == len(words) - 1 else " ", flush=True)
            time.sleep(0.08)  # delay nhỏ giữa các từ cho hiệu ứng

        print()  # xuống dòng
        time.sleep(delay * 0.3)  # delay giữa các turn

        full_transcript_lines.append(f"[{speaker.upper()}]: {text}")

    full_transcript = "\n".join(full_transcript_lines)
    return full_transcript


def simulate_ai_processing(scenario: dict) -> dict:
    """
    Giả lập AI Agent xử lý transcript → SOAP.
    Trong production: gọi LLM API thật.
    Trong demo: trả về expected_output từ mock data.
    """
    print(f"\n{BOLD}{'─'*60}{RESET}")
    print(f"{BOLD}⚙️  AI AGENT ĐANG XỬ LÝ...{RESET}")
    print(f"{BOLD}{'─'*60}{RESET}")

    steps = [
        ("🔍 Phân tích hội thoại, xác định chủ thể...", 0.8),
        ("💊 Tra cứu tên thuốc và mã ICD-10...", 1.0),
        ("📋 Tổng hợp SOAP theo chuẩn JCI...", 1.2),
        ("✅ Kiểm tra flags và cảnh báo...", 0.5),
    ]

    for step_text, step_delay in steps:
        print(f"  {step_text}", flush=True)
        time.sleep(step_delay)

    return scenario.get("expected_output", {})


def print_soap_output(output: dict, scenario: dict):
    """In SOAP output theo định dạng đẹp cho demo."""
    print(f"\n{BOLD}{'═'*60}{RESET}")
    print(f"{BOLD}📄  KẾT QUẢ HỒ SƠ SOAP — {scenario['scenario_name']}{RESET}")
    print(f"{BOLD}{'═'*60}{RESET}\n")

    patient = output.get("patient", {})
    visit   = output.get("visit", {})

    print(f"{BOLD}THÔNG TIN BỆNH NHÂN{RESET}")
    print(f"  Họ tên   : {patient.get('ho_ten', 'N/A')}")
    print(f"  Giới tính: {patient.get('gioi_tinh', 'N/A')}")
    print(f"  Ngày sinh: {patient.get('ngay_sinh', 'N/A')}")
    if patient.get("di_ung"):
        print(f"  {RED}⚠️  Dị ứng   : {patient['di_ung']}{RESET}")

    print(f"\n{GREEN}{BOLD}[S] SUBJECTIVE — Triệu chứng cơ năng{RESET}")
    print(f"  {visit.get('S_subjective', 'N/A')}")

    print(f"\n{GREEN}{BOLD}[O] OBJECTIVE — Khám thực thể{RESET}")
    print(f"  {visit.get('O_objective', 'N/A')}")

    print(f"\n{GREEN}{BOLD}[A] ASSESSMENT — Chẩn đoán{RESET}")
    print(f"  {visit.get('A_assessment', 'N/A')}  |  ICD-10: {visit.get('chan_doan_icd', '??')}")

    print(f"\n{GREEN}{BOLD}[P] PLAN — Kế hoạch điều trị{RESET}")
    print(f"  {visit.get('P_plan', 'N/A')}")

    # In flags nếu có
    flags = visit.get("flags", [])
    if flags:
        print(f"\n{YELLOW}{BOLD}⚠️  FLAGS — Cần bác sĩ xem xét:{RESET}")
        for flag in flags:
            print(f"  {YELLOW}• {flag}{RESET}")

    # Diarization notes nếu có
    if scenario.get("diarization_notes"):
        print(f"\n{RED}{BOLD}🔴 DIARIZATION WARNING:{RESET}")
        print(f"  {RED}{scenario['diarization_notes']}{RESET}")

    print(f"\n{BOLD}{'─'*60}{RESET}")
    print(f"{BOLD}✅  Hoàn thành! Bác sĩ review và bấm [DUYỆT] để lưu vào EHR.{RESET}")
    print(f"{BOLD}{'─'*60}{RESET}\n")


def run_text_mode(scenario_index: int):
    """Chạy full demo ở chế độ text simulation."""
    scenario = load_scenario(scenario_index)

    print(f"\n{BOLD}{'═'*60}{RESET}")
    print(f"{BOLD}🏥  AI CLINICAL SCRIBE AGENT — DEMO{RESET}")
    print(f"{BOLD}   Scenario {scenario_index}: {scenario['scenario_name']}{RESET}")
    print(f"{BOLD}   Type: {scenario['scenario_type']}{RESET}")
    print(f"{BOLD}{'═'*60}{RESET}")
    print(f"\n  {scenario['description']}\n")

    input(f"  {CYAN}Nhấn ENTER để bắt đầu giả lập ca khám...{RESET}")

    start_time = time.time()

    # Bước 1: STT stream
    simulate_stt_stream(scenario["turns"])

    # Bước 2: AI processing
    soap_output = simulate_ai_processing(scenario)

    # Bước 3: In kết quả
    print_soap_output(soap_output, scenario)

    total_time = time.time() - start_time
    print(f"  ⏱️  Tổng thời gian xử lý (simulation): {total_time:.1f}s")
    print(f"  ⚡ Production (LLM API thật): ~10-15s cho ca khám 15 phút\n")


# ═════════════════════════════════════════════════════════════════════════════
# MODE B — AUDIO FILE (Whisper HuggingFace + pyannote Diarization)
# ═════════════════════════════════════════════════════════════════════════════

def merge_stt_and_diarization(chunks: list, diarization) -> list:
    """
    Ghép timestamp từ Whisper với speaker label từ pyannote.
    Logic: Mỗi chunk text → tìm speaker chiếm nhiều thời gian nhất trong đoạn đó.
    """
    turns = []
    for chunk in chunks:
        start, end = chunk["timestamp"]
        if start is None or end is None:
            continue

        # Tìm speaker cho đoạn [start, end]
        speaker_votes = {}
        for segment, _, speaker in diarization.itertracks(yield_label=True):
            overlap_start = max(start, segment.start)
            overlap_end   = min(end, segment.end)
            if overlap_end > overlap_start:
                duration = overlap_end - overlap_start
                speaker_votes[speaker] = speaker_votes.get(speaker, 0) + duration

        dominant_speaker = max(speaker_votes, key=speaker_votes.get) if speaker_votes else "unknown"
        turns.append({
            "speaker": dominant_speaker,
            "text": chunk["text"].strip(),
            "start": start,
            "end": end
        })
    return turns


def map_speaker_labels(turns: list) -> list:
    """
    Map SPEAKER_00, SPEAKER_01... → doctor, patient, family.
    Heuristic đơn giản: speaker nói nhiều nhất thường là bác sĩ (hỏi nhiều câu ngắn).
    Trong demo: hỏi user map thủ công.
    """
    unique_speakers = list(set(t["speaker"] for t in turns))
    print(f"\n  Phát hiện {len(unique_speakers)} người nói: {unique_speakers}")

    mapping = {}
    role_options = ["doctor", "patient", "family", "other"]
    for spk in unique_speakers:
        sample = next(t["text"] for t in turns if t["speaker"] == spk)
        print(f"\n  {spk}: \"{sample[:60]}...\"")
        role = input(f"  Vai trò của {spk}? {role_options}: ").strip().lower()
        mapping[spk] = role if role in role_options else "other"

    for turn in turns:
        turn["speaker"] = mapping.get(turn["speaker"], "other")
    return turns


def run_audio_mode(audio_file: str, hf_token: str = None):
    """
    Chạy với file audio thật.
    Bước 1: Whisper (HuggingFace transformers) → raw text có timestamps
    Bước 2: pyannote → diarization (ai nói đoạn nào)
    Bước 3: Merge → JSON turns có speaker label
    Bảo mật: Xóa file audio sau khi STT xong (< 60s)
    """
    import os
    audio_path = Path(audio_file)

    if not audio_path.exists():
        print(f"{RED}Lỗi: Không tìm thấy file audio: {audio_file}{RESET}")
        sys.exit(1)

    print(f"\n{BOLD}🎵 AUDIO MODE — Xử lý file: {audio_file}{RESET}\n")

    try:
        from transformers import pipeline as hf_pipeline
        import torch
    except ImportError:
        print(f"{RED}Chưa cài transformers. Chạy: pip install transformers accelerate torch{RESET}")
        sys.exit(1)

    # ── Bước 1: Whisper STT ──────────────────────────────────────
    print("  📝 Bước 1/3: Whisper STT (HuggingFace)...")
    device = 0 if torch.cuda.is_available() else -1
    whisper = hf_pipeline(
        "automatic-speech-recognition",
        model="openai/whisper-medium",
        generate_kwargs={"language": "vi", "task": "transcribe"},
        return_timestamps=True,   # CẦN để merge với diarization
        device=device,
        chunk_length_s=30,        # xử lý từng đoạn 30s, tránh OOM
    )
    stt_result = whisper(audio_file)
    # stt_result["chunks"] = [{"text": "...", "timestamp": (start, end)}, ...]
    print(f"  ✅ STT xong. {len(stt_result['text'])} ký tự.\n")

    # ── Bảo mật: Xóa audio ngay sau STT ─────────────────────────
    # Failure mode #3: Audio bệnh nhân không được lưu lâu dài
    try:
        os.remove(audio_path)
        print(f"  🔒 Bảo mật: Đã xóa file audio gốc ({audio_path.name}) sau STT.\n")
    except OSError as e:
        print(f"  {YELLOW}⚠️  Không thể xóa audio: {e}{RESET}\n")

    # ── Bước 2: pyannote Diarization ─────────────────────────────
    print("  🎙️ Bước 2/3: Diarization (pyannote)...")
    try:
        from pyannote.audio import Pipeline as PyannotePipeline

        diarize_model = PyannotePipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=hf_token  # truyền vào hoặc để None nếu đã login
        )
        diarization = diarize_model(audio_file)
        print(f"  ✅ Diarization xong.\n")

        # ── Bước 3: Merge STT chunks + Diarization ───────────────────
        print("  🔀 Bước 3/3: Ghép text + speaker label...")
        turns = merge_stt_and_diarization(stt_result["chunks"], diarization)
        # Map SPEAKER_00/01 → doctor/patient/family
        turns = map_speaker_labels(turns)

    except ImportError:
        print(f"  {YELLOW}⚠️  pyannote chưa cài. Dùng raw transcript không có diarization.{RESET}")
        print(f"  Cài: pip install pyannote.audio\n")
        turns = [{"speaker": "unknown", "text": stt_result["text"]}]

    print(f"\n{CYAN}Raw transcript:{RESET}")
    preview = stt_result["text"]
    print(f"  {preview[:500]}{'...' if len(preview) > 500 else ''}")
    print(f"\n  ✅ Transcript sẵn sàng để đưa vào Medical Agent.\n")

    return stt_result["text"], turns


# ═════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="AI Clinical Scribe — Audio/Text Simulation"
    )
    parser.add_argument(
        "--mode", choices=["text", "audio"], default="text",
        help="'text' = dùng mock transcript, 'audio' = dùng file âm thanh thật"
    )
    parser.add_argument(
        "--scenario", type=int, default=1,
        help="Số thứ tự scenario (1-4) khi chạy mode text"
    )
    parser.add_argument(
        "--file", type=str, default=None,
        help="Đường dẫn file audio (.wav/.mp3) khi chạy mode audio"
    )
    parser.add_argument(
        "--hf-token", type=str, default=None,
        help="HuggingFace token (cần cho pyannote diarization). Xem: https://huggingface.co/settings/tokens"
    )
    parser.add_argument(
        "--list", action="store_true",
        help="Liệt kê tất cả scenario có sẵn"
    )

    args = parser.parse_args()

    # List scenarios
    if args.list:
        with open(MOCK_FILE, encoding="utf-8") as f:
            scenarios = json.load(f)
        print(f"\n{BOLD}📋 DANH SÁCH SCENARIOS:{RESET}\n")
        for i, s in enumerate(scenarios, 1):
            type_color = GREEN if s["scenario_type"] == "happy_path" else YELLOW
            print(f"  {i}. {BOLD}{s['scenario_name']}{RESET}")
            print(f"     Type: {type_color}{s['scenario_type']}{RESET}")
            print(f"     {s['description'][:80]}...\n")
        return

    # Run modes
    if args.mode == "text":
        run_text_mode(args.scenario)
    elif args.mode == "audio":
        if not args.file:
            print(f"{RED}Cần chỉ định --file khi dùng mode audio{RESET}")
            sys.exit(1)
        run_audio_mode(args.file, hf_token=args.hf_token)


if __name__ == "__main__":
    main()
