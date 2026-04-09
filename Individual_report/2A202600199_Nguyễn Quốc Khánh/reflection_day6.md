# Individual reflection — Nguyễn Quốc Khánh (2A202600199)

## 1. Role
Phụ trách thiết kế slide, poster, chuẩn bị script demo, và phần phân tích ROI 3 kịch bản. Làm mock prototype bằng HTML, hỗ trợ thiết kế UX/UI
Đóng góp và hoàn thiện final spec

## 2. Đóng góp cụ thể

| Output | Ghi chú |
|--------|---------|
| **Kịch bản Demo & Poster** | Lên kịch bản (demo-script.md) và thiết kế layout Poster để trình bày sản phẩm trực quan. |
| **Mock Prototype Frontend** | Dựng bản mô phỏng giao diện Medical Scribe tĩnh bằng HTML & Tailwind CSS. |
| **Phân tích ROI** | Tính toán chi phí O&M và thiết lập ROI 3 kịch bản (Conservative, Realistic, Optimistic). |
| **Tài liệu Spec Final** | Tổng hợp, biên tập và hoàn thiện tài liệu `spec_final.md` từ các mảnh ghép của nhóm. |
| **Thiết kế User Stories** | Tham gia xây dựng 4 paths, đặc biệt định hình cơ chế cảnh báo UI/UX (bôi vàng lỗi) cho rủi ro AI Hallucination. |

## 3. SPEC mạnh/yếu
- **Mạnh nhất:** Phần UI/UX Mitigation trong Failure Modes liên kết rất chặt chẽ với Prototype. Cơ chế thiết kế không dùng Auto-save và đánh dấu (??) màu vàng cho dữ liệu thiếu tự tin giúp giải quyết triệt để vấn đề rủi ro y tế.
- **Yếu nhất:** Kịch bản ROI. Các con số về chi phí vận hành (O&M) và thời gian tiết kiệm được (Pajama time) phần lớn dựa trên ước lượng chung chung (30 cases/doctor). Cần số liệu thực tế từ bệnh viện để bảng ROI có sức thuyết phục cao hơn với góc nhìn đầu tư.

## 4. Đóng góp khác
- Hỗ trợ nhóm điều chỉnh chiến lược Đánh giá mô hình (Eval metrics) từ việc bám chấp vào Precision sang ưu tiên Recall (>= 95%) để phù hợp với chuẩn quy trình khám bệnh.
- Quản lý các cấu trúc file thư mục `spec_day6` và đẩy toàn bộ docs lên nhánh GitHub của nhóm một cách trơn tru.

## 5. Điều học được
Qua quá trình thiết kế UI và Prototype, tôi nhận ra rằng AI không phải lúc nào cũng cần tự động hóa hoàn toàn 100%. Đôi khi, việc nhường lại quyền kiểm soát cuối cùng cho con người (Augmentation) cùng với một giao diện có chủ đích làm chậm thao tác click của người dùng (giảm Automation Bias) lại là quyết định thiết kế xuất sắc nhất.

## 6. Nếu làm lại
Nếu được bắt đầu lại, tôi sẽ bắt tay vào làm bản mock HTML Prototype ngay từ sớm. Việc có một giao diện trực quan sớm sẽ giúp cả nhóm dễ dàng mường tượng ra các ngã rẽ trong User Stories (Happy/Low-confidence/Failure) mà không phải tranh luận chay bằng lời nói hoặc text.

## 7. AI giúp gì / AI sai gì
- **Giúp:** Tác nhân trợ lý AI (như Copilot/Claude) giúp tôi lên khung HTML & Tailwind cực kỳ tốc độ chỉ trong vài phút, cũng như viết nhanh các dàn bài script trình bày.
- **Sai/mislead:** Ban đầu khi nhờ AI lên bảng Matrix Eval, nó liên tục hướng tôi sang việc tập trung vào Precision. Vì LLM không có Domain Knowledge y tế, tôi phải mất công uốn nắn lại prompt để ép nó hiểu tầm quan trọng sống còn của Recall trong Clinical Scribe. Bài học: Tin AI trong việc sinh code, nhưng không được phó thác Product Decision cốt lõi cho nó.

```

---

## Checklist trước khi nộp

- [ ] Repo cá nhân đặt tên đúng: `MaHocVien-HoTen-Day06`
- [ ] Repo nhóm đặt tên đúng: `NhomXX-Lop-Day06`
- [ ] Repo cá nhân có: `feedback.md` + `reflection.md`
- [ ] Repo nhóm có: `spec-final.md` + `prototype-readme.md` + `demo-slides.pdf`
- [ ] SPEC đủ 6 phần
- [ ] Prototype readme có link + mô tả + phân công
- [ ] Feedback có đủ các nhóm đã xem trong zone
- [ ] Reflection đủ 7 phần, không copy-paste với bạn cùng nhóm
- [ ] Có ít nhất 1 commit trên group repo



*Ngày 6 — VinUni A20 — AI Thực Chiến · 2026*
