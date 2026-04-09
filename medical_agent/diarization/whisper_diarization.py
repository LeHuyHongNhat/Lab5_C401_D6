"""
Diarization local: Whisper (STT) + pyannote (speaker diarization)

Luồng:
  audio file
      │
      ├─▶ Whisper  → segments: [{start, end, text}, ...]
      │
      └─▶ pyannote → speaker turns: [{start, end, speaker}, ...]
              │
              ▼
      Align theo timestamp → gán speaker cho từng segment Whisper
              │
              ▼
      raw_transcript.json (turns: [{speaker, text}])

Yêu cầu:
  pip install openai-whisper pyannote.audio torch
  HuggingFace token (để tải pyannote model): https://hf.co/settings/tokens
  Accept user conditions tại: https://hf.co/pyannote/speaker-diarization-3.1
"""

import json
import os
from pathlib import Path
from typing import Optional


def _align_speakers(whisper_segments: list, diarization) -> list:
    """
    Ghép speaker label từ pyannote vào từng segment của Whisper.
    Với mỗi segment Whisper, tìm speaker chiếm nhiều thời gian nhất
    trong khoảng [start, end] của segment đó.
    """
    turns = []
    for seg in whisper_segments:
        w_start, w_end = seg["start"], seg["end"]
        overlap: dict[str, float] = {}

        for turn, _, speaker in diarization.itertracks(yield_label=True):
            # Tính độ overlap giữa segment Whisper và turn của pyannote
            o_start = max(w_start, turn.start)
            o_end = min(w_end, turn.end)
            if o_end > o_start:
                overlap[speaker] = overlap.get(speaker, 0) + (o_end - o_start)

        if overlap:
            assigned = max(overlap, key=overlap.get)
        else:
            # Không khớp → gán speaker gần nhất về thời gian
            assigned = "UNKNOWN"

        turns.append({"raw_speaker": assigned, "text": seg["text"].strip()})

    return turns


def _map_to_roles(turns: list, doctor_speaker: str) -> list:
    """
    Đổi SPEAKER_00 / SPEAKER_01 → 'doctor' / 'patient'.
    doctor_speaker: pyannote label của bác sĩ (thường là người nói đầu tiên).
    """
    result = []
    for turn in turns:
        raw = turn["raw_speaker"]
        if raw == doctor_speaker:
            role = "doctor"
        elif raw == "UNKNOWN":
            role = "unknown"
        else:
            role = "patient"
        result.append({"speaker": role, "text": turn["text"]})
    return result


def _merge_consecutive(turns: list) -> list:
    """
    Gộp các lượt thoại liền kề của cùng một speaker thành một turn.
    Tránh trường hợp Whisper cắt quá nhỏ → nhiều turn rời rạc.
    """
    if not turns:
        return []
    merged = [turns[0].copy()]
    for turn in turns[1:]:
        if turn["speaker"] == merged[-1]["speaker"]:
            merged[-1]["text"] += " " + turn["text"]
        else:
            merged.append(turn.copy())
    return merged


def transcribe_and_diarize(
    audio_path: str,
    session_id: str,
    patient_id: str,
    recorded_at: str,
    hf_token: Optional[str] = None,
    whisper_model: str = "medium",
    doctor_speaker: str = "SPEAKER_00",
) -> dict:
    """
    Transcribe audio và diarize thành raw_transcript.json.

    Args:
        audio_path    : Đường dẫn file âm thanh (.wav / .mp3 / .m4a)
        session_id    : ID phiên khám (ví dụ "VNM-20260409-001")
        patient_id    : Mã bệnh nhân nội bộ (ví dụ "BN-2026-00001")
        recorded_at   : Thời gian ghi âm ISO format
        hf_token      : HuggingFace token (hoặc lấy từ biến môi trường HF_TOKEN)
        whisper_model : Kích thước Whisper model ("tiny","base","small","medium","large")
        doctor_speaker: pyannote label của bác sĩ (mặc định SPEAKER_00 — người nói đầu tiên)

    Returns:
        dict — cấu trúc raw_transcript.json
    """
    try:
        import whisper
        from pyannote.audio import Pipeline
        import torch
    except ImportError as e:
        raise ImportError(
            f"Thiếu thư viện: {e}\n"
            "Cài đặt: pip install openai-whisper pyannote.audio torch"
        ) from e

    token = hf_token or os.getenv("HF_TOKEN")
    if not token:
        raise ValueError(
            "Cần HuggingFace token để tải pyannote model.\n"
            "Cách lấy: https://hf.co/settings/tokens\n"
            "Sau đó set: export HF_TOKEN=hf_..."
        )

    if torch.cuda.is_available():
        device = "cuda"
    elif torch.backends.mps.is_available():
        device = "mps"
    else:
        device = "cpu"

    print(f"[Whisper] Đang transcribe: {audio_path} (model={whisper_model}, device={device})")
    model = whisper.load_model(whisper_model, device=device)
    result = model.transcribe(audio_path, language="vi", word_timestamps=False,
                              fp16=(device != "cpu"))
    whisper_segments = result["segments"]
    print(f"[Whisper] Xong — {len(whisper_segments)} segments")

    print("[pyannote] Đang diarize...")
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=token,
    ).to(torch.device(device))
    diarization = pipeline(audio_path)
    print(f"[pyannote] Xong — device={device}")

    turns = _align_speakers(whisper_segments, diarization)
    turns = _map_to_roles(turns, doctor_speaker)
    turns = _merge_consecutive(turns)

    transcript = {
        "session_id": session_id,
        "patient_id": patient_id,
        "recorded_at": recorded_at,
        "diarization_method": "whisper+pyannote",
        "turns": turns,
    }
    return transcript


def save_transcript(transcript: dict, output_path: str) -> None:
    """Lưu transcript ra file JSON."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(transcript, f, ensure_ascii=False, indent=2)
    print(f"[Diarization] Đã lưu transcript: {output_path}")
