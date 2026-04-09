# Prototype README — Vinmec Clinical Scribe AI

**Nhóm:** C401 — D6 | **Track:** Vinmec

---

## Mô tả prototype

Vinmec Clinical Scribe AI là hệ thống hỗ trợ bác sĩ tự động hóa ghi chép hồ sơ bệnh án: ghi âm toàn bộ hội thoại trong phòng khám, chuyển đổi thành văn bản qua Whisper STT, phân vai bác sĩ/bệnh nhân qua LLM diarization, rồi trích xuất thành bản nháp SOAP có cấu trúc (Patient / Visit / Assessment / Treatment & Instructions) trong vòng dưới 60 giây. Bác sĩ chỉ cần review, inline-edit và ký duyệt — không gõ tay từ đầu.

---

## Level

**☑ Working prototype** — Backend FastAPI + Whisper STT + Medical Agent (GPT-4o, ReAct, tool calling) + Frontend React/TypeScript hoạt động end-to-end. Diarization chạy được trên local (MPS/CUDA/CPU). ICD-10 lookup dùng dictionary local. Correction log ghi ra JSON sau mỗi session.

---

## Link prototype


| Tài nguyên     | Link         |
| -------------- | ------------ |
| GitHub repo    | *(để trống)* |
| Demo video     | *(để trống)* |
| Deployed app   | *(để trống)* |
| Figma / Poster | *(để trống)* |


---

## Tools và API đã dùng


| Thành phần              | Công cụ / API                                        | Ghi chú                                                     |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| **LLM**                 | OpenAI GPT-4o (`gpt-4o-2024-08-06`)                  | Structured output (Pydantic), function calling, diarization |
| **STT**                 | OpenAI Whisper (small, local)                        | Tự detect CUDA > MPS > CPU; tiếng Việt                      |
| **STT (test)**          | HuggingFace Transformers `openai/whisper-`*          | Dùng trong unit test pipeline                               |
| **Speaker Diarization** | GPT-4o LLM prompt                                    | Phân biệt doctor/patient theo ngữ cảnh y khoa               |
| **Agent framework**     | OpenAI Python SDK (ReAct tự viết)                    | Không dùng LangChain                                        |
| **Structured output**   | `client.beta.chat.completions.parse()` + Pydantic v2 | Type-safe, tự validate                                      |
| **Backend**             | FastAPI + Uvicorn                                    | `/api/transcribe`, `/api/records/save`, `/api/health`       |
| **Frontend**            | React 18 + TypeScript + Vite + Tailwind CSS          | MediaRecorder API, contentEditable, Undo/Redo               |
| **Audio (CLI)**         | sounddevice + soundfile + numpy                      | Thu âm trực tiếp từ microphone                              |
| **ICD-10 Lookup**       | Dictionary Python local                              | Không cần API ngoài                                         |
| **Prototype tĩnh**      | HTML + Tailwind CSS                                  | Mock UI demo 4 paths                                        |
| **AI coding tools**     | Cursor (Claude), v0, Gemini AI Studio                | Brainstorm, vibe coding, prompt testing                     |


---

## Phân công — Ai làm gì

### Lê Huy Hồng Nhật — Agent Architect & Lead

- Thiết kế và kiểm soát toàn bộ luồng AI: audio → Whisper STT → LLM Diarization → Medical Agent → SOAP output.
- Viết SPEC Phần 1 (AI Product Canvas) và Phần 6 (Mini AI Spec); đảm bảo nhất quán kỹ thuật xuyên suốt tài liệu.
- Quyết định kiến trúc pipeline diarization: loại bỏ pyannote, giữ luồng duy nhất Whisper + LLM — đơn giản, không phụ thuộc GPU cho diarization.
- Viết roadmap kỹ thuật thực tế (Section 8.1): STT fine-tune, LLM cost reduction, streaming latency, kiến trúc scale 1,000+ bác sĩ.
- Refactor `diarize.py`, `recorder.py`, `config.py`; cập nhật Tech Stack table; hoàn thiện `.gitignore`.

---

### Nguyễn Tuấn Khải — Data Pipeline & Audio Simulation

- Xây dựng audio pipeline hoàn chỉnh (`spec/audio_simulation.py`, `medical_agent/diarization/`): tích hợp Whisper (HuggingFace Transformers) + pyannote speaker diarization (prototype gốc).
- Cài đặt `merge_stt_and_diarization()` ghép Whisper segments với pyannote speaker turns theo timestamp; `map_speaker_labels()` tự map `SPEAKER_00/01` → `doctor/patient`.
- Auto-delete audio sau STT để giải quyết failure mode bảo mật.
- Viết 18 unit tests (`spec/test_pipeline.py`) đạt 100% pass — cover edge case: audio rỗng, giọng chồng nhau, tên thuốc biệt dược không map được, pipeline fallback khi thiếu HF token.
- Viết SPEC Phần 4 — Top 3 Failure Modes: bảng Severity × Likelihood, phân tích cascade failure (diarization nhầm → EHR sai → tương tác thuốc nguy hiểm — 6–7 bước trước khi phát hiện), adversarial scenarios (review fatigue, data leak nội bộ mạng).

