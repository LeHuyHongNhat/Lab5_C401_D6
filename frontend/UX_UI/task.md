# UX/UI Setup & Implementation Tasks (React)

Bảng theo dõi các công việc cần thiết để thiết kế và lập trình giao diện UX/UI bằng **React** (kết hợp Tailwind CSS) cho dự án Vinmec AI Clinical Scribe, dựa trên bản Mock Prototype và UX/UI Plan.

## Giai đoạn 1: Khởi tạo và Cấu hình Hệ thống Design (Design System Setup)
- [x] Khởi tạo project React (khuyến nghị dùng Vite + TypeScript để xử lý chặt chẽ logic UI).
- [x] Cài đặt và cấu hình **Tailwind CSS**.
- [x] Thiết lập bảng màu Vinmec trong `tailwind.config.js` (Primary: `blue-900`, Actions: `blue-600`, Alert: `red-600`, Warning: `yellow-400`).
- [x] Cấu hình font chữ mặc định chuẩn y tế (Sans-serif, dễ đọc, clean).
- [x] Thiết lập thư viện icon (ví dụ: `lucide-react` hoặc `heroicons` cho các icon báo cáo, mic ghi âm, lưu).

## Giai đoạn 2: Xây dựng Component Cơ bản (Base UI Components)
- [x] **Button Component:** Hỗ trợ các variants (Primary, Secondary, Danger, Ghost) và states (Loading, Disabled).
- [x] **Skeleton Component (Shimmer):** Hiệu ứng sáng loá dùng cho trạng thái chờ AI sinh text (`Model Latency`).
- [x] **Toast Notification:** Hệ thống thông báo tự động ẩn sau 5s (dùng cho thông báo "Lưu bệnh án thành công").
- [x] **Modal / Dialog Component:** Dùng cho Confirm Hủy/Xóa form.
- [x] **Badge / Tag Component:** Hiển thị nhãn "AI Generated" hoặc "[Cần xác nhận]".
- [x] **Tooltip Component:** Hiển thị trên các text AI nghi ngờ sai.

## Giai đoạn 3: Phân chia Layout (Layout Architecture)
- [x] Xây dựng **Header Bar:** Hiển thị thông tin bệnh nhân, bác sĩ, logo Vinmec.
- [x] Xây dựng **Split Layout:** 
  - [x] **Left Panel (Transcript):** Cột danh sách hội thoại chiếm 30%.
  - [x] **Right Panel (SOAP):** Cột điền form bệnh án chiếm 70%.
- [x] Xây dựng **Footer / Action Bar:** Nơi chứa các nút Hành động chính (Ghi âm, Hủy, Lưu).

## Giai đoạn 4: Tính năng Tương tác (Human-AI Interaction Features)
- [x] **Khối Ghi Âm (Recording UI):**
  - [x] Nút Record với hiệu ứng nháy đỏ (`blink`) khi đang thu âm.
  - [x] Đoạn chat Transcript tự động cuộn (auto-scroll) xuống dưới cùng.
- [x] **Khối SOAP (AI Output):**
  - [x] Bọc từng vùng S-O-A-P vào các Container Card có viền rõ ràng.
  - [x] Tích hợp tính năng **Inline Editing**: bọc text vào `<span contentEditable={true}>` hoặc component tương đương trong React để bác sĩ tự do sửa.
- [x] **Chỉ báo Độ Tin Cậy (Confidence UI):**
  - [x] Component hóa các từ khóa bị AI nghi ngờ: Highlight vàng / gạch chân đứt nét.
  - [x] Xử lý sự kiện `onClick` hoặc `onHover` vào từ bị bôi vàng để đổi từ hoặc gạch bỏ.
- [x] **Mô phỏng Latency:**
  - [x] Bật/tắt trạng thái UI `Processing/Loading` khi bấm kết thúc ghi âm.
  - [x] Render ra text SOAP sau thời gian delay (setTimeout để test UX).

