# 📖 TuTiên Game — API & Feature Reference

> **Stack:** Node.js + Express · Supabase (PostgreSQL) · React + TypeScript · Vite

---

## 🗄️ Database

| Table | Mô tả |
|-------|-------|
| `users` | Thông tin tài khoản + nhân vật (role, ban, mute, reset_otp) |
| `cultivations` | Dữ liệu tu luyện, cảnh giới, tông môn, nhiệm vụ tông môn, bí cảnh |
| `inventories` | Túi đồ, trang bị, buff tốc độ |
| `auction_listings` | Phiên đấu giá |
| `refresh_tokens` | JWT refresh token (server-side rotation) |

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
| `POST` | `/change-password` | Đổi mật khẩu (nhập MK cũ + MK mới), revoke toàn bộ refresh token | ✅ |
| `POST` | `/forgot-password` | Gửi OTP 6 số qua email (rate limit: 3 lần/giờ) | ❌ |
| `POST` | `/verify-otp` | Xác thực OTP → nhận `resetToken` tạm thời (5 phút) | ❌ |
| `POST` | `/reset-password` | Đặt lại mật khẩu bằng `resetToken` | ❌ |

> **Rate Limiting Auth:** `POST /login`, `/register`, `/forgot-password` giới hạn **5 request / 15 phút / IP**. OTP endpoints: **3 request / giờ / IP**.

### Linh Căn (Spirit Root) — Random khi tạo nhân vật

| Phẩm cấp | Hệ số tốc độ | Tỷ lệ ra |
|-----------|-------------|---------|
| 🟡 Hoàng  | ×1.0 | ~60% |
| 🔵 Huyền  | ×1.5 | ~25% |
| 🟣 Địa   | ×2.0 | ~12% |
| ⭐ Thiên  | ×3.0 | ~3%  |

---

## 👤 Hồ Sơ Người Chơi — `/api/users`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET`  | `/:username` | Xem hồ sơ công khai của người chơi khác (cảnh giới, linh căn, tông môn) | ❌ |

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
|---|-----------|---------|--------------|---------
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

| Cảnh giới | Thọ nguyên tối đa | Hao mòn/giờ (khi không tu luyện) |
|-----------|------------------|---------------------------------|
| Luyện Khí | 100 năm | 1 năm/giờ |
| Trúc Cơ | 200 năm | 1 năm/giờ |
| Kim Đan | 500 năm | 1 năm/giờ |
| Nguyên Anh | 1,000 năm | 1 năm/giờ |
| Hóa Thần | ∞ | 0 (bất tử) |

> ⏱️ 1 năm trong game = 1 giờ thực tế (`SECONDS_PER_YEAR = 3600`)

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
|------|---------|---------
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
| `GET`  | `/` | Danh sách phiên đang active (filter `?name=`, `?itemType=`, `?rarity=`, `?sort=`, phân trang) | ✅ |
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
| `GET`  | `/` | Trạng thái bí cảnh + danh sách dungeon | ✅ |
| `POST` | `/start` | Bắt đầu thám hiểm bí cảnh (treo máy) | ✅ |
| `POST` | `/claim` | Kết thúc và nhận phần thưởng | ✅ |

> Phần thưởng: Linh Thạch/giờ + rớt đồ ngẫu nhiên (theo `dropRate`). Không thể vừa tu luyện vừa thám hiểm.

### Danh sách Bí Cảnh

| ID | Tên | Cảnh giới yêu cầu | Linh Thạch/giờ | Ghi chú |
|----|-----|-------------------|---------------|---------|
| `dung_sect` | Thiên Kiếm Tông | Luyện Khí+ | 0 | Khu vực tông môn, bế quan tu luyện |
| `dung_thu_thach_coc` | Thử Thách Cốc | Luyện Khí+ | 500 | Bí cảnh tân thủ, rớt linh thảo + Tụ Khí Đan |
| `dung_thuy_tinh_dong` | Thủy Tinh Động | Trúc Cơ+ | 1,500 | Rớt nguyên liệu Kim Đan + vũ khí hiếm 1% |
| `dung_van_co_cam_dia` | Vạn Cổ Cấm Địa | Kim Đan+ | 5,000 | Rớt Tho Nguyên Quả, giáp hiếm 1% |
| `dung_thien_cung_di_tich` | Thiên Cung Di Tích | Nguyên Anh+ | 20,000 | Rớt siêu công pháp 0.5%, vũ khí huyền thoại |

---

## 🏆 Bảng Xếp Hạng — `/api/leaderboard`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET`  | `/` | Bảng xếp hạng (mặc định: `?type=realm`) | ✅ |
| `GET`  | `/?type=realm` | Top 50 theo Cảnh giới + EXP (mặc định) | ✅ |
| `GET`  | `/?type=stones` | Top 50 theo Linh Thạch | ✅ |

---

