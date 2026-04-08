# Bài tập UX — Vietnam Airlines Chatbot NEO

## Sản phẩm: Vietnam Airlines — Trợ lý ảo NEO (Nê-ô)

**Tính năng AI:** Chatbot hỗ trợ khách hàng 24/7, tra cứu thông tin chuyến bay, hành lý, mua vé.
**Truy cập:** vietnamairlines.com → nút "Chat với NEO" góc phải dưới.

---

## Phần 1 — Khám phá: Marketing hứa gì?

### Marketing nói gì

- Website giới thiệu: **"Chat ngay cùng NEO — Trợ lý ảo của Vietnam Airlines!"**
- Hứa hẹn: "Thuận tiện tra cứu, giải đáp nhanh chóng (24/7) mọi thắc mắc liên quan đến thông tin hành trình, mua vé, thanh toán và nhiều tính năng khác"
- Khả năng hỗ trợ NEO quảng cáo:
  - Tra cứu thông tin vé máy bay, chuyến bay và hành lý
  - Giải đáp các thông tin mua vé và hành lý
- Hình ảnh branding: mascot máy bay hoạt hình dễ thương, tạo cảm giác thân thiện, thông minh
- Tổng thể tông marketing: NEO là "trợ lý" — gợi ý khả năng hiểu ngữ cảnh, xử lý yêu cầu phức tạp

### Thực tế khi dùng thử

- NEO hoạt động như **information bot** (tra cứu FAQ), không phải AI agent (thực hiện hành động)
- Trước khi chat phải tick checkbox đồng ý điều khoản → nhấn "Bắt đầu"
- Cuối mỗi phản hồi có dòng disclaimer: **"NEO có thể sai sót, hãy kiểm tra thông tin quan trọng"**
- Với câu hỏi phổ biến (hành lý): trả lời chi tiết, đầy đủ, có phân loại theo hạng vé
- Với câu hỏi ngoài phạm vi: trả lời "NEO hiện chưa có thông tin" + đưa SĐT/email liên hệ
- Có nút "Gặp tư vấn viên" nhưng là fallback duy nhất

---

## Phần 2 — Phân tích 4 Paths

### Path 1: Khi AI đúng (Happy path)

**Tình huống test:** Hỏi "Quy định hành lý xách tay"

**User thấy gì:**
- NEO trả lời ngay lập tức với thông tin chi tiết
- Phân loại rõ ràng theo: hành lý trẻ em dưới 2 tuổi, hành lý từ 2 tuổi trở lên
- Chia theo hạng vé: Thương gia (18kg, 2 kiện), Phổ thông đặc biệt/Phổ thông (cụ thể theo đường bay)
- Format: text thuần, có bullet points, dễ đọc

**Hệ thống confirm thế nào:**
- Không có nút "Thông tin này có hữu ích không?" hay thumbs up/down
- Không có cơ chế xác nhận user đã hiểu đúng
- Flow kết thúc im lặng — NEO chờ câu hỏi tiếp

**Đánh giá:** ✅ Tốt — thông tin chính xác, chi tiết, phản hồi nhanh. Nhưng thiếu cơ chế thu feedback để biết AI đúng hay chưa.

---

### Path 2: Khi AI không chắc (Low-confidence)

**Tình huống test:** Hỏi "Baggage rules" (tiếng Anh) hoặc câu hỏi mơ hồ

**Hệ thống xử lý thế nào:**
- NEO đưa ra danh sách chủ đề gợi ý dạng nút bấm (ví dụ: "Hành lý xách tay", "Hành lý ký gửi", "Hành lý đặc biệt")
- User phải chọn 1 trong các nút → NEO mới trả lời
- Về bản chất đây là **menu-driven**, không phải AI hiểu ngữ cảnh

**Vấn đề:**
- Không có thanh confidence hay chỉ báo "NEO không chắc lắm"
- Không giải thích tại sao hiển thị các lựa chọn này
- Nếu không có nút nào khớp, user bị mắc kẹt — phải gõ lại từ đầu
- Thiếu nút "Không phải ý tôi" hoặc "Hỏi cách khác"

**Đánh giá:** ⚠️ Trung bình — có cơ chế gợi ý chủ đề khi không chắc, nhưng thiếu transparency (không nói "tôi không chắc") và thiếu lối thoát khi danh sách gợi ý không khớp.

---

### Path 3: Khi AI sai (Failure path) ← PATH YẾU NHẤT

**Tình huống test:** Hỏi "Làm thế nào để trở thành phi công Vietnam Airlines?"

**User biết sai bằng cách nào:**
- NEO trả lời: "NEO hiện chưa có thông tin về cách trở thành phi công của Vietnam Airlines"
- Sau đó đưa danh sách: SĐT tổng đài (1900 1100), SĐT quốc tế (+84 24 38320320), Email (onlinesupport@vietnamairlines.com)
- Có nút "Gặp tư vấn viên"

