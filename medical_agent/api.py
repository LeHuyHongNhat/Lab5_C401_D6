"""
FastAPI server — bridge giữa React UI và medical_agent.
Chạy: uvicorn api:app --reload --port 8000
"""

import sys
import os
import tempfile
from pathlib import Path
from typing import List
from datetime import datetime

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent))

from agent.medical_agent import run_agent
from utils.transcript_parser import SPEAKER_LABEL

app = FastAPI(title="Medical Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranscriptTurn(BaseModel):
    speaker: str  # "doctor" | "patient" | "family"
    text: str


class ProcessRequest(BaseModel):
    patient_id: str = "BN-2026-00001"
    turns: List[TranscriptTurn]


# ── Lazy-load Whisper để không chậm lúc khởi động server ─────────────────────
_whisper_model = None

def _get_whisper():
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper
            _whisper_model = whisper.load_model("small")
        except ImportError:
            raise HTTPException(
                status_code=503,
                detail="openai-whisper chưa được cài. Chạy: pip install openai-whisper"
            )
    return _whisper_model


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.post("/api/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Nhận file audio từ browser (webm/wav), chạy Whisper small,
    trả về danh sách turns [{speaker, text}].
    File audio bị xóa ngay sau khi transcribe (bảo mật).
    """
    suffix = Path(audio.filename or "audio.webm").suffix or ".webm"
    tmp_path = None

    try:
        # Lưu vào temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await audio.read())
            tmp_path = tmp.name

        model = _get_whisper()
        result = model.transcribe(tmp_path, language="vi", fp16=False)

    finally:
        # Xóa ngay sau STT (bảo mật bệnh nhân)
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    # Tách text thành các turns theo dấu câu (mỗi câu = 1 turn)
    import re
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', result["text"].strip()) if s.strip()]

    if not sentences:
        raise HTTPException(status_code=422, detail="Không nhận ra giọng nói. Hãy nói rõ hơn và thử lại.")

    # Gán tất cả turns là "doctor" — diarization cần pyannote + HF token riêng
    turns = [{"speaker": "doctor", "text": s} for s in sentences]

    return {"turns": turns, "raw_text": result["text"]}


@app.post("/api/process")
def process(req: ProcessRequest):
    if not req.turns:
        raise HTTPException(status_code=400, detail="Danh sách turns không được rỗng.")

    lines = []
    for turn in req.turns:
        label = SPEAKER_LABEL.get(turn.speaker, turn.speaker.capitalize())
        lines.append(f"{label}: {turn.text}")
    transcript = "\n".join(lines)

    try:
        record = run_agent(transcript, req.patient_id)
        return record.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
