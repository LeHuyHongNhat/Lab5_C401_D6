# AI Product Canvas: Clinical Scribe (Trợ lý AI Tạo Hồ Sơ Bệnh Án)

---

## 1. Canvas

|   | Value | Trust | Feasibility |
|---|-------|-------|-------------|
| **Câu hỏi guide** | User nào? Pain gì? AI giải quyết gì mà cách hiện tại không giải được? | Khi AI sai thì user bị ảnh hưởng thế nào? User biết AI sai bằng cách nào? User sửa bằng cách nào? | Cost bao nhiêu/request? Latency bao lâu? Risk chính là gì? |
| **Trả lời** | - **User:** Bác sĩ khám bệnh (Vinmec).<br>- **Pain:** Tốn 3-5 phút gõ hồ sơ sau mỗi ca khám, tổng cộng 1-2 tiếng mỗi ngày (gọi là "Pajama Time"). Khi khám phải cắm mặt gõ phím, giảm giao tiếp bằng mắt với bệnh nhân (KH VIP phàn nàn).<br>- **Khác biệt (AI giải quyết):** AI nghe toàn bộ cuộc thoại rồi tự đẩy dữ liệu vào đúng form JCI (Bệnh sử, Khám, Chỉ định). Bác sĩ có lại toàn bộ thời gian khám để tập trung nghe & nhìn bệnh nhân. | - **Ảnh hưởng:** AI nghe nhầm liều thuốc hoặc bịa triệu chứng (Hallucination) dẫn đến rủi ro y khoa chết người, sai chuẩn hồ sơ bảo hiểm.<br>- **Cách user biết AI sai:** Các trường dữ liệu phức tạp hoặc AI nghi ngờ (ví dụ: Tên Thuốc, Chỉ định xét nghiệm, Thông tin ngoại lệ) sẽ được bôi sáng màu VÀNG và cảnh báo bằng dấu `(??)`.<br>- **Cách sửa:** Giao diện có sẵn nút Accept/Reject cho các cụm từ bôi vàng. Bác sĩ có thể chỉnh sửa đè text bằng tay (Overwrite) trực tiếp trên form trước khi nhấn nút "Lưu HIS". | - **Cost:** Ước tính ~$0.05 / request (bao gồm API Whisper + LLM prompt). Rất rẻ so với tiền lương bác sĩ.<br>- **Latency:** Xử lý đoạn thoại 3-5 phút mất khoảng 5 - 10 giây (Whisper trans) + 10 giây (LLM extraction) -> Tổng độ trễ dưới 30 giây.<br>- **Risk:** Voice nhận diện kém ở môi trường ồn hoặc tiếng vùng miền; Rủi ro lộ dữ liệu nhạy cảm (Privacy); Bác sĩ không thèm đọc lại mà ấn "Lưu" luôn dẫn đến sai sót (Automation bias). |

---

## 2. Automation hay augmentation?

- [ ] Automation — AI làm thay, user không can thiệp
- [x] **Augmentation — AI gợi ý, user quyết định cuối cùng**

**Justify:** 
Ngành Y tế đòi hỏi trách nhiệm pháp lý 100% nằm ở người ký (Bác sĩ). AI không có chứng chỉ hành nghề, do đó AI chỉ đóng vai trò "người thư ký y khoa điện tử" soạn nháp văn bản. Việc đọc lại, chỉnh sửa và quyết định lưu dữ liệu nằm hoàn toàn ở tay bác sĩ. Nếu thiết kế Automation thì sẽ vi phạm tiêu chuẩn quản lý rủi ro y khoa.

---

## 3. Learning signal (Tín hiệu phản hồi để AI học)

| # | Câu hỏi | Trả lời |
|---|---------|---------|
| 1 | User correction đi vào đâu? | Đi vào một bảng Database riêng (Log Table): So sánh bản nháp AI (Before) và bản bác sĩ đã sửa/lưu (After) (Data pair: Âm thanh - Text sau sửa). |
| 2 | Product thu signal gì để biết tốt lên hay tệ đi? | 1. **Edit Distance / Tỉ lệ Reject:** Số từ bác sĩ phải xóa/gõ lại trên mỗi ca.<br>2. **Thời gian review:** Ban đầu mất 40s đọc, sau giảm còn 10s chứng tỏ AI viết chuẩn văn phong hơn.<br>3. **Feedback Rating:** Nút Thumbs Up/Down ở cuối ngày. |
| 3 | Data thuộc loại nào? | - [x] Domain-specific (Văn phong bệnh viện Vinmec, chuẩn JCI)<br>- [x] Human-judgment (Bác sĩ chuyên khoa check và quyết định)<br>- Yếu tố khác: Data hội thoại thật cực kỳ quý hiếm. |