## 🛡️ Admin Dashboard — `/api/admin` *(Protected: Admin only)*

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET`  | `/dashboard` | Thống kê tổng quan (CCU, users mới, Linh Thạch lưu thông) |
| `GET`  | `/users` | Danh sách người chơi (tìm kiếm, filter, phân trang) |
| `GET`  | `/users/:id` | Chi tiết một người chơi |
| `POST` | `/users/:id/ban` | Ban tài khoản |
| `POST` | `/users/:id/unban` | Unban tài khoản |
| `POST` | `/users/:id/mute` | Mute (cấm chat) |
| `POST` | `/users/:id/unmute` | Unmute |
| `POST` | `/users/:id/grant-resources` | Tặng/trừ Linh Thạch hoặc vật phẩm |
| `POST` | `/users/:id/adjust-stats` | Điều chỉnh EXP, Cảnh giới, Thọ nguyên, Linh Căn |
| `GET`  | `/sects` | Danh sách tông môn |
| `DELETE` | `/sects/:sectName` | Xóa tông môn |
| `PATCH`  | `/sects/:sectName/rename` | Đổi tên tông môn |
| `GET`  | `/auctions` | Danh sách đấu giá (admin view) |
| `DELETE` | `/auctions/:id` | Xóa listing vi phạm |
| `GET`  | `/shop-config` | Cấu hình shop hiện tại |
| `PATCH`  | `/shop-config` | Cập nhật giá / bật-tắt vật phẩm shop |
| `GET`  | `/server-config` | Cấu hình server (global buff, announcement) |
| `PATCH`  | `/server-config/global-buff` | Bật/tắt Global Buff (x2/x3 tốc độ) |
| `PATCH`  | `/server-config/announcement` | Đặt banner thông báo server |
| `POST` | `/mail/send` | Gửi thư/quà cho một hoặc toàn bộ người chơi |
| `GET`  | `/audit-logs` | Lịch sử hành động của Admin |
| `GET`  | `/transactions` | Lịch sử giao dịch toàn server |
| `GET`  | `/cheat-alerts` | Cảnh báo gian lận tự động |

---

### ✅ Đã hoàn thành (Giai đoạn 1 — Core)
- [x] Auth đầy đủ (đăng ký, đăng nhập, refresh token, OTP quên mật khẩu, đổi mật khẩu)
- [x] Tu Luyện — EXP, đột phá, thọ nguyên, tâm ma, linh căn
- [x] Túi đồ — dùng đan dược, trang bị, học công pháp
- [x] Kinh tế — Linh Thạch idle, Thương Hội, mua/bán NPC
- [x] Đấu Giá Hội — đăng bán, bid, buyout, claim
- [x] Tông Môn — gia nhập, rời, nhiệm vụ tông môn, Tàng Kinh Các
- [x] Bí Cảnh (Idle Dungeon) — 5 bí cảnh, nhận thưởng Linh Thạch + rớt đồ
- [x] Bảng Xếp Hạng — top cảnh giới, top Linh Thạch
- [x] Admin Dashboard — quản lý người chơi, tông môn, đấu giá, cấu hình server
- [x] Thành tựu (Achievements)
- [x] Lịch sử giao dịch
- [x] Thông báo real-time & Chat WorldChannel qua WebSocket
- [x] **Chiến đấu PvE** — Turn-based tại Đấu Trường với chỉ số HP/ATK/DEF
- [x] **Nhiệm vụ chính & Hàng ngày** — Tracking tiến độ, phần thưởng
- [x] **Mất căn cơ** — Tổn thương Nguyên Anh khi đột phá thất bại

### ✅ Đã hoàn thành (Giai đoạn 2 — Advanced)
- [x] **Luyện Đan (Alchemy)** — Công thức, tỷ lệ thành công theo cảnh giới
- [x] **Luyện Khí (Blacksmith)** — Chế tạo vũ khí + khảm ngọc (enchant) vào Pháp Bảo
- [x] **Chiến đấu PvP (Lôi Đài)** — Mô phỏng tự động + hệ thống ELO rating
- [x] **Nâng cấp Tông Môn** — 4 kiến trúc (Tụ Linh Trận, Luyện Đan Phòng, Thiên Vọng Các, Linh Vực)
- [x] **Tông Môn Chiến** — Tranh giành 4 Linh Mạch, bảng điểm theo tông môn
- [x] **Đệ tử / Đạo Lữ** — Thu nhận đệ tử (tối đa 5), kết Đạo Lữ song tu (+10% EXP)
- [x] **Hệ thống VIP + Jade Shop** — 3 gói VIP, Tiên Ngọc đổi đặc phẩm

---

## 🔧 Còn Thiếu / Cần Hoàn Thiện

### 🔴 Cấp thiết — Database Migration chưa đồng bộ:
- [ ] **Bảng `pvp_records`** — chưa có trong `supabase.sql` chính
- [ ] **Bảng `sect_wars`** — chưa có trong `supabase.sql` chính
- [ ] **Bảng `sects`** (cho kiến trúc tông môn) — chưa có trong schema chính
- [ ] **Cột `jade_coins`, `vip_level`, `vip_expiry_at`** trong bảng `users`
- [ ] **Cột `disciples`, `master_id`, `partner_id`** trong bảng `cultivations`
- [ ] **Stored procedures** `commit_pvp_result` và `attack_linh_mach` — cần tạo trong Supabase

### 🟡 Logic chưa hoàn chỉnh:
- [ ] **Sect War rewards** — `settleWar()` chưa phát thưởng thực tế cho tông môn chiến thắng
- [ ] **Dungeon Roguelike** — Bí cảnh hiện chỉ là idle timer, chưa có nhiều tầng, sự kiện ngẫu nhiên
- [ ] **Boss System** — chưa có Boss rớt đồ Hoàng Kim
- [ ] **Admin cheat-alerts** — endpoint khai báo trong README nhưng chưa có logic phát hiện thực sự
- [ ] **VIP payment gateway** — `purchaseJade` hiện là MOCK, chưa tích hợp Momo/VNPay

### 🟢 Tùy chọn:
- [ ] **Linh Căn reroll** — vật phẩm đặc biệt để random lại Linh Căn
- [ ] **Guild Hall rankings** — Xếp hạng tông môn tổng hợp
- [ ] **Seasonal events** — Sự kiện giới hạn thời gian

---

## 🚀 Hướng dẫn chạy

### Backend

```bash
cd backend
npm install
# Điền các biến môi trường vào .env (xem mục bên dưới)
# Chạy SQL migration trong Supabase Dashboard > SQL Editor
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

