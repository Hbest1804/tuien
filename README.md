# 📖 TuTiên Game — API & Feature Reference

> **Stack:** Node.js + Express · Supabase (PostgreSQL) · React + TypeScript · Vite

---

## 🗄️ Database

| Table | Mô tả |
|-------|-------|
| `users` | Thông tin tài khoản + nhân vật |
| `cultivations` | Dữ liệu tu luyện, cảnh giới, tông môn |
| `inventories` | Túi đồ, trang bị, buff tốc độ |
| `auction_listings` | Phiên đấu giá |
| `refresh_tokens` | JWT refresh token (server-side) |

---

## 🔐 Auth — `/api/auth`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/register` | Đăng ký tài khoản | ❌ |
| `POST` | `/login` | Đăng nhập, nhận access + refresh token | ❌ |
| `POST` | `/refresh` | Đổi refresh token lấy access token mới | ❌ |
| `POST` | `/logout` | Thu hồi refresh token | ❌ |
| `GET`  | `/me` | Lấy thông tin user hiện tại | ✅ |
| `POST` | `/setup-character` | Tạo nhân vật, random Linh Căn & phẩm cấp | ✅ |

### Linh Căn (Spirit Root) — Random khi tạo nhân vật

| Phẩm cấp | Hệ số tốc độ | Tỷ lệ ra |
|-----------|-------------|---------|
| 🟡 Hoàng  | ×1.0 | ~60% |
| 🔵 Huyền  | ×1.5 | ~25% |
| 🟣 Địa   | ×2.0 | ~12% |
| ⭐ Thiên  | ×3.0 | ~3%  |

---

## ⚡ Tu Luyện — `/api/cultivation`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET`  | `/status` | Lấy trạng thái tu luyện đầy đủ | ✅ |
| `POST` | `/start` | Bắt đầu tu luyện (tính EXP theo thời gian) | ✅ |
| `POST` | `/stop` | Dừng tu luyện, flush EXP vào DB | ✅ |
| `POST` | `/breakthrough` | Đột phá lên cảnh giới tiếp theo | ✅ |
| `POST` | `/join-sect` | Gia nhập tông môn (cần tên tông môn 2–30 ký tự) | ✅ |
| `POST` | `/leave-sect` | Rời tông môn hiện tại | ✅ |

### Cảnh giới (Realms)

| # | Cảnh giới | EXP cần | Tỷ lệ đột phá | Lôi Kiếp |
|---|-----------|---------|--------------|---------|
| 0 | Luyện Khí | 1,000 | 90% | — |
| 1 | Trúc Cơ | 5,000 | 75% | 500 dmg |
| 2 | Kim Đan | 20,000 | 50% | 2,000 dmg |
| 3 | Nguyên Anh | 80,000 | 30% | 10,000 dmg |
| 4 | Hóa Thần | ∞ | 10% | 50,000 dmg |

### Tốc độ EXP/giây cơ bản

| Trạng thái | Tốc độ |
|-----------|--------|
| Tán tu (không tông môn) | 0.1 EXP/s |
| Đệ tử tông môn | 0.25 EXP/s |

> **Công thức:** `Tốc độ thực = tốc độ cơ bản × hệ số Linh Căn × buff tốc độ × (1 + passive bonus công pháp)`

### Thọ Nguyên & Rủi ro

- Thọ nguyên hao mòn **1 năm/giờ** khi không tu luyện
- **Tâm Ma:** Thất bại đột phá 3 lần liên tiếp → tốc độ giảm 50% trong 24h
- **Thọ nguyên cạn:** EXP về 0, phải tu lại từ đầu trong cảnh giới hiện tại

---

