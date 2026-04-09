# Kế hoạch: Chuyển hội thoại bác sĩ – bệnh nhân thành hồ sơ y tế có cấu trúc

---

## 1. Định dạng đầu vào (Input Format)

**Câu hỏi gốc:** Nên giữ `.txt` hay chuyển sang định dạng có cấu trúc hơn cho output của speech-to-text?

**Đề xuất:** Dùng **JSON có speaker diarization** thay vì `.txt` thuần.

Lý do: LLM xử lý tốt hơn khi biết ai đang nói (bác sĩ hay bệnh nhân). File `.txt` không phân biệt được lượt thoại → agent dễ nhầm lẫn khi trích xuất.

**Định dạng đầu vào khuyến nghị — `raw_transcript.json`:**
```json
{
  "session_id": "VNM-20260409-001",
  "recorded_at": "2026-04-09T09:30:00",
  "turns": [
    { "speaker": "doctor",  "text": "Anh tên gì, năm nay bao nhiêu tuổi?" },
    { "speaker": "patient", "text": "Dạ tôi tên Nguyễn Văn A, sinh năm 1990." },
    { "speaker": "doctor",  "text": "Anh đến vì lý do gì hôm nay?" },
    { "speaker": "patient", "text": "Dạ tôi bị đau đầu và mất ngủ khoảng 2 tuần nay." }
  ]
}
```

> Nếu mô hình speech-to-text chưa hỗ trợ diarization, có thể giữ `.txt` và thêm bước tiền xử lý bằng regex hoặc LLM để gán nhãn speaker trước khi đưa vào agent.

### 1.1 Các mô hình Diarization chạy Local

| Mô hình | Chạy local | Chi phí | Tiếng Việt | Ghi chú |
|---|---|---|---|---|
| **pyannote/speaker-diarization-3.1** | Có (GPU/CPU) | Miễn phí (cần HuggingFace token) | Tốt | Phổ biến nhất, kết hợp tốt với Whisper |
| **NVIDIA NeMo** | Có (GPU) | Miễn phí | Tốt | Nặng hơn, phù hợp server có GPU mạnh |
| **Simple Diarizer** | Có (CPU) | Miễn phí | Trung bình | Nhẹ, phù hợp máy yếu, độ chính xác thấp hơn |
| **AssemblyAI / Deepgram** | Không (cloud API) | Trả phí (~$0.003–0.01/phút) | Khá tốt | Nhanh, dễ tích hợp nhưng phát sinh chi phí |

**Khuyến nghị theo tình huống:**

- **Có GPU** → Dùng `pyannote/speaker-diarization-3.1` kết hợp với `whisper-diarization` pipeline. Chạy local hoàn toàn, miễn phí, chất lượng tốt.
- **Chỉ có CPU / máy yếu** → Dùng `Simple Diarizer`, chấp nhận độ chính xác thấp hơn.
- **Không muốn cài đặt / demo nhanh** → Dùng AssemblyAI API (có free tier 100 giờ/tháng).

### 1.2 Fallback: Dùng LLM để phân vai nếu không có Diarization

Nếu không thể chạy mô hình diarization, đưa raw `.txt` vào LLM với prompt sau để phân vai trước khi trích xuất:

```
Đây là đoạn hội thoại giữa bác sĩ và bệnh nhân được chuyển từ âm thanh sang văn bản.
Hãy phân tích ngữ cảnh và gán nhãn [DOCTOR] hoặc [PATIENT] cho từng câu.

Quy tắc gán nhãn:
- [DOCTOR]: hỏi bệnh, chẩn đoán, chỉ định xét nghiệm, kê đơn, dặn dò
- [PATIENT]: mô tả triệu chứng, trả lời câu hỏi, kể bệnh sử

Chỉ trả về văn bản đã gán nhãn, không giải thích thêm.

---
{raw_text}
```

Kết quả sau bước này sẽ được parse thành định dạng JSON như mục 1 trước khi đưa vào Medical Agent.