---

### Phan Văn Tấn — Prompt Engineer & Medical Logic

- Thiết kế system prompt cho Medical JSON extraction (`prompts/system_prompt.txt`): cấu trúc theo hướng LLM → structured output, định nghĩa rõ role, rules, constraints và response format — đảm bảo model trả về JSON hợp lệ, không sinh text ngoài format.
- Các nguyên tắc prompt: chỉ extract thông tin có trong hội thoại (no hallucination), chuẩn hóa tiếng Việt lâm sàng, tách rõ các field: triệu chứng / khám lâm sàng / chẩn đoán / điều trị.
- Xây dựng bộ few-shot examples (`few_shot/examples.json`): tổng hợp và chuẩn hóa các case mẫu (format bệnh án Vinmec) để model học pattern mapping hội thoại → JSON; cover nhiều kiểu input từ triệu chứng đơn giản đến hội thoại nhiễu; giảm lỗi thiếu field và sai cấu trúc JSON.
- Định nghĩa ranh giới rõ LLM vs Backend: LLM chỉ xử lý natural language → structured JSON; Backend xử lý logic nghiệp vụ (ICD mapping, validation, enrich data) — giảm độ phức tạp prompt, tăng độ ổn định hệ thống.
- Viết SPEC Phần 2 — User Stories 4 Paths.

---

### Nguyễn Quốc Khánh — Business Intelligence & Presentation

- Xây dựng mock prototype frontend tĩnh bằng HTML + Tailwind CSS mô phỏng giao diện Medical Scribe, thể hiện UI khi AI đưa ra kết quả sai hoặc không chắc chắn.
- Phân tích ROI 3 kịch bản (Conservative / Realistic / Optimistic): tính toán chi phí O&M (inference, hạ tầng, tích hợp HIS) và benefit (tiết kiệm nhân lực, doanh thu thêm, giảm xuất toán BHYT).
- Hoàn thiện kịch bản demo (`demo-script.md`) và thiết kế layout Poster, Slide cho buổi thuyết trình.
- Tổng hợp và biên tập bản SPEC final để Lead kiểm duyệt.
- Tham gia thiết kế UI/UX cho failure path: kịch bản xử lý khi AI low-confidence hoặc sai.
- Viết SPEC Phần 5 — ROI 3 kịch bản.

---

### Nguyễn Quế Sơn — Frontend Developer

- Đại tu kiến trúc giao diện "Medical Record Draft": tái thiết kế từ `<p contentEditable>` thô sơ thành form y tế chuẩn, phân tách 4 khu vực rõ ràng: Hành chính / Bệnh sử / Khám lâm sàng / Chẩn đoán & Điều trị.
- Thiết kế Review Mechanism: highlight từ khóa low-confidence bằng màu vàng cảnh báo; UI Accept ✓ / Decline ✗ / inline edit cho từng token trong trường `dan_do`.
- Tối ưu UX thao tác: giao diện "Always-On" (form luôn hiển thị), nút "Ghi âm" ở trung tâm — bác sĩ có thể vừa đọc transcript vừa gõ trực tiếp vào form mà không cần đợi workflow hoàn tất.
- Hỗ trợ xây dựng tập dữ liệu demo (kịch bản khám tiêu hóa) và prompt-testing trực tiếp trên giao diện để kiểm tra AI trích xuất đúng luồng khám thực tế.

---

### Lê Công Thành — AI Evaluator & Metrics

- Lên ý tưởng và dùng prototyping tool xây dựng Mock Prototype thể hiện đầy đủ 4 paths: Happy / Low-confidence / Failure / Correction.
- Thiết kế bộ chỉ số đánh giá (LLM-as-a-judge) để đo chất lượng SOAP output; thực hiện test corner cases.
- Phản biện chéo các ý tưởng trong SPEC — đặc biệt đối chiếu định nghĩa "Zero-edit rate" với tiêu chí Recall trong môi trường y khoa: chỉ ra rằng Zero-edit rate cao không đồng nghĩa với Recall cao nếu AI bỏ sót thông tin và bác sĩ không nhận ra.
- Viết SPEC Phần 3 — Eval Metrics + Threshold.
- Đóng góp chỉnh sửa SPEC final.