## 🎒 Túi đồ — `/api/inventory`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET`  | `/` | Xem túi đồ (50 ô mặc định) | ✅ |
| `POST` | `/use` | Dùng đan dược (EXP / tốc độ / thọ nguyên) | ✅ |
| `POST` | `/equip` | Trang bị vũ khí hoặc phòng hộ | ✅ |
| `POST` | `/unequip` | Tháo trang bị | ✅ |
| `POST` | `/learn-technique` | Học công pháp (tăng tốc độ vĩnh viễn) | ✅ |
| `POST` | `/add-test-item` | Dev: Thêm vật phẩm trực tiếp | ✅ |

### Loại vật phẩm (Item Types)

| Loại | SubType | Tác dụng |
|------|---------|---------|
| `PILL` | `EXP` | Cộng thẳng EXP vào đan điền |
| `PILL` | `SPEED_BUFF` | Tăng tốc tu luyện có thời hạn (vd: ×2 trong 2h) |
| `PILL` | `LIFESPAN` | Hồi phục thọ nguyên |
| `ARTIFACT` | `WEAPON` | Trang bị slot Vũ khí |
| `ARTIFACT` | `ARMOR` | Trang bị slot Phòng giáp |
| `ARTIFACT` | `PROTECTION` | Pháp bảo chống Lôi Kiếp khi đột phá |
| `ARTIFACT` | `BREAKTHROUGH` | Đan dược tăng tỷ lệ đột phá thành công |
| `TECHNIQUE` | — | Học vĩnh viễn → tăng passive speed bonus |
| `MATERIAL` | — | Nguyên liệu (dùng cho Luyện Đan sau này) |

---

## 💰 Kinh tế & Thương Hội — `/api/economy`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET`  | `/balance` | Số Linh Thạch hiện có + lượng chờ thu | ✅ |
| `POST` | `/idle-collect` | Thu Linh Thạch idle tích lũy theo thời gian | ✅ |
| `GET`  | `/shop` | Danh sách hàng hóa Thương Hội | ✅ |
| `POST` | `/shop/buy` | Mua vật phẩm tại shop | ✅ |
| `POST` | `/shop/sell` | Bán vật phẩm cho NPC (50% giá gốc) | ✅ |
| `GET`  | `/shop/sell-prices` | Xem giá bán NPC | ✅ |

### Linh Thạch Idle (theo cảnh giới)

| Cảnh giới | Linh Thạch/phút | Tối đa/ngày |
|-----------|----------------|------------|
| Luyện Khí | 1 | 1,440 |
| Trúc Cơ | 2 | 2,880 |
| Kim Đan | 4 | 5,760 |
| Nguyên Anh | 8 | 11,520 |
| Hóa Thần | 15 | 21,600 |

---

## 🏮 Đấu Giá Hội — `/api/auction`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET`  | `/` | Danh sách phiên đang active (filter + phân trang) | ✅ |
| `GET`  | `/my` | Phiên của tôi (đang bán + đang thắng thầu) | ✅ |
| `POST` | `/list` | Đăng bán vật phẩm (12h / 24h / 48h) | ✅ |
| `POST` | `/bid` | Đặt giá thầu (tối thiểu +5%) | ✅ |
| `POST` | `/buyout` | Mua ngay (buyout price) | ✅ |
| `POST` | `/claim` | Claim tiền (người bán) hoặc hàng (người mua) | ✅ |
| `DELETE` | `/:id` | Huỷ đăng bán (chỉ khi chưa có bid) | ✅ |

### Trạng thái Phiên đấu giá

| Status | Nghĩa |
|--------|-------|
| `active` | Đang đấu giá |
| `pending_claim` | Hết hạn, có người thắng thầu, chờ claim |
| `expired` | Hết hạn, không có bid |
| `sold` | Đã bán (buyout hoặc claim xong) |
| `cancelled` | Người bán huỷ |

---

## 🏯 Tông Môn — `/api/sect`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET`  | `/missions` | Xem danh sách nhiệm vụ hàng ngày | ✅ |
| `POST` | `/missions/start` | Nhận nhiệm vụ | ✅ |
| `POST` | `/missions/complete` | Hoàn thành nhiệm vụ (đổi Điểm Cống Hiến) | ✅ |