---

## 2. Kiến trúc Agent

**Đề xuất kiến trúc: Single Agent với Tool Calling (ReAct pattern)**

```
raw_transcript.json
        │
        ▼
┌─────────────────────┐
│   Orchestrator      │  ← Điều phối luồng xử lý
└────────┬────────────┘
         │ gọi
         ▼
┌─────────────────────┐       ┌──────────────────────────┐
│  Medical Agent      │──────▶│  Tool: get_patient_info  │ ← Gọi API DB bằng CCCD
│  (LLM + Sys Prompt) │       └──────────────────────────┘
│                     │       ┌──────────────────────────┐
│                     │──────▶│  Tool: lookup_icd_code   │ ← Tra cứu mã ICD-10
└─────────────────────┘       └──────────────────────────┘
         │
         ▼
  structured_record.json  →  PDF / Giao diện bác sĩ xác nhận
```

**Lý do chọn Single Agent + Tool Calling thay vì Multi-Agent:**
- Bài toán có luồng tuyến tính rõ ràng (đọc → tra DB → trích xuất → xuất)
- Multi-agent chỉ nên dùng khi cần song song hoá hoặc các sub-task độc lập nhau
- Giảm độ phức tạp, dễ debug hơn cho giai đoạn đầu

---

## 3. Câu hỏi: Nên dùng Tool API hay script đơn giản để lấy bệnh sử?

**Đề xuất: Dùng Tool (function calling) trong agent.**

| Tiêu chí | Script thuần | Tool trong Agent |
|---|---|---|
| Tích hợp với agent | Thủ công, phải truyền tay | Tự động, agent tự quyết định khi nào gọi |
| Mở rộng sau này | Khó | Dễ — thêm tool mới không ảnh hưởng luồng cũ |
| Kiểm soát lỗi | Phải xử lý ngoài | Xử lý trong vòng lặp ReAct của agent |

**Luồng cụ thể:**
1. Agent đọc transcript → phát hiện số CCCD (hoặc tên + ngày sinh)
2. Agent tự gọi tool `get_patient_info(cccd="...")`
3. Tool gọi REST API: `GET /api/patients/{cccd}`
4. Kết quả trả về được agent tích hợp vào trường `Bệnh sử`

---

## 4. Output — Hồ sơ y tế có cấu trúc

**Định dạng đầu ra — `structured_record.json`:**
```json
{
  "patient": {
    "ho_ten": "Nguyễn Văn A",
    "gioi_tinh": "Nam",
    "ngay_sinh": "1990-05-12",
    "dia_chi": "123 Nguyễn Trãi, Q.1, TP.HCM",
    "cccd": "079090012345"
  },
  "visit": {
    "ngay_kham": "2026-04-09",
    "benh_su": "Tiền sử tăng huyết áp độ 1 (2024). Không dị ứng thuốc.",
    "ly_do_kham": "Đau đầu, mất ngủ kéo dài 2 tuần",
    "trieu_chung": "Đau đầu vùng thái dương, mất ngủ, lo âu nhẹ",
    "kham_lam_sang": {
      "nhan_xet_chung": "Bệnh nhân tỉnh táo, tiếp xúc tốt",
      "cam_xuc": "Lo âu nhẹ",
      "tu_duy": "Mạch lạc, không có ý tưởng bất thường",
      "tri_giac": "Không ảo giác",
      "hanh_vi": "Hợp tác"
    },
    "xet_nghiem": ["Công thức máu", "Điện giải đồ", "Siêu âm bụng tổng quát"],
    "chan_doan": "Rối loạn lo âu lan toả",
    "chan_doan_icd": "F41.1",
    "huong_dieu_tri": "Kết hợp liệu pháp tâm lý + thuốc chống lo âu nhóm SSRI",
    "dan_do": "Tránh căng thẳng, ngủ đúng giờ, hạn chế caffeine",
    "ngay_tai_kham": "2026-04-23"
  }
}
```

