# 🛡️ Hệ thống Admin Dashboard

> **Hiện trạng:** Chưa có bất kỳ code nào liên quan đến admin — không có trường `role` trong User model, không có route `/api/admin/`, không có middleware bảo vệ, không có UI admin panel.

---

## Bước 0 — Nền tảng cần làm trước tiên

- [ ] Thêm trường `role: { type: String, enum: ['player', 'admin'], default: 'player' }` vào `User.js`
- [ ] Tạo middleware `isAdmin.js` — kiểm tra `req.user.role === 'admin'`, từ chối 403 nếu không đủ quyền
- [ ] Đăng ký group route `/api/admin/*` được bảo vệ bởi `authenticate` + `isAdmin`
- [ ] Tạo layout Admin Dashboard trên frontend (sub-route `/admin`), chỉ hiển thị nếu `user.role === 'admin'`

---

## 1. Quản lý Người chơi (User Management)

- [ ] **Danh sách người chơi:** Xem toàn bộ thông tin (username, email, Linh Căn, Cảnh giới, Tông môn, Linh Thạch, ngày tạo, trạng thái tài khoản). Có phân trang + tìm kiếm theo tên/email.
- [ ] **Tặng / Trừ Linh Thạch:** Admin cộng/trừ trực tiếp `spiritStones` cho một người chơi cụ thể (đền bù sự cố, thưởng event).
- [ ] **Tặng Vật phẩm vào Túi đồ:** Admin gửi đan dược, pháp bảo, nguyên liệu vào inventory của người chơi.
- [ ] **Điều chỉnh EXP / Cảnh giới / Thọ Nguyên:** Sửa dữ liệu Cultivation để fix lỗi hoặc hỗ trợ người chơi bị kẹt.
- [ ] **Sửa Linh Căn:** Thay đổi `spiritRootGrade` (ví dụ: event đổi Linh Căn).
- [ ] **Ban / Unban tài khoản:** Thêm trường `isBanned`, `banReason`, `banExpiresAt` vào User model. Middleware auth từ chối login nếu đang bị ban.
- [ ] **Mute (Cấm chat):** Khi hệ thống Chat ra mắt — thêm trường `isMuted`, `muteExpiresAt`.
- [ ] **Reset mật khẩu hộ:** Admin reset password mà không cần email người chơi.

---

## 2. Quản lý Nội dung Game (Content Management)

> ⚠️ Hiện tại data vật phẩm hardcode trong `backend/src/data/items.js`. Để admin quản lý được thì cần chuyển sang MongoDB collection `Items`.

- [ ] **Quản lý Vật phẩm (Items):** Thêm/Sửa/Xóa Đan dược, Pháp bảo, Nguyên liệu — tên, chỉ số, giá shop, rarity.
- [ ] **Quản lý Công pháp (Techniques):** Khi hệ thống công pháp ra mắt — CRUD danh sách công pháp.
- [ ] **Quản lý Tông Môn:** Xem danh sách tông môn hiện có, số thành viên, xóa tông môn vi phạm hoặc đổi tên.
- [ ] **Quản lý Shop:** Chỉnh giá vật phẩm trong shop, bật/tắt mặt hàng cụ thể mà không cần deploy lại.
- [ ] **Quản lý Đấu giá hội:** Xóa listing vi phạm, hoàn tiền thủ công khi có tranh chấp.

---

## 3. Quản lý Sự kiện & Cấu hình Hệ thống (Events & Config)

- [ ] **Global Buff (Sự kiện toàn server):** Bật/Tắt x2/x3 tốc độ tu luyện trong dịp lễ. Cần thêm collection `ServerConfig` lưu các cờ toàn server.
- [ ] **Điều chỉnh tỷ lệ:** Thay đổi tỷ lệ quay ra Thiên/Địa Linh Căn, tỷ lệ đột phá thành công mà không cần sửa code.
- [ ] **Hệ thống Thư (Mail/Inbox):** Gửi thông báo hoặc quà đền bù vào hòm thư của toàn bộ hoặc từng người chơi cụ thể. Cần model `Mail`.
- [ ] **Announcement (Thông báo server):** Hiển thị banner/thông báo trên giao diện người chơi (bảo trì, event...).

---

## 4. Thống kê & Báo cáo (Analytics & Logs)

- [ ] **Dashboard tổng quan:** Số người chơi online (CCU), đăng ký mới hôm nay, tổng Linh Thạch lưu thông, giao dịch đấu giá 24h.
- [ ] **Audit Log (Action Logs):** Ghi lại mọi hành động của admin (ai ban ai, ai phát quà, ai sửa EXP...) để tránh lạm quyền. Cần model `AdminLog`.
- [ ] **Cheat Detection:** Ghi log cảnh báo khi EXP tăng đột biến bất thường hoặc Linh Thạch thay đổi lớn trong thời gian ngắn.
- [ ] **Transaction History:** Lịch sử toàn bộ giao dịch Linh Thạch (mua shop, đấu giá, admin tặng...).

---

## 5. Thứ tự ưu tiên triển khai

| Ưu tiên | Tính năng |
|---------|-----------|
| 🔴 Cấp thiết | Bước 0 (role, middleware, route group) |
| 🔴 Cấp thiết | Ban/Unban tài khoản |
| 🟠 Quan trọng | Danh sách người chơi + tìm kiếm |
| 🟠 Quan trọng | Tặng Linh Thạch / Vật phẩm |
| 🟡 Nên có | Điều chỉnh EXP/Cảnh giới |
| 🟡 Nên có | Quản lý Đấu giá hội (xóa listing vi phạm) |
| 🟡 Nên có | Audit Log |
| 🟢 Mở rộng | Global Buff / ServerConfig |
| 🟢 Mở rộng | Hệ thống Thư (Mail) |
| 🟢 Mở rộng | Dashboard thống kê CCU |
| 🔵 Dài hạn | Cheat Detection tự động |
| 🔵 Dài hạn | Quản lý nội dung động (Items trong MongoDB) |
