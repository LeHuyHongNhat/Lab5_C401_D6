# SPEC — AI Product Hackathon

**Nhóm:** C401 — D6
**Track:** ☐ VinFast · ☑ Vinmec · ☐ VinUni-VinSchool · ☐ XanhSM · ☐ Open
**Problem statement (1 câu):** Bác sĩ Vinmec mất 3–5 phút/ca gõ hồ sơ bệnh án thủ công sau mỗi lần khám, thiếu giao tiếp ánh mắt với bệnh nhân, và mang giấy tờ về nhà làm thêm (Pajama time) — AI ghi âm toàn bộ hội thoại, tự động trích xuất và điền hồ sơ SOAP có cấu trúc trong vòng 15 giây, bác sĩ chỉ cần review 30 giây rồi ký duyệt.

---

## 1. AI Product Canvas


|             | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Trust                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Feasibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Câu hỏi** | User nào? Pain gì? AI giải gì?                                                                                                                                                                                                                                                                                                                                                                                                                               | Khi AI sai thì sao? User sửa bằng cách nào?                                                                                                                                                                                                                                                                                                                                                                                                                         | Cost/latency bao nhiêu? Risk chính?                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Trả lời** | **User:** Bác sĩ tại phòng khám Vinmec. **Pain:** (1) Mất 3–5 phút gõ hồ sơ SOAP mỗi ca khám 15 phút → chiếm 20–33% thời gian; (2) Cắm mặt vào máy tính khiến mất tương tác ánh mắt; (3) "Pajama time" — hoàn thiện hồ sơ sau giờ làm gây burnout; (4) Hồ sơ sơ sài → xuất toán bảo hiểm, không đạt chuẩn JCI. **AI giải:** Tự động chuyển toàn bộ hội thoại 15 phút thành bản nháp SOAP có cấu trúc trong ≤15 giây. Bác sĩ chỉ review + ký duyệt (30 giây). | **Khi AI sai:** Giao diện hiển thị bản nháp (draft), không tự lưu vào EHR. AI đánh dấu `(??)` các đoạn nghe không rõ hoặc có độ tin cậy thấp (highlight vàng). **User sửa:** Inline editing — click trực tiếp vào trường, gõ đè. Mỗi trường có nút Accept ✓ / Decline ✗. Lịch sử Undo/Redo (Ctrl+Z) cho toàn bộ session. **Correction logging:** Mọi action (accept/edit/decline) được ghi lại với timestamp và diff text → dùng để cải thiện agent/ STT model sau. | **Chi phí:** ~$0.03–0.06/ca (Whisper local + GPT-4o ~$0.02/ca). Không phát sinh chi phí diarization (chạy local). **Latency:** STT Whisper small ~30–60s cho audio 15 phút (M4 Pro MPS); LLM diarization ~5–10s; Medical Agent ~5–15s. Tổng pipeline: 45–90s sau khi kết thúc ghi âm. *→ Xem mục 8.1 về hướng tối ưu xuống <15s.* **Risk chính:** (1) Hallucination liều thuốc/chẩn đoán; (2) Nhầm speaker doctor/patient trong môi trường ồn; (3) Bảo mật dữ liệu y tế (HIPAA/JCI). |


**Automation hay augmentation?** ☐ Automation · ☑ Augmentation

**Justify:** Hậu quả sai sót y khoa là nghiêm trọng về tính mạng và pháp lý. AI chỉ tạo bản nháp (draft), bác sĩ là người duyệt và ký cuối cùng — Human-in-the-loop là bắt buộc. Không thể automation hoàn toàn cho đến khi accuracy field-level đạt ≥99.9% trong ít nhất 6 tháng liên tục.

**Learning signal:**

1. **User correction đi vào đâu?** Mọi action (accept / edit / decline) được ghi vào `correction_log` dưới dạng JSON sau mỗi session. Log lưu cặp `(agent_value, final_value)` cho từng trường → raw material để fine-tune hoặc improve prompt.
2. **Product thu signal gì để biết tốt lên hay tệ đi?** Zero-edit rate theo field (tỉ lệ accepted không cần sửa), thời gian review trung bình (review latency per field), tỉ lệ decline theo field (field nào bác sĩ xóa đi nhiều nhất).
3. **Data thuộc loại nào?** ☐ User-specific (format bệnh án là chuẩn hóa, không cá nhân hóa theo bác sĩ) · ☑ Domain-specific (tiếng Việt y khoa, thuật ngữ nội khoa Vinmec) · ☐ Real-time · ☑ Human-judgment
  **Marginal value:** Cao — ưu tiên tối ưu hệ thống chung: (1) Model STT cần chính xác trong nhiều điều kiện thực tế — tiếng ồn phòng khám, tạp âm thiết bị ghi âm, giọng vùng miền đa dạng (Bắc/Trung/Nam/địa phương); (2) LLM chưa được fine-tune trên tiếng Việt y khoa chuyên sâu và thuật ngữ chuẩn của hồ sơ bệnh viện Việt Nam. Format bệnh án chuẩn hóa theo quy định Vinmec/JCI — không thay đổi theo cá nhân bác sĩ.

---

## 2. User Stories — 4 Paths

### Feature 1: Ghi âm & Trích xuất SOAP (Clinical Scribe)

**Trigger:** Bệnh nhân bước vào phòng → bác sĩ bấm **"Ghi âm"** → nói chuyện tự nhiên → bấm **"Kết thúc & Trích xuất"** → pipeline xử lý → bản nháp SOAP hiện trên màn hình.


