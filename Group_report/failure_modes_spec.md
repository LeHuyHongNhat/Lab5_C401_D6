# 📋 SPEC: TOP 3 FAILURE MODES — AI CLINICAL SCRIBE AGENT

**Phần 4:** Risk Analysis — Data Pipeline & Audio Simulation

---

## 🎯 TỔNG QUAN

Hệ thống AI Clinical Scribe có tiềm năng lớn nhưng hoạt động trong môi trường y tế — nơi lỗi có thể ảnh hưởng trực tiếp đến bệnh nhân. Tài liệu này mô tả **3 failure mode nguy hiểm nhất** được xác định qua phân tích luồng dữ liệu và thử nghiệm với mock data.

---

## 🔴 FAILURE MODE #1: DIARIZATION ERROR — NHIỀU NGƯỜI NÓI CÙNG LÚC

### 📌 MÔ TẢ

**Xảy ra khi:** Bác sĩ và bệnh nhân nói đè lên nhau (overlapping speech), hoặc khi có người thứ ba trong phòng (người nhà bệnh nhân, y tá, sinh viên thực tập) tham gia hội thoại mà AI không phân biệt được vai.

**Cơ chế lỗi:**

```
Micro ghi âm → VAD phát hiện giọng nói → STT chuyển thành text
→ Diarization model gán nhãn [BS] / [BN] → NẾU SAI → SOAP điền sai chủ thể
```

### 💬 VÍ DỤ THỰC TẾ (từ ca test)

**Hội thoại thực:**

```
[BS]  "Anh có đau ngực không?"
[BN]  "Không bác sĩ ơi, không đau—"
[BS]  "—nhưng có tức không?"
[BN]  "Tức thì có."
```

**Khi AI diarize sai:**

```
SOAP ghi: "Patient denies chest pain but reports chest tightness"
          ↓
Đúng về nội dung nhưng attribution lộn
→ Nguy hiểm nếu câu phức tạp hơn
```

**Trường hợp nguy hiểm hơn** — người nhà bổ sung thông tin:

```
[Người nhà] "Bác sĩ ơi, chú uống thuốc tim đấy!"
           ↓
Nếu AI gán nhầm đây là lời BS → Objective section bị ô nhiễm ⚠️
```

### ⚡ TÁC ĐỘNG

> **Mức độ nghiêm trọng:** 🔴 CAO (3/3)  
> **Khả năng xảy ra:** 🟡 TRUNG BÌNH-CAO _(phòng khám Việt Nam thường có người nhà đi cùng, tiếng ồn nền cao)_  
> **Hậu quả:** Thông tin về thuốc, tiền sử, triệu chứng bị gán sai chủ thể → Bác sĩ review nếu không cẩn thận có thể bỏ qua → **sai sót lâm sàng**

### 🛠️ MITIGATION PLAN

#### Ngắn hạn (v1.0)

- ✅ **Confidence threshold:** Nếu diarization confidence < 0.85 → FLAG ⚠️ trên UI để bác sĩ review thủ công đoạn đó
- ✅ **Visual differentiation:** Hiển thị màu sắc khác biệt [BS] / [BN] trong transcript viewer, cho phép bác sĩ sửa label trước khi approve

#### Trung hạn (v1.5)

- ✅ **Multi-microphone array:** Hướng tính micro → phân biệt nguồn âm theo vị trí không gian (BS ngồi một bên, BN bên kia)
- ✅ **Speaker enrollment:** Bác sĩ đăng ký giọng nói đầu buổi → diarize chính xác hơn

#### Dài hạn (v2.0)

- ✅ **Fine-tune model:** Trên tập dữ liệu âm thanh phòng khám Vinmec với đặc thù tiếng Việt + tiếng ồn thiết bị y tế

---

## 🔴 FAILURE MODE #2: THUẬT NGỮ Y KHOA ĐỊA PHƯƠNG & TÊN THUỐC BIỆT DƯỢC

### 📌 MÔ TẢ

**Xảy ra khi:** Bác sĩ sử dụng tên biệt dược Việt Nam phổ biến thay vì tên INN quốc tế, hoặc dùng từ lóng y khoa địa phương, STT nhận sai → **AI không thể map sang tên thuốc chuẩn, code ICD-10, hoặc ATC code.**

### 💊 VÍ DỤ THỰC TẾ

#### Vấn đề với **Tên thuốc:**

| Bác sĩ nói    | 🎙️ STT transcribe | 🤖 AI map sang    | ✅/❌ |
| ------------- | ----------------- | ----------------- | ----- |
| Efferalgan    | Efferalgan        | Paracetamol 500mg | ✅    |
| Panadol extra | Panama extra      | KHÔNG MAP ĐƯỢC    | ❌    |
| Augmentin     | Argumentation     | KHÔNG MAP ĐƯỢC    | ❌    |
| Streptomycin  | Strep to my sin   | KHÔNG MAP ĐƯỢC    | ❌    |
| Berodual      | Be rô đồ          | KHÔNG MAP ĐƯỢC    | ❌    |

