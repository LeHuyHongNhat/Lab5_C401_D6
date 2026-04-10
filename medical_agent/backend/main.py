"""
FastAPI Backend — Medical Agent API

Endpoints:
  GET  /api/health                 → health check
  POST /api/transcribe             → audio file → transcript + MedicalRecord
  POST /api/records/save           → lưu hồ sơ + correction log

Cách chạy:
  cd medical_agent
  uvicorn backend.main:app --reload --port 8000
"""

import json
import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Thêm thư mục gốc medical_agent vào path
sys.path.insert(0, str(Path(__file__).parent.parent))

from agent.medical_agent import run_agent
from agent.schemas import MedicalRecord
from diarization.diarize import _transcribe_with_whisper
from diarization.llm_diarization import diarize_with_llm

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(title="Medical Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = Path(__file__).parent.parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


# ── Request / Response schemas ────────────────────────────────────────────────

class TranscriptTurn(BaseModel):
    speaker: str   # "doctor" | "patient"
    text: str


class TranscribeResponse(BaseModel):
    session_id: str
    transcript: list[TranscriptTurn]
    medical_record: dict


class SaveRequest(BaseModel):
    session_id: str
    medical_record: dict
    corrections: list[dict] = []


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.post("/api/transcribe", response_model=TranscribeResponse)
async def transcribe(
    audio: UploadFile = File(..., description="File audio từ browser (WebM/Opus)"),
    patient_id: str = Form(..., description="Mã bệnh nhân nội bộ"),
    session_id: str = Form(..., description="ID phiên khám"),
    whisper_model: str = Form("small", description="Kích thước Whisper model"),
):
    """
    Nhận file audio từ browser, chạy STT → Diarization → Medical Agent.
    Trả về transcript + hồ sơ y tế có cấu trúc.
    """
    # Lưu audio tạm ra đĩa (Whisper cần đường dẫn file)
    suffix = Path(audio.filename or "audio.webm").suffix or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # ── Bước 1: Whisper STT ───────────────────────────────────────────
        raw_text = _transcribe_with_whisper(tmp_path, whisper_model=whisper_model)

        if not raw_text.strip():
            raise HTTPException(
                status_code=422,
                detail="Không nhận được nội dung từ audio. Vui lòng ghi âm lại rõ hơn.",
            )

        # ── Bước 2: LLM Diarization ──────────────────────────────────────
        transcript_data = diarize_with_llm(
            raw_text=raw_text,
            session_id=session_id,
            patient_id=patient_id,
            recorded_at=datetime.now().isoformat(),
        )
        turns = transcript_data["turns"]

        # ── Bước 3: Medical Agent ────────────────────────────────────────
        transcript_str = "\n".join(
            f"{'Bác sĩ' if t['speaker'] == 'doctor' else 'Bệnh nhân'}: {t['text']}"
            for t in turns
        )
        record: MedicalRecord = run_agent(transcript_str, patient_id)

        return TranscribeResponse(
            session_id=session_id,
            transcript=[TranscriptTurn(**t) for t in turns],
            medical_record=record.model_dump(),
        )

    finally:
        os.unlink(tmp_path)


@app.post("/api/records/save")
def save_record(body: SaveRequest):
    """
    Lưu hồ sơ y tế cuối cùng (sau khi bác sĩ review) + correction log.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    record_file = OUTPUT_DIR / f"record_{body.session_id}_{timestamp}.json"
    log_file = OUTPUT_DIR / f"correction_log_{body.session_id}_{timestamp}.json"

    with open(record_file, "w", encoding="utf-8") as f:
        json.dump(body.medical_record, f, ensure_ascii=False, indent=2)

    if body.corrections:
        correction_log = {
            "session_id": body.session_id,
            "saved_at": datetime.now().isoformat(),
            "corrections": body.corrections,
        }
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(correction_log, f, ensure_ascii=False, indent=2)

    return {
        "status": "saved",
        "record_file": str(record_file),
        "corrections_count": len(body.corrections),
    }
