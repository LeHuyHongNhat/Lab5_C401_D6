# Kế Hoạch Thực Hiện UX/UI - Vinmec AI Clinical Scribe

Dựa trên Mock Prototype, dưới đây là kế hoạch thiết kế và tối ưu trải nghiệm UX/UI dành riêng cho người dùng là **Bác sĩ**, đặc biệt tập trung vào các chiến lược xử lý tương tác giữa Người và Trí tuệ nhân tạo (Human-AI Interaction).

## 1. Mục Tiêu Trải Nghiệm Người Dùng (UX Goals)
- **Tối giản thao tác:** Bác sĩ không phải học cách dùng phần mềm phức tạp.
- **Minh bạch (Transparency):** Bác sĩ luôn biết AI đang làm gì, nguồn gốc thông tin từ đâu.
- **Kiểm soát (Control):** Bác sĩ là người có quyền quyết định cuối cùng, dễ dàng chỉnh sửa hoặc từ chối kết quả của AI.
- **Giảm tải nhận thức (Cognitive Unburdening):** Tự động điền và format sẵn theo chuẩn SOAP, chỉ yêu cầu bác sĩ review.

---

## 2. Kịch Bản Tương Tác với AI (AI Interaction Scenarios)

### 2.1. Khi AI Xử Lý Chậm (Model Latency / Delay)
**Vấn đề:** Model Speech-to-Text và LLM cần thời gian để generate text (thường từ vài giây đến hơn 10 giây). Bác sĩ có thể tưởng hệ thống bị treo.
**Giải pháp UX/UI:**
- **Skeleton Loading & Skeleton Text:** Thay vì một vòng tròn xoay (spinner) nhàm chán, hiển thị các dòng text giả đang nhấp nháy (Shimmer effect) ở các trường SOAP.
- **Micro-copy thông báo trạng thái:** Trạng thái chuyển đổi rõ ràng:
  - *"Đang ghi âm..."* kèm sóng âm (audio visualizer).
  - *"Đang xử lý âm thanh..."*
  - *"AI đang trích xuất thông tin bệnh án..."*
- **Streaming Output (Tuỳ chọn):** Trả kết quả về theo từng chữ (như ChatGPT) thay vì chờ load toàn bộ để tạo cảm giác hệ thống đang hoạt động liên tục.

### 2.2. Khi AI Đúng (High Confidence & Correct)
**Vấn đề:** Làm sao để bác sĩ lướt qua nhanh mà vẫn yên tâm ký duyệt?
**Giải pháp UX/UI:**
- **Highlight từ khóa y khoa:** Các triệu chứng ("đau đầu", "39 độ C"), thuốc, chẩn đoán được bôi đậm tự động để bác sĩ đọc lướt (skimming) dễ dàng.
- **Giao diện Review nhanh:** Các trường thông tin S-O-A-P được phân cụm rõ ràng.
- **1-Click Save:** Nút "Lưu Bệnh Án" nổi bật ở cuối, khi lưu thành công sẽ hiển thị **Toast Message (thông báo nhỏ góc màn hình, tự tắt sau 5s)** để không làm gián đoạn luồng làm việc.

### 2.3. Khi AI Không Chắc Chắn (Low Confidence / Ambiguous)
**Vấn đề:** AI nghe không rõ (do tạp âm, bệnh nhân nói giọng địa phương) hoặc thông tin y khoa mâu thuẫn.
**Giải pháp UX/UI:**
- **Cảnh báo độ tin cậy trực quan:**
  - Chữ bị nghi ngờ nghe sai sẽ được gạch chân bằng nét đứt chóp màu vàng / cam (với tooltip: *"AI không chắc chắn, vui lòng kiểm tra lại"*).
  - Khuyến nghị thẻ (Tag): AI có thể chèn 1 thẻ `[Cần xác nhận]` kế bên phần thông tin thiếu (ví dụ: *"Bệnh nhân khai đau bụng nhưng chưa rõ vị trí [Cần xác nhận]"*).
- **So sánh với hội thoại gốc:** Cung cấp tính năng "Click vào text SOAP -> bôi đậm đoạn Transcript tương ứng" để bác sĩ đối chiếu dễ dàng xem AI lấy thông tin đó từ câu nào.

### 2.4. Khi AI Sai (Hallucination / Incorrect Errors)
**Vấn đề:** Tránh rủi ro y khoa khi AI "tưởng tượng" ra triệu chứng hoặc thuốc. Bác sĩ cần sửa lỗi siêu nhanh.
**Giải pháp UX/UI:**
- **Direct Inline Editing (Click để sửa trực tiếp):** Nhấp chuột trực tiếp vào bất kỳ chỗ nào trong form SOAP để gõ lại, không cần mở qua tab hay popup phức tạp (như đã demo trong prototype).
- **Undo/Redo:** Nếu bác sĩ lỡ tay xóa nhầm, có nút hoàn tác lập tức.
- **Fallback Form:** Có nút "Hủy kết quả AI" và một nút "Xóa trắng form" kèm **Confirm Dialog** để bác sĩ có thể tự gõ từ đầu hoặc dùng template văn bản cũ nếu AI làm quá tệ.
- **Feedback Loop (Học phản hồi):** Khi bác sĩ sửa đoạn chữ từ "A" thành "B", hệ thống ngầm ghi nhận (Log) để finetune model sau này.