#### Vấn đề với **Thuật ngữ y khoa:**

| Bác sĩ nói        | 🤖 AI hiểu            | Ghi chú         |
| ----------------- | --------------------- | --------------- |
| Huyết áp tâm thu  | Systolic BP           | ✅              |
| Đường huyết đói   | Fasting glucose       | ✅              |
| Nhịn ăn           | NPO / Fasting         | ✅              |
| Siêu âm màu       | Doppler ultrasound    | ⚠️ cần ngữ cảnh |
| Nội soi đại tràng | Colonoscopy           | ✅              |
| Mổ đẻ             | C-section / Caesarean | ⚠️ cần ngữ cảnh |
| Bệnh gút          | Gout                  | ✅              |
| Bệnh thần kinh    | Depends on context    | ⚠️              |

### ⚡ TÁC ĐỘNG

> **Mức độ nghiêm trọng:** 🔴 CAO (3/3) — _thuốc sai dẫn đến toa thuốc sai_  
> **Khả năng xảy ra:** 🟡 TRUNG BÌNH _(bác sĩ Vinmec dùng tên quốc tế, nhưng tiếng Việt địa phương vẫn phổ biến)_  
> **Hậu quả:** AI ghi sai tên thuốc trong SOAP → bác sĩ copy-paste sang EHR mà không kiểm tra → **đơn thuốc sai tên, sai liều**

### 🛠️ MITIGATION PLAN

#### Ngắn hạn (v1.0)

- ✅ **Custom medical dictionary:** Danh sách 500+ tên biệt dược phổ biến tại Việt Nam + phonetic equivalents → tăng accuracy STT
- ✅ **Post-processing layer:** Fuzzy matching tên thuốc với database MIMS Việt Nam + WHO ATC → highlight các tên không map được → BS review
- ✅ **Visual warning:** Tên thuốc không confirm được → tô màu đỏ trong UI

#### Trung hạn

- ✅ **HIS integration:** Tích hợp với danh mục thuốc HIS/Vinmec: chỉ accept tên có trong formulary list → giảm hallucination
- ✅ **STT fine-tuning:** Fine-tune STT (Whisper) trên corpus y khoa tiếng Việt

#### Dài hạn

- ✅ **Regulatory collaboration:** Hợp tác với Cục Quản lý Dược (DAV) để có database chuẩn biệt dược ↔ INN ↔ ATC code cho thị trường VN

**📊 KPI ĐO LƯỜNG:** Medication name recognition accuracy **> 95%** trên test set biệt dược VN

---

## 🔴🚨 FAILURE MODE #3: BẢO MẬT DỮ LIỆU & TUÂN THỦ QUY ĐỊNH BỘ Y TẾ VN

### 📌 MÔ TẢ

**Xảy ra khi:** Hệ thống ghi âm liên tục và xử lý/lưu trữ dữ liệu âm thanh bệnh nhân mà không đảm bảo các quy trình bảo mật → **vi phạm quyền riêng tư bệnh nhân và quy định pháp lý tại Việt Nam.**

### ⚠️ CÁC VECTOR RỦI RO

#### 1️⃣ LƯU TRỮ AUDIO RAW

```
Audio 15 phút/ca × 30 ca/ngày/BS × 200 BS = 90,000 phút audio/ngày
↓
Nếu lưu raw audio → Thông tin y tế nhạy cảm không mã hóa
↓
VI PHẠM: Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân VN
```

#### 2️⃣ TRUYỀN DỮ LIỆU QUA CLOUD NƯỚC NGOÀI

```
Gửi audio/transcript sang API nước ngoài (OpenAI, Anthropic)
↓
Không có DPA (Data Processing Agreement)
↓
VI PHẠM: Luật An ninh mạng 2018 + data localization
(Dữ liệu y tế công dân VN phải lưu tại VN)
```

#### 3️⃣ KHÔNG CÓ CONSENT RÕ RÀNG

- Bệnh nhân không được thông báo về việc ghi âm
- **Vi phạm:** Quyền thông tin & đồng thuận của bệnh nhân

#### 4️⃣ KHÔNG CÓ ACCESS CONTROL

- Transcript lưu trong hệ thống mà không phân quyền đúng
- **Hậu quả:** Nhân viên không liên quan có thể đọc hồ sơ bệnh nhân khác

### ⚡ TÁC ĐỘNG