| Path                               | Câu hỏi thiết kế                                           | Mô tả (theo implementation thực tế)                                                                                                                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Happy — AI đúng, tự tin**        | User thấy gì? Flow kết thúc ra sao?                        | Bảng MedicalRecord Draft hiện đầy đủ 4 section (Patient / Visit / Assessment / Điều trị & dặn dò). Các trường đều chính xác. Bác sĩ lướt 10–20 giây, bấm **"Lưu bệnh án"** → hồ sơ lưu vào `output/` kèm correction log.                |
| **Low-confidence — AI không chắc** | System báo "không chắc" bằng cách nào? User quyết thế nào? | Các cụm từ nghe không rõ trong trường `dan_do` được highlight vàng với `(??)`. Bác sĩ click vào highlight → Accept ✓ (giữ nguyên) hoặc Decline ✗ (xóa đoạn đó). Có thể thao tác "Bỏ chọn ô cụ thể" để chọn từng token.                  |
| **Failure — AI sai**               | User biết AI sai bằng cách nào? Recover ra sao?            | Tất cả trường đều là `contentEditable` — bác sĩ click vào và gõ đè trực tiếp. Có Undo (Ctrl+Z) / Redo (Ctrl+Shift+Z) cho toàn bộ session. AI sai nhưng bác sĩ có full control để fix trong <30 giây.                                    |
| **Correction — user sửa**          | User sửa bằng cách nào? Data đó đi vào đâu?                | Sửa inline → khi blur khỏi trường, giá trị mới được commit vào Undo history. Khi bấm "Lưu bệnh án", `correction_log` ghi lại toàn bộ `(field, action, agent_value, final_value, latency_ms)` → dùng để phân tích accuracy và fine-tune. |


---

### Feature 2: Tra cứu ICD-10 tự động (Tool Calling)

**Trigger:** Medical Agent nhận kết quả chẩn đoán văn bản → tự động gọi tool `lookup_icd_code` → điền mã ICD-10 vào trường `chan_doan_icd`.


| Path                 | Câu hỏi thiết kế                    | Mô tả                                                                                                                                            |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Happy — AI đúng**  | Mã ICD-10 đúng với chẩn đoán.       | Trường `ICD-10` hiển thị ví dụ "K21.9". Bác sĩ Accept trong 1 giây.                                                                              |
| **Low-confidence**   | Nhiều mã ICD-10 có thể phù hợp.     | Agent trả về mã phổ biến nhất. Tool `lookup_icd_code` hiện tại dùng dictionary local, không hỏi lại LLM. Cần mở rộng để trả về top-3 candidates. |
| **Failure — sai mã** | Mã ICD-10 không khớp với chẩn đoán. | Bác sĩ sửa trực tiếp trường ICD-10 (contentEditable). Sửa được ghi vào correction log → phát hiện các pattern sai lặp lại.                       |
| **Correction**       | Bác sĩ sửa mã.                      | Ghi `(chan_doan_icd, edited, "K21.9", "K21.9 + K29.5")` vào correction log.                                                                      |


---

### Feature 3: Diarization (Phân biệt giọng bác sĩ / bệnh nhân)

**Trigger:** Audio thô từ Whisper STT (raw text) → LLM diarization hoặc pyannote → transcript có nhãn speaker → Medical Agent.


| Path                       | Câu hỏi thiết kế                                       | Mô tả                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Happy**                  | Speaker assignment đúng hoàn toàn.                     | Agent nhận transcript đúng format → trích xuất chính xác triệu chứng (patient) và chỉ định (doctor).                                                         |
| **Low-confidence**         | Phòng ồn, 2 người nói chèn nhau.                       | LLM diarization dùng ngữ cảnh ngôn ngữ để đoán. Nếu không rõ gán `speaker: unknown`. Transcript được hiển thị trên Live Transcript panel để bác sĩ kiểm tra. |
| **Failure — nhầm speaker** | Doctor/patient bị gán nhầm.                            | Triệu chứng của bệnh nhân có thể bị ghi vào phần chỉ định, hoặc ngược lại. Đây là failure mode nguy hiểm nhất — xem mục 4.                                   |
| **Correction**             | Bác sĩ thấy transcript sai → sửa trực tiếp SOAP draft. | Không có UI để sửa transcript hiện tại (limitation). Future: thêm inline edit trên Live Transcript panel.                                                    |


---

## 3. Eval Metrics + Threshold

**Optimize precision hay recall?** ☐ Precision · ☑ Recall

**Tại sao?** Trong y khoa, bỏ sót triệu chứng (false negative) nguy hiểm hơn nhiều so với ghi thừa (false positive). Bác sĩ dễ dàng xóa thông tin dư thừa nhưng rất khó nhớ lại triệu chứng bị bỏ qua. Target: ghi nhận ≥95% nội dung y khoa có trong hội thoại.

**Nếu sai ngược lại (optimize precision):** AI chỉ ghi những câu rõ ràng, bỏ qua các chi tiết tinh tế ("đau âm ỉ khi trời lạnh", "thỉnh thoảng buồn nôn sau ăn") → bác sĩ phải gõ thêm nhiều → mất đi giá trị của tool.