**Có marginal value không? (Model đã biết cái này chưa? Ai khác cũng thu được data này không?)**
> **Có (Very High Marginal Value).** Chatbot/LLM thông thường như GPT-4 không thể tự biết phong cách viết SOAP, cách dùng từ địa phương, mã ICD-10 quy ước riêng, cũng như danh mục thuốc nội bộ. Việc tích lũy kho dữ liệu Audio-to-SOAP được chuyên gia xác thực (Human-expert verification) tạo ra con hào bảo vệ (Moat) độc quyền cho Vinmec, các hãng bên ngoài rất khó sao chép được do bị vướng rào cản bảo mật y tế HIPAA/Luật Khám chữa bệnh.

# User Stories — 4 Paths: Clinical Scribe

Dưới đây là kịch bản trải nghiệm người dùng (UX) cho tính năng cốt lõi của hệ thống Clinical Scribe, được thiết kế bao phủ cả 4 tình huống xảy ra khi tương tác với AI Y tế.

---

## Tính năng: AI Trích xuất & Điền tự động hồ sơ bệnh án (Voice-to-SOAP)

**Trigger:** Bác sĩ bật mic ghi âm hội thoại cuộc khám → Kết thúc, nhấn nút "Tạo hồ sơ" → AI (Whisper + LLM) xử lý pipeline → Render thông tin đã điền lên các trường (Bệnh sử, Khám lâm sàng, Chỉ định xét nghiệm/Thuốc).

| Path | Câu hỏi thiết kế | Mô tả chi tiết |
|------|-------------------|-------|
| 🟢 **Happy**<br>*(AI đúng, tự tin)* | User thấy gì? Flow kết thúc ra sao? | Màn hình hiển thị đầy đủ thông tin bệnh án, câu văn trôi chảy, đúng chuẩn form ICD-10. Không có từ ngữ nào bị đánh dấu lấp lửng. Bác sĩ chỉ mất 20-30s đọc lướt, thấy hoàn hảo, nhấn "Lưu HIS" và xong ca khám. |
| 🟡 **Low-confidence**<br>*(AI không chắc chắn)* | System báo "không chắc" bằng cách nào? User quyết thế nào? | Bệnh nhân dùng từ địa phương khó hiểu hoặc đọc một tên thuốc hiếm/phát âm sai, microphone rè. Hệ thống map text nhưng **bôi nền màu VÀNG** kèm ký hiệu `(??)`. Bác sĩ lúc lướt duyệt sẽ bị thu hút sự chú ý vào điểm vàng này → tự định hình lại và sửa đổi, hoặc ấn "Accept" nếu AI đoán trúng. |
| 🔴 **Failure**<br>*(AI sai/Hallucinate)* | User biết AI sai bằng cách nào? Recover ra sao? | AI bị "ảo giác" (Hallucinate) tự chế ra liều thuốc 500mg thành 5000mg, hoặc bệnh nhân "không ho" thành "có ho kéo dài". Bác sĩ duyệt lại văn bản trích xuất trực tiếp trên màn hình, phát hiện sự vô lý so với biểu hiện thực tế. Bác sĩ recover bằng cách bôi đen xoá cụm từ sai đó đi, và tự type đè lại liều lượng đúng. |
| 🔵 **Correction**<br>*(User can thiệp sửa)* | User sửa bằng cách nào? Data đó đi vào đâu? | Bác sĩ dùng chuột nhấn Reject các highlight vàng, hoặc tự gõ text mới (Overwrite) trực tiếp trên các trường Input Field của giao diện. Toàn bộ hành vi "xóa/sửa text" này được API bắt lại `(Text Draft AI) vs (Text Final Bác sĩ)` và lưu thẳng vào table `correction_logs` làm data pair, tự động dùng cho pipeline Fine-tuning định kỳ cuối tuần. |

---

## Mở rộng - Edge Cases (Các tình huống biên)

Dưới đây là 3 tình huống biên ngoài luồng mà AI Clinical Scribe có thể gặp trở ngại tại phòng khám Vinmec:

| Edge case | Dự đoán AI sẽ xử lý thế nào | UX nên phản ứng ra sao |
|-----------|------------------------------|------------------------|
| **1. Bệnh nhân nói tiếng lóng vùng miền / khó nghe** *(VD: "đau con trối", "tức cái lồng ngực")* | Whisper nhận diện thành text thô nhưng LLM không map được vào chuẩn Y khoa ICD-10. | Hệ thống bôi vàng nguyên text tiếng lóng, LLM để trống phần mã bệnh. UX hiện tooltip: *"Ngôn ngữ chưa rõ nghĩa, vui lòng bác sĩ chuẩn hóa thủ công."* |
| **2. Tạp âm có đối thoại dư thừa** *(VD: Người nhà bệnh nhân mắng mỏ nhau chen vào lúc bác sĩ khám)* | LLM có thể bị nhiễu context (distraction) và đưa luôn chuyện gia đình vào "Bệnh sử". | Yêu cầu LLM Prompt quy định nghiêm ngặt chỉ trích xuất "triệu chứng y khoa định lượng". Nếu AI vẫn lỡ trích xuất rác, UI cho phép bác sĩ highlight một cụm lớn và bấm xoá nhanh bằng 1 click. |
| **3. Cuộc khám quá ngắn** *(VD: Bệnh nhân chỉ vào xin lại đơn thuốc cũ, không khám)*| Âm thanh dưới 30s. Mở LLM bóc dữ liệu sẽ bị thiếu hầu hết các trường Required như "Khám lâm sàng". | UX hiển thị cảnh báo nhẹ: *"Cuộc hội thoại quá ngắn, AI chưa thu thập đủ thông tin form chuẩn JCI. Vui lòng tự bổ sung phần Khám Lâm Sàng để được phép Lưu."* |

---

# Eval Metrics + Threshold: Clinical Scribe

Bộ chỉ số đánh giá (Evaluation) và các ngưỡng (Threshold) dành riêng cho hệ thống AI tạo hồ sơ bệnh án, xác định độ an toàn y khoa trước khi đưa vào bệnh viện.

---

## 1. Định hướng tối ưu: Precision hay Recall?

- [ ] Precision (Độ chuẩn xác)
- [x] **Recall (Độ bao phủ)** — AI thu thập và ghi nhận đầy đủ tất cả thông tin, triệu chứng y khoa xuất hiện trong cuộc hội thoại.

**Tại sao ưu tiên Recall?**
Trong bài toán Clinical Scribe cho bác sĩ, việc ưu tiên Recall mang lại ý nghĩa sống còn cho tính năng Augmentation (trợ lý):
1. **Tránh bỏ sót thông tin y khoa quan trọng:** Trong chẩn đoán, việc bỏ lỡ một triệu chứng nhỏ hoặc lời phàn nàn của bệnh nhân (Low Recall) có nguy cơ gây sai lệch chẩn đoán cực cao. Một hồ sơ đầy đủ giúp bác sĩ có cái nhìn toàn diện nhất.
2. **Thao tác xóa nhanh hơn thao tác gõ mới:** AI soạn nháp để bác sĩ duyệt. Nếu AI ghi thừa, bác sĩ chỉ mất 1-2 giây để bôi đen và xóa. Ngược lại, nếu AI bỏ sót, bác sĩ phải lục lại trí nhớ và tốn 30-60 giây để gõ lại từ đầu, làm hao hụt thời gian tiết kiệm được.
3. **Bác sĩ là bộ lọc Precision hoàn hảo nhất:** Con người (nhất là chuyên gia y tế) lọc nhiễu và xác thực (Precision) rất tốt nhưng lại có giới hạn về khả năng ghi nhớ chi tiết một đoạn hội thoại dài. AI đóng vai trò ghi chép đầy đủ (Recall), để bác sĩ làm bộ lọc. Các thông tin AI trích xuất nhưng độ chắc chắn thấp (Precision thấp) sẽ được **tự động bôi vàng `(??)`** để bác sĩ tập trung review và sửa lại nhanh chóng.
4. **Giảm áp lực ghi nhớ:** Ưu tiên Recall giúp bác sĩ trút bỏ gánh nặng ghi nhớ, hoàn toàn yên tâm 100% hướng mắt về phía bệnh nhân (eye-contact).

---

## 2. Bảng Metrics & Thresholds Chính