---

## 5. Cấu trúc code chi tiết

```
project/
├── main.py                    # Entry point: chạy toàn bộ pipeline
├── config.py                  # API keys, endpoint URL, model name
│
├── input/
│   └── raw_transcript.json    # Input từ speech-to-text
│
├── agent/
│   ├── medical_agent.py       # Khởi tạo agent, gắn tools, chạy vòng lặp ReAct
│   └── system_prompt.py       # System prompt chuyên về y tế
│
├── tools/
│   ├── get_patient_info.py    # Tool gọi API lấy thông tin bệnh nhân qua CCCD
│   └── lookup_icd_code.py     # Tool tra mã ICD-10 từ chẩn đoán văn bản
│
├── output/
│   └── structured_record.json # Output cuối cùng
│
└── utils/
    ├── transcript_parser.py   # Parse JSON transcript thành chuỗi cho LLM
    └── validator.py           # Kiểm tra output có đủ trường không
```

### Mô tả các hàm chính

| File | Hàm | Input | Output |
|---|---|---|---|
| `transcript_parser.py` | `parse_transcript(path)` | Đường dẫn file JSON | Chuỗi hội thoại có nhãn speaker |
| `get_patient_info.py` | `get_patient_info(cccd)` | Số CCCD (string) | Dict thông tin bệnh nhân |
| `lookup_icd_code.py` | `lookup_icd(diagnosis_text)` | Chẩn đoán văn bản | Mã ICD-10 (string) |
| `medical_agent.py` | `run_agent(transcript)` | Chuỗi hội thoại | Dict hồ sơ y tế có cấu trúc |
| `validator.py` | `validate_record(record)` | Dict hồ sơ | `True/False` + danh sách trường còn thiếu |
| `main.py` | `main()` | — | Ghi file `structured_record.json` |

---

## 6. System Prompt cho Medical Agent

```
Bạn là trợ lý y tế chuyên nghiệp, hỗ trợ bác sĩ tổng hợp hồ sơ bệnh án.

Nhiệm vụ: Dựa trên hội thoại giữa bác sĩ và bệnh nhân, trích xuất thông tin 
vào đúng các trường JSON được chỉ định.

Quy tắc bắt buộc:
- Chỉ ghi thông tin có trong hội thoại. Nếu không có, để giá trị là null.
- Không suy diễn hoặc bịa đặt bất kỳ thông tin y tế nào.
- Nếu cần thông tin bệnh sử, gọi tool get_patient_info với số CCCD từ hội thoại.
- Mã ICD-10 phải tra qua tool lookup_icd, không tự đặt.
- Ngôn ngữ đầu ra: Tiếng Việt, thuật ngữ y khoa chuẩn.
```

---

## 7. Giao diện xác nhận của bác sĩ & Correction Logging

### 7.1 Luồng xác nhận

Sau khi agent điền dữ liệu vào các trường, bác sĩ **không nhận output thô** mà xem qua giao diện review trước khi lưu chính thức:

```
Agent output (JSON)
        │
        ▼
┌─────────────────────────────────────────┐
│         Giao diện Review (UI)           │
│                                         │
│  Triệu chứng: [đau đầu, mất ngủ...]    │
│               [✏ Sửa] [✓ Accept] [✗ Decline] │
│                                         │
│  Chẩn đoán:   [Rối loạn lo âu F41.1]  │
│               [✏ Sửa] [✓ Accept] [✗ Decline] │
└─────────────────────────────────────────┘
        │
        ▼ (sau khi bác sĩ xác nhận toàn bộ)
  Lưu hồ sơ chính thức + Ghi correction_log
```

### 7.2 Các trạng thái của từng trường

| Trạng thái | Ý nghĩa | Hành động UI |
|---|---|---|
| `pending` | Agent đã điền, chờ bác sĩ xem | Hiển thị ghost-text (màu xám nhạt) |
| `accepted` | Bác sĩ chấp nhận giá trị agent đề xuất | Click ✓ Accept |
| `edited` | Bác sĩ sửa rồi lưu | Click ✏, sửa text, click Save |
| `declined` | Bác sĩ từ chối, để trống hoặc nhập lại | Click ✗ Decline → trường trở về rỗng |

