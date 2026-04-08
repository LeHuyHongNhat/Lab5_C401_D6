# Research Notes — AI Product Design Patterns

Ghi chú cá nhân từ bài giảng + tài liệu tham khảo Ngày 5.

---

## 1. Domino chain — logic xuyên suốt buổi học

```
AI = xác suất (luôn có sai số)
  → Automation hay Augmentation? (chọn cách deploy)
    → 3 trụ: Requirement / UX / Eval (thiết kế khác phần mềm thường)
      → Canvas gộp 3 trụ vào 1 trang
        → Feedback loop + Data flywheel (product sống, không tĩnh)
          → ROI 3 kịch bản (có đáng build không?)
```

Mấu chốt: mỗi quyết định ở trên ảnh hưởng cascade xuống dưới. Chọn sai auto/aug → requirement sai → UX sai → eval sai → product fail.

---

## 2. Accuracy quyết định UX pattern (Kevin Weil, CPO OpenAI)

| Accuracy | UX pattern | Ví dụ |
|----------|-----------|-------|
| ~30% | Ghost text / suggestion (user bỏ dễ) | GitHub Copilot |
| ~60% | Copilot (gợi ý + user confirm) | Email draft |
| ~95% | Semi-auto (AI làm, user review) | Spam filter |
| ~99.5% | Autopilot (AI tự xử lý) | Self-driving car |

→ Không phải cứ accuracy thấp = product tệ. Copilot 30% vẫn 20M user vì UX đúng (cost of reject = 0, chỉ cần nhấn Tab hoặc bỏ qua).

---

## 3. Case studies đáng nhớ

### GitHub Copilot — augmentation thắng automation
- Accuracy chỉ 30% nhưng ghost text UX khiến cost of reject = 0
- User nhấn Tab (accept) hoặc tiếp tục gõ (reject) — không mất thời gian
- Speed-first positioning: $19/tháng, scale nhanh

### Harvey — capability thắng speed
- Legal AI, sai = mất vụ kiện → phải precision cực cao
- Ship chậm, invest accuracy trước
- $500+/user/tháng nhưng client chấp nhận

### Microsoft Tay — thiếu failure design
- Chatbot không có content moderation → bị troll thành racist bot
- Bài học: Path 3 + Path 4 phải thiết kế từ đầu, không phải "fix sau"

### Microsoft Dragon — data flywheel thực tế
- AI ghi chép cho bác sĩ
- V1: synthetic data → acceptance 30-60%
- V2: 600K ca thực tế + chuyên gia đánh giá → 75%
- V3: continuous loop → 83%
- Bài học: dữ liệu thật + chuyên gia >> synthetic data

### Customer Support Agent — agency progression
- V1: routing ticket (augmentation)
- V2: gợi ý draft trả lời (copilot)
- V3: tự xử lý (automation)
- Team nhảy thẳng V3 phải shutdown vì lỗi quá nhiều
- Bài học: phải đi từng bước, thu data mỗi bước

---

## 4. Công thức quan trọng

**Intelligence × Context × UI = Utility** (Mike Krieger, CPO Anthropic)
- Phép nhân → 1 cái = 0 thì tất cả = 0
- Model giỏi + context tốt + UI tệ = vô dụng
- Overhang: AI làm được nhiều hơn user thực tế dùng → UX là bottleneck

**AI product = organism** (Asha Sharma, Microsoft)
- Không phải artifact (build → ship → done)
- KPI mới = "metabolism" — tốc độ loop
- Loop: Ingest → Digest → Output → Repeat

---

## 5. Precision vs Recall — cách chọn

```
User KHÔNG thấy lỗi → cần Precision cao
  Ví dụ: spam filter (email quan trọng bị filter = thiệt hại lớn, user không biết)

User THẤY lỗi ngay → Recall OK
  Ví dụ: Copilot (user thấy code sai → bỏ qua, không thiệt hại)
```

Quy tắc: PM chọn precision/recall = product decision, KHÔNG phải technical decision.

---

## 6. Data flywheel — khi nào có lợi thế thật?

3 điều kiện để data flywheel tạo competitive advantage:
1. **Marginal value**: data mới phải cải thiện model (model đã biết cái này chưa?)
2. **Exclusivity**: data này chỉ mình mình có (ai khác cũng thu được không?)
3. **Defensibility**: competitor không thể copy data này

Ví dụ tốt: Dragon (data bác sĩ-bệnh nhân thật, exclusive)
Ví dụ yếu: AI viết email (data general, ai cũng có)

---

## 7. ROI 3 kịch bản + Kill criteria

| | Conservative | Realistic | Optimistic |
|---|---|---|---|
| Users | Ít, adoption thấp | Trung bình | Nhiều, adoption cao |
| Cost | Inference + maintain | | |
| Benefit | Tiết kiệm gì? | | |
| Net | Lỗ/lãi? | | |

Kill criteria: điều kiện dừng project
- VD: cost > benefit 2 tháng liên tục → dừng
- Quan trọng vì AI product dễ rơi vào "sunk cost fallacy"