| Metric (Chỉ số đo lường) | Threshold (Ngưỡng đạt chuẩn) | Red flag (Báo động đỏ - Dừng hệ thống) |
|--------|-----------|---------------------|
| **Recall (Tỉ lệ bao phủ thông tin)** - Số triệu chứng, chỉ định AI bắt được so với số lượng thực tế nói trong ca khám | ≥ 95% | **< 85%** (AI bỏ sót quá nhiều thông tin, bác sĩ phải tự gõ lại mất thời gian). |
| **WER (Word Error Rate)** của module Whisper trên từ vựng Y khoa | < 5% (Sai số dưới 5 từ trên 100 từ) | **> 15%** liên tục 3 ngày (Hệ thống Whisper bị điếc do môi trường nhiễu hoặc sai biệt dược trầm trọng). |
| **Accuracy (Pydantic Schema Match)** - Tỉ lệ AI điền đúng format quy định của bệnh viện | ≥ 98% | **< 90%** (LLM không tuân thủ JSON/Pydantic, trả về text lộn xộn khiến HIS không đọc được). |
| **Edit Distance (Correction Rate)** - Số lượng ký tự/từ bác sĩ phải gõ đè để sửa đổi sau khi AI tạo nháp | < 10% (Bác sĩ chỉ phải sửa rất ít) | **> 30%** (Bác sĩ thà tự gõ từ đầu còn nhanh hơn ngồi đi fix lỗi cho AI). |
| **Critical Hallucination Rate** - Tỉ lệ AI tự bịa ra Thuốc/Liều lượng hoặc Tiền sử bệnh mà trong File Ghi âm KHÔNG HỀ CÓ | **0% (Zero Tolerance)** | **> 0% (Dù chỉ 1 ca sai)** → Buộc phải tạm dừng để rào lại Prompt và cảnh báo Human-in-the-loop. |
| **Time-saved per Session** - Giải quyết mục tiêu "Pajama Time" | Tiết kiệm ≥ 70% thời gian gõ so với trước đây (từ 3p xuống <1p). | **< 30%** (Sài AI mà vẫn chậm như tự gõ máy). |

---

## 3. Mở rộng: User-facing metrics vs Internal metrics

Không phải mọi thứ đo lường đều hiển thị lên giao diện của bác sĩ. 

| Metric | User (Bác sĩ) có thấy không? | Mục đích sử dụng |
|--------|-----------|-----------------|
| **Confidence Score (Độ tự tin của LLM)** | ☑️ Có (Dưới dạng mã màu) | Mức độ < 80% sẽ hiển thị highlight Vàng và biển báo `(??)` để ép bác sĩ phải đọc kỹ. |
| **Response Latency (Thời gian load AI)** | ❌ Không hiện con số ms | Tránh làm phiền, chỉ hiển thị "Skeleton loading" khi request tốn trên 3s. |
| **Edit Distance (Độ dài đoạn text bác sĩ tự sửa)** | ❌ Không hiện | Logs đưa thẳng về DB của team Product để tính toán độ hiệu quả và Fine-tune lại mô hình. |

---

## 4. Offline Eval vs Online Eval

Hệ thống được giám sát liên tục theo 2 phase:

| Loại | Thời điểm | Cách thức đo & Metric | Ví dụ thực tế |
|------|---------|-------|-------|
| **Offline Eval** | Trước khi Deploy (Staging) | Đo Precision/Recall trên tập dataset 500 file ghi âm bác sĩ thật. Chấm điểm ROUGE score so với hồ sơ chuẩn của trưởng khoa. | Cứ mỗi lần update version LLM hoặc Prompt mới, tự động chạy qua tập test 500 ca này xem có bị Hallucinate thuốc không. |
| **Online Eval** | Sau khi Deploy (Production) | Đo Telemetry từ hành vi thật của bác sĩ (Accept/Reject, Edit Distance, Time to Save). | Sau 1 tuần, query bảng `correction_logs` xem bác sĩ phải sửa phần "Khám Lâm Sàng" nhiều nhất hay phần "Bệnh Sử". Nếu bác sĩ bấm "Thumbs Down" liên tục -> Kiểm tra lại prompt. |


# Top 3 Failure Modes: Clinical Scribe

Dưới đây là 3 kịch bản lỗi (Failure Modes) nguy hiểm nhất có thể xảy ra khi triển khai AI Clinical Scribe tại bệnh viện, tập trung vào những lỗi **bác sĩ có thể không nhận ra ngay lập tức**.

> **Nguyên tắc thiết kế:** "Lỗi nguy hiểm nhất không phải là hệ thống sập, mà là hệ thống chạy mượt nhưng chèn sai thông tin y tế mà người dùng (Bác sĩ) nhắm mắt bấm Lưu."

