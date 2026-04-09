# Luồng hoạt động — AI Clinical Scribe Agent

> Tài liệu này mô tả toàn bộ luồng dữ liệu từ input âm thanh đến hồ sơ SOAP cuối cùng.

---

## Sơ đồ tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                        INPUT                                │
│   File audio (.wav/.mp3)   HOẶC   Mock JSON (demo)         │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │  audio_simulation  │
         │  .py               │
         │                    │
         │  Mode A (text)     │  Nhận mock JSON → giả lập STT
         │  Mode B (audio)    │  Whisper STT → pyannote Diarize
         └─────────┬──────────┘
                   │
                   │  raw_transcript.json
                   │  { speaker, text, timestamp }
                   │
         ┌─────────▼──────────┐
         │  medical_agent.py  │
         │  (LLM + ReAct)     │
         │                    │
         │  Tools:            │
         │  - get_patient_info│
         │  - lookup_icd_code │
         └─────────┬──────────┘
                   │
                   │  structured_record.json (SOAP)
                   │
         ┌─────────▼──────────┐
         │    React UI        │
         │  Review Interface  │
         │  Accept/Edit/Decline│
         └────────────────────┘
```

---

## Bước 1 — Audio Simulation (`spec/audio_simulation.py`)

### Mode A: Text Simulation (dùng cho demo)

```
mock_transcripts.json
       │
       ▼
load_scenario(index)          ← Đọc 1 trong 4 scenarios
       │
       ▼
simulate_stt_stream(turns)    ← In ra màn hình như real-time STT
       │                         Màu: xanh=BS, cyan=BN, vàng=NhàⓊ
       ▼
simulate_ai_processing()      ← Giả lập AI xử lý (mock output)
       │
       ▼
print_soap_output()           ← In SOAP đẹp ra terminal
```

**Cách chạy:**

```bash
python spec/audio_simulation.py --mode text --scenario 3
python spec/audio_simulation.py --list   # xem danh sách scenarios
```

---

### Mode B: Audio thật (dùng Whisper + pyannote)

```
File audio (.wav/.mp3)
       │
       ▼
[Bước 1] Whisper STT (HuggingFace transformers)
         model: openai/whisper-medium
         output: { text, chunks: [{text, timestamp:(start,end)}] }
       │
       ▼ [Bảo mật] Xóa file audio gốc ngay lập tức
       │
       ▼
[Bước 2] pyannote Diarization
         model: pyannote/speaker-diarization-3.1
         output: segments với speaker label (SPEAKER_00, SPEAKER_01...)
       │
       ▼
[Bước 3] merge_stt_and_diarization()
         Logic: Mỗi Whisper chunk → tìm speaker overlap nhiều nhất
         output: [{speaker, text, start, end}, ...]
       │
       ▼
[Bước 4] map_speaker_labels()
         Hỏi user: SPEAKER_00 = doctor? patient? family?
         output: turns với nhãn đúng
```

**Cách chạy:**

```bash
python spec/audio_simulation.py --mode audio --file recording.wav --hf-token hf_xxx
```

---

## Bước 2 — Medical Agent (`medical_agent/main.py`)

```
raw_transcript.json
       │
       ▼
transcript_parser.py          ← Parse JSON → string hội thoại
       │
       ▼
get_patient_info(patient_id)  ← Pre-fetch từ DB (hoặc mock)
       │
       ▼
LLM (GPT-4o) ReAct loop
  ├── lookup_icd_code()       ← Tool: tìm mã ICD-10
  └── Tổng hợp SOAP
       │
       ▼
MedicalRecord (Pydantic)      ← Validate schema
       │
       ▼
