"""
FastAPI server — bridge giữa React UI và medical_agent.
Chạy: uvicorn api:app --reload --port 8000  (từ thư mục medical_agent/)

Endpoints:
  GET  /api/health           → health check
  POST /api/transcribe       → audio → Whisper STT → LLM diarization → SOAP
  POST /api/process          → turns JSON → SOAP (dùng cho Mock mode)
  POST /api/records/save     → lưu hồ sơ + correction log
"""

import json
import os
import sys
import tempfile
from pathlib import Path
from typing import List
from datetime import datetime

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent))

from agent.medical_agent import run_agent
from utils.transcript_parser import SPEAKER_LABEL

app = FastAPI(title="Medical Agent API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


# ── Schemas ───────────────────────────────────────────────────────────────────

class TranscriptTurn(BaseModel):
    speaker: str  # "doctor" | "patient"
    text: str


class ProcessRequest(BaseModel):
    patient_id: str = "BN-2026-00001"
    turns: List[TranscriptTurn]


class SaveRequest(BaseModel):
    session_id: str
    medical_record: dict
    corrections: List[dict] = []


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.post("/api/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    patient_id: str = Form("BN-2026-00001"),
    session_id: str = Form(...),
    whisper_model: str = Form("small"),
):
    """
    Nhận audio từ browser → Whisper STT → LLM diarization → Medical Agent SOAP.
    File audio bị xóa ngay sau STT (bảo mật bệnh nhân).
    """
    suffix = Path(audio.filename or "audio.webm").suffix or ".webm"
    tmp_path = None

    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(await audio.read())
            tmp_path = tmp.name

        # Bước 1: Whisper STT
        from diarization.diarize import _transcribe_only
        raw_text = _transcribe_only(tmp_path, whisper_model=whisper_model)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    if not raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Không nhận được nội dung từ audio. Vui lòng ghi âm lại rõ hơn.",
        )

    # Bước 2: LLM Diarization — GPT gán nhãn doctor/patient
    from diarization.llm_diarization import diarize_with_llm
    transcript_data = diarize_with_llm(
        raw_text=raw_text,
        session_id=session_id,
        patient_id=patient_id,
        recorded_at=datetime.now().isoformat(),
    )
    turns = transcript_data["turns"]

    # Bước 3: Medical Agent → SOAP
    transcript_str = "\n".join(
        f"{'Bác sĩ' if t['speaker'] == 'doctor' else 'Bệnh nhân'}: {t['text']}"
        for t in turns
    )
    record = run_agent(transcript_str, patient_id)

    return {
        "session_id": session_id,
        "transcript": turns,
        "medical_record": record.model_dump(),
    }


@app.post("/api/process")
def process(req: ProcessRequest):
    """Dùng cho Demo (Mock) mode: nhận turns sẵn → chạy Medical Agent."""
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


@app.post("/api/records/save")
def save_record(body: SaveRequest):
    """Lưu hồ sơ y tế cuối cùng (sau khi bác sĩ review) + correction log."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    record_file = OUTPUT_DIR / f"record_{body.session_id}_{timestamp}.json"

    with open(record_file, "w", encoding="utf-8") as f:
        json.dump(body.medical_record, f, ensure_ascii=False, indent=2)

    if body.corrections:
        log_file = OUTPUT_DIR / f"correction_log_{body.session_id}_{timestamp}.json"
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump({
                "session_id": body.session_id,
                "saved_at": datetime.now().isoformat(),
                "corrections": body.corrections,
            }, f, ensure_ascii=False, indent=2)

    return {
        "status": "saved",
        "record_file": str(record_file),
        "corrections_count": len(body.corrections),
    }
