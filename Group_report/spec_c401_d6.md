# SPEC — AI Product Hackathon

**Nhóm:** Nhóm C401_D6
**Track:** ☐ VinFast · ☑ Vinmec · ☐ VinUni-VinSchool · ☐ XanhSM · ☐ Open
**Problem statement (1 câu):** Bác sĩ Vinmec gặp khó khăn khi ghi chép hồ sơ bệnh án chuẩn SOAP và tạo chỉ định cận lâm sàng trong bối cảnh thời gian ca khám chỉ vỏn vẹn 15 phút nhưng yêu cầu tiêu chuẩn JCI khắt khe, hiện họ đang phải cắm mặt gõ phím máy tính 3-5 phút mỗi ca và mang việc giấy tờ về nhà làm thêm, dẫn đến kiệt sức (burnout), thiếu giao tiếp ánh mắt với bệnh nhân, và nguy cơ hồ sơ sơ sài gây xuất toán bảo hiểm.

---

## 1. AI Product Canvas

|   | Value | Trust | Feasibility |
|---|-------|-------|-------------|
| **Câu hỏi** | User nào? Pain gì? AI giải gì? | Khi AI sai thì sao? User sửa bằng cách nào? | Cost/latency bao nhiêu? Risk chính? |
| **Trả lời** | 1. User: Bác sĩ Vinmec.<br><br>2. Pain: Mất 3-5 phút gõ hồ sơ (Pajama time), thiếu tương tác mắt với bệnh nhân.<br><br>3. AI giải quyết: Tự động chuyển hội thoại thành báo cáo SOAP, y lệnh và đơn thuốc (10-15s). Giảm thời gian hoàn thiện hồ sơ còn 30s-1p. | 1. Khi AI sai: Hệ thống chỉ tạo bản nháp (Draft), bác sĩ là người ký duyệt cuối cùng.<br><br>2. Cách sửa: Sửa nhanh qua 1-click hoặc voice-to-text.<br><br>3. Cơ chế học: Continuous Learning từ các chỉnh sửa của bác sĩ trong HIS để giảm thời gian edit xuống < 5s. Ưu tiên độ bao phủ thông tin (Recall). | 1. Chi phí phần mềm: ~$0.05/ca khám.<br><br>2. Chi phí phần cứng: 800k - 1000k/phòng (Lắp đặt micro rùa USB đa hướng).<br><br>3. Latency: < 15s cho toàn bộ báo cáo.<br><br>4. Risk: Hallucination về liều lượng thuốc; Bảo mật dữ liệu y tế (JCI/HIPAA). |

**Automation hay augmentation?** ☐ Automation · ☑ Augmentation
Justify: *Bắt buộc sử dụng Augmentation vì hậu quả của việc sai sót y khoa (chẩn đoán nhầm, kê đơn sai) là vô cùng nghiêm trọng ảnh hưởng đến tính mạng bệnh nhân và uy tín pháp lý. Do đó, không thể giao phó hoàn toàn công việc cho máy móc (Automation). AI chỉ làm vai trò drafting (gợi ý bản nháp), bác sĩ đóng vai trò Filter/Review và phê duyệt cuối cùng (Human-in-the-loop).*

**Learning signal:**

1. User correction đi vào đâu? *Bác sĩ chỉnh sửa trên bản nháp chuẩn SOAP trên HIS/EHR trước khi bấm lưu. Bản chỉnh sửa được sẽ được lưu lại và feedback lại cho agent để cho ra kết quả tốt hơn.*
2. Product thu signal gì để biết tốt lên hay tệ đi? *Thời gian thao tác chỉnh sửa của bác sĩ giảm từ 30s xuống 5-10s. Tỷ lệ chỉnh sửa bản nháp (Edit Rate).* 
3. Data thuộc loại nào? ☑ User-specific (phong cách từng bác sĩ) · ☑ Domain-specific (ngôn ngữ y khoa JCI) · ☐ Real-time · ☑ Human-judgment · ☐ Khác: ___
   Có marginal value không? (Model đã biết cái này chưa?) *Có, model sẽ cải thiện rất nhiều sau khi học được cách viết và chẩn đoán đặc thù của 1 bác sĩ theo thời gian.*

---

## 2. User Stories — 4 paths

### Feature: *Tự động ghi chép bệnh án (Clinical Scribe & SOAP Rendering)*

