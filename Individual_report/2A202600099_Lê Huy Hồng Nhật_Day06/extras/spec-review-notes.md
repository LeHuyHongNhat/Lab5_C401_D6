# SPEC Review Notes — C401_D6
**Reviewer:** Lê Huy Hồng Nhật (2A202600099)
**Date:** 09/04/2026
**File reviewed:** `Group_report/SPEC_final_c401_d6.md`

---

## Mục đích

Ghi lại các inconsistency và điểm yếu phát hiện được trong SPEC trong quá trình review, kèm quyết định sửa đổi và lý do. Đây là "diff log" tư duy — không phải git diff.

---

## Issue #1 — Learning Signal data type sai

**Vị trí:** Mục 1 (AI Product Canvas) → Learning signal → câu hỏi 3

**Trước:**
```
☑ User-specific (phong cách từng bác sĩ) · ☑ Domain-specific · ☐ Real-time · ☑ Human-judgment

Marginal value: Cao — các LLM hiện tại chưa được fine-tune trên tiếng Việt y khoa
chuyên sâu và phong cách hành văn hồ sơ bệnh viện Việt Nam.
```

**Vấn đề:**
Format bệnh án SOAP là chuẩn hóa theo quy định Vinmec/JCI — không phải phong cách cá nhân bác sĩ. Đánh dấu User-specific dẫn đến Section 8.3 bị định hướng sai (Personalization theo từng bác sĩ).

Marginal value nói về "phong cách hành văn" trong khi bottleneck thực sự là STT accuracy trong điều kiện thực tế Việt Nam (tiếng ồn, giọng vùng miền).

**Sau:**
```
☐ User-specific (format bệnh án là chuẩn hóa, không cá nhân hóa theo bác sĩ)
☑ Domain-specific · ☐ Real-time · ☑ Human-judgment

Marginal value: Cao — ưu tiên tối ưu hệ thống chung:
(1) STT chính xác trong tiếng ồn phòng khám, tạp âm thiết bị, giọng Bắc/Trung/Nam/địa phương
(2) LLM chưa fine-tune trên tiếng Việt y khoa và thuật ngữ chuẩn hồ sơ bệnh viện Việt Nam.
Format bệnh án chuẩn hóa theo quy định Vinmec/JCI — không thay đổi theo cá nhân bác sĩ.
```

---

## Issue #2 — Section 8.1 roadmap thiếu thực tế

**Vị trí:** Section 8.1 — Giảm latency pipeline

**Trước:**
3 options ngắn (A: Realtime Streaming, B: Whisper large-v3-turbo, C: Kết hợp A+B) — chỉ giải quyết latency, bỏ qua 3 vấn đề song song: STT accuracy, LLM cost, scale architecture.

**Vấn đề:**
- Option A và B không có trade-off rõ (khi nào dùng Deepgram vs faster-whisper?)
- Không đề cập việc giảm chi phí LLM khi scale (GPT-4o $0.05/ca × 3,000 ca/ngày = $150/ngày)
- Không có kiến trúc rõ ràng cho production (hiện tại single-process FastAPI không scale được)

**Sau:** Rewrite thành 4 hướng độc lập:
- **A. STT accuracy** — fine-tune Whisper trên ground-truth từ correction log, medical vocabulary bias, noise suppression
- **B. LLM cost** — PhoBERT cho diarization (free), GPT-4o-mini fine-tuned (~15× rẻ hơn), LLM local (vLLM), prompt caching
- **C. Latency** — streaming STT (faster-whisper + WebSocket), parallel processing, streaming output
- **D. Scale architecture** — bảng MVP vs hệ thống lớn: Kubernetes, FHIR, Prometheus, Vault, HIPAA compliance

---

## Issue #3 — Section 8.3 định hướng sai

**Vị trí:** Section 8.3

**Trước:** "Personalization theo từng bác sĩ" — học phong cách viết của từng bác sĩ, per-doctor prompt tuning.

**Vấn đề:** Inconsistent với Issue #1. Nếu format là chuẩn hóa thì không có "phong cách viết của từng bác sĩ" để học.

**Sau:** Đổi thành "Cải thiện hệ thống chung từ correction log":
- Correction data → improve system-wide accuracy (không phải per-user output)
- Analytics dashboard theo field, không theo bác sĩ
- STT improvement từ audio ground-truth
- Fine-tune model chung, không phải per-doctor model

---

## Tổng kết

| Issue | Severity | Loại | Trạng thái |
|---|---|---|---|
| #1 Learning Signal data type sai | High | Product logic error | ✅ Đã sửa |
| #2 Section 8.1 thiếu thực tế | Medium | Incomplete roadmap | ✅ Đã sửa |
| #3 Section 8.3 định hướng sai | Medium | Inconsistency | ✅ Đã sửa |
| #4 Tech Stack mô tả architecture cũ | Low | Documentation mismatch | ✅ Đã sửa |

**Lesson learned:** SPEC review nên được làm sau khi code/architecture đã ổn định — viết SPEC trước khi implement xong dễ dẫn đến inconsistency giữa document và thực tế.