| Metric                                                                       | Target                   | Threshold  | Red flag (dừng khi)          | Cách đo                                           |
| ---------------------------------------------------------------------------- | ------------------------ | ---------- | ---------------------------- | ------------------------------------------------- |
| **Zero-edit rate** (% trường accepted không sửa)                             | ≥ 60%                    | ≥ 45%      | < 30% trong 2 tuần liên tiếp | `accepted_count / total_fields` từ correction log |
| **Review latency / ca**                                                      | ≤ 45 giây                | ≤ 90 giây  | > 150 giây (bằng gõ tay)     | Tổng `latency_ms` các trường trong session        |
| **Field-level recall** (% thông tin có trong hội thoại được trích xuất đúng) | ≥ 85% per field          | ≥ 70%      | < 60% cho bất kỳ field nào   | Đánh giá thủ công sample 100 ca                   |
| **Speaker diarization accuracy**                                             | ≥ 90% turns đúng speaker | ≥ 80%      | < 70%                        | So sánh với ground truth có bác sĩ annotate       |
| **Pipeline latency** (từ lúc bấm stop đến khi SOAP hiện ra)                  | ≤ 60 giây                | ≤ 120 giây | > 180 giây                   | Server-side timing log                            |
| **Tỉ lệ khiếu nại do hồ sơ thiếu sót / AI lỗi**                              | 0%                       | 0%         | > 0 trường hợp nghiêm trọng  | Incident report từ HIS                            |


---

## 4. Top 3 Failure Modes


| #     | Trigger                                                                                                                   | Hậu quả                                                                                                                                                                                | Nguy hiểm                                                   | Mitigation đã làm                                                                                                                                        | Mitigation cần thêm                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Diarization nhầm speaker:** Bệnh nhân/bác sĩ bị gán nhầm vai (môi trường ồn, giọng tương tự, hai người nói chèn nhau)   | Agent gán triệu chứng của bệnh nhân thành chỉ định của bác sĩ — hoặc tệ hơn: chẩn đoán bị nhầm → **Bác sĩ không nhận ra sai vì text trông "hợp lý"**                                   | **Cao nhất** — User KHÔNG BIẾT bị sai                       | (1) Hiển thị Live Transcript để bác sĩ kiểm tra trong lúc ghi âm; (2) LLM diarization dùng ngữ cảnh để giảm nhầm; (3) highlight `(??)` các đoạn không rõ | Thêm confidence score per turn; Cho phép bác sĩ sửa transcript trực tiếp; Khi detect nhầm speaker → alert nổi bật                             |
| **2** | **Hallucination liều thuốc / chỉ định:** LLM "bịa" tên thuốc, liều dùng, hoặc xét nghiệm chưa được đề cập trong hội thoại | Bác sĩ bấm Accept nhầm → bệnh nhân nhận đơn thuốc sai liều hoặc bị chỉ định xét nghiệm không cần thiết → Rủi ro pháp lý nghiêm trọng                                                   | **Cao** — có thể xảy ra với GPT-4o ở điều kiện prompt nghèo | (1) System prompt cấm tuyệt đối suy diễn ngoài hội thoại; (2) `temperature=0` giảm hallucination; (3) Pydantic schema validate output                    | Thêm "Citation required" — mỗi trường phải trích dẫn từ câu cụ thể trong transcript; Post-processing: cross-check thuốc với danh mục cho phép |
| **3** | **Audio chất lượng thấp:** Phòng ồn, micro USB không ổn định, bệnh nhân nói nhỏ, giọng Bắc/Nam/địa phương đặc             | Whisper trả về raw text nhiều lỗi/thiếu → LLM diarization hoặc agent không đủ context → SOAP thiếu nhiều trường quan trọng → Bác sĩ phải gõ lại gần như toàn bộ = tệ hơn không dùng AI | **Trung bình** — User biết ngay vì thấy nhiều ô trống       | (1) Recommend microphone đa hướng USB (Konftel, Jabra); (2) Whisper small model xử lý tốt tiếng Việt; (3) Hiển thị transcript để bác sĩ kiểm tra         | Thêm audio quality pre-check trước khi gửi lên backend; Nếu WER ước tính > 30% → alert bác sĩ ghi âm lại                                      |


---

## 5. ROI 3 Kịch Bản


