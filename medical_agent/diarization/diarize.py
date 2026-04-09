"""
Entry point cho bước Diarization.

Luồng duy nhất:
  - File audio (.wav/.mp3/.m4a/...) → Whisper STT → LLM gán nhãn speaker
  - File text (.txt)                → LLM gán nhãn speaker trực tiếp

Cách dùng:
  # Từ audio
  python diarize.py --input audio/session.wav --session-id VNM-001 --patient-id BN-2026-00001

  # Từ text
  python diarize.py --input raw_text.txt --session-id VNM-001 --patient-id BN-2026-00001
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg", ".mp4"}
TEXT_EXTENSIONS = {".txt", ".text"}


def _transcribe_with_whisper(audio_path: str, whisper_model: str = "small") -> str:
    """Chạy Whisper STT để lấy raw text từ audio. Tự detect device: CUDA > MPS > CPU."""
    try:
        import whisper
        import torch
    except ImportError:
        raise ImportError(
            "Cần cài Whisper và torch:\n"
            "pip install openai-whisper torch"
        )

    device = "cpu"
    if torch.cuda.is_available():
        device = "cuda"
    elif torch.backends.mps.is_available():
        device = "mps"

    print(f"[Whisper STT] Đang transcribe (model={whisper_model}, device={device})...")
    model = whisper.load_model(whisper_model, device=device)
    result = model.transcribe(audio_path, language="vi", fp16=(device != "cpu"))
    raw_text = result["text"].strip()
    print(f"[Whisper STT] Xong — {len(raw_text)} ký tự")
    return raw_text


def run(
    input_path: str,
    session_id: str,
    patient_id: str,
    recorded_at: str,
    output_path: str,
    whisper_model: str = "small",
) -> dict:
    """
    Chạy diarization và lưu kết quả ra output_path.

    - File audio → Whisper STT → LLM gán nhãn speaker
    - File text  → LLM gán nhãn speaker trực tiếp

    Args:
        input_path   : File âm thanh (.wav/.mp3/...) hoặc text (.txt)
        session_id   : ID phiên khám
        patient_id   : Mã bệnh nhân nội bộ
        recorded_at  : Thời gian ghi âm (ISO format)
        output_path  : Đường dẫn lưu raw_transcript.json
        whisper_model: Kích thước Whisper model (mặc định: small)

    Returns:
        dict — raw_transcript
    """
    from diarization.llm_diarization import diarize_with_llm, diarize_from_file, save_transcript

    ext = Path(input_path).suffix.lower()
    print(f"[Diarize] Input: {input_path}")

    if ext in AUDIO_EXTENSIONS:
        raw_text = _transcribe_with_whisper(input_path, whisper_model)
        transcript = diarize_with_llm(
            raw_text=raw_text,
            session_id=session_id,
            patient_id=patient_id,
            recorded_at=recorded_at,
        )
    elif ext in TEXT_EXTENSIONS:
        transcript = diarize_from_file(
            txt_path=input_path,
            session_id=session_id,
            patient_id=patient_id,
            recorded_at=recorded_at,
        )
    else:
        raise ValueError(
            f"Không nhận ra định dạng file '{ext}'.\n"
            f"Audio được hỗ trợ: {AUDIO_EXTENSIONS}\n"
            f"Text được hỗ trợ : {TEXT_EXTENSIONS}"
        )

    save_transcript(transcript, output_path)
    print(f"[Diarize] Xong — {len(transcript['turns'])} turns")
    return transcript


def main():
    parser = argparse.ArgumentParser(
        description="Diarization: chuyển audio/text thành raw_transcript.json"
    )
    parser.add_argument("--input", required=True, help="File audio (.wav/.mp3/...) hoặc text (.txt)")
    parser.add_argument("--session-id", required=True, help="ID phiên khám, ví dụ VNM-20260409-001")
    parser.add_argument("--patient-id", required=True, help="Mã bệnh nhân nội bộ, ví dụ BN-2026-00001")
    parser.add_argument("--recorded-at", default=datetime.now().isoformat(), help="Thời gian ghi âm ISO format")
    parser.add_argument("--output", default="input/raw_transcript.json", help="Đường dẫn lưu transcript JSON")
    parser.add_argument("--whisper-model", default="small", choices=["tiny", "base", "small", "medium", "large"],
                        help="Kích thước Whisper model (mặc định: small)")

    args = parser.parse_args()

    run(
        input_path=args.input,
        session_id=args.session_id,
        patient_id=args.patient_id,
        recorded_at=args.recorded_at,
        output_path=args.output,
        whisper_model=args.whisper_model,
    )


if __name__ == "__main__":
    main()
