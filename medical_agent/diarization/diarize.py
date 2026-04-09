"""
Entry point cho bước Diarization.

Tự động chọn phương pháp:
  - Nếu input là file audio (.wav/.mp3/.m4a) → dùng Whisper + pyannote (local)
  - Nếu input là file text (.txt)             → dùng LLM fallback
  - Nếu --method được chỉ định               → ép dùng phương pháp đó

Cách dùng:
  # Từ audio (tự detect)
  python diarize.py --input audio/session.wav --session-id VNM-001 --patient-id BN-2026-00001

  # Từ text (LLM fallback)
  python diarize.py --input raw_text.txt --session-id VNM-001 --patient-id BN-2026-00001

  # Ép dùng LLM dù input là audio (không nên, nhưng có thể)
  python diarize.py --input audio/session.wav --method llm ...
"""

import argparsec
import json
import os
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg", ".mp4"}
TEXT_EXTENSIONS = {".txt", ".text"}


def _detect_method(input_path: str) -> str:
    """Tự detect phương pháp dựa trên extension của file input."""
    ext = Path(input_path).suffix.lower()
    if ext in AUDIO_EXTENSIONS:
        return "whisper"
    if ext in TEXT_EXTENSIONS:
        return "llm"
    raise ValueError(
        f"Không nhận ra định dạng file '{ext}'.\n"
        f"Audio: {AUDIO_EXTENSIONS}\n"
        f"Text : {TEXT_EXTENSIONS}"
    )


def _get_device() -> str:
    """Tự detect device tốt nhất: CUDA > MPS (Apple Silicon) > CPU."""
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
        if torch.backends.mps.is_available():
            return "mps"
    except ImportError:
        pass
    return "cpu"


def _transcribe_only(audio_path: str, whisper_model: str = "medium") -> str:
    """
    Chạy Whisper STT để lấy raw text từ audio, không diarize.
    Tự dùng MPS trên Apple Silicon, CUDA nếu có, fallback CPU.
    """
    try:
        import whisper
        import torch
    except ImportError:
        raise ImportError(
            "Cần cài Whisper và torch:\n"
            "pip install openai-whisper torch"
        )
    device = _get_device()
    print(f"[Whisper STT] Đang transcribe audio (model={whisper_model}, device={device})...")
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
    method: str = "auto",
    hf_token: str | None = None,
    whisper_model: str = "medium",
    doctor_speaker: str = "SPEAKER_00",
) -> dict:
    """
    Chạy diarization và lưu kết quả ra output_path.

    Args:
        input_path    : File âm thanh (.wav/.mp3) hoặc text (.txt)
        session_id    : ID phiên khám
        patient_id    : Mã bệnh nhân nội bộ
        recorded_at   : Thời gian ghi âm (ISO format)
        output_path   : Đường dẫn lưu raw_transcript.json
        method        : "auto" | "whisper" | "llm"
        hf_token      : HuggingFace token cho pyannote
        whisper_model : Kích thước whisper model
        doctor_speaker: pyannote label của bác sĩ

    Returns:
        dict — raw_transcript
    """
    if method == "auto":
        method = _detect_method(input_path)

    print(f"[Diarize] Input : {input_path}")
    print(f"[Diarize] Method: {method}")

    input_ext = Path(input_path).suffix.lower()
    is_audio = input_ext in AUDIO_EXTENSIONS

    if method == "whisper":
        from diarization.whisper_diarization import transcribe_and_diarize, save_transcript
        transcript = transcribe_and_diarize(
            audio_path=input_path,
            session_id=session_id,
            patient_id=patient_id,
            recorded_at=recorded_at,
            hf_token=hf_token or os.getenv("HF_TOKEN"),
            whisper_model=whisper_model,
            doctor_speaker=doctor_speaker,
        )

    elif method == "llm":
        from diarization.llm_diarization import diarize_with_llm, diarize_from_file, save_transcript

        if is_audio:
            # Audio → STT bằng Whisper trước, rồi LLM gán nhãn speaker
            raw_text = _transcribe_only(input_path, whisper_model)
            transcript = diarize_with_llm(
                raw_text=raw_text,
                session_id=session_id,
                patient_id=patient_id,
                recorded_at=recorded_at,
            )
        else:
            # Text file → LLM gán nhãn trực tiếp
            transcript = diarize_from_file(
                txt_path=input_path,
                session_id=session_id,
                patient_id=patient_id,
                recorded_at=recorded_at,
            )

    else:
        raise ValueError(f"method phải là 'auto', 'whisper' hoặc 'llm', nhận được: '{method}'")

    save_transcript(transcript, output_path)
    print(f"[Diarize] Xong — {len(transcript['turns'])} turns")
    return transcript


def main():
    parser = argparse.ArgumentParser(
        description="Diarization: chuyển audio/text thành raw_transcript.json"
    )
    parser.add_argument("--input", required=True, help="File audio (.wav/.mp3) hoặc text (.txt)")
    parser.add_argument("--session-id", required=True, help="ID phiên khám, ví dụ VNM-20260409-001")
    parser.add_argument("--patient-id", required=True, help="Mã bệnh nhân nội bộ, ví dụ BN-2026-00001")
    parser.add_argument("--recorded-at", default=datetime.now().isoformat(), help="Thời gian ghi âm ISO format")
    parser.add_argument("--output", default="input/raw_transcript.json", help="Đường dẫn lưu transcript JSON")
    parser.add_argument("--method", choices=["auto", "whisper", "llm"], default="auto")
    parser.add_argument("--hf-token", default=None, help="HuggingFace token (hoặc set HF_TOKEN env)")
    parser.add_argument("--whisper-model", default="medium", choices=["tiny", "base", "small", "medium", "large"])
    parser.add_argument("--doctor-speaker", default="SPEAKER_00", help="pyannote label của bác sĩ")

    args = parser.parse_args()

    run(
        input_path=args.input,
        session_id=args.session_id,
        patient_id=args.patient_id,
        recorded_at=args.recorded_at,
        output_path=args.output,
        method=args.method,
        hf_token=args.hf_token,
        whisper_model=args.whisper_model,
        doctor_speaker=args.doctor_speaker,
    )


if __name__ == "__main__":
    main()