> **Mức độ nghiêm trọng:** 🔴🔴🔴 RẤT CAO _(khung pháp lý + đạo đức y tế + uy tín JCI)_  
> **Khả năng xảy ra:** 🔴 CAO _(nếu không có thiết kế privacy-by-design)_  
> **Hậu quả THẢM KHỐC:** Phạt hành chính • Mất chứng nhận JCI • Kiện tụng từ bệnh nhân • **Mất niềm tin của BS & BN**

### 🛠️ MITIGATION PLAN

#### Ngắn hạn — Privacy by Design (v1.0) ⚡🔐

- ✅ **Consent screen bắt buộc:** Màn hình tablet/ipad đặt tại phòng khám
  - BN bấm "Đồng ý ghi âm" trước khi phiên bắt đầu
  - Tự động log consent có timestamp

- ✅ **On-device STT:** Dùng Whisper local (chạy trên máy chủ Vinmec nội bộ)
  - **Audio KHÔNG ra ngoài mạng nội bộ Vinmec**

- ✅ **Auto-delete audio:** Xóa file audio gốc ngay sau khi STT xong (⏱️ 60 giây)

- ✅ **Encrypt-at-rest:** Transcript text + SOAP JSON được mã hóa **AES-256** trên database nội bộ

#### Trung hạn (v1.5) 🔑

- ✅ **Role-based access:** Chỉ BS phụ trách ca đó mới xem được transcript/SOAP
- ✅ **Audit log 360°:** Mọi truy cập vào dữ liệu đều được log _(who, when, what)_
- ✅ **Compliance assessment:** Hợp tác với Phòng Pháp chế Vinmec + tư vấn luật
  - Rà soát toàn bộ luồng dữ liệu theo **Nghị định 13/2023/NĐ-CP**

#### Dài hạn (v2.0) 🏆

- ✅ **ISO 27001 certification** cho hệ thống AI Scribe
- ✅ **Federated learning:** Train model từ dữ liệu Vinmec mà không gửi raw data ra ngoài
- ✅ **Patient data portal:** BN có thể xem, tải, yêu cầu xóa dữ liệu của mình

**📊 KPI ĐO LƯỜNG:**

- Zero data breach incidents (0%)
- 100% consent capture
- 100% audit log coverage

================================================================
TÓM TẮT MA TRẬN RỦI RO
================================================================

---

## 📊 TÓM TẮT MA TRẬN RỦI RO

| Failure Mode               |  Nghiêm trọng  |   Xác suất    | Mức ưu tiên |
| -------------------------- | :------------: | :-----------: | ----------- |
| **#1 Diarization Error**   |     🔴 CAO     | 🟡 TRUNG BÌNH | 🟡 **P1**   |
| **#2 Tên thuốc biệt dược** |     🔴 CAO     | 🟡 TRUNG BÌNH | 🟡 **P1**   |
| **#3 Bảo mật & Pháp lý**   | 🔴🔴🔴 RẤT CAO |    🔴 CAO     | 🔴 **P0**   |

---

### 🎯 KẾT LUẬN QUAN TRỌNG

> **Failure Mode #3 là ưu tiên P0:** Phải giải quyết **TRƯỚC KHI DEPLOY**, không phải sau khi deploy.

---

## 💼 KHUYẾN NGHỊ CHO VINMEC

### 1️⃣ Giai đoạn PILOT (3 tháng đầu)

- ✅ Chỉ chạy trên **1 phòng khám nội khoa** với 2–3 BS tình nguyện
- ✅ BS **PHẢI review 100% SOAP** trước khi lưu vào EHR
- ✅ Thu thập feedback **hàng tuần** để cải thiện model
- ✅ **TUÂN THỦ 100%** các quy trình privacy & consent

### 2️⃣ KPI chấp nhận để SCALE UP

| Metric                                | Ngưỡng chấp nhận              |
| ------------------------------------- | ----------------------------- |
| SOAP accuracy (vs ground truth)       | **> 90%**                     |
| Bác sĩ satisfaction score             | **> 4/5 ⭐**                  |
| Critical errors (sai thuốc, sai liều) | **Zero** ❌ → không chấp nhận |
| Data security incidents               | **Zero** ❌ → không chấp nhận |

### 3️⃣ GOVERNANCE STRUCTURE

**Lập "AI Review Committee" gồm:**

- 👨‍⚕️ BS senior (2–3 người)
- 💻 IT / Platform team (1–2 người)
- ⚖️ Phòng Pháp chế Vinmec (1 người)
- 🔐 Data Security Officer (1 người)

**Quy trình xuyên suốt:**

```
Model Improvement
      ↓
Clinical Validation
      ↓
Security Review (Privacy check)
      ↓
Regulatory Compliance Check
      ↓
AI Review Committee APPROVAL
      ↓
Deploy to Production
```

---

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Status:** ✅ Ready for Clinical Trial Pilot