---

## 1. Bảng Failure Modes Chính

| # | Trigger (Nguyên nhân kích hoạt) | Hậu quả (Tác động thực tế) | Mitigation (Biện pháp phòng/chống) |
|---|---------|---------|------------|
| 1 | **Hallucination Y khoa âm thầm:** Bệnh nhân nói "không bị dị ứng thuốc", hoặc phòng khám quá ồn khiến Whisper nghe nhầm. LLM tự động "bịa" ra bệnh nhân có tiền sử dị ứng, hoặc tự ý thay đổi liều lượng (vd: 10mg thành 100mg). | **Cực kỳ nguy hiểm (Sai lệch chẩn đoán & Chỉ định).** Bác sĩ lướt qua quá nhanh (Automation Bias) không đọc kỹ, lưu vào HIS. Bệnh nhân sau đó bị sốc thuốc hoặc bị từ chối bảo hiểm do sai tiền sử bệnh. | 1. Ép output LLM vào **Pydantic Schema** nghiêm ngặt.<br>2. **UI/UX rào cản:** Bất kỳ thông số định lượng nào (Liều lượng, Tên thuốc biệt dược, Mã ICD) đều bị **bôi VÀNG `(??)`** để bẻ gãy quán tính đọc lướt, ép bác sĩ phải dừng mắt lại nhấn review.<br>3. Giữ nguyên chức năng Augmentation (Bác sĩ CHỊU TRÁCH NHIỆM ký duyệt), tuyệt đối không làm Auto-save. |
| 2 | **Low Recall (Bỏ sót triệu chứng mấu chốt):** Bệnh nhân nói tiếng địa phương lóng, nói quá nhanh, hoặc giọng lí nhí. AI tóm tắt (Summarize) quá tay, lọc mất các "nhánh thông tin phụ" nhưng thực chất lại là triệu chứng chỉ điểm của một bệnh hiếm. | **Nguy hiểm bậc trung (Chẩn đoán thiếu).** Hồ sơ bệnh án bị nghèo nàn. Nếu bác sĩ không nhớ để gõ bổ sung, các bác sĩ tuyến sau đọc lại hồ sơ sẽ bị thiếu dữ liệu chẩn đoán phân biệt. | 1. Trong Prompt LLM, đặt System Instruction: *"Không được tóm tắt làm mất các Keyword y khoa, ưu tiên trích xuất nguyên văn (Verbatim) các danh từ chỉ triệu chứng."*<br>2. Giao diện luôn có Box Text cho phép bác sĩ **gõ bổ sung nhanh** vào form đang điền dở. |
| 3 | **Hệ thống sập/Quá tải API (Downtime):** Mạng bệnh viện chập chờn, API Whisper/LLM cloud bị timeout do quá tải vào giờ cao điểm sáng thứ 2. | **Gián đoạn quy trình (Bác sĩ bức xúc).** Bác sĩ đã quen không gõ máy tính, đột nhiên AI quay mòng mòng 1 phút không ra chữ. Khám xong bệnh nhân mà hồ sơ vẫn trắng trơn, gây ùn tắc phòng khám. | 1. Đặt **Timeout = 15 giây**. Nếu quá 15s API không trả kết quả, UX phải báo lỗi NGAY LẬP TỨC: *"Kết nối AI gián đoạn, vui lòng chuyển qua gõ tay"*, tránh để bác sĩ chờ đợi mù quáng.<br>2. Có nút "Dừng AI" để bác sĩ giành lại quyền chủ động gõ phím ngay lập tức. |

---

## 2. Mở rộng: Ma trận Severity × Likelihood

Xếp hạng độ ưu tiên xử lý cho 3 lỗi trên để team Dev căn bổ nguồn lực:

```text
            Likelihood (Khả năng xảy ra)
            Thấp                     Cao
          ┌────────────────────┬────────────────────┐
          │                    │                    │
Severity  │  Monitor + Plan    │  FIX BẰNG MỌI GIÁ  │
(Hậu quả) │  (Mode 3: API sập) │  (Mode 1: Bịa thuốc│
Cao       │                    │   + Hallucination) │
          │                    │                    │
          ├────────────────────┼────────────────────┤
          │                    │                    │
Severity  │  Accept (By Design)│  Xử lý UI/UX       │
Thấp      │                    │  (Mode 2: Bỏ sót   │
          │                    │   tin do giọng lạ) │
          └────────────────────┴────────────────────┘
```

