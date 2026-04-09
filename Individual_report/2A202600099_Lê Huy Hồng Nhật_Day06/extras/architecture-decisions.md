# Architecture Decision Log — Vinmec Clinical Scribe AI

**Author:** Lê Huy Hồng Nhật (2A202600099) — Agent Architect & Lead
**Date:** 09/04/2026

---

## ADR-001 — Loại bỏ pyannote, giữ Whisper + LLM diarization

**Ngữ cảnh:**
Pipeline gốc dùng Whisper (STT) + pyannote/speaker-diarization-3.1 (phân vai bác sĩ/bệnh nhân theo timestamp). pyannote yêu cầu HuggingFace token, tải model ~1GB, cần GPU đủ mạnh, và phụ thuộc nhiều thư viện nặng.

**Quyết định:**
Loại bỏ hoàn toàn pyannote. Luồng duy nhất:

```
audio → Whisper STT → raw_text → GPT-4o LLM → labeled turns (doctor/patient)
```

LLM gán nhãn dựa trên ngữ cảnh y khoa: `[DOCTOR]` khi hỏi bệnh, chẩn đoán, kê đơn; `[PATIENT]` khi mô tả triệu chứng, trả lời câu hỏi.

**Lý do:**

- pyannote giải quyết speaker diarization bằng acoustic similarity (giọng ai giống ai) — không dùng ngữ nghĩa
- GPT-4o dùng medical context (ai sẽ nói "uống 2 viên/ngày"?) — phù hợp hơn cho domain y tế
- Bỏ dependency nặng: không cần HF_TOKEN, không cần GPU cho bước diarization, barrier to deploy thấp hơn
- Đơn giản hơn = ít bug surface, dễ maintain trong hackathon timeframe

**Đánh đổi:**

- Mất timestamp-level alignment (pyannote biết chính xác giây nào ai nói)
- LLM có thể nhầm khi câu ngắn, mơ hồ (không đặc trưng doctor hay patient)
- Mitigation: hiển thị transcript để bác sĩ kiểm tra, highlight `(??)` đoạn không chắc

**Files thay đổi:**

- Xóa: `medical_agent/diarization/whisper_diarization.py`
- Sửa: `medical_agent/diarization/diarize.py` — bỏ `method`, `hf_token`, `doctor_speaker` params
- Sửa: `medical_agent/diarization/recorder.py` — bỏ `--method`, `--hf-token` CLI args
- Sửa: `medical_agent/config.py` — xóa `HF_TOKEN`
- Sửa: `medical_agent/diarization/llm_diarization.py` — đổi `diarization_method: "llm-fallback"` → `"whisper+llm"`

---

## ADR-002 — Format bệnh án là chuẩn hóa, không cá nhân hóa theo bác sĩ

**Ngữ cảnh:**
SPEC Learning Signal (Mục 1.3) ban đầu đánh dấu:

```
☑ User-specific (phong cách từng bác sĩ)
```

Marginal value viết: "LLM chưa fine-tune trên tiếng Việt y khoa và phong cách hành văn hồ sơ bệnh viện Việt Nam."

**Vấn đề:**
Format bệnh án SOAP/JCI của Vinmec là chuẩn hóa theo quy định bệnh viện và luật pháp y tế — không phải phong cách cá nhân của từng bác sĩ. "Personalization" theo bác sĩ ở đây là sai về mặt product: nếu mỗi bác sĩ có format output khác nhau, hồ sơ sẽ không đạt chuẩn JCI, xuất toán BHYT sẽ bị từ chối.

**Quyết định:**

- Bỏ check `☑ User-specific`, thêm giải thích rõ: format là chuẩn hóa
- Pivot Marginal value sang 2 điểm thực sự quan trọng:
  1. STT robustness — tiếng ồn phòng khám, tạp âm micro, giọng Bắc/Trung/Nam/địa phương
  2. Domain knowledge — thuật ngữ y khoa tiếng Việt chuyên sâu chưa có trong LLM hiện tại
- Đổi tên Section 8.3 từ "Personalization theo từng bác sĩ" → "Cải thiện hệ thống chung từ correction log"

**Tác động:**
Toàn bộ roadmap của correction log giờ hướng về nâng accuracy hệ thống chung thay vì tùy biến output cá nhân — đây là hướng đúng cho một medical system.

---

## ADR-003 — Whisper default model: small thay vì medium

**Ngữ cảnh:**
Whisper model size ảnh hưởng trực tiếp đến tốc độ xử lý và accuracy. Pipeline gốc dùng `medium` làm default.

**Quyết định:**
Đổi default sang `small` trong `diarize.py` và `recorder.py`.

**Lý do:**

- Hackathon context: cần tốc độ hơn là accuracy tối đa
- Whisper `small` đủ tốt cho tiếng Việt rõ ràng (WER ~15-20%), xử lý nhanh hơn ~3-4× so với `medium`
- Khi fine-tune cho domain Vinmec (roadmap), model nhỏ hơn sẽ fine-tune nhanh và rẻ hơn
- `medium` vẫn có thể chọn qua `--whisper-model medium` khi cần