|                                       | Conservative                                                                              | Realistic                                                                                                                   | Optimistic                                                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Assumption**                        | 50 bác sĩ dùng thử tại 1 khoa, 3 ca/ngày, tiết kiệm 3 phút/ca. Adoption rate: 40%         | 300 bác sĩ toàn hệ thống Vinmec, tiết kiệm 4 phút/ca. Adoption rate: 70%. Hồ sơ đạt chuẩn JCI giảm tỷ lệ xuất toán BHYT 15% | 1,000+ bác sĩ toàn quốc (chain Vinmec + đối tác), tiết kiệm 4.5 phút/ca + thêm 1 ca bệnh nhân VIP/ngày/bác sĩ nhờ thời gian rảnh. Tích hợp hoàn toàn vào HIS |
| **Chi phí API (inference)**           | ~$0.05/ca × 450 ca/ngày = $22.5/ngày                                                      | ~$0.05/ca × 2,700 ca/ngày = $135/ngày                                                                                       | ~$0.05/ca × 9,000 ca/ngày = $450/ngày                                                                                                                        |
| **Chi phí hạ tầng**                   | Server nhỏ VPS (1 GPU node): ~$500/tháng                                                  | 3 GPU nodes + load balancer: ~$2,000/tháng                                                                                  | Cloud multi-region + fine-tuning infrastructure: ~$8,000/tháng                                                                                               |
| **Chi phí triển khai & tích hợp HIS** | Minimal — standalone app, không tích hợp HIS: ~$10,000 one-time                           | Tích hợp HIS API semi-automated: ~$50,000 one-time                                                                          | Full HIS integration + mobile app bệnh nhân + fine-tuning: ~$200,000 one-time                                                                                |
| **Benefit — tiết kiệm nhân lực**      | 50 BS × 3 ca × 3 phút = 225 phút/ngày ≈ tiết kiệm 3.75 giờ lao động/ngày (~750k VND/ngày) | 300 BS × 3 ca × 4 phút = 3,600 phút/ngày ≈ 60 giờ/ngày (~12 triệu VND/ngày)                                                 | 1,000 BS × 3 ca × 4.5 phút = 13,500 phút/ngày ≈ 225 giờ/ngày (~45 triệu VND/ngày)                                                                            |
| **Benefit — doanh thu thêm**          | Không tính                                                                                | +1 ca VIP/tuần/BS × 300 BS × 1.5 triệu/ca ≈ +450 triệu VND/tuần                                                             | +2 ca VIP/tuần/BS × 1,000 BS × 1.5 triệu/ca ≈ 3 tỷ VND/tuần                                                                                                  |
| **Benefit — giảm xuất toán BHYT**     | Không tính                                                                                | Giảm 15% xuất toán trên ~200 ca BHYT/ngày × 500k/ca = 15 triệu VND/ngày                                                     | Giảm 20% xuất toán trên 3,000 ca/ngày = 300 triệu VND/ngày                                                                                                   |
| **Net**                               | Dương nhẹ sau 3–6 tháng. Break-even trong năm đầu.                                        | ROI rõ ràng trong tháng thứ 2–3. Payback period < 6 tháng.                                                                  | Game-changing. ROI 10–20x sau năm đầu.                                                                                                                       |


**Kill criteria:**

- Tỉ lệ bác sĩ tắt AI và quay lại gõ tay > 40% sau 30 ngày dùng thử → sản phẩm không giải quyết được pain đủ
- Xảy ra ≥1 sự cố sai lệch y khoa nghiêm trọng có thể truy nguyên từ AI (hallucination không được detect)
- Chi phí inference > benefit tiết kiệm được × 2 trong 3 tháng liên tiếp
- Whisper accuracy < 70% WER trên dataset tiếng Việt thực tế của Vinmec sau tuning

---

## 6. Mini AI Spec (1 trang)

**Tên sản phẩm:** Vinmec Clinical Scribe AI
**Version:** MVP — Hackathon prototype (April 2026)

**Sản phẩm giải quyết việc gì, cho ai?**

Cho **bác sĩ tại phòng khám Vinmec**: Giảm 70–80% thời gian gõ hồ sơ (từ 3–5 phút xuống 30–60 giây/ca). Kết thúc Pajama time. Trả lại ánh mắt và sự thấu cảm cho bệnh nhân trong suốt 15 phút khám.

Cho **bệnh nhân**: Cảm nhận bác sĩ lắng nghe 100%, không bị gián đoạn vì bác sĩ gõ máy. Sau khám nhận hướng dẫn dặn dò rõ ràng (trường `dan_do` từ hồ sơ AI).

Cho **quản trị Vinmec**: Hồ sơ đạt chuẩn SOAP/JCI, mã ICD-10 chính xác bảo vệ doanh thu BHYT. Có correction log đầy đủ để audit và cải thiện model.

**AI làm gì (Augmentation):**

1. **Ghi âm** → Whisper STT (local, GPU MPS/CUDA/CPU) → raw text
2. **Phân vai** → LLM diarization (fallback) hoặc pyannote (nếu có GPU) → transcript có nhãn `doctor`/`patient`
3. **Trích xuất** → Medical Agent (GPT-4o, ReAct pattern, tool calling) → MedicalRecord Pydantic → validate tự động
4. **Review** → Bác sĩ inline-edit, Accept/Decline, Undo/Redo → Correction log
5. **Lưu** → `output/record_{session}_{timestamp}.json` + `correction_log_{session}.json`

**Quality (Precision/Recall trade-off):** Tối ưu Recall — thà ghi thừa để bác sĩ xóa, hơn là bỏ sót thông tin y khoa quan trọng.

**Risk chính:**

- **Diarization nhầm speaker** trong môi trường ồn → bác sĩ không detect → trích xuất sai SOAP
- **Hallucination thuốc/chẩn đoán** → LLM bịa thông tin không có trong hội thoại
- Cả hai được mitigate bằng bắt buộc Human-in-the-loop review trước khi lưu

**Data flywheel:** `correction_log` → analytics → tìm field yếu nhất → cải thiện system prompt hoặc fine-tune → accuracy tăng → review time giảm → bác sĩ dùng nhiều hơn → nhiều correction data hơn → vòng lặp tự cải thiện.

---

## 7. Kiến Trúc Kỹ Thuật (Implementation Chi Tiết)

### 7.1 Sơ đồ tổng thể