**Nhận định Mức độ Ưu tiên:**
- **Mode 1 (Hallucination)** nằm ở ô ĐỎ MÁU (High Severity x High Likelihood với LLM hiện nay). Bắt buộc phải dồn 80% công sức Dev UI để làm tính năng "Bôi Vàng & Accept/Reject" cảnh báo bác sĩ.
- **Mode 2 (Bỏ sót do giọng lạ)** xảy ra thường xuyên nhưng hệ quả thấp hơn vì bác sĩ dễ dàng gõ bù thêm. 

---

## 3. Adversarial / Misuse Scenarios (Lạm dụng hệ thống)

Ngoài lỗi do AI, hệ thống cũng cần cẩn thận hành vi lạm dụng từ chính người dùng:

| Scenario (Hoàn cảnh lạm dụng) | Hậu quả | Phòng tránh (Mitigation) |
|----------|---------|-------------|
| **Bác sĩ làm biếng (Over-reliance):** Bác sĩ ỷ lại hoàn toàn vào AI, không thèm khám kỹ mà cứ bật mic nói vơ vào vài câu để AI tự phịa ra 1 hồ sơ mĩ miều đối phó với JCI. | Hồ sơ bệnh án thành văn mẫu sáo rỗng, chất lượng khám thực tế đi xuống nhưng giấy tờ vẫn đẹp. | Đo đạc **Audio Length**. Nếu file ghi âm < 15 giây mà AI lại gen ra 1 đoạn dài ngoằng, đánh flag "Bất thường" lên hệ thống quản lý của Trưởng khoa. |
| **Thêm thắt để lách Luật Bảo Hiểm:** Bác sĩ cố tình đọc to các triệu chứng KHÔNG CÓ thật vào mic (vd: "đau dạ dày dữ dội") để hợp thức hóa việc kê đơn thực phẩm chức năng moi tiền BHYT. | AI vẫn ghi nhận trung thực (vì nó nghe thấy). Bệnh viện thất thoát quỹ bảo hiểm do bị xuất toán. | Lưu trữ **File Audio gốc** kèm theo Log text. Khi BHYT thanh tra, có thể lấy băng ghi âm ra đối chiếu rành rọt tiếng bác sĩ tự đọc hay thực sự là lời bệnh nhân mô tả. |


# 5. Phân Tích Kịch Bản ROI (Return On Investment)

*(Tham khảo Format chuẩn trong 01-spec-template.md - Phần 5)*

**Bối cảnh chung (Assumption cơ sở):**
- Số ca khám/nửa ngày của 1 bác sĩ Vinmec: ~15 ca.
- Thời gian gõ máy tính mỗi ca bệnh: 3 - 5 phút.
- Chi phí đầu tư (Cost): 
  - Phần cứng: ~800k - 1,000k VND (Micro đa hướng/phòng khám).
  - Phần mềm/API Inference (Whisper + LLM Gen SOAP): Ước tính ~$0.05/ca khám.
    - **Phân tách chi tiết phí $0.05:**
      - **Whisper (Speech-to-Text):** Trung bình một ca khám kéo dài 3-5 phút, tính phí ~$0.006/phút -> Tổng khoảng ~$0.02 - $0.03.
      - **LLM (SOAP Generation):** Prompt trung bình và Output tiêu tốn khoảng 2,000-3,000 tokens. Với mức giá (ví dụ GPT-3.5 hoặc Claude Haiku) khoảng $0.001 -> $0.015/1k token -> Tổng khoảng ~$0.02 - $0.03.
      - **Tổng cộng:** $0.03 (Audio) + $0.02 (Text) = ~$0.05 / ca khám.
  - Phí Server & Vận hành tích hợp (O&M): Chi phí cố định hàng tháng. Bệnh viện đã có sẵn hệ thống HIS và đội ngũ IT, chi phí này được tối ưu đáng kể:
    - **Tiết kiệm:** Dùng lại được hạ tầng Data Center, đội ngũ Helpdesk nội bộ, giảm thiểu phí lưu trữ cơ sở dữ liệu (chỉ lưu text SOAP rất nhẹ).
    - **Trọng tâm phát sinh mới:** Chi phí đầu tư hoặc thuê Server GPU (ví dụ NVIDIA A100/RTX 4090, Cloud GPU) để tải mô hình AI; và phí duy trì phần mềm Middleware (API tích hợp) đẩy kết quả SOAP từ AI vào HIS cũ.
    C

---

