# Poster layout — 1 trang

Poster/slides tóm tắt trưng tại bàn demo. Peer nhìn poster trước khi nghe demo.

---

## Layout gợi ý (trên xuống dưới)

1. **Tên product + problem statement** (1 câu)
2. **Before | After** — 2 cột so sánh:
   - Before: flow hiện tại (user làm gì, mất bao lâu, pain gì)
   - After: flow với AI (AI làm gì, auto hay aug, cải thiện gì)
3. **Live demo** — demo chạy được (link prototype hoặc QR code). Nếu mock: screenshot flow chính + 1 prompt/AI call chạy thật bên cạnh
4. **Impact** — so sánh metric trước vs sau: thời gian, số bước, accuracy, cost... Dùng số cụ thể, không nói chung chung
5. **Failure modes | Learning signal** — 2 cột: top 1-2 failure + mitigation | thu data gì để cải thiện

---

## Tips

- Font lớn, đọc được từ 1-2 mét — peer đứng xem
- Ít chữ, nhiều hình — screenshot > mô tả text
- Dùng Canva template "poster" nếu muốn design nhanh
- Không cần đẹp, cần rõ: peer nhìn 10 giây hiểu product làm gì

---

## Mở rộng (optional — bonus)

### Before/After chi tiết hơn

Thay vì chỉ mô tả text, show bằng hình:

| | Before (hiện tại) | After (với AI) |
|---|---|---|
| **Screenshot / sketch** | *(ảnh flow cũ)* | *(ảnh flow mới)* |
| **Số bước** | *VD: 7 bước, 10 phút* | *VD: 3 bước, 2 phút* |
| **Pain point chính** | *VD: phải chờ lễ tân* | *VD: AI trả lời ngay* |
| **Ai quyết định** | *VD: lễ tân tra thủ công* | *VD: AI gợi ý, user chọn* |

### QR code đến live demo

In QR code trên poster → peer scan = thử demo ngay trên điện thoại. Ấn tượng hơn nhiều so với chỉ nhìn screenshot.

- Dùng bất kỳ QR generator nào (free) trỏ đến link deploy
- Nếu chưa deploy: QR trỏ đến video recording demo

### Impact dashboard mock

Sketch 1 dashboard nhỏ trên poster, show metric trước và sau:

```
┌─────────────────────────────────┐
│ Thời gian trung bình    10m → 2m │
│ Độ chính xác           — → 85%  │
│ User hài lòng          3/5 → 4/5│
└─────────────────────────────────┘
```

Dùng số thật từ test (nếu có) hoặc ước lượng có cơ sở.

### Câu hỏi mở rộng

- Peer chỉ nhìn poster 10 giây — thông tin nào PHẢI thấy đầu tiên?
- Poster có thể "đứng một mình" (không cần người giải thích) không?
- Nếu phải bỏ 1 phần trên poster, bỏ phần nào? Tại sao?
