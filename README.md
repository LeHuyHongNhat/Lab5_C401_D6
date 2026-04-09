# Vinmec Clinical Scribe AI

**Nhóm:** C401 — D6 | **Track:** Vinmec | **Hackathon:** VinUni A20 AI Thực Chiến · April 2026

AI augmentation tool tự động chuyển hội thoại phòng khám thành bản nháp hồ sơ SOAP có cấu trúc trong dưới 60 giây. Bác sĩ chỉ cần review, inline-edit và ký duyệt.

---

## Pipeline

```
Browser (MediaRecorder)
    │  WebM audio
    ▼
FastAPI Backend (:8000)
    ├── Whisper STT (local · CUDA / MPS / CPU)  →  raw text
    ├── GPT-4o LLM Diarization                  →  [DOCTOR] / [PATIENT] turns
    └── Medical Agent (ReAct · GPT-4o)          →  MedicalRecord (Pydantic)
            └── Tool: lookup_icd_code()         →  ICD-10 code
    ▼
React Frontend (:5173)
    └── Review UI: inline-edit · Accept/Decline · Undo/Redo · Correction log
```

---

## Cấu trúc thư mục

```
Lab5_C401_D6/
├── frontend/                   # React + TypeScript + Vite + Tailwind CSS
│   └── src/
│       ├── App.tsx             # UI chính: Live Transcript + SOAP Review
│       ├── context/            # State: MediaRecorder, API calls, Undo/Redo
│       ├── services/api.ts     # Typed API client: transcribeAudio(), saveRecord()
│       ├── types/              # TypeScript interfaces: MedicalRecord
│       ├── components/ui/      # Badge, Button, Modal, Skeleton, Toast
│       └── utils/reviewTokens.ts  # Parse highlight tokens (??)
│
└── medical_agent/
    ├── backend/main.py         # FastAPI: /api/health · /api/transcribe · /api/records/save
    ├── agent/
    │   ├── medical_agent.py    # ReAct loop → MedicalRecord
    │   ├── schemas.py          # Pydantic: MedicalRecord, PatientInfo, VisitInfo
    │   └── system_prompt.py    # System prompt tiếng Việt
    ├── diarization/
    │   ├── diarize.py          # Entry point: audio/text → raw_transcript.json
    │   ├── llm_diarization.py  # GPT-4o gán nhãn doctor/patient
    │   └── recorder.py         # CLI: microphone → WAV → diarize
    ├── tools/
    │   ├── get_patient_info.py # Mock patient data lookup
    │   └── lookup_icd_code.py  # ICD-10 dictionary lookup
    └── output/                 # record_*.json · correction_log_*.json
```

---

## Cài đặt & Chạy

### Yêu cầu

- Python 3.10+ · Node.js 18+
- `ffmpeg` — `brew install ffmpeg`
- OpenAI API key

### Terminal 1 — Backend

```bash
cd medical_agent

# Cài dependencies
pip install -r requirements.txt
pip install -r backend/requirements.txt
pip install openai-whisper torch   # STT local

# Tạo file .env
cp .env.example .env
# Điền OPENAI_API_KEY vào .env

uvicorn backend.main:app --reload --port 8000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/transcribe` | audio + patient_id + session_id → transcript + MedicalRecord |
| `POST` | `/api/records/save` | Lưu hồ sơ + correction log ra `output/` |
| `GET` | `/docs` | Swagger UI (tự gen bởi FastAPI) |

---

## Tech Stack

| Thành phần | Công cụ |
|---|---|
| LLM | GPT-4o (`gpt-4o-2024-08-06`) |
| STT | OpenAI Whisper (small, local) — CUDA › MPS › CPU |
| Diarization | Whisper STT → GPT-4o LLM |
| Backend | FastAPI + Uvicorn |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Output schema | Pydantic v2 + structured output |

---

## Tài liệu nhóm

| File | Nội dung |
|---|---|
| [`Group_report/spec-final_c401_D6.md`](Group_report/spec-final_c401_D6.md) | SPEC đầy đủ — Canvas, User Stories, Eval, Failure modes, ROI, Kiến trúc |
| [`Group_report/prototype-readme.md`](Group_report/prototype-readme.md) | Prototype README — mô tả, tools, phân công |
| [`Group_report/demo-script.md`](Group_report/demo-script.md) | Kịch bản demo |

---

*VinUni A20 — AI Thực Chiến · 2026*