# Admin mặc định (tự tạo khi server khởi động lần đầu)
ADMIN_EMAIL=admin@tutien.com
ADMIN_PASSWORD=your_strong_secret_password_here

# Email (dùng cho Quên mật khẩu / OTP)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### SQL Migration (chạy trong Supabase SQL Editor)

Chỉ cần **1 file duy nhất** — gộp toàn bộ Phase 1 + Phase 2:

```bash
# File: backend/supabase.sql
# Mở Supabase Dashboard > SQL Editor > paste toàn bộ nội dung > Run
```

> ✅ File dùng `IF NOT EXISTS` / `CREATE OR REPLACE` — an toàn khi chạy lại nhiều lần trên database đã có sẵn.

**Verify sau khi chạy:**
```sql
-- Kiểm tra tất cả bảng đã tạo
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Kiểm tra tất cả stored procedures
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' ORDER BY routine_name;
```



---

## 📁 Cấu trúc thư mục

```
tuien/
├── backend/
│   ├── supabase.sql             # Schema DB giai đoạn 1 (chạy lần đầu trên Supabase)
│   ├── migrations/
│   │   └── phase2_migration.sql # Schema bổ sung: pvp_records, sect_wars, sects, v.v.
│   └── src/
│       ├── config/
│       │   ├── db.js            # Test kết nối Supabase
│       │   ├── supabase.js      # Supabase client singleton
│       │   ├── wsServer.js      # WebSocket server (broadcast helper)
│       │   ├── emailService.js  # Nodemailer (Gmail App Password)
│       │   ├── cronJobs.js      # Cron 3AM: dọn refresh token hết hạn
│       │   └── seedAdmin.js     # Tự tạo tài khoản admin lần đầu
│       ├── models/              # Supabase query helpers
│       │   ├── User.js
│       │   ├── Cultivation.js
│       │   ├── Inventory.js
│       │   ├── AuctionListing.js
│       │   ├── Achievement.js
│       │   ├── RefreshToken.js
│       │   └── TransactionLog.js
│       ├── controllers/         # Business logic (23 controllers)
│       ├── routes/              # Express routes (22 route files)
│       ├── middlewares/
│       │   ├── authMiddleware.js
│       │   ├── adminMiddleware.js
│       │   └── rateLimiter.js   # Rate limiting (general / auth / otp)
│       └── data/
│           ├── items.js         # Dữ liệu vật phẩm (hardcoded)
│           ├── dungeons.js      # Dữ liệu bí cảnh (hardcoded)
│           ├── recipes.js       # Công thức luyện đan
│           └── blacksmithRecipes.js  # Công thức rèn luyện + đá khảm
└── frontend/
    └── src/
        ├── components/          # 38 React components
        │   ├── Cultivation.tsx / CultivationCard.tsx
        │   ├── Inventory.tsx
        │   ├── Shop.tsx / AuctionHouse.tsx
        │   ├── Sect.tsx / SectWar.tsx
        │   ├── AlchemyLab.tsx / Blacksmith.tsx
        │   ├── CombatArena.tsx / PvPArena.tsx
        │   ├── DungeonExplorer.tsx
        │   ├── DisciplePanel.tsx
        │   ├── JadeShop.tsx
        │   ├── ChatWindow.tsx / NotificationBell.tsx
        │   ├── Achievements.tsx / Leaderboard.tsx
        │   ├── DailyQuests.tsx / MainQuestPanel.tsx
        │   ├── CharacterSetupModal.tsx / BreakthroughModal.tsx
        │   ├── ChangePasswordModal.tsx / ForgotPasswordModal.tsx
        │   └── NavBar.tsx / Footer.tsx / WorldMap.tsx / ...
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   ├── PublicProfilePage.tsx  # /player/:username
        │   └── admin/
        │       └── AdminDashboard.tsx
        ├── services/            # 21 API service layer files
        └── App.tsx
```