---

## 3. Kiến Trúc Màn Hình (Screen Layout)

*Bố cục ưu tiên trên Figma:*
1. **Header:** Title bệnh nhân (Nguyễn Văn A, 45 tuổi, Mã BA) & Trạng thái kết nối.
2. **Left Panel (30% width):** 
   - Box Ghi âm (Nút Record to/đỏ).
   - Real-time Transcript (Đoạn đối thoại Bác sĩ - Bệnh nhân hiển thị kiểu chat).
3. **Right Panel (70% width):** 
   - Form SOAP được tự điền.
   - Mỗi section có tiêu đề rõ ràng (Subjective, Objective,...).
   - Khu vực chỉnh sửa trực tiếp.
4. **Footer:** Action buttons (Hủy, Lưu bệnh án). Toast Notification nằm ở góc trên cùng hoặc dưới cùng bên phải.

## 4. Các Bước Triển Khai Tiếp Theo
1. Lên Wireframe/Figma dựa trên kịch bản layout ở trên.
2. Tạo các component Design System (Button, Toast, Input, Skeleton, Tooltip).
3. Đánh giá Usability Test với một bác sĩ hoặc người đóng vai bác sĩ, yêu cầu họ sửa một form AI làm sai.
4. Điều chỉnh độ trễ (Mocking delay) trong prototype để test cảm giác của người dùng.

---

## 5. Hướng Dẫn UI & Nhận Diện Thương Hiệu (Vinmec UI Guidelines)

Dựa trên thiết kế Mock Prototype hiện tại và chuẩn nhận diện thương hiệu của Vinmec, hệ thống UI cần tuân thủ các quy tắc sau để mang lại cảm giác thân thuộc, tin cậy cho bác sĩ:

### 5.1. Bảng Màu (Color Palette)
Hệ thống màu sắc cần bám sát hình ảnh chuyên nghiệp, y tế của Vinmec:
- **Primary Brand (Màu chủ đạo):** Xanh dương đậm đặc trưng (`bg-blue-900`, `text-white` cho Header Bar, Navigation).
- **Primary Actions (Thao tác chính):** Xanh nước biển sáng hơn cho nút bấm chức năng như *Xác nhận & Lưu EHR* (`bg-blue-600` hover `bg-blue-700`).
- **Accent/Alert (Cảnh báo & Ghi âm):** Màu đỏ truyền thống của logo chữ V (`text-red-600`), kết hợp các sắc độ đỏ khác (`bg-red-500`, `bg-red-100`) cho nút ghi âm hoặc các thao tác nguy hiểm tiềm ẩn (Hủy bệnh án).
- **Warning/AI Doubt (Cảnh báo AI không chắc chắn):** Màu vàng (`bg-yellow-400`, chữ `yellow-900`) hoặc highlight vàng nhạt (`bg-[#fef08a]`) kết hợp viền gạch đứt, giúp bác sĩ lập tức chú ý đến các đoạn text AI có độ tự tin thấp cần review.
- **Backgrounds (Màu nền):** Sử dụng xám nhạt (`bg-gray-50`) và nền trắng (`bg-white`) tạo sự tương phản nhẹ nhàng. Giúp phân vùng rõ ràng luồng mắt giữa Transcript bên trái và Form SOAP thực tế bên phải, chống mỏi mắt.

### 5.2. Typography & Layout
- **Font & Kích thước chữ:** Sử dụng font Sans-serif chân phương, dễ đọc. Kích thước text ưu tiên rõ ràng, đặc biệt vùng điền text SOAP (từ `14px` trở lên, Line height thoáng `space-y-3` hoặc `space-y-4`).
- **Sectioning (Phân mảnh):** Các mục S - O - A - P cần được bao bọc trong các viền nhẹ (`border-gray-100` / `border-blue-100`) và nhãn phân biệt, giúp bác sĩ dễ đọc lướt (skimming) cực nhanh. Điểm nào có bất thường bôi đỏ.

### 5.3. Icon & Vi Tương Tác (Micro-interactions)
- **Trạng thái đang thu âm:** Ký hiệu chớp đỏ (`blink animation`) hoặc vòng sóng âm lan toả báo hiệu hệ thống ghi âm đang liên tục hoạt động.
- **Tương tác sửa lỗi AI:** Hover chuột vào đoạn chữ AI cảnh báo, màu nền đổi sắc (`hover:bg-[#fde047]`) và con trỏ thành dạng tương tác (`cursor-pointer`) báo hiệu có thể click vào để sửa lỗi tức thì. Thêm nhãn Tag "AI Generated" góc phải để bác sĩ luôn ý thức về nguồn gốc nội dung định chuẩn y khoa.