**Trigger:** *Bệnh nhân bước ra khỏi phòng / Bác sĩ bấm nút kết thúc ghi âm → AI xử lý audio 15 phút thành bản ghi SOAP*

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | *Bảng EHR điền sẵn S-O-A-P đầy đủ, chính xác. Các chỉ định HIS và toa thuốc có sẵn. Bác sĩ tốn 10s lướt và ấn "Duyệt".* |
| Low-confidence — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | *AI highlight hoặc để (??) ở các cụm từ chuyên khoa/triệu chứng nghe không rõ. Bác sĩ chủ động điền thủ công phần đó.* |
| Failure — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | *Thiếu thông tin bệnh nhân nói hoặc chẩn đoán bị sai lệch. Bác sĩ thấy ngay khi đọc lướt → gõ đè lại hoặc xóa đoạn sai trước khi Lưu EHR.* |
| Correction — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | *Sửa trực tiếp text field SOAP/đơn thuốc. Data ghi nhận lại (diff text) đi vào "Continuous Learning engine" để tinh chỉnh AI agent.* |


---

## 3. Eval metrics + threshold

**Optimize precision hay recall?** ☐ Precision · ☑ Recall
Tại sao? *Trong y khoa, thà "nghe thừa" (bác sĩ có thể xoá dòng dư thừa dễ dàng) còn hơn "bỏ sót" (missing) triệu chứng hay lời phàn nàn của bệnh nhân (High Recall). Bác sĩ có thể đóng vai trò lọc thông tin (Precision/Filter).*
Nếu sai ngược lại thì chuyện gì xảy ra? *Nếu optimize precision nhưng low recall, AI sẽ chỉ ghi chép những câu rất rõ ràng và bỏ qua các chi tiết nhỏ tinh tế nhưng quan trọng, khiến bác sĩ phải tự nhớ và gõ lại tốn sức hơn.*

| Metric | Threshold | Red flag (dừng khi) |
|--------|-----------|---------------------|
| *Tỷ lệ chấp thuận không cần chỉnh sửa lớn (Zero-edit rate)* | *≥ 60%* | *< 30% trong 2 tuần liên tiếp* |
| *Thời gian chỉnh sửa trung bình / bệnh án* | *≤ 45 giây* | *> 1.5 phút (bằng/kém gõ tay)* |
| *Tỷ lệ khiếu nại do hồ sơ y khoa thiếu sót* | *0%* | *> 0 trường hợp do lỗi từ AI ghi chép* |

---

## 4. Top 3 failure modes

| # | Trigger | Hậu quả | Mitigation |
|---|---------|---------|------------|
| 1 | *Phòng ồn, giọng nói quá nhỏ, lẫn tạp âm ngoài hành lang hoặc nói chèn nhau* | *AI bỏ đoạn dài, "Hallucinate" sinh văn bản không có thật hoặc nhầm lẫn ai đang nói (Bác sĩ vs Bệnh nhân)* | *Dùng model tách luồng giọng nói (Diarization) tốt; Cho phép bác sĩ thấy "bản phụ đề trực tiếp" để biết mic có đang thu đúng không.* |
| 2 | *Sinh sai chỉ định cận lâm sàng/thuốc do hiểu lầm ngữ cảnh (VD: Bác sĩ bảo "không cần X-Quang đâu")* | *Agent tạo nhầm phiếu X-Quang, gây nhầm lẫn hoặc tốn phí không cần thiết nếu bác sĩ bấm Duyệt nhầm.* | *Luôn require "1-click explicit confirmation" từ bác sĩ cho phần Plan/Orders. Đặt cảnh báo nếu thuốc sinh ra kỵ với bệnh nền.* |
| 3 | *Khó khăn trong trích xuất thuật ngữ y tế địa phương/lề thói ngôn ngữ riêng* | *Text bị rác, bác sĩ phải sửa đi sửa lại một từ nhiều lần.* | *Chức năng custom dictionary/học từ vựng cá nhân. Bác sĩ có thể gõ vào "Alias: Đau dạ dày = trào ngược".* |

---

## 5. ROI 3 kịch bản

