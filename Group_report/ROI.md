# 5. Phân Tích Kịch Bản ROI (Return On Investment)

*(Tham khảo Format chuẩn trong 01-spec-template.md - Phần 5)*

**Bối cảnh chung (Assumption cơ sở):**
- Số ca khám/nửa ngày của 1 bác sĩ Vinmec: ~15 ca.
- Thời gian gõ máy tính mỗi ca bệnh: 3 - 5 phút.
- Chi phí đầu tư (Cost): 
  - Phần cứng: ~800k - 1,000k VND (Micro đa hướng/phòng khám).
  - Phần mềm/API Inference (Whisper + LLM Gen SOAP): Ước tính ~$0.05/ca khám.
  - Phí Server & Vận hành tích hợp (O&M): Chi phí cố định một tháng.

---

### Bảng ROI 3 Kịch Bản
| Biến số/Kịch bản | Conservative (Tối thiểu/Bảo thủ) | Realistic (Thực tế) | Optimistic (Khả quan) |
|---|-------------|-----------|------------|
| **Assumption** | *Phạm vi:* Áp dụng nhỏ giọt cho 20 bác sĩ.<br>*Hiệu quả:* Giảm được 50% thời gian gõ hồ sơ (còn 2 phút/ca).<br>*Tỷ lệ hài lòng:* 50%. Bác sĩ chưa quen văn phong AI. | *Phạm vi:* Triển khai toàn bệnh viện lớn (VD: Vinmec Times City) - 100 bác sĩ.<br>*Hiệu quả:* AI học được phong cách (Continuous Learning), giảm 80% thời gian gõ, duyệt trong 30s/ca.<br>*Tỷ lệ hài lòng:* 75%. | *Phạm vi:* Phủ toàn bộ hệ thống Vinmec (500 phòng khám).<br>*Hiệu quả:* AI thay thế gần như hoàn toàn "Pajama Time", bác sĩ chỉ mất 10s duyệt/ca.<br>*Tỷ lệ hài lòng:* >90%. |
| **Cost** | - Phần cứng: 20 triệu VNĐ.<br>- API: ~$15/ngày.<br>- Phí đào tạo: Cao (vì bác sĩ chưa quen). | - Phần cứng: 100 triệu VNĐ.<br>- API: ~$75/ngày (~1,500 ca).<br>- Phí server chuyên dụng: $1000/tháng. | - Phần cứng: 500 triệu VNĐ.<br>- API: ~$375/ngày (~7,500 ca).<br>- Private LLM Cloud Hosting lớn. |
| **Benefit (Lợi ích)** | Bác sĩ tiết kiệm được 45 phút - 1 tiếng/ngày. Tinh thần của nhân viên y tế ổn định hơn, giảm Burnout. | - Tiết kiệm gần 2 tiếng/ngày.<br>- **Chuẩn y khoa:** Hồ sơ đầy đủ chứng từ (JCI) -> Tỷ lệ hồ sơ BHYT bị xuất toán (từ chối chi trả) giảm rõ rệt.<br>- Hồ sơ chuẩn hóa ICD-10 giúp thanh toán nội bộ mượt mà hơn. | - Tiết kiệm được đủ thời gian để bác sĩ **nhận thêm 2 bệnh nhân VIP/ngày/phòng**.<br>- Trải nghiệm khách hàng Premium (mắt đối mắt, trọn vẹn sự chú ý) cao nhất -> Tăng tỷ lệ quay lại của KH hạng sang.<br>- Thu tăng trực tiếp lên đến hàng tỷ đồng mỗi tháng. |
| **Net (ROI thực nhận)** | Hòa vốn hoặc lãi nhẹ. Tuy nhiên Value về tinh thần (Clinician Well-being) là rất lớn. | Bệnh viện không những giảm được thất thoát doanh thu từ claim bảo hiểm mà còn tạo lợi thế cạnh tranh rất lớn trên thị trường Y tế 5 sao. | Siêu lợi nhuận. ROI vượt trên 300% nhờ việc tăng công suất/tần suất phục vụ trên một ghế khám (Room Utilization) mà chi phí nhân sự giữ nguyên. |

---

### Tiêu Chí Ngừng Dự Án (Kill Criteria)
Đây là các tín hiệu báo động đỏ (Red Flags) buộc Ban Giám Đốc và nhóm phát triển phải tạm dừng (hoặc gỡ bỏ hoàn toàn dự án) để đánh giá lại:

1. **Kháng cự từ User (Low Adoption):** Tỉ lệ bác sĩ tắt chế độ AI và quay lại gõ tay truyền thống vọt lên trên 40%. Nguyên nhân có thể do UX quá tệ hoặc văn phong AI đưa ra liên tục gặp lỗi khiến bác sĩ mất nhiều thời gian fix hơn tự gõ.
2. **Tràn chi phí API (Cost Overrun):** Chi phí API token phát sinh vượt quá % số tiền tiết kiệm được từ thời gian (hoặc phát sinh quá $1,000/5,000 ca bệnh) liên tục trong 2 tháng mà không có chiều hướng giảm từ Caching/Fine-tuning.
3. **Thảm họa Y khoa (Clinical Hazard):** Phát hiện >= 1 ca bệnh mà hệ thống AI ghi nhận nhầm/bịa đặt chỉ định thuốc nghiêm trọng (VD: Hallucinate liều lượng/hoạt chất), *và hệ thống cảnh báo (Human-in-the-loop)* của Review Bác sĩ cũng vô tình để lọt lỗi đó.