**Sửa bằng cách nào:**
- User KHÔNG thể sửa — không có nút "Câu hỏi của tôi là về chủ đề khác"
- Không có nút "NEO hiểu sai, tôi muốn hỏi lại"
- User chỉ có 2 lựa chọn: (1) tự gõ câu mới, (2) bấm "Gặp tư vấn viên"
- Không có cơ chế report "NEO trả lời sai" hay feedback tiêu cực

**Bao nhiêu bước để recovery:**
1. Nhận ra NEO không giúp được → 2. Tự nghĩ cách diễn đạt lại → 3. Gõ lại câu hỏi → 4. Nếu vẫn sai → đành gọi tổng đài (rời khỏi chat hoàn toàn)
→ **3-4 bước**, và khả năng cao vẫn không giải quyết được

**Vấn đề nghiêm trọng:**
- AI không phân biệt được "không có thông tin" vs "không hiểu câu hỏi" — cả 2 trường hợp đều response giống nhau
- Không có nút feedback: "Câu trả lời này không hữu ích" / "NEO hiểu sai"
- Không có gợi ý chủ đề liên quan gần nhất
- Fallback duy nhất là chuyển sang kênh khác (tổng đài) — bỏ nguyên context cuộc hội thoại

**Đánh giá:** ❌ Yếu — khi AI sai hoặc không hiểu, user bị đẩy ra khỏi hệ thống. Không có correction loop, không có feedback mechanism, không giữ context khi escalate.

---

### Path 4: Khi user mất niềm tin (Trust breakdown)

**Tình huống test:** Hỏi nhiều câu ngoài phạm vi liên tiếp

**Có exit không:**
- Có — nút "Gặp tư vấn viên" luôn hiện
- Có disclaimer cố định: "NEO có thể sai sót, hãy kiểm tra thông tin quan trọng"

**Có fallback không:**
- Fallback duy nhất: "Gặp tư vấn viên" → chuyển sang agent người thật
- Ngoài giờ hoặc tư vấn viên bận → user phải để lại lời nhắn, không rõ khi nào được trả lời
- Thông tin tổng đài (1900 1100) luôn được đưa ra khi NEO không xử lý được

**Dễ tìm không:**
- Nút "Gặp tư vấn viên" dễ thấy (hiện trong phản hồi khi NEO không biết)
- Nhưng KHÔNG có nút "Gặp tư vấn viên" thường trực trên UI — chỉ xuất hiện KHI NEO đã thất bại
- Không có option "Tắt NEO, nói chuyện với người thật từ đầu"

**Đánh giá:** ⚠️ Trung bình khá — có lối thoát rõ ràng và disclaimer trung thực. Nhưng fallback chỉ 1 tầng (NEO fail → tổng đài), không có fallback trung gian. User muốn nói chuyện với người thật phải chờ NEO thất bại trước.

---

## Tổng kết 4 paths

| Path | Đánh giá | Lý do |
|------|----------|-------|
| 1. AI đúng | ✅ Tốt | Thông tin chính xác, chi tiết, nhanh |
| 2. AI không chắc | ⚠️ Trung bình | Có gợi ý menu nhưng thiếu transparency |
| 3. AI sai | ❌ **Yếu nhất** | Không có correction, feedback, hay recovery flow |
| 4. User mất tin | ⚠️ Trung bình khá | Có exit nhưng chỉ 1 tầng, phải chờ AI fail |

### Path yếu nhất: Path 3 — Khi AI sai

**Lý do:**
- Khi AI sai hoặc không hiểu, response mặc định giống nhau: "chưa có thông tin" + SĐT tổng đài. Không phân biệt được AI thật sự không biết hay AI hiểu sai câu hỏi
- Không có bất kỳ cơ chế correction nào: user không thể report sai, không thể rate, không thể đánh dấu "không hữu ích"
- Không có learning signal: NEO không thể cải thiện từ các lần bị sai vì không thu được feedback
- User bị đẩy khỏi kênh digital (chat) sang kênh analog (gọi điện) — mất toàn bộ context, phải nhắc lại từ đầu

---

## Phần 3 — Gap giữa marketing và thực tế

| | Marketing | Thực tế |
|---|-----------|---------|
| Định vị | "Trợ lý ảo" — gợi ý AI thông minh, hiểu ngôn ngữ tự nhiên | Information bot — tra cứu FAQ có script sẵn |
| Phạm vi | "Mọi thắc mắc liên quan đến hành trình, mua vé, thanh toán và nhiều tính năng khác" | Chỉ trả lời tốt câu hỏi về hành lý và quy định cơ bản |
| Mua vé | Marketing ngầm gợi ý NEO hỗ trợ mua vé | NEO không thể đặt vé, chỉ đưa link/SĐT |
| 24/7 | "Giải đáp nhanh chóng 24/7" | NEO chatbot 24/7 đúng, nhưng "Gặp tư vấn viên" có thể bận/ngoài giờ |
| Hình ảnh | Mascot thân thiện, thông minh | Chatbot cứng nhắc, phản hồi kiểu template |