### Bảng ROI 3 Kịch Bản
| Biến số/Kịch bản | Conservative (Tối thiểu/Bảo thủ) | Realistic (Thực tế) | Optimistic (Khả quan) |
|---|-------------|-----------|------------|
| **Assumption** | *Phạm vi:* Áp dụng nhỏ giọt cho 20 bác sĩ.<br>*Hiệu quả:* Giảm được 50% thời gian gõ hồ sơ (còn 2 phút/ca).<br>*Tỷ lệ hài lòng:* 50%. Bác sĩ chưa quen văn phong AI. | *Phạm vi:* Triển khai toàn bệnh viện lớn (VD: Vinmec Times City) - 100 bác sĩ.<br>*Hiệu quả:* AI học được phong cách (Continuous Learning), giảm 80% thời gian gõ, duyệt trong 30s/ca.<br>*Tỷ lệ hài lòng:* 75%. | *Phạm vi:* Phủ toàn bộ hệ thống Vinmec (500 phòng khám).<br>*Hiệu quả:* AI thay thế gần như hoàn toàn "Pajama Time", bác sĩ chỉ mất 10s duyệt/ca.<br>*Tỷ lệ hài lòng:* >90%. |
| **Cost** | - Phần cứng: 20 triệu VNĐ.<br>- API: ~$30/ngày (20 bác sĩ x 30 ca/ngày x $0.05).<br>- Phí đào tạo: Cao, bù lại O&M bằng 0 (chạy Cloud). | - Phần cứng: 100 triệu VNĐ.<br>- API: ~$150/ngày (3,000 ca x $0.05).<br>- Phí bảo trì/nhân sự: $500/tháng.<br>- Tổng O&M: ~$5,000/tháng. | - Phần cứng: 500 triệu VNĐ.<br>- API: ~$750/ngày (15,000 ca x $0.05) ~ $22,500/tháng.<br>- Thuê nguyên cụm Server GPU nội bộ (O&M ~ $5,000/tháng). |
| **Benefit (Lợi ích)** | Bác sĩ tiết kiệm được 45 phút - 1 tiếng/ngày. Tinh thần của nhân viên y tế ổn định hơn, giảm Burnout. | - Tiết kiệm gần 2 tiếng/ngày.<br>- **Chuẩn y khoa:** Hồ sơ đầy đủ chứng từ (JCI) -> Tỷ lệ hồ sơ BHYT bị xuất toán (từ chối chi trả) giảm rõ rệt.<br>- Hồ sơ chuẩn hóa ICD-10 giúp thanh toán nội bộ mượt mà hơn. | - Tiết kiệm được đủ thời gian để bác sĩ **nhận thêm 2 bệnh nhân VIP/ngày/phòng**.<br>- Trải nghiệm khách hàng Premium (mắt đối mắt, trọn vẹn sự chú ý) cao nhất -> Tăng tỷ lệ quay lại của KH hạng sang.<br>- Thu tăng trực tiếp lên đến hàng tỷ đồng mỗi tháng. |
| **Net (ROI thực nhận)** | Hòa vốn hoặc lãi nhẹ. Tuy nhiên Value về tinh thần (Clinician Well-being) là rất lớn. | Bệnh viện không những giảm được thất thoát doanh thu từ claim bảo hiểm mà còn tạo lợi thế cạnh tranh rất lớn trên thị trường Y tế 5 sao. | Siêu lợi nhuận. ROI vượt trên 300% nhờ việc tăng công suất/tần suất phục vụ trên một ghế khám (Room Utilization) mà chi phí nhân sự giữ nguyên. |

---

### Tiêu Chí Ngừng Dự Án (Kill Criteria)
Đây là các tín hiệu báo động đỏ (Red Flags) buộc Ban Giám Đốc và nhóm phát triển phải tạm dừng (hoặc gỡ bỏ hoàn toàn dự án) để đánh giá lại:

1. **Kháng cự từ User (Low Adoption):** Tỉ lệ bác sĩ tắt chế độ AI và quay lại gõ tay truyền thống vọt lên trên 40%. Nguyên nhân có thể do UX quá tệ hoặc văn phong AI đưa ra liên tục gặp lỗi khiến bác sĩ mất nhiều thời gian fix hơn tự gõ.
2. **Tràn chi phí API (Cost Overrun):** Chi phí API token phát sinh vượt quá % số tiền tiết kiệm được từ thời gian (hoặc phát sinh quá $1,000/5,000 ca bệnh) liên tục trong 2 tháng mà không có chiều hướng giảm từ Caching/Fine-tuning.
3. **Thảm họa Y khoa (Clinical Hazard):** Phát hiện >= 1 ca bệnh mà hệ thống AI ghi nhận nhầm/bịa đặt chỉ định thuốc nghiêm trọng (VD: Hallucinate liều lượng/hoạt chất), *và hệ thống cảnh báo (Human-in-the-loop)* của Review Bác sĩ cũng vô tình để lọt lỗi đó.

