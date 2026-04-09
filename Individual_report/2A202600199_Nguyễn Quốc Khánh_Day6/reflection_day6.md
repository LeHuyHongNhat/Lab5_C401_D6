# Individual reflection — Nguyễn Quốc Khánh (2A202600199)

## 1. Role
Business Intelligence & Presentation: Phụ trách thiết kế slide, poster, chuẩn bị script demo, và phần phân tích ROI 3 kịch bản. Làm mock prototype bằng HTML, hỗ trợ thiết kế UX/UI. Đóng góp, tổng hợp, hoàn thiện final spec

## 2. Đóng góp cụ thể

| Output | Ghi chú |
|--------|---------|
| **Kịch bản Demo, thiết kế Slide, Poster** | Lên kịch bản (demo-script.md) và thiết kế Poster, Slide để trình bày sản phẩm trực quan. Chịu trách nhiệm thuyết trình trước lớp|
| **Mock Prototype Frontend** | Dựng bản mô phỏng giao diện Medical Scribe tĩnh bằng HTML & Tailwind CSS. (mock_prototype.html) |
| **Phân tích ROI** | Tính toán chi phí O&M và thiết lập ROI 3 kịch bản (Conservative, Realistic, Optimistic). (Phần 5 trong Spec_final.md) |


## 3. SPEC mạnh/yếu
- **Mạnh nhất:** Phần UI/UX Mitigation trong Failure Modes liên kết rất chặt chẽ với Prototype. Cơ chế thiết kế không dùng Auto-save và đánh dấu (??) màu vàng cho dữ liệu thiếu tự tin giúp giải quyết triệt để vấn đề rủi ro y tế.
- **Yếu nhất:** Kịch bản ROI. Các con số về chi phí vận hành (O&M) và thời gian tiết kiệm được (Pajama time) phần lớn dựa trên ước lượng chung chung (30 cases/doctor). Cần số liệu thực tế từ bệnh viện để bảng ROI có sức thuyết phục cao hơn với góc nhìn đầu tư.

## 4. Đóng góp khác
- Hỗ trợ thiết kế giao diện UX/UI để tối ưu trải nghiệm người dùng, đặc biệt là cơ chế cảnh báo khi AI thiếu tự tin (bôi vàng).
- Tổng hợp, biên tập tài liệu `spec_final.md` từ các mảnh ghép của nhóm để leader chỉnh sửa đưa ra bản cuối cùng. 

## 5. Điều học được
Qua quá trình thiết kế UI và Prototype, tôi nhận ra rằng AI không phải lúc nào cũng cần tự động hóa hoàn toàn 100%. Đôi khi, việc nhường lại quyền kiểm soát cuối cùng cho con người (Augmentation) cùng với một giao diện có chủ đích làm chậm thao tác click của người dùng (giảm Automation Bias) lại là quyết định thiết kế xuất sắc nhất.

## 6. Nếu làm lại
Nếu được bắt đầu lại, tôi sẽ bắt tay vào làm bản mock HTML Prototype ngay từ sớm. Việc có một giao diện trực quan sớm sẽ giúp cả nhóm dễ dàng mường tượng ra các ngã rẽ trong User Stories (Happy/Low-confidence/Failure) mà không phải tranh luận chay bằng lời nói hoặc text.

## 7. AI giúp gì / AI sai gì
- **Giúp:** Tác nhân trợ lý AI (như Copilot/Claude) giúp tôi lên khung HTML & Tailwind cực kỳ tốc độ chỉ trong vài phút, cũng như viết nhanh các dàn bài script trình bày.
Tác nhân AI như gemini cũng hỗ trợ tôi trong việc thiết kế Poster/Slide , giúp tiết kiệm thời gian và tạo ra sản phẩm có tính thẩm mỹ cao hơn.
- **Sai/mislead:** Khi lập bảng ROI, AI đưa ra các con số về chi phí O&M và Pajama time dựa trên ước lượng chung chung (30 cases/doctor) mà không có dữ liệu thực tế từ bệnh viện. Điều này làm cho phần ROI thiếu thuyết phục khi trình bày với góc nhìn đầu tư. 
Khi thiết kế cài đặt UX/UI, AI thường không hiểu rõ được luông thao tác của bác sĩ và các rủi ro y tế, nên ban đầu nó đề xuất dùng Auto-save cho tất cả các trường dữ liệu. Tôi đã phải chỉnh sửa lại prompt để hướng nó đến giải pháp đánh dấu (??) màu vàng cho những chỗ AI thiếu tự tin thay vì tự động ghi đè, nhằm giảm thiểu rủi ro do AI Hallucination. 
Bài học: Tin AI trong việc sinh code, nhưng không được phó thác Product Decision cốt lõi cho nó.

```

*Ngày 6 — VinUni A20 — AI Thực Chiến · 2026*
