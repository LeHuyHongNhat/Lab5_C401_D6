# Reflection — Cá nhân
**Họ tên:** Lê Huy Hồng Nhật
**MSSV:** 2A202600099
**Vai trò trong nhóm:** Agent Architect & Lead — C401_D6 (Track Vinmec)

---

## 1. Role

**Agent Architect & Lead.** Phụ trách thiết kế và kiểm soát toàn bộ luồng xử lý AI: Input (audio/transcript) → STT → Diarization → Medical Agent → Structured Output (SOAP). Viết SPEC phần 1 (AI Product Canvas) và phần 6 (Mini AI Spec). Đảm bảo tính nhất quán kỹ thuật xuyên suốt tài liệu — các quyết định ở Canvas phải phản ánh đúng trong kiến trúc kỹ thuật và ngược lại.

---

## 2. Đóng góp cụ thể

- **Thiết kế pipeline Whisper + LLM Diarization:** Ra quyết định loại bỏ pyannote (cần HuggingFace token, GPU nặng, thêm dependency phức tạp), giữ lại luồng duy nhất: audio → Whisper STT → GPT-4o LLM gán nhãn speaker theo ngữ cảnh y khoa. Đơn giản hơn, dễ maintain, không phụ thuộc GPU cho diarization.

- **Cập nhật và phản biện SPEC:** Phát hiện và sửa sai trong phần Learning Signal — ban đầu đánh dấu `☑ User-specific (phong cách từng bác sĩ)` nhưng thực tế format bệnh án Vinmec là chuẩn hóa, không cá nhân hóa theo bác sĩ. Pivot Marginal value sang đúng trọng tâm: STT robustness trên tiếng Việt đa vùng miền và điều kiện tiếng ồn thực tế.

- **Viết roadmap kỹ thuật thực tế (Section 8.1):** Mở rộng từ 3 option ngắn thành 4 hướng toàn diện: (A) cải thiện STT accuracy bằng fine-tune trên ground-truth từ correction log, (B) giảm chi phí LLM bằng GPT-4o-mini fine-tuned và long-term LLM local, (C) streaming STT để giảm latency xuống <15s, (D) bảng kiến trúc scale từ MVP → hệ thống 1,000+ bác sĩ với Kubernetes, FHIR, Prometheus, compliance HIPAA.

- **Dọn dẹp kỹ thuật:** Xóa `whisper_diarization.py` (pyannote pipeline), refactor `diarize.py` bỏ các tham số không còn dùng (`method`, `hf_token`, `doctor_speaker`), cập nhật `recorder.py` và `config.py` cho nhất quán. Viết lại `.gitignore` đầy đủ theo nhóm (secrets, Python, Node, ML models, audio files, OS, IDE, testing).

---

## 3. SPEC mạnh / yếu

**Mạnh nhất: Failure modes (Mục 4) và Human-in-the-loop design.** Nhóm xác định được failure mode nguy hiểm nhất không phải là "AI sai" mà là "AI sai mà bác sĩ không phát hiện ra" — cụ thể là diarization nhầm speaker trong môi trường ồn. Từ đó thiết kế toàn bộ UI hướng về augmentation: draft không tự lưu, highlight `(??)`, inline edit, correction log. Đây là quyết định product đúng, không chỉ là safety theater.

**Yếu nhất: Phần Learning Signal ban đầu thiếu nhất quán.** Đánh dấu `User-specific` trong khi thực tế format SOAP của Vinmec là chuẩn hóa. Marginal value viết chung chung về "LLM chưa fine-tune tiếng Việt" mà không chỉ ra đâu là bottleneck thực sự — đó là STT trong điều kiện thực tế, không phải LLM comprehension. Sau khi sửa, phần này mới align đúng với prioritization của cả hệ thống.

---

## 4. Đóng góp khác

