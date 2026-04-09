# Individual reflection — Lê Công Thành (2A202600091)

## 1. Role
UX designer. Phụ trách thiết kế luồng tương tác (UI/UX flow) cho Mock Prototype.

## 2. Đóng góp cụ thể
- Lên ý tưởng và sử dụng prototyping-tool để dựng Mock Prototype thể hiện rõ 4 paths (Happy, Low-confidence, Failure, Correction).
- Đóng góp chỉnh sửa file SPEC của nhóm.

## 3. SPEC mạnh/yếu
- Mạnh nhất: Phần Data Flywheel và tư duy thiết kế cho Uncertainty. Nhóm không chỉ nói lý thuyết mà đã thiết kế được luồng thu thập "Dữ liệu riêng user" và "Dữ liệu đánh giá của người" rất chi tiết (thông qua tín hiệu Correction và Implicit). Việc ưu tiên Recall cao (thà thừa để bác sĩ xóa còn hơn bỏ sót) thể hiện sự thấu hiểu sâu sắc đặc thù rủi ro của ngành y tế.
- Yếu nhất: Phần Eval metrics (chỉ số đánh giá). Dù đã chọn đúng Recall, nhưng các metric hiện tại (Zero-edit rate, Thời gian chỉnh sửa trung bình) vẫn thiên về định lượng (Quantitative) và đo lường hiệu suất cuối cùng. SPEC đang thiếu các metric trung gian để đo lường chất lượng bản nháp của AI trước khi bác sĩ can thiệp (ví dụ: tỉ lệ bắt đúng triệu chứng chính so với audio gốc).

## 4. Đóng góp khác
- Phản biện chéo các ý tưởng trong SPEC, đặc biệt là đối chiếu định nghĩa "Zero-edit rate" với tiêu chí đánh giá Recall trong môi trường y khoa khắt khe.

## 5. Điều học được
Trước hackathon, tôi thường nghĩ UI/UX chỉ là để trải nghiệm người dùng tốt hơn. Sau khi thiết kế AI Clinical Scribe, tôi nhận ra trong sản phẩm AI: UX chính là công cụ để thu thập Data Flywheel. Giao diện cho lúc AI làm sai (Failure/Correction) thậm chí còn quan trọng hơn lúc làm đúng, vì nó quyết định model có học được từ chuyên gia (RLHF/Human-judgment) hay không. Đồng thời, tôi hiểu sâu sắc tại sao y tế lại ưu tiên Recall cao (chấp nhận AI sinh thừa để bác sĩ xóa) thay vì tối ưu Precision (bỏ sót triệu chứng của bệnh nhân).

## 6. Nếu làm lại
Nhóm tôi còn yếu về phần Eval metrics do chưa đo lường được độ chính xác thực tế, đặc biệt khi môi trường lớp học quá ồn làm giảm nghiêm trọng chất lượng nhận diện Speech-to-Text. Nếu được làm lại, tôi sẽ chuẩn bị sẵn một tập dữ liệu các mẫu audio giả lập ca khám bệnh từ trước. Việc này sẽ giúp nhóm chủ động test liên tục, đo lường các chỉ số chính xác hơn và tinh chỉnh prompt hiệu quả, thay vì bị động thu âm trực tiếp giữa không gian nhiều tạp âm.

## 7. AI giúp gì / AI sai gì
- **Giúp:** AI là một người phản biện (sparring partner) cực kỳ đắc lực. Tôi dùng AI để đối chiếu các phiên bản bảng tính ROI và Data Flywheel với framework của bài giảng, giúp nhận ra đâu là phiên bản "Product thinking" sắc bén hơn. AI cũng hỗ trợ viết prompt tạo UI rất nhanh.
- **Sai/mislead:** AI rất hay gợi ý lan man các tính năng ngoài lề (như tự động đặt lịch tái khám), suýt làm dự án bị phình to quy mô (scope creep) nếu không kiểm soát chặt chẽ.
  Bài học: AI brainstorm tốt nhưng không biết giới hạn scope.