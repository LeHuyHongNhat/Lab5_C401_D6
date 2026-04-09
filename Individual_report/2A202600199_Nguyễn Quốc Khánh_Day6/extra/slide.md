# Dàn Ý Thuyết Trình: Vinmec Clinical Scribe (AI Agent)
**Thời lượng:** 3-5 phút
**Công cụ khuyến nghị:** Cấu trúc này dùng cho Gamma.app để gen slide nhanh, sau đó Export sang Canva để gắn màu Đỏ - Xanh dương - Trắng (chuẩn Vinmec).

---

## Slide 1: Tiêu đề & Hook
- **Tiêu đề:** Clinical Scribe Agent - "Trả lại đôi mắt" cho y khoa thấu cảm
- **Tagline:** Giải phóng bác sĩ Vinmec khỏi gánh nặng hành chính, hướng tới dịch vụ y tế 5 sao đích thực.
- **Visual:** Hình ảnh một bác sĩ đang tươi cười nhìn thẳng vào mắt bệnh nhân (thay vì cắm mặt vào màn hình).

## Slide 2: Nỗi đau (The "Pajama Time" Problem)
- **Thực trạng khám bệnh 15 phút/ca:** Bác sĩ mất 3-5 phút (30% thời lượng) chỉ để gõ hồ sơ (SOAP) và đánh máy chỉ định (HIS).
- **Hậu quả 1 (Bác sĩ):** Gánh nặng giấy tờ tạo ra "Pajama time" (mang việc về nhà làm lúc 10h đêm) → Tỷ lệ Burnout (kiệt sức) cao.
- **Hậu quả 2 (Bệnh nhân & BQT):** Bệnh nhân VIP đến Vinmec nhưng bác sĩ không có thời gian giao tiếp ánh mắt. Rủi ro hồ sơ ghi chép thiếu sót dễ dẫn đến y lệnh chưa chuẩn xác, ảnh hưởng Claim bảo hiểm.

## Slide 3: Giải Pháp - AI Clinical Scribe Agent
- **Product Vision:** Một Agent "Lắng nghe" toàn bộ cuộc hội thoại (15 phút) thông qua micro đa hướng tại phòng khám.
- **Tự động hóa (Augmentation):** 
  - Render trong 10 - 15 giây ra bản ghi chuẩn SOAP (Subjective, Objective, Assessment, Plan).
  - Tự động tick dọn lệnh hóa nghiệm (Xét nghiệm máu, X-Quang) và tạo nháp Đơn thuốc.
- **Visual:** Sơ đồ luồng: Voice -> AI Agent -> SOAP Draft -> Xác nhận 1-click.

## Slide 4: Tại sao là Augmentation (Human-in-the-loop)?
- **Tiêu chí y khoa:** Chúng tôi KHÔNG cho AI tự động lưu bệnh án (Automation). Mọi thao tác phải thông qua Bác sĩ duyệt & chỉnh sửa.
- **Trust Mechanism:** Các thông tin chẩn đoán không tự tin (Low-confidence) sẽ được bôi đậm (Highlight vàng) để bác sĩ kiểm tra kĩ.
- **Continuous Learning (Điểm nhấn kĩ thuật):** AI Scribe có khả năng tự học phong cách hành văn và danh mục thuốc quen thuộc của *từng bác sĩ* thông qua dữ liệu chỉnh sửa của họ, giúp giảm thời gian duyệt từ 30s xuống <5s.

## Slide 5: Demo Time (Video Mockup)
- **Chuẩn bị:** Chèn Video dài 45s - 1 phút.
- **Narrative Demo:** *"Hôm nay, bác sĩ Nhật khám cho bệnh nhân bị trào ngược dạ dày..."*. (Trình chiếu giao diện ứng dụng lúc AI tự động bắt chữ và nhả ra file JSON/SOAP).
- **Showcase:** Nhấn mạnh tốc độ <15s và cảnh bác sĩ chỉ cần bấm nút "Duyệt" là hồ sơ vào thẳng hệ thống EHR.

## Slide 6: ROI & Lợi Ích Kép
- **Bác Sĩ:** Tiết kiệm 2h/ngày, tăng chất lượng cuộc sống (Well-being).
- **Bệnh Nhân:** 100% thời gian khám là dành cho sự tương tác và thấu cảm.
- **Vinmec / Business:** 
  - Tăng công suất khám: Tiết kiệm được thời gian -> khám thêm 1-2 bệnh nhân VIP/ngày.
  - Tối ưu hóa doanh thu (Revenue Integrity): Báo cáo AI cực kỳ chi tiết -> ICD-10 Coding chính xác -> Không bị bảo hiểm từ chối do hồ sơ sơ sài.

## Slide 7: Roadmap & Đội ngũ (Nhóm C401_D6)
- **Team Roles:** (Liệt kê ngắn gọn 6 thành viên)
- **Next steps:**
  - Pilot (Thử nghiệm) tại 5 phòng khám Nội khoa trong 1 tháng.
  - Fix tuning trên dữ liệu tiếng Việt chuyên ngành y khoa JCI.
  - Triển khai toàn hệ thống khám ngoại trú Vinmec.
- **Call to action:** Cảm ơn BGK. Q&A.