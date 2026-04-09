# Individual reflection — Nguyễn Quang Sơn (sonnq)

## 1. Role cụ thể
**Frontend Developer & UI/UX Designer**. Toàn quyền phụ trách luồng trải nghiệm ở phía người dùng, thiết kế giao diện (UI) và tối ưu hóa hệ thống tương tác (UX) cho ứng dụng Clinical Scribe AI.

## 2. Đóng góp cụ thể
- **Đại tu kiến trúc giao diện:** Tái thiết kế toàn bộ khu vực "Medical Record Draft" từ một khối văn bản `<p contentEditable>` thô sơ, lộn xộn thành một **Form y tế chuẩn chỉ**, phân tách rõ ràng 4 khu vực: Hành chính, Bệnh sử, Khám lâm sàng và Chẩn đoán. 
- **Thiết kế Review Mechanism (Cơ chế duyệt):** Tạo cơ chế highlight đánh dấu các từ khóa có độ tin cậy thấp (khả năng AI nghe sai) bằng màu vàng cảnh báo. Xây dựng UI linh hoạt cho phép bác sĩ dễ dàng duyệt (`Check`), từ chối (`Cross`) hoặc chỉnh sửa trực tiếp.
- **Tối ưu UX thao tác tay:** Thiết kế giao diện "Always-On" (Form luôn hiển thị) và đẩy nút "Ghi âm" lên khu vực trung tâm để bác sĩ có thể vừa đọc transcript vừa gõ phím trực tiếp điền form trước mà không cần đợi workflow xong.

## 3. SPEC phần nào mạnh nhất, phần nào yếu nhất? Vì sao?
- **Mạnh nhất: User Flow & Visual Status:** Nhóm định hình rất tốt luồng thao tác của trợ lý bác sĩ. Việc thiết kế UI mô phỏng theo chuẩn Glassmorphism không chỉ lấy điểm thẩm mỹ (Premium Feel) mà phần điều hướng rất sát thực tế với các chỉ báo y tế (Mã ICD-10, Cận lâm sàng). Giao diện thể hiện rõ các trạng thái "Trắng", "Đang xử lý phân tích" và "Cần Review".
- **Yếu nhất: API Integration Scope:** Phía backend chạy agent rất phức tạp nhưng các đầu API trả về chưa được map chuẩn hoàn toàn 1-1 với front-end, dẫn đến giai đoạn cuối nhóm vẫn phải dùng cấu trúc "Mocking data" bằng `setTimeout` trên React thay vì một luồng fetch backend thực sự trơn tru. Nên chốt rõ Interface Data sớm hơn.

## 4. Đóng góp cụ thể khác
- **Brainstorm Idea cho hệ thống:** Là người đề xuất ý tưởng cốt lõi và định hình bài toán kinh doanh (business case) cho sản phẩm "Clinical Scribe AI". Phân tích sát sao các pain-point (nỗi đau) thực tế của bác sĩ trong việc mất quá nhiều thời gian gõ hồ sơ tay.
- Hỗ trợ xây dựng tập dữ liệu demo (kịch bản khám tiêu hóa) và prompt-testing trực tiếp lên giao diện để xem AI có trích xuất đúng luồng khám bệnh thực tế hay không.

## 5. Điều học được 
Trước hackathon, tôi từng nghĩ AI tốt là AI có mô hình LLM xịn, và kỹ thuật backend mới là "trái tim" của chức năng. 
Nhưng qua dự án mới thấm thía: **Trong lĩnh vực Y tế (Healthcare), UX/UI là yếu tố cốt lõi phòng ngừa rủi ro**. Một hệ thống AI dù thông minh đến mấy nếu không có thiết kế UI chuẩn y khoa (như bắt buộc Highlight cảnh báo từ ngữ độ tin cậy thấp, vô hiệu hoá nút Lưu khi chưa duyệt) thì rủi ro sai sót bệnh án là cực cao. Ranh giới giữa một sản phẩm Tech-Demo và một Medical Standard Product chính là sự chỉn chu trong cơ chế Review Mechanism trên màn hình người dùng.

## 6. Nếu làm lại, đổi gì?
Tôi sẽ **thiết kế Mockup trên Figma và làm Test UX sớm hơn**. Thay vì vừa lên ý tưởng vừa lao vào code React ngay từ ngày đầu dẫn đến việc phải đập đi xây lại giao diện dạng Form nhiều lần (như hiện tại file `App.tsx` lên tới hơn 600 dòng), tôi nên làm wireframe tĩnh để "đóng giả làm bác sĩ" duyệt thử quy trình thao tác. Việc chốt trước User Flow và tính toán tới các Edge Cases (ví dụ đoạn bác sĩ xóa text làm crash app) từ sớm ở môi trường Prototype sẽ giúp tiết kiệm ít nhất 30% thời gian code lại ở giai đoạn nước rút.

## 7. AI giúp gì? AI sai/mislead ở đâu?
- **Giúp:** Tăng tốc code UI cực khủng. Khi cần thiết kế một cụm HTML dài bằng TailwindCSS (như các viền đổ bóng, hiệu ứng nhấp nháy khi ghi âm, render array checkbox), AI tự gen code vừa mắt chỉ trong 1 turn prompt. AI cũng hỗ trợ mò ra nguyên nhân React bị crash do `removeChild` rất ấn tượng.
- **Sai/mislead:** AI nhiều lúc rất "cầm đèn chạy trước ô tô". Khi được yêu cầu tối ưu UX, AI tự động chèn thêm thẳng các đoạn code `fetch('/api/process_transcript')` chọc vào Backend trong khi bản thân tôi chỉ muốn sửa giao diện mộc bằng Frontend. Điều này suýt làm vỡ logic app hiện tại và tốn thời gian rollback lại state cũ. **Bài học:** Phải giới hạn chặt ranh giới hoạt động của AI (ví dụ: *"Tuyệt đối không đụng vào backend, chỉ xử lý layout"*).
