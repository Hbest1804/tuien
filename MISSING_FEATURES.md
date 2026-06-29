# 📜 Roadmap — Chức năng còn thiếu / cần bổ sung

> **Hiện trạng đã có:**
> User, đăng ký/đăng nhập, tạo nhân vật, random Linh Căn, Tu luyện idle theo thời gian thực, Thọ nguyên, Tông môn (gia nhập/rời), Đột phá (có tỷ lệ thành công, Lôi Kiếp, Tâm Ma), Túi đồ (Inventory), Đan dược (EXP, tăng tốc, Thọ Nguyên Quả, Phá Cảnh Đan), Pháp bảo (vũ khí, phòng hộ lôi kiếp), Nguyên liệu cơ bản, Linh Thạch Idle (thu thập theo cảnh giới), Thương Hội/Shop (mua bán toàn bộ vật phẩm), Đấu giá hội (đặt thầu, mua ngay, claim, huỷ).

---

## 1. Hệ thống Vật phẩm & Túi đồ

- [ ] **Tăng độ phong phú vật phẩm:** Chỉ có 1 nguyên liệu (`Huyết Linh Thảo`). Cần bổ sung nguyên liệu các cấp (Trúc Cơ, Kim Đan...) để làm nền tảng cho Luyện Đan sau này.
- [ ] **Công pháp (Kỹ năng sách):** Item loại `TECHNIQUE` giúp tăng vĩnh viễn hệ số tốc độ tu luyện hoặc chỉ số chiến đấu — hiện chưa có loại item này.
- [ ] **Equip slot cho Vũ khí/Giáp:** Vũ khí và giáp đã có trong data (`atkBonus`, `tribulationDefense`) nhưng **chưa được áp dụng** vào chỉ số thực tế — cần hệ thống "trang bị" (equip slot) riêng.

---

## 2. Hệ thống Tiền tệ & Kinh tế

- [ ] **Nguồn Linh Thạch đa dạng hơn:** Hiện chỉ có idle tự động. Cần thêm: nhiệm vụ, bí cảnh, khai thác linh mạch.
- [ ] **Bán vật phẩm cho NPC:** Người chơi chưa thể bán lại đồ vào shop — chỉ đấu giá với nhau.

---

## 3. Hệ thống Kỹ năng & Công pháp

- [ ] **Công pháp (Techniques):** Sách kỹ năng tăng vĩnh viễn hệ số tu luyện. Chưa có model, UI, cơ chế học công pháp.
- [ ] **Thần thông/Bí thuật (Spells):** Kỹ năng chủ động dùng trong chiến đấu. Phụ thuộc vào hệ thống chiến đấu.
- [ ] **Tàng Kinh Các:** UI và API nơi người chơi đổi điểm cống hiến lấy công pháp (trong Tông Môn).

---

## 4. Hệ thống Tông môn nâng cao

- [ ] **Điểm Cống hiến (Sect Contribution):** Chưa có. Cần thêm field vào model, cơ chế tích điểm và đổi thưởng.
- [ ] **Chức vụ Tông môn:** Chưa có hệ thống thăng chức (Tạp dịch → Ngoại môn → Nội môn → Chân truyền → Trưởng lão → Tông chủ). Mỗi cấp có bonus tu luyện riêng.
- [ ] **Nhiệm vụ Tông môn hàng ngày:** Nguồn cung điểm cống hiến và tài nguyên ổn định.
- [ ] **Chiến tranh Tông môn (Sect Wars):** Tính năng mở rộng dài hạn — các tông môn tranh giành linh mạch.

---

## 5. Rủi ro Đột phá & Thiên Kiếp

> ✅ Đã có: tỷ lệ thành công theo cảnh giới, Lôi Kiếp (`tribulationDamage`), Tâm Ma sau 3 lần thất bại liên tiếp.

- [ ] **Mất căn cơ khi thất bại nặng:** Hiện thất bại chỉ trừ EXP/thọ nguyên. Cảnh giới cao (Nguyên Anh+) có thể thêm cơ chế hỏng Linh Căn tạm thời.
- [ ] **Hiển thị rõ tỷ lệ đột phá trên UI:** BreakthroughModal cần hiển thị % thành công + sát thương lôi kiếp trước khi người chơi bấm xác nhận.

---

## 6. Hệ thống Chiến đấu & Bí cảnh

- [ ] **Chỉ số nhân vật (Stats):** Chưa có HP, ATK, DEF, Bạo kích. Vũ khí có `atkBonus` trong data nhưng không được dùng ở đâu.
- [ ] **Bí Cảnh / Lịch Luyện (Dungeons):** Chế độ treo máy 1–2 tiếng để mang về linh thạch và nguyên liệu. Cần model `DungeonRun` và API.
- [ ] **Yêu Thú (Beasts):** Danh sách quái theo cấp độ để săn bắn (phụ thuộc hệ thống chiến đấu).

---

## 7. Tương tác Người chơi (Social & PvP)

- [ ] **Bảng xếp hạng (Leaderboards):** API + UI xếp hạng theo Tu Vi, Linh Thạch, Cảnh giới. Chưa có.
- [ ] **Tỷ võ đài (Arena / PvP):** Chưa có. Cần hệ thống chiến đấu trước.
- [ ] **Truyền âm (Chat):** Chưa có. Chat Thế giới, Tông môn, tin nhắn riêng.
- [ ] **Đạo Lữ / Song Tu:** Kết đôi 2 người chơi nhận buff cộng hưởng. Tính năng mở rộng.

---

## 8. Hệ thống Nghề nghiệp (Professions)

- [ ] **Luyện Đan Sư (Alchemist):** Dùng nguyên liệu chế tạo đan dược. Cần recipe system và UI lò luyện đan.
- [ ] **Luyện Khí Sư (Blacksmith):** Chế tạo pháp bảo từ nguyên liệu kim loại.
- [ ] **Trận Pháp Sư (Array Master):** Đặt trận pháp tăng buff khu vực (tính năng mở rộng).

---

## 9. Nhiệm vụ & Thành tựu

- [ ] **Nhiệm vụ hàng ngày (Daily Quests):** Đăng nhập, tu luyện X giờ, đặt thầu, điểm danh tông môn... Chưa có model Quest và API.
- [ ] **Nhiệm vụ chính tuyến (Main Quests):** Hướng dẫn tân thủ theo cốt truyện. Chưa có.
- [ ] **Thành tựu (Achievements):** Mở khóa danh hiệu hiển thị trên tên nhân vật (ví dụ: "Thiên Đạo Sủng Nhi", "Kết Đan Kỳ Lão Quái"). Chưa có.

---

## 10. UX / Kỹ thuật còn thiếu

- [ ] **Thông báo (Notifications):** Đấu giá bị vượt thầu, đấu giá kết thúc, buff hết hạn... Chưa có hệ thống push/alert.
- [ ] **Lịch sử giao dịch:** Lịch sử mua bán tại shop và đấu giá hội. Chưa có.
- [ ] **Filter theo tên vật phẩm tại Đấu giá hội:** Hiện chỉ có filter type/rarity, chưa search theo tên.
- [ ] **Refresh token / bảo mật nâng cao:** JWT hiện tại chỉ là access token đơn thuần, chưa có refresh token.