```
[Browser — React/TypeScript]
       │  MediaRecorder API (WebM/Opus)
       │  POST /api/transcribe (FormData: audio + patient_id + session_id)
       ▼
[FastAPI Backend — medical_agent/backend/main.py]
       │
       ├─► Lưu audio tạm (tempfile .webm)
       │
       ├─► Whisper STT (openai-whisper, small model)
       │       └── Auto-detect device: MPS (M4 Pro) > CUDA > CPU
       │       └── Trả về: raw_text (str)
       │
       ├─► LLM Diarization (llm_diarization.py)
       │       └── Prompt GPT-4o: gán [DOCTOR]/[PATIENT] theo ngữ cảnh
       │       └── Trả về: turns = [{speaker, text}, ...]
       │
       ├─► Medical Agent (agent/medical_agent.py — ReAct loop)
       │       ├── Pre-fetch patient_info(patient_id) [trực tiếp, không qua LLM]
       │       ├── GPT-4o với structured output (response_format=MedicalRecord)
       │       ├── Tool: lookup_icd_code(diagnosis_text) → ICD-10 code
       │       └── Trả về: MedicalRecord (Pydantic, đã validate)
       │
       └─► Response: {session_id, transcript: [...], medical_record: {...}}

[Browser — hiển thị kết quả]
       │  Review UI: contentEditable, Accept/Decline, Undo/Redo
       │
       │  POST /api/records/save (JSON: session_id + medical_record + corrections)
       ▼
[output/record_{session}_{ts}.json]
[output/correction_log_{session}_{ts}.json]
```

### 7.2 Cấu trúc thư mục thực tế

```
Lab5_C401_D6/
├── frontend/                         # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.tsx                   # UI chính: Live Transcript + SOAP Review
│   │   ├── context/
│   │   │   └── ClinicalScribeContext.tsx  # State: MediaRecorder, API calls, Undo/Redo
│   │   ├── services/
│   │   │   └── api.ts                # transcribeAudio(), saveRecord(), checkHealth()
│   │   ├── types/
│   │   │   └── medicalRecord.ts      # TypeScript interfaces: MedicalRecord, PatientInfo, VisitInfo
│   │   ├── components/ui/            # Badge, Button, Modal, Skeleton, Toast
│   │   └── utils/
│   │       └── reviewTokens.ts       # Parse highlight tokens (??...) trong dan_do
│   └── vite.config.ts                # Proxy /api → localhost:8000
│
└── medical_agent/
    ├── backend/
    │   └── main.py                   # FastAPI: /api/health, /api/transcribe, /api/records/save
    │
    ├── agent/
    │   ├── medical_agent.py          # ReAct loop, run_agent(transcript, patient_id) → MedicalRecord
    │   ├── schemas.py                # Pydantic: MedicalRecord, PatientInfo, VisitInfo, KhamLamSang
    │   └── system_prompt.py          # System prompt tiếng Việt cho Medical Agent
    │
    ├── tools/
    │   ├── get_patient_info.py       # get_patient_info(patient_id) → dict (gọi trực tiếp)
    │   └── lookup_icd_code.py        # lookup_icd_code(diagnosis_text) → ICD-10 code (LLM tool)
    │
    ├── diarization/
    │   ├── diarize.py                # Entry point: chọn phương thức diarization
    │   ├── whisper_diarization.py    # STT + pyannote local pipeline
    │   ├── llm_diarization.py        # LLM-based fallback diarization
    │   └── recorder.py               # CLI recorder: sounddevice → WAV → diarize
    │
    ├── utils/
    │   ├── transcript_parser.py      # Parse raw_transcript.json → formatted string
    │   └── validator.py              # Validate MedicalRecord đủ trường
    │
    ├── input/
    │   └── raw_transcript.json       # Sample input với patient_id metadata
    │
    ├── output/                       # Generated: record_*.json, correction_log_*.json
    ├── config.py                     # API keys, model name, HF_TOKEN
    └── requirements.txt              # Python dependencies
```

### 7.3 Pydantic Output Schema

```python
class PatientInfo(BaseModel):
    ho_ten: Optional[str]         # Họ và tên đầy đủ
    gioi_tinh: Optional[str]      # 'Nam' hoặc 'Nữ'
    ngay_sinh: Optional[str]      # YYYY-MM-DD
    dia_chi: Optional[str]        # Địa chỉ thường trú
    patient_id: Optional[str]     # Mã nội bộ VD 'BN-2026-00001'

class KhamLamSang(BaseModel):
    nhan_xet_chung: Optional[str] # Nhận xét chung
    cam_xuc: Optional[str]        # Trạng thái cảm xúc
    tu_duy: Optional[str]         # Đánh giá tư duy
    tri_giac: Optional[str]       # Đánh giá tri giác / ảo giác
    hanh_vi: Optional[str]        # Nhận xét hành vi

class VisitInfo(BaseModel):
    ngay_kham: Optional[str]         # YYYY-MM-DD
    benh_su: Optional[str]           # Tiền sử bệnh + dị ứng thuốc
    ly_do_kham: Optional[str]        # Lý do đến khám
    trieu_chung: Optional[str]       # Triệu chứng bệnh nhân mô tả
    kham_lam_sang: Optional[KhamLamSang]
    xet_nghiem: Optional[List[str]]  # Danh sách xét nghiệm
    chan_doan: Optional[str]         # Chẩn đoán bằng tiếng Việt
    chan_doan_icd: Optional[str]     # Mã ICD-10
    huong_dieu_tri: Optional[str]    # Phác đồ điều trị
    dan_do: Optional[str]            # Lời dặn dò
    ngay_tai_kham: Optional[str]     # YYYY-MM-DD

class MedicalRecord(BaseModel):
    patient: PatientInfo
    visit: VisitInfo
```