### 7.3 Schema Correction Log

Mỗi action của bác sĩ đều được ghi vào `correction_log` để đánh giá chất lượng agent sau này:

```json
{
  "session_id": "VNM-20260409-001",
  "doctor_id": "BS-NGUYEN-VAN-B",
  "reviewed_at": "2026-04-09T10:15:32",
  "corrections": [
    {
      "field": "trieu_chung",
      "action": "accepted",
      "agent_value": "Đau đầu vùng thái dương, mất ngủ, lo âu nhẹ",
      "final_value": "Đau đầu vùng thái dương, mất ngủ, lo âu nhẹ",
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
      "field": "chan_doan_icd",
      "action": "declined",
      "agent_value": "F41.1",
      "final_value": "F41.1 + G47.0",
      "latency_ms": 9100
    }
  ]
}
```

### 7.4 Dùng Correction Log để làm gì?

| Mục tiêu | Cách dùng |
|---|---|
| **Đo accuracy của agent** | Tỉ lệ `accepted` / tổng số trường → accuracy per field |
| **Tìm trường yếu nhất** | Field nào có tỉ lệ `edited` + `declined` cao nhất → cần cải thiện prompt |
| **Tính ROI thời gian** | So sánh `latency_ms` bác sĩ review vs thời gian viết tay ước tính |
| **Fine-tune model** | `(agent_value, final_value)` cặp dữ liệu → dùng làm training data DPO/RLHF |
| **Audit trail y tế** | Truy vết ai đã sửa gì, khi nào — đáp ứng yêu cầu pháp lý hồ sơ bệnh viện |

### 7.5 Bổ sung vào cấu trúc code

```
project/
├── ...
├── ui/
│   ├── review_interface.py    # Logic render form review từng trường
│   └── action_handler.py      # Xử lý sự kiện accept / decline / edit từ UI
│
└── logging/
    ├── correction_logger.py   # Ghi correction_log.json sau mỗi session
    └── analytics.py           # Tính accuracy, tỉ lệ chỉnh sửa theo field
```

| File | Hàm | Input | Output |
|---|---|---|---|
| `correction_logger.py` | `log_correction(session_id, field, action, agent_val, final_val)` | Thông tin action | Append vào `correction_log.json` |
| `analytics.py` | `compute_accuracy(log_path)` | Đường dẫn log | Dict accuracy theo từng trường |
| `action_handler.py` | `handle_action(field, action, new_value)` | Tên trường + action | Cập nhật record + gọi logger |

---

## 8. Tech Stack đề xuất

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| LLM | GPT-4o hoặc Gemini 1.5 Pro | Hiểu tiếng Việt tốt, hỗ trợ function calling |
| Framework Agent | LangChain hoặc OpenAI Assistants API | Tool calling có sẵn, dễ tích hợp |
| Diarization (local) | pyannote/speaker-diarization-3.1 | Miễn phí, chạy local, tích hợp tốt với Whisper |
| Diarization (fallback) | LLM prompt phân vai | Không cần cài thêm, dùng khi không có GPU |
| Database API | REST API (FastAPI mock) | Đơn giản, dễ test với dữ liệu giả |
| ICD Lookup | WHO ICD API hoặc file JSON local | Phiên bản local nhanh hơn, không cần mạng |
| UI Review | React + Tailwind CSS | Render form từng trường với nút Accept/Edit/Decline |
| Correction Log | JSON file hoặc SQLite | Lưu toàn bộ action của bác sĩ để phân tích sau |
| Analytics | Python script (Pandas) | Tính accuracy, tìm trường yếu nhất |
| Output | JSON → PDF (WeasyPrint) | Bác sĩ có thể in / lưu trữ |
