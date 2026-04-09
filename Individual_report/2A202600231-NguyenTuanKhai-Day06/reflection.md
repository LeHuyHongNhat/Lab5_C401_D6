# Individual Reflection — Nguyễn Tuấn Khải (khaidz)

## 1. Role
Data Pipeline & Audio Simulation Engineer. Phụ trách toàn bộ luồng xử lý âm thanh: từ ghi âm → STT (Whisper) → diarization (tách giọng bác sĩ / bệnh nhân) → đầu vào cho Medical Agent. Kiêm phần Spec phần 4 (Top 3 Failure Modes).

---

## 2. Đóng góp cụ thể

- **Xây dựng audio pipeline hoàn chỉnh** (`spec/audio_simulation.py`, `medical_agent/diarization/`): tích hợp Whisper (HuggingFace Transformers) + pyannote speaker diarization, có `merge_stt_and_diarization()` ghép Whisper segments với pyannote speaker turns theo timestamp, `map_speaker_labels()` tự map SPEAKER_00/01 → doctor/patient, và auto-delete audio sau STT (giải quyết failure mode bảo mật #3).
- **Viết 18 unit tests** (`spec/test_pipeline.py`) đạt 100% pass, cover các edge case: audio rỗng, giọng chồng nhau, tên thuốc biệt dược không map được, pipeline fallback khi thiếu HF token.
- **Viết Spec phần 4 — Top 3 Failure Modes** (`05-failure-modes.md`): bao gồm bảng Severity × Likelihood, phân tích cascade failure (diarization nhầm → EHR sai → tương tác thuốc nguy hiểm — 6-7 bước trước khi phát hiện), và adversarial scenarios (review fatigue, data leak qua nội bộ mạng).

---

## 3. SPEC mạnh / yếu

- **Mạnh nhất: Failure Modes (Phần 4)** — Nhóm đã đi xa hơn việc chỉ liệt kê 3 dòng: có ma trận Severity × Likelihood, cascade failure step-by-step, và adversarial misuse. Quan trọng hơn, failure mode nguy hiểm nhất (#1 Diarization Error) là loại "bác sĩ đọc lướt không phát hiện được" — đây đúng là loại lỗi ẩn nhất trong y khoa. Mitigation cụ thể: confidence threshold 0.85, màu [BS]/[BN] riêng trong transcript.
- **Yếu nhất: ROI Phần 5** — Ba kịch bản Conservative / Realistic / Optimistic thực ra chỉ khác nhau về số bác sĩ sử dụng (100 → 500 → toàn hệ thống). Assumption nền gần như giống nhau, không tách được thành phần nào thay đổi. Nên làm rõ hơn: Conservative = chỉ chạy pilot 1 khoa, không fine-tune; Optimistic = tích hợp sâu HIS + continuous learning 6 tháng. Như vậy mới thấy rõ ROI tăng từ đâu.

---

## 4. Đóng góp khác

- Tích hợp FastAPI backend (`api.py`): thiết kế endpoint `/api/transcribe` nhận audio blob từ browser → Whisper STT → LLM diarization → Medical Agent, và endpoint `/api/records/save` ghi correction log để phục vụ continuous learning flywheel — điểm được nhắc trong SPEC nhưng chưa ai làm trước đó.

---

## 5. Điều học được

Trước hackathon, nghĩ diarization (tách giọng nói) là bài toán học thuật phức tạp, cứ dùng pyannote là xong. Sau khi code thực tế mới phát hiện: pyannote cần HuggingFace token + accept license trên web, không thể deploy tự động cho người dùng mới. Phải thiết kế fallback LLM diarization (chạy Whisper STT trước, rồi dùng LLM gán nhãn doctor/patient từ text). Bài học: infrastructure constraint (auth, license, cold-start) quyết định thiết kế pipeline, không phải chỉ accuracy của model.

---

## 6. Nếu làm lại

Sẽ chốt **JSON schema của transcript** (`raw_transcript.json`) vào buổi sáng D5, trước khi bắt đầu code frontend. Thực tế schema thay đổi 2 lần trong ngày (thêm field `confidence`, đổi `speaker_label` thành `speaker`) khiến Sơn phải sửa lại component `ClinicalScribeContext.tsx` — mất ~1.5 tiếng không cần thiết. Nếu lock schema sớm bằng 1 file JSON example và ký tên vào đó, mỗi người tự code song song mà không block nhau.

---

## 7. AI giúp gì / AI sai gì

- **Giúp:** Dùng Claude để thiết kế cascade failure analysis trong Spec — hỏi "failure mode #1 xảy ra thì step tiếp theo là gì?" Claude truy ra được chuỗi 6-7 bước (nhầm lời người nhà → EHR sai → bác sĩ kế tiếp kê đơn dựa EHR cũ → tương tác thuốc) mà nếu chỉ suy nghĩ một mình thì dừng ở bước 3. Dùng Cursor để gen boilerplate cho unit tests, tốc độ viết test nhanh hơn 3-4x.
- **Sai/mislead:** Claude ban đầu gợi ý dùng `openai-whisper` (CLI cũ) thay vì HuggingFace `transformers` pipeline — hai thư viện có API hoàn toàn khác nhau. Mất 30 phút debug lỗi import trước khi nhận ra mình đang mix hai codebase. Bài học: khi hỏi AI về thư viện cụ thể, phải nêu rõ version và source (PyPI vs HuggingFace Hub), không để AI tự suy diễn — nó không biết mình đang dùng cái nào.