|   | Conservative | Realistic | Optimistic |
|---|-------------|-----------|------------|
| **Assumption** | *100 bác sĩ dùng, giảm 3 phút/ca* | *500 bác sĩ dùng, giảm 4 phút/ca, tăng doanh thu từ mã hóa bệnh tật (ICD-10)* | *Trọng tâm toàn Vinmec, giảm 4.5 phút/ca, tăng 2 bệnh nhân VIP/bác sĩ/ngày* |
| **Cost** | *Chi phí server inference, build hệ thống* | *Phát triển app tích hợp HIS hoàn chỉnh, fine-tune* | *Tích hợp voice + app bệnh nhân, cloud chi phí cao.* |
| **Benefit** | *Bác sĩ bớt 1h gõ máy/ngày. Giảm "Pajama time"* | *Bác sĩ khám thêm 1 ca/buổi. Hồ sơ đủ chuẩn JCI, giảm tỷ lệ xuất toán BHYT.* | *CSAT/NPS tối đa, doanh thu mỗi bác sĩ tăng 10-15%. Không còn tình trạng bác sĩ kiệt sức.* |
| **Net** | *Dương nhẹ nhờ cải thiện vận hành nội bộ* | *Siêu lợi nhuận từ khám thêm & claim bảo hiểm chuẩn xác* | *Thay đổi diện mạo dịch vụ khám bệnh Premium* |

**Kill criteria:** *Khi nào nên dừng? Tỉ lệ bác sĩ tắt AI và quay lại gõ tay thủ công > 40%; Hoặc xảy ra sự cố sai lệch y khoa nghiêm trọng không thể khắc phục cấu trúc.*

---

## 6. Mini AI spec (1 trang)

**Tên sản phẩm:** AI Agent Trợ lý Ghi chép Y khoa (Clinical Scribe Agent)
**Mục tiêu:** Giải phóng bác sĩ Vinmec khỏi gánh nặng hành chính, "trả lại" ánh mắt và sự thấu cảm cho bệnh nhân (Premium Patient Experience) đồng thời bảo vệ Bác sĩ chống lại suy kiệt nghề nghiệp (Burnout).

**Sản phẩm giải quyết việc gì, cho ai?**
- Cho Bác sĩ: Giảm 70-80% thời gian gõ hồ sơ (3-5 phút/ca xuống còn 1 phút/ca), kết thúc tình trạng đem việc giấy tờ về nhà ("Pajama time").
- Cho Bệnh nhân: Thấy bác sĩ lắng nghe và thấu cảm 100%, sau khám nhận ngay hướng dẫn dùng thuốc dễ hiểu theo tiếng Việt trên App thành viên.
- Cho Quản trị (Ban giám đốc Vinmec): Đảm bảo chất lượng hồ sơ chuẩn SOAP và yêu cầu khắt khe của JCI; Mã hóa bệnh tật ICD-10 chính xác bảo vệ doanh thu (Revenue Integrity); Tăng công suất khám từ 2-3 bệnh nhân VIP/bác sĩ/ngày.

**AI làm gì (Automation or Augmentation)?**
- **Augmentation (hỗ trợ cốt lõi):** AI lắng nghe suốt 15 phút, tự hoàn tất bản thảo hồ sơ y tế chuẩn SOAP với tốc độ 10-15s sau ca khám. Bác sĩ đứng vai trò "Duyệt" và chỉnh sửa.
- **Workflow Automation:** Dựa trên "Plan" (Kế hoạch), AI tự soạn lệnh cận lâm sàng (ví dụ: Tạo phiếu Xét nghiệm máu, X-Quang trên HIS) và dịch thuật ngữ lập toa thuốc thành hướng dẫn dễ hiểu cho bệnh nhân.

**Quality & Learning Flywheel (Continuous Learning)**
- Tối ưu hóa **Recall**. Ghi nhận đủ mọi triệu chứng để bác sĩ không bị lọt thông tin.
- Hệ thống có biên lai học hỏi (feedback loop) cực tốt: Khi bác sĩ sửa các bản thảo SOAP, model sẽ thu nhận thao tác này (Data: domain-specific & user-specific) để học phong cách hành văn và thói quen dùng thuốc của đích danh bác sĩ đó. Thời gian chỉnh sửa tương lai sẽ rút dần từ 30s xuống 5-10s.

**Risk chính & Mitigation:**
- Môi trường nhiễu âm thu nhầm giọng người khác, AI tự bịa thông tin. Giảm thiểu bằng việc yêu cầu Bác sĩ duyệt một cách tường minh trước khi "Lưu vào hệ thống EHR" và cơ chế phát hiện hội thoại không rõ ràng (low-confidence flags).
```