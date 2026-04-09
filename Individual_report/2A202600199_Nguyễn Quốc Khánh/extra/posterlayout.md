# Poster Layout: Clinical Scribe (AI Tạo Hồ Sơ Bệnh Án)

*Dưới đây là bản thiết kế nội dung (Markdown format) để nhóm có thể bưng thẳng sang Canva hoặc Google Slides làm Poster trưng bày tại bàn Demo.*

---

## 1. Tiêu đề & Vấn đề (Header)
**CLINICAL SCRIBE: AI "Nghe" Bệnh Phẩm, Bác Sĩ Chấm Dứt "Pajama Time"**
*Vấn đề:* Bác sĩ mất 1-2 tiếng mỗi ngày chỉ để gõ hồ sơ bệnh án (Pajama time), dẫn tới mệt mỏi và giảm chất lượng giao tiếp bằng mắt (eye-contact) với bệnh nhân.

---

## 2. Before / After (Cột so sánh)

| | 🚨 BEFORE (Hiện tại) | ✨ AFTER (Với Clinical Scribe AI) |
|---|---|---|
| **Hình ảnh minh họa** | *(Ảnh: Bác sĩ cắm mặt gõ bàn phím, bệnh nhân bơ vơ)* | *(Ảnh: Bác sĩ nhìn bệnh nhân trò chuyện, màn hình tự chạy chữ)* |
| **Quy trình (Steps)** | 1. Vừa khám vừa gõ<br>2. Nhớ nhớ quên quên<br>3. Tự nhập mã ICD-10 | 1. Khám & nói tự nhiên<br>2. Nhấn nút "Generate"<br>3. Lướt đọc & Lưu |
| **Thời gian trung bình** | **3 - 5 phút** / ca khám | **30 giây** / ca khám |
| **Mức độ tự động hóa**| 100% Manual (Thủ công) | **Augmentation** (AI viết nháp, Bác sĩ duyệt) |

---

## 3. Ảnh Chụp Màn Hình (Core UI) - 1 Hình Lớn Ở Giữa
> *(Khoảng trống dành cho screenshot của hệ thống thực)*
> **Mô tả ảnh:** Giao diện gồm phần "Ghi âm hội thoại" bên trái, và 3 form (Bệnh Sử, Khám Lâm Sàng, Chỉ Định) bên phải được điền tự động.
> **Highlight 🔴:** Khoanh tròn đỏ và chỉ mũi tên vào các đoạn text **Màu Vàng `(??)`** (Tính năng Human-in-the-loop: AI bôi vàng khi độ tự tin thấp hoặc nhắc nhở kiểm tra liều lượng thuốc).

---

## 4. Bảng Impact (Hiệu quả chuyển đổi) & Cost
```text
┌──────────────────────────────────────────────┐
│  ⚡ THỜI GIAN GÕ HỒ SƠ:   3 phút ➜ 30 giây    │
│  🎯 CHUẨN Y KHOA:         Template JCI, ICD-10│
│  💰 CHI PHÍ VẬN HÀNH:     ~$0.05 / ca khám    │
└──────────────────────────────────────────────┘
```

---

## 5. Failure Modes & Learning Signal (Góc dưới cùng)

| ⚠️ Top 2 Failure (Rủi ro rớt đài) | 🛡️ Mitigation (Cách Team xử lý) |
|---|---|
| 1. **Hallucination thuốc:** AI tự bịa liều lượng hoặc sai tên thuốc biệt dược hiếm. | ➜ Force Map vào Pydantic Schema. Các trường `Medication` mặc định bôi vàng ép bác sĩ Review thủ công (Accept/Reject). |
| 2. **Nhiễu âm thanh:** Bệnh nhân nói tiếng địa phương hoặc phòng khám ồn ào. | ➜ Fix cứng context prompt; Dùng Whisper model tốt nhất; Bác sĩ luôn được quyền gõ đè (Overwrite text). |

---

## 6. Call to Action / QR Code (Góc phải dưới)
**[ Hình QR Code to, rõ ràng ]**
*Quét mã để xem Video Demo thực tế (Trường hợp Wifi hội trường chập chờn)*