output/record_<session>.json  ← Lưu hồ sơ
```

**Cách chạy:**

```bash
cd medical_agent
cp .env.example .env          # Điền OPENAI_API_KEY vào .env
python main.py
```

---

## Dữ liệu trung gian

### raw_transcript.json (input của medical_agent)

```json
{
  "session_id": "VNM-20260409-001",
  "patient_id": "BN-2026-00001",
  "recorded_at": "2026-04-09T09:30:00",
  "turns": [
    { "speaker": "doctor", "text": "Chào anh..." },
    { "speaker": "patient", "text": "Dạ tôi tên..." },
    { "speaker": "family", "text": "Bác sĩ ơi..." }
  ]
}
```

### structured_record.json (output SOAP)

```json
{
  "patient": {
    "ho_ten": "Nguyễn Văn A",
    "gioi_tinh": "Nam",
    "ngay_sinh": "1990-05-12",
    "di_ung": null
  },
  "visit": {
    "S_subjective": "...",
    "O_objective": "...",
    "A_assessment": "Rối loạn lo âu lan toả",
    "chan_doan_icd": "F41.1",
    "P_plan": "...",
    "flags": ["DIARIZATION_WARNING: ..."]
  }
}
```

---

## 4 Scenarios test

| #   | Tên                             | Loại                   | ICD   |
| --- | ------------------------------- | ---------------------- | ----- |
| 1   | Happy Path — Lo âu lan toả      | happy_path             | F41.1 |
| 2   | Bệnh nhân nói nhỏ, câu bỏ lửng  | low_confidence         | K25   |
| 3   | Người nhà chen vào (demo chính) | diarization_error_risk | I50.0 |
| 4   | Tên biệt dược khó nhận          | medication_recognition | J02.9 |

> **Demo ngày thi:** Dùng `--scenario 3` — ấn tượng nhất với giám khảo.

---

## Top 3 Failure Modes cần test

| #   | Lỗi                               | Scenario    | Giải pháp                          |
| --- | --------------------------------- | ----------- | ---------------------------------- |
| 1   | Diarization nhầm người nói        | SCENARIO-03 | Flag `DIARIZATION_WARNING`         |
| 2   | STT nhận sai tên thuốc (Berodual) | SCENARIO-04 | Flag `MEDICATION_FLAG`             |
| 3   | Audio lưu raw không xóa           | Bất kỳ      | Auto-delete sau STT (đã implement) |

---

## Hướng dẫn cài đặt & chạy

### Bước 1 — Clone và cài dependencies

```bash
git pull origin Khaidz

python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Cài cho audio pipeline (Whisper + pyannote + torch ~2GB)
pip install -r requirements.txt

# Cài cho medical agent (OpenAI + Pydantic)
pip install -r medical_agent/requirements.txt
```

> **Máy có CUDA GPU:** thay dòng torch trong `requirements.txt` bằng:
> ```bash
> pip install torch --index-url https://download.pytorch.org/whl/cu118
> ```

---

### Bước 2 — Cấu hình API keys

**OpenAI (cho medical agent):**
```bash
cp medical_agent/.env.example medical_agent/.env
# Mở file medical_agent/.env và điền:
# OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
```

**HuggingFace (cho pyannote diarization — chỉ cần khi chạy Mode B audio):**
1. Tạo tài khoản tại huggingface.co
2. Vào `huggingface.co/pyannote/speaker-diarization-3.1` → bấm **Agree and access**
3. Lấy token tại `huggingface.co/settings/tokens`
4. Truyền vào lệnh chạy: `--hf-token hf_xxx`

---

### Bước 3 — Chạy

**A. Text demo (không cần GPU, không cần API key):**
```bash
# Windows
PYTHONIOENCODING=utf-8 python spec/audio_simulation.py --mode text --scenario 3

# Xem danh sách 4 scenarios
PYTHONIOENCODING=utf-8 python spec/audio_simulation.py --list
```

**B. Audio thật với Whisper (cần GPU + HF token):**
```bash
python spec/audio_simulation.py --mode audio --file recording.wav --hf-token hf_xxx
```

**C. Medical Agent (cần OpenAI API key):**
```bash
python medical_agent/main.py
# Output lưu tại: medical_agent/output/record_<session_id>.json
```

**D. Chạy tests:**
```bash
PYTHONIOENCODING=utf-8 python -m pytest spec/test_pipeline.py -v
# Kết quả mong đợi: 18 passed
```

**E. Chạy Whisper trên Google Colab (không có GPU local):**
- Upload file `colab_whisper_pipeline.ipynb` lên [colab.research.google.com](https://colab.research.google.com)
- Chọn `Runtime → Change runtime type → T4 GPU`
- Chạy từng cell theo thứ tự
- Download `raw_transcript_colab.json` → copy vào `medical_agent/input/raw_transcript.json` → chạy bước C

---

_Cập nhật: 09/04/2026 — Khải (Data Pipeline & Audio Simulation)_
