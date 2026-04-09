# Individual reflection — Phan Văn Tấn

## 1. Role cụ thể trong nhóm
Tôi đảm nhận vai trò **Prompt Engineer & Medical Logic**, chịu trách nhiệm thiết kế cách AI hiểu và xử lý hội thoại y tế, từ đó trích xuất thành dữ liệu có cấu trúc.  
Cụ thể, tôi tập trung vào việc định nghĩa system prompt, format output và đảm bảo thông tin được tổ chức đúng logic nghiệp vụ.

---

## 2. Phần phụ trách cụ thể
- Thiết kế **system prompt để LLM trả về JSON MedicalRecord trực tiếp**, thay vì dùng SOAP rồi parse lại  
- Xây dựng **few-shot examples từ dữ liệu y tế mẫu**, giúp model hiểu rõ pattern output và giảm sai lệch  
- Định nghĩa các rule quan trọng:
  - Tách đúng các field (triệu chứng, chẩn đoán, điều trị)
  - Loại bỏ thông tin nhiễu trong hội thoại
  - Không hallucinate thông tin
  - Không sinh mã ICD (để backend xử lý)

---

## 3. SPEC mạnh/yếu
- **Mạnh nhất:** thiết kế output JSON rõ ràng, có thể dùng trực tiếp cho backend  
  → giúp giảm đáng kể bước xử lý trung gian và hạn chế lỗi format  

- **Yếu nhất:** chưa cover hết các trường hợp hội thoại phức tạp  
  → ví dụ: hội thoại dài, nhiều thông tin nhiễu hoặc thiếu dữ liệu  
  → trong các trường hợp này, LLM có xu hướng:
    - trả null nhiều field  
    - hoặc bỏ sót thông tin quan trọng  

---

## 4. Đóng góp khác
Ngoài phần chính, tôi còn:
- Test prompt với nhiều input khác nhau để kiểm tra độ ổn định  
- So sánh output trước và sau khi thêm few-shot để đánh giá hiệu quả  
- Refine prompt nhiều lần để:
  - giảm lỗi format JSON  
  - giảm hiện tượng hallucination  
- Hỗ trợ debug luồng dữ liệu giữa LLM và backend, đảm bảo output có thể dùng trực tiếp

---

## 5. Điều học được
Trước hackathon, tôi nghĩ prompt chỉ là viết instruction cho AI.  
Tuy nhiên, sau khi làm project, tôi nhận ra:

**Prompt thực chất là một phần của system design.**

Cách định nghĩa:
- rule  
- format  
- ví dụ (few-shot)  

ảnh hưởng trực tiếp đến chất lượng output.  

Ngoài ra, tôi cũng hiểu rõ hơn về việc phân chia trách nhiệm:
- LLM → xử lý ngôn ngữ (extract thông tin)
- Backend -> xử lý logic (mapping, validation)

---

## 6. Nếu làm lại
Nếu có cơ hội làm lại, tôi sẽ:
- **Bỏ SOAP ngay từ đầu và đi thẳng JSON pipeline** để giảm complexity  
- Bắt đầu **test prompt sớm hơn (ngay từ ngày đầu)** thay vì viết xong mới test  
- Chuẩn bị sẵn nhiều test case hơn (đặc biệt là edge cases) để tăng độ robust của hệ thống  

---

## 7. AI giúp gì / AI sai gì
- **AI giúp:**
  - Tăng tốc quá trình viết và refine prompt  
  - Tạo nhanh nhiều example để test  
  - Gợi ý cách tổ chức output và rule  

- **AI sai/mislead:**
  - Có thể trả output đúng format nhưng sai logic  
  - Đôi khi thêm thông tin không có trong hội thoại  
  - Một số trường hợp bỏ sót field quan trọng  

-> Vì vậy, cần kết hợp:
- rule chặt trong prompt  
- validation ở backend  

thay vì phụ thuộc hoàn toàn vào LLM