# Mini AI Spec: Clinical Scribe (Trợ lý Tạo Hồ Sơ Bệnh Án)

📝 **Vấn đề & Mục tiêu (Problem & Value)**
Bác sĩ Vinmec hiện đang mất từ 1 đến 2 tiếng mỗi ngày chỉ để cắm mặt vào máy tính tự gõ hồ sơ bệnh án sau mỗi ca khám (gọi là "Pajama Time"). Việc này vừa gây áp lực dễ dẫn tới "Burnout" cho nhân viên y tế, vừa làm trải nghiệm của bệnh nhân VIP bị giảm sút vì bác sĩ không có thời gian giao tiếp bằng mắt.
**Clinical Scribe** ra đời như một "Trợ lý Thư ký điện tử". Cốt lõi của sản phẩm là khả năng "lắng nghe" cuộc hội thoại thông thường giữa bác sĩ và bệnh nhân, sau đó tự động bóc tách (Extract) từ khóa và dịch chúng ra ngôn ngữ chuẩn y khoa (chuẩn JCI, mã ICD-10) để điền sẵn vào các Box của hệ thống Bệnh viện (HIS). Hệ thống giúp giảm thời gian soạn hồ sơ từ 3 phút/ca xuống còn 30 giây duyệt/ca.

🤖 **Tính chất tương tác AI (Augmentation vs Automation)**
Đây hoàn toàn là hệ thống **Augmentation (Trợ lực)**. Do rào cản pháp lý và tính mạng y khoa, mọi quyết định lưu bệnh án đều thuộc trách nhiệm của Bác sĩ. AI chỉ đóng vai trò "Viết nháp" (Drafting).

🎯 **Đo lường & Chỉ tiêu tối ưu (Evaluation Metrics & Threshold)**
Hệ thống ưu tiên optimize **Recall** (Độ bao phủ) lên trên 95%. Bác sĩ cần một cuốn hồ sơ nháp đầy đủ triệu chứng để rà soát thay vì một văn bản gọn lỏn nhưng bị thiếu sót thông tin quan trọng. Quá trình xoá đoạn thừa chỉ tốn 2 giây, nhưng việc ngồi ngẫm nghĩ gõ lại phần thiếu sẽ phá vỡ mục tiêu tiết kiệm thời gian ban đầu. Về STT, Word Error Rate (WER) bắt buộc phải luôn < 5%. 

⚠️ **Rủi ro cốt tử (Top Failure Mode & Mitigation)**
Tử huyệt của GenAI trong y tế là bịa đặt thông tin (Hallucination) - ví dụ bịa thêm liều lượng thuốc hoặc tự gắn cho bệnh nhân một căn bệnh mà họ không có, dẫn đến shock thuốc hoặc lách luật bảo hiểm. Để trị rủi ro này, UI/UX buộc phải ra tay: Bất kỳ phần thông số thuốc hoặc thông tin LLM có Confidence Score thấp đều bị hệ thống ép **BÔI NỀN VÀNG `(??)`** chói lọi. Bác sĩ lúc đọc lướt sẽ bị chặn lại ở các cụm màu vàng, bắt buộc phải dùng nút *"Accept"* hoặc *"Reject"* bằng tay. 

🔄 **Vòng lặp Dữ liệu (Data Flywheel)**
Hệ thống sinh ra **High Marginal Value** thông qua hành vi "Correction" của user. Mỗi khi bác sĩ sửa một cụm từ hoặc ấn Reject trên màn hình, hệ thống sẽ thu về một cặp dữ liệu (Data Pair): `[Đoạn nháp AI viết] -> [Đoạn text Bác sĩ sửa lại chuẩn y khoa]`. Bảng log này là kho báu độc quyền, giúp bệnh viện sở hữu tệp Dữ liệu Đào tạo Đội chuyên gia (Domain-specific & Human-judgment Data). Hàng tuần, dữ liệu này dùng để Fine-tune model, giúp AI viết ngày càng "trâu" và mang đậm văn phong riêng của vị trưởng khoa bệnh viện.
