# 🛡️ Danh sách các chức năng dành cho Admin (Admin Dashboard)

Hiện tại, mã nguồn dự án **chưa có hệ thống Admin** (trong `User` model chưa có cờ `role` hay `isAdmin` và chưa có các API dành riêng cho quản trị viên).

Tuy nhiên, đối với một tựa game trực tuyến (kể cả dạng Idle Cultivation), hệ thống Admin là vô cùng cần thiết để quản lý và vận hành. Dưới đây là danh sách các chức năng Admin cần được xây dựng:

## 1. Quản lý Người chơi (User Management)
Đây là tính năng cốt lõi nhất để hỗ trợ người chơi và giữ môi trường game trong sạch.
*   **Danh sách người chơi:** Xem toàn bộ thông tin người chơi (Tên, Email, Giới tính, Linh Căn, Cảnh giới, Tông môn...).
*   **Can thiệp dữ liệu (Hỗ trợ/Đền bù):**
    *   Tặng/Trừ Linh thạch, Vật phẩm (khi hệ thống túi đồ ra mắt).
    *   Sửa đổi Linh Căn (ví dụ: người chơi trúng event được đổi sang Thiên Linh Căn).
    *   Điều chỉnh EXP, Thọ Nguyên hoặc Cảnh giới (để fix lỗi nếu người chơi bị kẹt).
*   **Kiểm duyệt & Xử lý vi phạm:**
    *   **Ban/Unban:** Khóa tài khoản vĩnh viễn hoặc có thời hạn (nếu phát hiện hack/cheat hoặc chửi bậy).
    *   **Mute (Cấm chat):** Tước quyền chat của người chơi trên kênh thế giới.

## 2. Quản lý Nội dung Game (Content Management)
Giúp Admin thêm bớt nội dung game mà không cần phải can thiệp trực tiếp vào code/database.
*   **Quản lý Tông Môn:** Tạo mới, chỉnh sửa tên, xóa tông môn, hoặc chỉ định Tông chủ.
*   **Quản lý Vật phẩm (Items):** Thêm/Sửa/Xóa các loại Đan dược, Pháp bảo, Nguyên liệu (Tên, chỉ số buff, giá bán...).
*   **Quản lý Công pháp (Techniques):** Cập nhật kho tàng công pháp và kỹ năng.
*   **Quản lý Bí cảnh & Yêu thú (PvE):** Mở/Đóng các bí cảnh, thiết lập sức mạnh và phần thưởng rớt ra từ yêu thú.

## 3. Quản lý Sự kiện & Cấu hình Hệ thống (System & Events)
Dùng để tổ chức event hoặc cân bằng lại game.
*   **Global Buff (Sự kiện toàn server):** 
    *   Bật/Tắt chế độ x2, x3 Tốc độ tu luyện toàn server trong dịp lễ.
    *   Giảm tỷ lệ hao mòn Thọ nguyên.
*   **Chỉnh sửa Rate (Tỷ lệ):** 
    *   Điều chỉnh tỷ lệ quay ra Thiên/Địa Linh Căn.
    *   Điều chỉnh tỷ lệ đột phá thành công.
*   **Gửi Thư (Mail System):** Gửi thông báo hoặc quà đền bù/quà sự kiện vào hòm thư của toàn bộ người chơi hoặc một người cụ thể.

## 4. Thống kê & Báo cáo (Analytics & Logs)
Theo dõi tình trạng "sức khỏe" của game.
*   **Dashboard Thống kê:** Số lượng người chơi online (CCU), số lượt đăng ký mới trong ngày, tổng số Linh thạch đang lưu thông.
*   **Cheat Detection (Phát hiện gian lận):** Ghi log các giao dịch bất thường hoặc những người chơi có lượng EXP tăng đột biến không hợp lý.
*   **Action Logs:** Ghi lại mọi hành động của Admin (Admin A đã ban User B, Admin C đã phát quà...) để tránh lạm quyền.

---
### 🛠️ Đề xuất cách triển khai
1.  **Backend:** 
    *   Thêm trường `role: { type: String, enum: ['player', 'admin'], default: 'player' }` vào `User.js`.
    *   Tạo middleware `isAdmin.js` để bảo vệ các route `/api/admin/...`.
2.  **Frontend:** 
    *   Tạo một layout riêng biệt dành cho Admin Dashboard (có thể dùng một sub-route như `/admin`).
    *   Chỉ hiển thị nút "Admin Panel" trên NavBar nếu `user.role === 'admin'`.