## Giai đoạn 5: Tối ưu Trải nghiệm (Polishing & UX refinement)
- [x] Thêm animation chuyển cảnh mềm mại (ví dụ thư viện `framer-motion` hoặc transition của Tailwind) khi mở/đóng Modal, hiển thị Toast.
- [x] Xử lý quản lý State: Dùng React Context hoặc thư viện (Zustand/Redux) để quản lý luồng dữ liệu giữa Transcript và kết quả Form SOAP.
- [x] **Usability Check:**
  - [x] Đảm bảo Contrast (Độ tương phản) của text đạt chuẩn, bác sĩ dễ đọc lướt.
  - [x] Test thao tác undo/redo khi sửa nhầm văn bản trong React.
  - [x] Tối ưu hóa phím tắt (Keyboard shortcuts - ví dụ Ctrl+S để lưu bệnh án).

## Giai đoạn 6: Kết nối Backend với Frontend (Integration Requirements)

> Trạng thái hiện tại sau khi pull nhánh `nhat`: backend trong `medical_agent/` đang có các module `tools/` và `utils/`, **chưa có API server entrypoint** (`main.py`/`app.py`) và chưa có `config.py` ở root. Vì vậy cần hoàn thành các yêu cầu sau để kết nối được với React UI.

### 6.1 API Contract bắt buộc (Backend)
- [ ] Tạo service backend (khuyến nghị FastAPI) với các endpoint tối thiểu:
  - [ ] `GET /health` → kiểm tra service sống.
  - [ ] `POST /api/transcript/parse` → nhận `raw_transcript.json` hoặc payload `turns[]`, trả transcript đã chuẩn hóa từ `parse_transcript`.
  - [ ] `GET /api/patients/{patient_id}` → bọc logic từ `get_patient_info` (ưu tiên API thật, fallback mock).
  - [ ] `POST /api/icd/lookup` → nhận `diagnosis_text`, trả mã ICD từ `lookup_icd_code`.
  - [ ] `POST /api/record/validate` → nhận record và trả `{is_valid, missing_fields}` từ `validate_record`.

### 6.2 Cấu hình môi trường & bảo mật
- [ ] Tạo `config.py` hoặc `settings.py` để chứa biến môi trường backend (đặc biệt `PATIENT_API_BASE_URL`).
- [ ] Tạo `.env.example` cho backend (không commit secret thật).
- [ ] Chuẩn hóa timeout khi gọi API ngoài (đang dùng 5s trong `get_patient_info`) và trả lỗi thân thiện cho frontend.

### 6.3 Yêu cầu từ phía Frontend (React)
- [ ] Tạo `frontend/.env.example` với `VITE_API_BASE_URL=http://localhost:<backend-port>`.
- [ ] Viết module API client tập trung (`frontend/src/services/api.ts`) dùng `fetch`/`axios` để gọi backend.
- [ ] Tạo TypeScript types cho response backend:
  - [ ] `PatientInfoResponse`
  - [ ] `IcdLookupResponse`
  - [ ] `RecordValidationResponse`
- [ ] Ánh xạ response vào UI state cho các path AI: đúng / sai / không chắc / lỗi latency.

### 6.4 CORS, network và lỗi tích hợp
- [ ] Bật CORS backend cho origin frontend local (ví dụ `http://localhost:5173`).
- [ ] Quy định format lỗi thống nhất: `{error_code, message, details?}` để frontend hiển thị toast rõ ràng.
- [ ] Xử lý các kịch bản timeout/network trong UI:
  - [ ] Retry có giới hạn cho request quan trọng (1–2 lần).
  - [ ] Hiển thị skeleton/loading khi chờ.
  - [ ] Fallback về mode chỉnh tay nếu backend fail.

### 6.5 Kiểm thử kết nối end-to-end
- [ ] Viết test nhanh backend cho các endpoint chính (`health`, `icd lookup`, `validate`).
- [ ] Viết test frontend cho API integration state (loading / success / error).
- [ ] Chạy thử luồng E2E tối thiểu:
  1) Upload transcript → 2) Parse → 3) Lookup ICD → 4) Validate record → 5) Hiển thị và cho bác sĩ sửa inline.

### 6.6 Definition of Done (DoD) cho integration
- [ ] Frontend gọi được backend bằng `VITE_API_BASE_URL` không hardcode URL.
- [ ] Tất cả endpoint chính trả dữ liệu đúng schema đã thống nhất.
- [ ] Lỗi CORS, timeout, 4xx/5xx đều có UX xử lý rõ ràng.
- [ ] Demo được flow tối thiểu trong buổi review nhóm (backend + frontend chạy đồng thời).