### 7.4 Correction Log Schema

```json
{
  "session_id": "VNM-20260409-001",
  "saved_at": "2026-04-09T10:15:32",
  "corrections": [
    {
      "field": "trieu_chung",
      "action": "accepted",
      "agent_value": "Đau đầu vùng thái dương, mất ngủ 2 tuần",
      "final_value": "Đau đầu vùng thái dương, mất ngủ 2 tuần",
      "latency_ms": 4200
    },
    {
      "field": "chan_doan",
      "action": "edited",
      "agent_value": "Rối loạn lo âu lan toả",
      "final_value": "Rối loạn lo âu lan toả kèm mất ngủ thứ phát",
      "latency_ms": 18500
    },
    {
      "field": "dan_do",
      "action": "declined",
      "agent_value": "sau khi chăn trâu (??)",
      "final_value": "",
      "latency_ms": 3100
    }
  ]
}
```

### 7.5 Tech Stack tóm tắt


| Thành phần                 | Lựa chọn hiện tại                                 | Lý do                                                                 |
| -------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| **LLM**                    | GPT-4o (`gpt-4o-2024-08-06`)                      | Hiểu tiếng Việt tốt, structured output với Pydantic, function calling |
| **STT**                    | OpenAI Whisper (small, local)                     | Chạy local hoàn toàn, tự detect device: CUDA > MPS (Apple Silicon) > CPU, không tốn API cost |
| **Diarization**            | Whisper STT → GPT-4o LLM                          | Luồng duy nhất: STT local + LLM gán nhãn doctor/patient theo ngữ cảnh y khoa |
| **Agent framework**        | OpenAI SDK thuần (ReAct tự viết)                  | Đơn giản, kiểm soát được toàn bộ vòng lặp, không phụ thuộc LangChain  |
| **Structured output**      | `client.beta.chat.completions.parse()` + Pydantic | Type-safe, tự validate, không cần manual JSON parsing                 |
| **Backend**                | FastAPI + Uvicorn                                 | Async, tích hợp multipart upload, tự gen OpenAPI docs                 |
| **Frontend**               | React + TypeScript + Vite + Tailwind CSS          | Modern, fast HMR, type-safe API service layer                         |
| **Audio (browser)**        | MediaRecorder API (WebM/Opus)                     | Native browser API, không cần thư viện ngoài                          |
| **Audio (CLI)**            | sounddevice + soundfile + numpy                   | Python native, hỗ trợ CUDA / MPS / CPU                                |
| **Output**                 | JSON file (local)                                 | Đơn giản cho prototype, migrate sang DB dễ dàng                       |
| **ICD Lookup**             | Dictionary Python local                           | Không cần mạng, nhanh, đủ cho prototype                               |


---

## 8. Hướng Phát Triển Tương Lai (Roadmap Chi Tiết)

### 8.1 Tối ưu toàn diện: STT accuracy, LLM cost, latency và roadmap scale

**Problem hiện tại:** Pipeline Whisper small trên CPU/MPS/CUDA mất 30–90 giây cho audio 15 phút. Ngoài latency, còn 3 vấn đề song song cần giải quyết: (1) STT chưa đủ chính xác với tiếng Việt y khoa và các điều kiện âm thanh thực tế; (2) Chi phí GPT-4o cho mỗi ca còn cao khi scale; (3) Kiến trúc hiện tại chưa sẵn sàng cho hệ thống lớn nhiều bác sĩ đồng thời.

---

#### A. Cải thiện STT — Accuracy trước, tốc độ sau

**Vấn đề cốt lõi:** Whisper small không được fine-tune trên tiếng Việt y khoa — giọng vùng miền, tiếng ồn phòng khám, và thuật ngữ chuyên sâu là 3 nguồn lỗi chính làm SOAP output sai dù LLM tốt.

**Lộ trình:**

1. **Thu thập ground-truth data từ correction log:** Mỗi lần bác sĩ sửa SOAP → suy ngược ra phần transcript nào bị nhận sai → xây dựng dataset `(audio_segment, correct_text)` từ chính dữ liệu thực tế Vinmec.
2. **Fine-tune Whisper medium/large-v3 trên domain y khoa Việt Nam:** Dùng dataset trên + dữ liệu tổng hợp (TTS từ từ điển thuật ngữ Vinmec). Target WER < 10% trên test set nội bộ (hiện baseline ~15–20%).
3. **Thêm medical vocabulary bias:** Whisper hỗ trợ `initial_prompt` — truyền danh sách thuật ngữ vào để boost xác suất nhận đúng tên thuốc, xét nghiệm, chẩn đoán.
4. **Audio pre-processing:** Noise suppression (RNNoise/DeepFilterNet) trước khi đưa vào Whisper — đặc biệt quan trọng với phòng khám ồn và micro USB không chuyên.

**Kết quả kỳ vọng:** WER giảm từ ~15% xuống <8% → field-level recall tăng từ ~75% lên >90%.

---

#### B. Giảm chi phí LLM — Tối ưu theo scale

**Vấn đề:** GPT-4o ~$0.03–0.06/ca. Với 300 bác sĩ × 10 ca/ngày = 3,000 ca → ~$90–180/ngày. Có thể giảm mạnh mà không mất quality.

**Lộ trình:**

