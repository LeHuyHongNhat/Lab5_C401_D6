# Reflection — Ngày 5: Thiết kế sản phẩm AI cho uncertainty

## Bài học quan trọng nhất

Câu nói ấn tượng nhất trong buổi học: **"Vấn đề không phải AI yếu. Vấn đề là ta đang đối xử AI như phần mềm thường."**

Trước buổi học, mình nghĩ build AI product = train model tốt → deploy → xong. Nhưng thực tế hoàn toàn ngược lại. AI output là xác suất — luôn có sai số. Nếu không thiết kế UX cho lúc AI sai, product sẽ thất bại dù model accuracy cao đến đâu.

## 3 thay đổi tư duy lớn nhất

### 1. Demo ≠ Product

"0→80% = 1 tuần, 80→95% = gấp 4 lần effort." Một demo AI chạy tốt trên vài test case không có nghĩa là nó sẽ hoạt động tốt trên hàng nghìn user thật. 20% cuối cùng quyết định liệu có ai dùng product không.

**Ví dụ thực tế:** Khi test NEO chatbot của Vietnam Airlines, những câu hỏi "happy path" (hỏi hành lý) NEO trả lời rất tốt. Nhưng chỉ cần hỏi 1 câu ngoài phạm vi là hệ thống bế tắc hoàn toàn. Đây chính là khoảng cách giữa demo và product.

### 2. Precision vs Recall là product decision, không phải technical decision

PM phải quyết định: ưu tiên ít sai nhầm (precision) hay ít bỏ sót (recall)?
- Nếu user KHÔNG thấy lỗi → cần precision cao (ví dụ: spam filter)
- Nếu user THẤY lỗi ngay → recall OK (ví dụ: Copilot — user bỏ qua suggestion sai)

Trước giờ mình nghĩ đây là việc của engineer. Nhưng thực ra PM cần hiểu cost of error của product để chọn đúng metric.

### 3. Feedback loop IS the product

"The loop IS the product, IS the IP." (Asha Sharma, Microsoft)

AI product không phải artifact (build xong rồi ship) mà là organism (sống, phát triển). Cần thiết kế loop: User dùng → Thu feedback → AI cải thiện → User dùng tốt hơn.

Khi phân tích NEO chatbot, mình thấy thiếu hoàn toàn loop này. User sửa lỗi NEO nhưng NEO không học được gì → NEO sẽ sai mãi.

## Liên hệ với bài tập UX

Qua việc phân tích Vietnam Airlines Chatbot NEO, mình nhận ra:

| Framework | Áp dụng thực tế |
|-----------|-----------------|
| 4 paths | NEO chỉ thiết kế tốt Path 1 (AI đúng). Path 3 (AI sai) gần như không được thiết kế |
| Auto vs Aug | NEO đang ở dạng automation (tự trả lời, user không can thiệp) nhưng accuracy chưa đủ cao cho automation. Nên chuyển sang augmentation (gợi ý + user xác nhận) |
| Data flywheel | NEO không thu correction signal → không có flywheel → quality đứng yên |
| Graceful failure | NEO fail không graceful — đẩy user ra tổng đài, mất context |

## Câu hỏi còn đọng lại

1. Khi nào nên chuyển từ augmentation sang automation? Copilot nói 30% accuracy đủ cho augmentation. Nhưng với domain high-stakes như y tế (Vinmec), threshold này khác thế nào?
2. Làm sao đo lường "trust" một cách quantitative? Biết user bắt đầu mất niềm tin ở thời điểm nào?
3. Data flywheel có ethical concern gì không khi thu implicit feedback (user behavior) mà user không biết?

## Áp dụng cho hackathon

Nếu nhóm chọn track Vinmec (AI triage), mình sẽ đề xuất:
- Bắt đầu **augmentation** — AI gợi ý top 3 chuyên khoa, bác sĩ/lễ tân xác nhận
- Thiết kế **4 paths** từ đầu, đặc biệt Path 3 (gợi ý sai khoa → bệnh nhân mất thời gian)
- Tích hợp **correction signal**: bệnh nhân cuối cùng khám khoa nào → so sánh với gợi ý AI
- Đặt **kill criteria**: nếu precision top-3 < 60% sau 2 tuần → dừng, review lại approach