- Giữ vai trò kiểm tra tính nhất quán kỹ thuật giữa các phần SPEC: quyết định ở Canvas (augmentation, not automation) phải thể hiện được trong kiến trúc (draft mode, correction log, human approval trước khi lưu vào HIS).
- Cập nhật Tech Stack table loại bỏ 2 dòng pyannote/fallback, thêm dòng Diarization duy nhất mô tả đúng luồng thực tế; bổ sung CUDA vào device support (trước chỉ có MPS).
- Refine Section 8.3 từ "Personalization theo từng bác sĩ" (sai định hướng) thành "Cải thiện hệ thống chung từ correction log" — correction data dùng để nâng accuracy toàn hệ thống, không phải output riêng cho từng user.

---

## 5. Điều học được

Trước hackathon hiểu "data flywheel" theo nghĩa kỹ thuật: nhiều data → model tốt hơn. Sau khi thiết kế correction log và thinking through section 8, mới hiểu flywheel phải có vòng lặp khép kín cụ thể: correction log → phát hiện field yếu nhất → cải thiện đúng chỗ (prompt, fine-tune, hay vocabulary) → accuracy tăng → bác sĩ dùng nhiều hơn → nhiều correction data hơn. Thiếu bất kỳ mắt xích nào thì data thu về nhưng không được dùng — chỉ là logging, không phải learning.

Một điều nữa: **architectural simplicity là product decision, không phải compromise kỹ thuật.** Bỏ pyannote không phải vì không tốt mà vì thêm một dependency nặng vào MVP làm tăng surface area lỗi, tăng barrier to entry cho người deploy, và giải quyết vấn đề (diarization) mà LLM đã làm được đủ tốt ở giai đoạn này. "Đủ tốt cho hiện tại, rõ ràng hướng nâng cấp" tốt hơn "hoàn hảo nhưng phức tạp không cần thiết".

---

## 6. Nếu làm lại

Sẽ **viết failure modes trước khi viết happy path.** Lần này nhóm viết Canvas → User Stories happy path → rồi mới nghĩ đến failure modes. Nếu làm lại, sẽ bắt đầu từ câu hỏi "AI sai theo cách nào nguy hiểm nhất?" → từ đó ngược lên thiết kế pipeline và UI. Thực tế khi đã xác định "diarization nhầm speaker mà bác sĩ không detect được" là failure mode số 1, toàn bộ thiết kế hệ thống xoay quanh việc mitigate đúng điểm đó — thay vì add feature rồi patch lỗi sau.

Sẽ **quyết định sớm hơn về scope của STT.** Whisper model size (small vs medium vs large) ảnh hưởng trực tiếp đến latency và accuracy — quyết định này nên được lock sớm và dựa trên benchmark thực tế với audio tiếng Việt, không phải chọn mặc định.

---

## 7. AI giúp gì / AI sai gì

**Giúp:**
- Dùng Claude (Cursor) để review SPEC — phát hiện inconsistency giữa Canvas và phần Tech Stack (đánh dấu User-specific nhưng format là chuẩn hóa). AI đọc toàn bộ document và chỉ ra điểm mâu thuẫn nhanh hơn tự review nhiều.
- Brainstorm roadmap kỹ thuật thực tế: khi đặt câu hỏi về "giảm chi phí LLM khi scale", AI gợi ý được lộ trình cụ thể (GPT-4o-mini fine-tune → LLM local via vLLM) với con số ước tính, không chỉ nói chung chung.
- Dọn code nhanh: refactor `diarize.py` bỏ pyannote, cập nhật các file liên quan (`recorder.py`, `config.py`) mà không bỏ sót reference nào — AI search toàn bộ codebase trước khi xóa.

**Sai / cần cẩn thận:**
- AI có xu hướng **thêm vào hơn là bỏ đi** — khi yêu cầu viết roadmap, output ban đầu liệt kê nhiều option (A, B, C) mà không có guidance rõ ràng về priority. Phải explicitly yêu cầu "cái nào quan trọng nhất, làm trước" thì mới có cấu trúc ưu tiên rõ.
- Khi brainstorm failure modes, AI gợi ý thêm nhiều case hợp lý nhưng **không biết scope của hackathon** — một số mitigation được gợi ý (real-time audio quality check, drug interaction database) tốt về kỹ thuật nhưng quá lớn cho MVP. Bài học: AI brainstorm tốt nhưng người dùng phải là người quyết định scope, không delegate phần đó cho AI.