1. **Tách diarization ra khỏi GPT-4o:** LLM diarization hiện tốn ~$0.01/ca. Thay bằng model phân loại nhẹ (BERT/PhoBERT fine-tuned) để phân biệt doctor/patient theo ngữ cảnh — chạy local, chi phí ~$0.
2. **Dùng GPT-4o-mini cho Medical Agent:** Fine-tune GPT-4o-mini trên cặp `(transcript, MedicalRecord)` từ correction log. GPT-4o-mini rẻ hơn ~15× so với GPT-4o. Target: accuracy tương đương GPT-4o trên domain Vinmec sau 500+ training samples.
3. **Long-term — LLM local:** Llama-3.1-8B hoặc Qwen-2.5-7B chạy qua vLLM on-premise. Zero API cost, dữ liệu không ra ngoài mạng nội bộ (HIPAA compliance). Cần ~1 GPU A100 cho throughput đủ dùng.
4. **Prompt caching:** Các phần system prompt và patient_info cố định → dùng OpenAI Prompt Caching (giảm 50% cost cho input tokens lặp lại).

**Kết quả kỳ vọng:** Chi phí inference giảm từ $0.05/ca xuống <$0.01/ca khi dùng mini + caching; gần $0 khi chuyển sang LLM local.

---

#### C. Giảm latency — Xử lý song song và streaming

**Vấn đề:** Pipeline hiện tại tuần tự: STT (30–90s) → Diarization (5–10s) → Medical Agent (5–15s) = 45–90s tổng. Cần xuống <15s.

**Lộ trình:**

1. **Streaming STT (ưu tiên cao nhất):** Thay Whisper batch bằng streaming — browser stream audio chunks qua WebSocket, backend transcribe từng chunk và trả về transcript turns ngay lập tức (<1s/câu). Khi bác sĩ bấm "Stop", phần lớn transcript đã xong → Medical Agent chỉ cần chạy thêm 5–10s.
   - **Option nhanh:** Deepgram Nova-2 Streaming API (hỗ trợ tiếng Việt, $0.0043/phút)
   - **Option on-premise:** faster-whisper (CTranslate2) + WebSocket server — nhanh hơn Whisper gốc 4× với cùng model size
2. **Parallel processing:** Diarization và pre-fetch patient_info chạy song song với STT thay vì chờ STT xong.
3. **Medical Agent streaming output:** Dùng `stream=True` để các trường SOAP hiện dần trên UI trong khi LLM vẫn đang generate → bác sĩ bắt đầu review sớm hơn.

**Kết quả kỳ vọng:** Tổng pipeline từ 45–90s xuống **<15s** với streaming STT + parallel processing.

---

#### D. Kiến trúc khi scale lên hệ thống lớn

**Kịch bản:** 1,000+ bác sĩ toàn quốc, nhiều ca đồng thời, tích hợp HIS, yêu cầu uptime 99.9%.

| Thành phần | MVP hiện tại | Hệ thống lớn |
| --- | --- | --- |
| **STT** | Whisper small, single process | faster-whisper cluster + load balancer; hoặc Deepgram Streaming API |
| **Diarization** | GPT-4o LLM call | PhoBERT classifier local (zero cost, <100ms) |
| **LLM** | GPT-4o API | GPT-4o-mini fine-tuned; long-term: vLLM on-premise (Llama/Qwen) |
| **Backend** | FastAPI single instance | Kubernetes + horizontal scaling; message queue (Redis/RabbitMQ) cho audio jobs |
| **Storage** | JSON file local | PostgreSQL + object storage (S3/MinIO) cho audio; FHIR-compliant EHR integration |
| **Monitoring** | Không có | Prometheus + Grafana: latency/ca, WER trend, cost/ca, zero-edit rate theo field |
| **Security** | API key trong .env | Vault secret management, mTLS giữa services, audit log mọi access vào dữ liệu bệnh nhân |
| **Compliance** | Chưa có | BAA với OpenAI hoặc chuyển hoàn toàn on-premise; encrypt at rest + in transit |

---

### 8.2 Tích hợp HIS/EHR Vinmec (High business value)

**Hiện tại:** Output lưu ra file JSON local, không kết nối với hệ thống bệnh viện.

**Roadmap:**

1. **Phase 1 — API Integration:** Kết nối `get_patient_info()` với HIS API thật (HL7 FHIR standard). Tự động lấy bệnh sử, dị ứng thuốc, tiền sử từ DB bệnh viện thay vì mock data.
2. **Phase 2 — Write-back:** Sau khi bác sĩ approve, tự động push record vào HIS qua FHIR `POST /Patient/{id}/Encounter`. Bác sĩ chỉ cần ký điện tử (digital signature).
3. **Phase 3 — Drug interaction check:** Tích hợp với cơ sở dữ liệu tương tác thuốc (MIMS Việt Nam API) — khi agent điền `huong_dieu_tri`, tự động check nếu thuốc kỵ với bệnh nền của bệnh nhân.

---

### 8.3 Cải thiện hệ thống chung từ correction log (Data flywheel)

**Nguyên tắc:** Format bệnh án là chuẩn hóa theo quy định Vinmec/JCI — không cá nhân hóa theo từng bác sĩ. Correction log được dùng để cải thiện chất lượng hệ thống chung, không phải tùy biến output riêng cho từng người dùng.

**Cơ chế học hiện tại:** `correction_log` ghi lại nhưng chưa được dùng để cải thiện model tự động.

**Roadmap:**

