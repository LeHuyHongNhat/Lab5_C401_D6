# Kịch bản Demo: Hệ thống Clinical Scribe (AI tạo hồ sơ bệnh án)

**Tổng thời gian trình bày:** 5 phút (+ 5 phút Q&A)
**Mục tiêu:** Trình diễn cách AI thay thế "Pajama Time" của bác sĩ bằng luồng Voice-to-Text -> LLM -> Hồ sơ bệnh án chuẩn y khoa JCI.

---

## 1. Cấu trúc trình bày (5 phút)

| Phần | Thời gian | Nội dung chi tiết | Người nói (Dự kiến) |
|------|-----------|----------|--------|
| **Problem + Before** | 45 giây | - **Vấn đề:** Bác sĩ Vinmec mất 3-5 phút/ca để gõ máy tính, tổng cộng tốn 1-2 tiếng mỗi ngày (Pajama Time). Khách hàng VIP phàn nàn bác sĩ "chỉ nhìn màn hình, không nhìn bệnh nhân".<br>- **Flow hiện tại:** Trực tiếp tự gõ SOAP vào hệ thống HIS. Cực kỳ dễ mệt mỏi (Burnout). | [Tên thành viên 1] |
| **Solution + After** | 45 giây | - **Giải pháp (Augmentation - Trợ lý AI):** Thu âm tự động cuộc hội thoại (Whisper) -> LLM bóc tách thông tin điền sẵn vào các trường Bệnh sử, Khám lâm sàng, Chỉ định.<br>- **Flow mới:** Bác sĩ chỉ khám và nói chuyện bình thường. Cuối buổi mất 30s để Review (duyệt) và nhấn Lưu. | [Tên thành viên 2] |
| **Live demo (Happy Path + Edge Case)** | 120 giây | - **Bước 1 (Happy Path - 80s):** Bật microphone, giả lập đoạn hội thoại khám bệnh: *"Chào bác, dạo này đau đầu gối bên phải, có uống paracetamol không đỡ..."*. Nhấn nút xử lý. Bấm qua màn hình xem AI tự fill text vào đúng trường Bệnh sử, Khám, Chỉ định.<br>- **Bước 2 (Edge Case - 40s):** Show tính năng "Human-in-the-loop": AI nghi ngờ 1 triệu chứng hoặc tên thuốc (có đánh dấu highlight/`(??)`). Bác sĩ ấn "Accept/Reject" trực tiếp trên giao diện (ví dụ reject thông tin không chắc chắn). | [Tên thành viên 3] |
| **Impact + Lessons** | 45 giây | - **Metric:** Giảm 80% thời gian gõ hồ sơ (từ 3p xuống 30s duyệt).<br>- **Failure Mode chính:** Bệnh nhân nói tiếng địa phương nặng hoặc Whisper nhận nhầm tên biệt dược hiếm. UI/UX khắc phục bằng cách báo màu vàng để bác sĩ check lại theo chuẩn JCI.<br>- **Bài học:** Design AI cho y tế không phải là tự động hóa 100%, mà là tối ưu trải nghiệm "Review thay vì Type" cho bác sĩ. | [Tên thành viên 4] |

---

## 2. Chuẩn bị (Checklist trước demo)
- [ ] **Mở sẵn môi trường:** Vite/React chạy ở `localhost:5173`, Backend API mở sẵn, không chờ load.
- [ ] **Backup:** Quay sẵn 1 màn hình video demo dài 2 phút phòng hờ ngắt kết nối mạng hoặc Whisper/LLM API sập.
- [ ] **Kịch bản thoại ghép:** Viết sẵn ra giấy 1 đoạn hội thoại mẫu 2 người (Bác sĩ - Bệnh nhân) để đọc trực tiếp vào mic lúc demo.
- [ ] **Phân công:** Không giành mic của nhau, mỗi người nói chuẩn đúng thời lượng.

---

## 3. Q&A Anticipation (Dự phòng câu hỏi)

**Q: Hệ thống này là Tự động hoàn toàn (Auto) hay Tăng cường (Aug)?**
> A: Là Tăng cường (Augmentation). Y khoa đòi hỏi trách nhiệm pháp lý tuyệt đối nên AI chỉ đóng vai trò "người thư ký" (Scribe) nháp sẵn văn bản. Bác sĩ bắt buộc phải đọc lại (Human-in-the-loop) và ký duyệt.

**Q: Failure mode chính của hệ thống là gì? Bác sĩ xử lý sao nếu AI điền sai chỉ định thuốc?**
> A: Failure lớn nhất là AI "Hallucinate" liều lượng hoặc bị nhiễu do tạp âm phòng khám. Chúng tôi xử lý UI bằng cách: AI luôn bắt buộc map text vào Pydantic Schema, những phần confidence thấp hoặc các phần liên quan đến Thuốc (Medication) mặc định phải được bôi sáng màu vàng để nhắc bác sĩ tập trung kiểm tra. Bác sĩ có thể bấm Reject để xoá thẳng chỗ đó và tự gõ lại.

**Q: Tại sao Vinmec không cho bác sĩ mở màn hình ChatGPT ra và tự dùng luôn?**
> A: ChatGPT không "nhúng" (integrate) thẳng vào hệ thống các Data Field y khoa như Patient Info, Khám Lân Sàng, Mã ICD-10. Dùng ChatGPT bác sĩ phải Copy-Paste rất cực qua lại vào HIS, đồng thời có nguy cơ lộ lọt dữ liệu (Data Privacy) nhạy cảm của người bệnh ra public internet, vi phạm JCI. Hệ thống này map thẳng vào Schema nội bộ của viện.
