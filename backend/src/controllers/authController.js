import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Danh sách linh căn và tỷ lệ random
const SPIRIT_ROOTS = [
  // ── HUYỀN THOẠI — Cực kỳ hiếm ──────────────────────────────────
  { name: 'Hỗn Nguyên', grade: 'Thiên', weight: 1 },  // ~0.25% — vạn cổ độc nhất
  { name: 'Âm Dương', grade: 'Thiên', weight: 2 },  // ~0.50% — nhị nguyên chi căn
  { name: 'Không Gian', grade: 'Thiên', weight: 2 },  // ~0.50% — không gian pháp tắc

  // ── THIÊN PHẨM — Ngũ hành đầy đủ + linh căn đặc biệt ───────────
  { name: 'Kim', grade: 'Thiên', weight: 4 },
  { name: 'Mộc', grade: 'Thiên', weight: 4 },
  { name: 'Thủy', grade: 'Thiên', weight: 4 },
  { name: 'Hỏa', grade: 'Thiên', weight: 4 },
  { name: 'Thổ', grade: 'Thiên', weight: 4 },  // ← Ngũ hành Thổ Thiên
  { name: 'Lôi', grade: 'Thiên', weight: 3 },
  { name: 'Băng', grade: 'Thiên', weight: 3 },
  { name: 'Phong', grade: 'Thiên', weight: 3 },

  // ── ĐỊA PHẨM — Ngũ hành + linh căn đặc thù ─────────────────────
  { name: 'Kim', grade: 'Địa', weight: 10 },
  { name: 'Mộc', grade: 'Địa', weight: 10 },
  { name: 'Thủy', grade: 'Địa', weight: 10 },
  { name: 'Hỏa', grade: 'Địa', weight: 10 },
  { name: 'Thổ', grade: 'Địa', weight: 10 },
  { name: 'Lôi', grade: 'Địa', weight: 7 },
  { name: 'Băng', grade: 'Địa', weight: 7 },
  { name: 'Phong', grade: 'Địa', weight: 7 },
  { name: 'Quang', grade: 'Địa', weight: 6 },  // Quang Linh Căn — ánh sáng
  { name: 'Ám', grade: 'Địa', weight: 6 },  // Ám Linh Căn — bóng tối
  { name: 'Huyết', grade: 'Địa', weight: 5 },  // Huyết Linh Căn — huyết mạch
  { name: 'Độc', grade: 'Địa', weight: 5 },  // Độc Linh Căn — bá đạo
  { name: 'Tinh Thần', grade: 'Địa', weight: 5 },  // Tinh Thần Linh Căn — hồn pháp

  // ── HUYỀN PHẨM ───────────────────────────────────────────────────
  { name: 'Kim', grade: 'Huyền', weight: 18 },
  { name: 'Mộc', grade: 'Huyền', weight: 18 },
  { name: 'Thủy', grade: 'Huyền', weight: 18 },
  { name: 'Hỏa', grade: 'Huyền', weight: 18 },
  { name: 'Thổ', grade: 'Huyền', weight: 18 },
  { name: 'Lôi', grade: 'Huyền', weight: 10 },
  { name: 'Băng', grade: 'Huyền', weight: 10 },
  { name: 'Phong', grade: 'Huyền', weight: 10 },
  { name: 'Quang', grade: 'Huyền', weight: 8 },
  { name: 'Ám', grade: 'Huyền', weight: 8 },
  { name: 'Độc', grade: 'Huyền', weight: 7 },
  { name: 'Tinh Thần', grade: 'Huyền', weight: 7 },

  // ── HOÀNG PHẨM — Phổ biến nhất ──────────────────────────────────
  { name: 'Kim', grade: 'Hoàng', weight: 22 },
  { name: 'Mộc', grade: 'Hoàng', weight: 22 },
  { name: 'Thủy', grade: 'Hoàng', weight: 22 },
  { name: 'Hỏa', grade: 'Hoàng', weight: 22 },
  { name: 'Thổ', grade: 'Hoàng', weight: 22 },
  { name: 'Lôi', grade: 'Hoàng', weight: 12 },
  { name: 'Băng', grade: 'Hoàng', weight: 12 },
  { name: 'Phong', grade: 'Hoàng', weight: 12 },
  { name: 'Huyết', grade: 'Hoàng', weight: 8 },
  { name: 'Độc', grade: 'Hoàng', weight: 8 },
  { name: 'Tinh Thần', grade: 'Hoàng', weight: 8 },
];

// Pre-compute tổng weight một lần duy nhất (performance)
const TOTAL_WEIGHT = SPIRIT_ROOTS.reduce((sum, r) => sum + r.weight, 0);

const randomSpiritRoot = () => {
  let rand = Math.random() * TOTAL_WEIGHT;
  for (const root of SPIRIT_ROOTS) {
    rand -= root.weight;
    if (rand <= 0) return root;
  }
  return SPIRIT_ROOTS[SPIRIT_ROOTS.length - 1];
};

// ──────────────────────────────────────
// Tạo JWT token
// ──────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// ──────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }

    // Tạo user mới (password tự động hash trong model)
    const user = await User.create({ username, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        isCharacterCreated: user.isCharacterCreated,
        gender: user.gender,
        spiritRoot: user.spiritRoot,
        spiritRootGrade: user.spiritRootGrade,
        spiritStones: user.spiritStones,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ──────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và password' });
    }

    // Tìm user và lấy thêm trường password (select: false trong schema)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc password không đúng' });
    }

    // So sánh password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc password không đúng' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        isCharacterCreated: user.isCharacterCreated,
        gender: user.gender,
        spiritRoot: user.spiritRoot,
        spiritRootGrade: user.spiritRootGrade,
        spiritStones: user.spiritStones,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ──────────────────────────────────────
// POST /api/auth/setup-character  (cần đăng nhập)
// Random linh căn + lưu giới tính
// ──────────────────────────────────────
export const setupCharacter = async (req, res) => {
  try {
    const { gender } = req.body;

    if (!gender || !['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'Giới tính không hợp lệ' });
    }

    // Random linh căn trước khi query để không block DB
    const { name: spiritRoot, grade: spiritRootGrade } = randomSpiritRoot();

    // Atomic update: chỉ cập nhật nếu isCharacterCreated === false
    // Ngăn chặn race condition khi user gửi nhiều request đồng thời
    const user = await User.findOneAndUpdate(
      { _id: req.user.id, isCharacterCreated: false },
      {
        gender,
        spiritRoot,
        spiritRootGrade,
        isCharacterCreated: true,
      },
      { new: true }
    );

    if (!user) {
      // Kiểm tra xem user có tồn tại không hay đã tạo nhân vật rồi
      const userExists = await User.exists({ _id: req.user.id });
      if (!userExists) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }
      return res.status(400).json({ message: 'Nhân vật đã được tạo trước đó' });
    }

    res.status(200).json({
      message: 'Khai mở linh căn thành công!',
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        isCharacterCreated: user.isCharacterCreated,
        gender: user.gender,
        spiritRoot: user.spiritRoot,
        spiritRootGrade: user.spiritRootGrade,
        spiritStones: user.spiritStones,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ──────────────────────────────────────
// GET /api/auth/me  (cần đăng nhập)
// ──────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.status(200).json({
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        isCharacterCreated: user.isCharacterCreated,
        gender: user.gender,
        spiritRoot: user.spiritRoot,
        spiritRootGrade: user.spiritRootGrade,
        spiritStones: user.spiritStones,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};