1. **Analytics dashboard:** Visualize zero-edit rate, edit rate, decline rate theo từng field. Identify trường nào yếu nhất trên toàn hệ thống.
2. **STT robustness improvement:** Dùng audio và transcript đã được bác sĩ xác nhận làm ground truth để fine-tune hoặc evaluate Whisper trên tiếng Việt y khoa — đặc biệt các điều kiện tiếng ồn phòng khám, giọng vùng miền (Bắc/Trung/Nam).
3. **System prompt improvement:** Phân tích pattern sai lặp lại nhiều nhất theo field (ví dụ: `dan_do` hay bị decline) → cải thiện system prompt chung cho toàn hệ thống.
4. **Fine-tuning hệ thống chung:** Dùng cặp `(agent_value, final_value)` từ toàn bộ correction log làm training data cho DPO (Direct Preference Optimization) → fine-tune model nhỏ hơn (GPT-4o-mini hoặc Llama-3.1-8B) chạy local, cải thiện accuracy cho mọi bác sĩ.
5. **Custom vocabulary chuẩn hóa:** Định nghĩa từ điển thuật ngữ Vinmec — từ viết tắt, cách viết chuẩn — áp dụng đồng nhất cho toàn hệ thống.

---

### 8.4 Giao diện bác sĩ hoàn chỉnh (UI/UX)

**Hiện tại:** UI prototype với contentEditable, Accept/Decline cho trường `dan_do`, Undo/Redo.

**Cần thêm:**

1. **Inline edit transcript:** Cho phép bác sĩ sửa trực tiếp từng turn trong Live Transcript panel → re-run Medical Agent với transcript đã sửa.
2. **Per-field confidence badge:** Hiển thị AI confidence (Low/Medium/High) cho từng trường → bác sĩ biết trường nào cần review kỹ hơn.
3. **Accept-all button:** Với ca đơn giản, bác sĩ có thể "Accept All" với 1 click → chỉ dừng lại ở các trường có confidence thấp.
4. **Voice-to-text correction:** Bác sĩ nói vào mic để sửa trường thay vì gõ → giảm thêm friction.
5. **Keyboard shortcuts:** Tab navigation giữa các trường, Enter để accept, Delete để decline.
6. **Dark mode + Compact mode:** Phù hợp với môi trường phòng khám (màn hình nhỏ, ánh sáng yếu).

---

### 8.5 Bảo mật & Compliance (HIPAA / JCI)

**Rủi ro hiện tại:** Audio bệnh nhân được xử lý qua OpenAI API (cloud) → vi phạm HIPAA nếu không có BAA (Business Associate Agreement).

**Roadmap:**

1. **On-premise deployment:** Chạy toàn bộ pipeline on-premise (Whisper local + LLM local như Llama-3.1-70B via Ollama hoặc vLLM). Không có dữ liệu bệnh nhân nào ra ngoài mạng nội bộ.
2. **Data anonymization:** Trước khi gửi audio/text lên bất kỳ cloud API nào, strip thông tin PII (họ tên, địa chỉ, CCCD) → chỉ gửi nội dung y khoa trung tính.
3. **Audit trail:** Ghi log toàn bộ action của bác sĩ với timestamp và user ID → đáp ứng yêu cầu audit JCI.
4. **RBAC:** Phân quyền truy cập — bác sĩ chỉ xem hồ sơ ca của mình, quản lý khoa xem toàn khoa.
5. **Encryption at rest:** Audio temp files và correction log được encrypt AES-256 trước khi lưu.

---

### 8.6 Mở rộng sang chuyên khoa khác

**Hiện tại:** Schema và system prompt thiên về nội khoa tổng quát.

**Roadmap per-specialty:**


| Chuyên khoa      | Trường đặc thù cần thêm                                            | Complexity |
| ---------------- | ------------------------------------------------------------------ | ---------- |
| **Sản phụ khoa** | `tuan_thai`, `so_lan_sinh`, `tien_su_san_khoa`, `ket_qua_sieu_am`  | Cao        |
| **Nhi khoa**     | `can_nang_chieu_cao`, `tiem_chung`, `phat_trien_tam_than_van_dong` | Trung bình |
| **Tâm thần**     | `thang_diem_PHQ9`, `thang_diem_GAD7`, `tien_su_tam_than_gia_dinh`  | Cao        |
| **Cấp cứu**      | `gio_nhap_vien`, `Glasgow_score`, `FAST_score`, `vital_signs`      | Cao        |
| **Răng hàm mặt** | `rang_bieu_do`, `ma_rang_FDI`, `vat_lieu_phuc_hoi`                 | Trung bình |


Mỗi specialty cần schema riêng (Pydantic model) + system prompt chuyên biệt + validation rules riêng.

---

### 8.7 Analytics & Reporting cho Ban Giám Đốc

**Hiện tại:** Correction log lưu JSON, chưa có dashboard.

**Roadmap:**

1. **Per-field accuracy dashboard:** Biểu đồ zero-edit rate, edit rate, decline rate theo field và theo thời gian → tìm trend cải thiện hoặc xấu đi.
2. **Per-doctor analytics:** Thời gian review trung bình, field nào hay phải sửa nhất, so sánh giữa các bác sĩ.
3. **ROI report:** Tổng thời gian tiết kiệm (giờ/ngày), so sánh với baseline gõ tay, quy đổi ra VND.
4. **Quality audit:** Tỉ lệ hồ sơ đạt chuẩn SOAP đầy đủ (không có trường null quan trọng) vs trước khi dùng AI.