**Gap lớn nhất:** Marketing dùng từ **"Trợ lý ảo"** khiến user kỳ vọng NEO hiểu ngữ cảnh và thực hiện hành động (đặt vé, thay đổi chuyến bay). Thực tế NEO chỉ là **FAQ bot** tra cứu thông tin tĩnh. Khoảng cách giữa kỳ vọng (AI agent) và thực tế (lookup bot) là nguyên nhân chính khiến user thất vọng.

---

## Phần 4 — Sketch: Cải thiện Path 3 (Khi AI sai)

### Hướng dẫn vẽ sketch (chia đôi tờ giấy)

#### BÊN TRÁI — AS-IS (Hiện tại)

Vẽ khung điện thoại có giao diện chat. Từ trên xuống:

```
┌─────────────────────────────┐
│       Vietnam Airlines      │
│─────────────────────────────│
│                             │
│  🤖 NEO hiện chưa có thông │
│     tin về cách trở thành   │
│     phi công của Vietnam    │
│     Airlines.               │
│                             │
│     Quý khách vui lòng liên │
│     hệ với Tư vấn viên     │
│     hoặc Trung tâm CSKH    │
│                             │
│     - Gọi: 1900 1100       │
│     - Gọi QT: +84 24 3832..│
│     - Email: onlinesupport │
│       @vietnamairlines.com  │
│                             │
│  ┌───────────────────────┐  │
│  │   Gặp tư vấn viên    │  │  ← Lối thoát duy nhất
│  └───────────────────────┘  │
│                             │
│  [Nhập câu hỏi...      ]   │
│  NEO có thể sai sót, hãy   │
│  kiểm tra thông tin.        │
└─────────────────────────────┘
```

Đánh dấu ❌ vào các chỗ gãy:
- ❌ Không có nút "NEO hiểu sai" hay "Không hữu ích"  
- ❌ Không gợi ý chủ đề liên quan gần nhất
- ❌ Response "chưa có thông tin" giống nhau cho mọi loại lỗi
- ❌ User phải rời chat để gọi tổng đài → mất context

Ghi chú: **Breaking point = user bị đẩy ra khỏi hệ thống, không có đường quay lại**

---

#### BÊN PHẢI — TO-BE (Cải thiện)

Vẽ khung điện thoại tương tự, nhưng cải thiện:

```
┌─────────────────────────────┐
│       Vietnam Airlines      │
│─────────────────────────────│
│                             │
│  🤖 NEO chưa tìm thấy     │
│     thông tin chính xác.    │
│                             │
│     Có phải bạn muốn hỏi   │
│     về:                     │
│  ┌─────────────────────┐    │
│  │ 📋 Tuyển dụng VNA   │    │  ← Gợi ý chủ đề gần nhất
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 🎓 Học viện hàng không│   │  ← Gợi ý thứ 2
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ ✗ Không phải ý tôi  │    │  ← NÚT MỚI: user báo AI sai
│  └─────────────────────┘    │
│                             │
│  ──── Hoặc ─────           │
│  💬 Gặp tư vấn viên        │
│  📞 Yêu cầu gọi lại (5p)  │  ← Fallback phân cấp
│  👎 Góp ý cho NEO           │  ← Thu feedback
│                             │
│  [Nhập câu hỏi...      ]   │
└─────────────────────────────┘
```

Đánh dấu ✅ vào các điểm cải thiện:
- ✅ **Gợi ý chủ đề gần nhất** thay vì im lặng "chưa có thông tin"
- ✅ **Nút "Không phải ý tôi"** → AI learn từ correction, đưa gợi ý khác
- ✅ **Fallback phân cấp**: gợi ý AI → tư vấn viên → gọi lại → góp ý
- ✅ **Nút "Góp ý cho NEO"** → thu correction signal để cải thiện

Ghi chú: **Thêm gì? Gợi ý chủ đề + nút correction + fallback nhiều tầng. Bớt gì? Bỏ wall of text SĐT/email. Đổi gì? Từ "chưa có thông tin" → "Có phải bạn muốn hỏi về..."**

---

## Tóm tắt đề xuất cải thiện

| Vấn đề hiện tại | Đề xuất | Lý do |
|-----------------|---------|-------|
| Response "chưa có thông tin" giống nhau cho mọi lỗi | Phân biệt "không hiểu" vs "chưa có dữ liệu" và gợi ý chủ đề gần nhất | User biết AI sai ở đâu, không bị bế tắc |
| Không có nút feedback | Thêm "Không phải ý tôi" + "Góp ý cho NEO" | Thu correction signal → data flywheel → AI cải thiện |
| Fallback chỉ 1 tầng | Thêm "Yêu cầu gọi lại sau 5 phút" | User không phải rời chat, giữ context |
| Không giữ context khi escalate | Tự động gửi lịch sử chat cho tư vấn viên | User không phải nhắc lại từ đầu |
