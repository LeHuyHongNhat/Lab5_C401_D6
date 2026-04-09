# Prompt Test Logs — Medical Agent

## 1. Mục tiêu
Kiểm tra độ ổn định của system prompt trong việc:
- Trích xuất thông tin y tế từ hội thoại
- Trả về JSON đúng format MedicalRecord
- Không hallucinate
- Không sinh ICD (để backend xử lý)

---

## 2. Test Cases

### Case 1 — Triệu chứng rõ ràng
**Input:**
Đau đầu 3 ngày, chóng mặt nhẹ, buồn nôn

**Output:**
- JSON đúng format
- Trích xuất đúng triệu chứng
- Không có ICD

**Nhận xét:**
 Hoạt động tốt

---

### Case 2 — Hội thoại có nhiễu
**Input:**
Hôm qua tôi thức khuya chơi game, sáng nay hơi chóng mặt, đau đầu nhẹ

**Output:**
- Bỏ được thông tin "chơi game"
- Giữ lại triệu chứng chính

**Nhận xét:**
 Prompt lọc nhiễu tốt

---

### Case 3 — Thiếu thông tin
**Input:**
Tôi thấy hơi mệt

**Output:**
- trieu_chung: "mệt mỏi"
- Các field khác: null

**Nhận xét:**
 Không hallucinate

---

### Case 4 — Có khám lâm sàng
**Input:**
Bệnh nhân đau đầu, huyết áp 130/85 mmHg, nhịp tim 88 bpm

**Output:**
- Triệu chứng → trieu_chung
- Chỉ số → kham_lam_sang

**Nhận xét:**
 Phân loại đúng

---

### Case 5 — Có chẩn đoán
**Input:**
Bác sĩ nói đau đầu do căng thẳng, cần nghỉ ngơi

**Output:**
- chan_doan: "đau đầu do căng thẳng"
- huong_dieu_tri: "nghỉ ngơi"

**Nhận xét:**
 Mapping đúng

---

## 3. Vấn đề gặp phải
- Một số trường hợp LLM:
  - Bỏ sót field
  - Hoặc trả null nhiều hơn cần thiết

---

## 4. Cải tiến đã thực hiện
- Thêm rule: không suy diễn
- Thêm few-shot examples
- Ép format JSON strict

---

## 5. Kết luận
- Prompt đạt độ ổn định tốt với các case phổ biến
- Cần thêm test cho:
  - Hội thoại dài
  - Nhiều bệnh cùng lúc