### Chức vụ & Điểm Cống Hiến

| Điểm cống hiến | Chức vụ |
|----------------|--------|
| 0–99 | Tạp Dịch |
| 100–499 | Ngoại Môn |
| 500–1,999 | Nội Môn |
| 2,000–4,999 | Chân Truyền |
| 5,000–9,999 | Trưởng Lão |
| ≥ 10,000 | Tông Chủ |

### Cấp nhiệm vụ hàng ngày

| Cấp | Thời gian | Phần thưởng |
|-----|-----------|------------|
| 🟡 Hoàng | 10 phút | 20 điểm |
| 🔵 Huyền | 30 phút | 80 điểm |
| 🟣 Địa | 1 giờ | 200 điểm |
| ⭐ Thiên | 2 giờ | 500 điểm |

---

## 📚 Tàng Kinh Các — `/api/pavilion`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET`  | `/` | Danh sách vật phẩm đổi bằng Điểm Cống Hiến | ✅ |
| `POST` | `/exchange` | Đổi vật phẩm | ✅ |

---

## 🗺️ Bí Cảnh (Dungeon) — `/api/dungeons`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET`  | `/status` | Trạng thái bí cảnh + danh sách dungeon | ✅ |
| `POST` | `/start` | Bắt đầu thám hiểm bí cảnh (treo máy) | ✅ |
| `POST` | `/claim` | Kết thúc và nhận phần thưởng | ✅ |

> Phần thưởng: Linh Thạch/giờ + rớt đồ ngẫu nhiên (theo `dropRate`)

---

## 🏆 Bảng Xếp Hạng — `/api/leaderboard`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET`  | `/?type=realm` | Top 50 theo Cảnh giới + EXP | ✅ |
| `GET`  | `/?type=stones` | Top 50 theo Linh Thạch | ✅ |

---

## ⚠️ Chức năng còn thiếu (TODO)

### 🔴 Quan trọng — Cần làm sớm

- [ ] **Đổi mật khẩu** (`POST /api/auth/change-password`) — User nhập mật khẩu cũ + mới
- [ ] **Quên mật khẩu / Reset qua email** — Gửi link reset, xác thực OTP
- [ ] **Xem hồ sơ người chơi khác** (`GET /api/users/:username`) — Cảnh giới, linh căn, tông môn
- [ ] **Refresh token rotation** — Hiện backend đã có bảng `refresh_tokens`, nhưng frontend chưa tự động gọi `/refresh` khi access token hết hạn

### 🟠 Gameplay — Cần để hoàn thiện trải nghiệm

- [ ] **Luyện Đan (Alchemy)** — Kết hợp nguyên liệu → chế tạo đan dược (recipe system)
- [ ] **Chỉ số nhân vật** — HP, ATK, DEF từ trang bị (vũ khí/giáp có `atkBonus`/`defBonus` nhưng chưa dùng)
- [ ] **Chiến đấu PvE** — Đánh quái, tính sát thương dựa trên chỉ số
- [ ] **Hệ thống nhiệm vụ chính** — Hướng dẫn tân thủ, mở khóa tính năng theo tiến trình
- [ ] **Nhiệm vụ hàng ngày độc lập** — Đăng nhập, tu luyện X giờ, mua/bán, đặt thầu...
- [ ] **Thành tựu (Achievements)** — Mở khóa danh hiệu hiển thị trên nhân vật
- [ ] **Mất căn cơ khi thất bại** — Cảnh giới cao (Nguyên Anh+) hỏng Linh Căn tạm thời

### 🟡 UX & Kỹ thuật

- [ ] **Thông báo real-time** — Bị vượt thầu, đấu giá kết thúc, buff hết hạn (WebSocket / SSE)
- [ ] **Lịch sử giao dịch** — Lịch sử mua bán shop + đấu giá
- [ ] **Search theo tên vật phẩm tại Đấu giá hội** — Frontend đã có input nhưng cần verify backend filter
- [ ] **Xóa refresh token hết hạn tự động** — Cron job hoặc pg_cron trong Supabase
- [ ] **Rate limiting** — Chống spam API (express-rate-limit)

