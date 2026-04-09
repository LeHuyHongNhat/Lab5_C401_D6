KẾ HOẠCH HÀNH ĐỘNG HACKATHON — NHÓM C401_D6

1. Phân chia vai trò (6 thành viên đều có base AI)

Vì cả nhóm đều mạnh về AI, chúng ta sẽ chia theo các module xử lý dữ liệu thay vì chia theo chức danh truyền thống.

Thành viên 1 - Nhật: Agent Architect & Lead

Phụ trách luồng xử lý của Agent (Input -> Prompt -> Output).

Viết Spec phần 1 (Canvas) và phần 6 (Mini Spec).

Kiểm soát sự thống nhất giữa các phần của Spec.

Thành viên 2 - Tấn: Prompt Engineer & Medical Logic

Thiết kế System Prompt cho SOAP (Subjective, Objective, Assessment, Plan).

Phụ trách Spec phần 2 (User Stories - 4 paths).

Xây dựng bộ Few-shot examples từ dữ liệu y tế mẫu của Vinmec.

Thành viên 3 - Sơn: Frontend Developer (Vibe Coding)

Sử dụng LLM (Cursor/v0/Claude) để code file React duy nhất.

Tích hợp giao diện với các logic xử lý text/audio từ các thành viên khác.

Chỉnh sửa CSS/Tailwind để đảm bảo UI đúng chuẩn Premium của Vinmec.

Thành viên 4 - Khải: Data Pipeline & Audio Simulation

Xử lý giả lập luồng ghi âm (Audio processing simulation).

Chuẩn bị dữ liệu Input (Mock transcripts) cho nhiều tình huống khám bệnh khác nhau.

Viết Spec phần 4 (Top 3 failure modes).

Thành viên 5 - Thành: AI Evaluator & Metrics

Thiết kế bộ chỉ số đánh giá (LLM-as-a-judge) để đo lường chất lượng SOAP đầu ra.

Viết Spec phần 3 (Eval metrics + threshold).

Thực hiện test các trường hợp Corner Cases.

Thành viên 6 - Khánh: Business Intelligence & Presentation

Phụ trách Spec phần 5 (ROI 3 kịch bản).

Thiết kế Poster/Slides bằng công cụ AI (Gamma/Canva).

Làm mock prototype bằng HTML, hỗ trợ thiết kế UX/UI.

Viết script demo và chuẩn bị narrative cho bài thuyết trình.

2. Lộ trình thực hiện (Timeline)

09:00 - 10:00: Họp nhanh chốt Schema dữ liệu (JSON) giữa Prompt, Frontend và Data.

10:00 - 11:30: Xây dựng đồng thời (M2):

Thành viên 2, 4, 5 làm việc trên Colab/Playground để hoàn thiện Prompt và Data.

Thành viên 3 dùng công cụ AI gen giao diện React dựa trên Schema đã chốt.

Thành viên 1 và 6 viết các phần Spec chiến lược.

11:30 - 13:00: Tích hợp (M3). Đưa kết quả AI vào Prototype React. Chốt Spec lần 1.

14:00 - 15:00: Polish & Testing. Chỉnh sửa UI, kiểm tra các Failure modes trên app.

15:00 - 16:00: Prep Demo (M4). Tập dượt thuyết trình và quay video demo dự phòng.

3. Danh mục bàn giao (Deliverables)

1 File React duy nhất chứa toàn bộ logic và UI.

1 File Spec hoàn thiện (Markdown).

1 Poster/Slide thuyết trình.

Link GitHub/Repo có lịch sử commit của cả 6 người.