### 🟢 Hệ thống Admin Dashboard (Dài hạn)

**1. Nền tảng phân quyền**
- [ ] **Trường `role`** — Thêm `role: 'player' | 'admin'` vào bảng `users`
- [ ] **Middleware `isAdmin`** — Xác thực phân quyền, bảo vệ route `/api/admin/*`
- [ ] **Admin UI** — Layout dashboard riêng biệt trên frontend

**2. Quản lý Người chơi (User Management)**
- [ ] **Danh sách người chơi** — Xem thông tin, tìm kiếm, phân trang
- [ ] **Ban / Unban tài khoản** — Thêm `is_banned`, chặn login nếu bị ban
- [ ] **Tặng/Trừ tài nguyên** — Thêm/bớt Linh Thạch hoặc vật phẩm trực tiếp
- [ ] **Điều chỉnh chỉ số** — Sửa EXP, Cảnh giới, Thọ nguyên, Linh căn khi cần thiết
- [ ] **Mute (Cấm chat)** — Chặn người chơi gửi tin nhắn (khi có hệ thống chat)

**3. Quản lý Nội dung Game (Content Management)**
- [ ] **Quản lý Vật phẩm (Items)** — Di chuyển data từ file JS sang DB, thêm/sửa/xóa vật phẩm
- [ ] **Quản lý Tông môn** — Xem danh sách, xóa hoặc sửa tên tông môn vi phạm
- [ ] **Quản lý Đấu giá hội** — Can thiệp xóa listing vi phạm, hoàn tiền thủ công
- [ ] **Quản lý Shop** — Điều chỉnh giá cả, bật/tắt bán vật phẩm

**4. Quản lý Sự kiện & Hệ thống (Events & Config)**
- [ ] **Global Buff** — X2/X3 tốc độ tu luyện hoặc sự kiện toàn server
- [ ] **Hệ thống Thư (Mail/Inbox)** — Gửi thông báo hoặc quà đền bù cho người chơi
- [ ] **Thông báo Server (Announcement)** — Hiển thị banner bảo trì, sự kiện

**5. Thống kê & Báo cáo (Analytics)**
- [ ] **Dashboard tổng quan** — Thống kê CCU, đăng ký mới, lượng Linh Thạch lưu thông
- [ ] **Audit Log (Action Logs)** — Ghi log mọi hành động của Admin để theo dõi
- [ ] **Cheat Detection** — Tự động cảnh báo khi có giao dịch hoặc lượng EXP tăng bất thường
- [ ] **Lịch sử giao dịch toàn server** — Theo dõi luồng tiền tệ trong game

---

## 🚀 Hướng dẫn chạy

### Backend

```bash
cd backend
npm install
# Điền SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY vào .env
# Chạy supabase_schema.sql trong Supabase Dashboard > SQL Editor
npm run dev      # http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

### Biến môi trường Backend (`.env`)

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Service Role key (không phải anon key!)

JWT_SECRET=your_super_secret_key
JWT_ACCESS_EXPIRES_IN=15m
```

---

## 📁 Cấu trúc thư mục

```
tuien/
├── backend/
│   ├── supabase_schema.sql      # Chạy lần đầu trên Supabase
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # Test kết nối Supabase
│   │   │   └── supabase.js      # Supabase client singleton
│   │   ├── models/              # Supabase query helpers
│   │   ├── controllers/         # Business logic
│   │   ├── routes/              # Express routes
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js
│   │   └── data/
│   │       ├── items.js         # Dữ liệu vật phẩm (hardcoded)
│   │       └── dungeons.js      # Dữ liệu bí cảnh (hardcoded)
└── frontend/
    └── src/
        ├── components/          # React components
        ├── services/            # API service layer
        └── App.tsx
```
