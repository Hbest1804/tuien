import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Danh sách linh căn và tỷ lệ random
const SPIRIT_ROOTS = [
  { name: 'Hỗn Nguyên', grade: 'Thiên', weight: 1 },   // 1% - siêu hiếm
  { name: 'Kim',         grade: 'Thiên', weight: 3 },
  { name: 'Mộc',         grade: 'Thiên', weight: 3 },
  { name: 'Thủy',        grade: 'Thiên', weight: 3 },
  { name: 'Hỏa',         grade: 'Thiên', weight: 3 },
  { name: 'Lôi',         grade: 'Địa',   weight: 8 },
  { name: 'Băng',        grade: 'Địa',   weight: 8 },
  { name: 'Phong',       grade: 'Địa',   weight: 8 },
  { name: 'Kim',         grade: 'Địa',   weight: 10 },
  { name: 'Mộc',         grade: 'Địa',   weight: 10 },
  { name: 'Thủy',        grade: 'Địa',   weight: 10 },
  { name: 'Hỏa',         grade: 'Địa',   weight: 10 },
  { name: 'Thổ',         grade: 'Địa',   weight: 10 },
  { name: 'Kim',         grade: 'Huyền', weight: 15 },
  { name: 'Mộc',         grade: 'Huyền', weight: 15 },
  { name: 'Thủy',        grade: 'Huyền', weight: 15 },
  { name: 'Hỏa',         grade: 'Huyền', weight: 15 },
  { name: 'Thổ',         grade: 'Huyền', weight: 15 },
  { name: 'Kim',         grade: 'Hoàng', weight: 20 },
  { name: 'Mộc',         grade: 'Hoàng', weight: 20 },
  { name: 'Thủy',        grade: 'Hoàng', weight: 20 },
  { name: 'Hỏa',         grade: 'Hoàng', weight: 20 },
  { name: 'Thổ',         grade: 'Hoàng', weight: 20 },
];

const randomSpiritRoot = () => {
  const totalWeight = SPIRIT_ROOTS.reduce((sum, r) => sum + r.weight, 0);
  let rand = Math.random() * totalWeight;
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
        username: user.username,
        email: user.email,
        isCharacterCreated: user.isCharacterCreated,
        gender: user.gender,
        spiritRoot: user.spiritRoot,
        spiritRootGrade: user.spiritRootGrade,
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
        username: user.username,
        email: user.email,
        isCharacterCreated: user.isCharacterCreated,
        gender: user.gender,
        spiritRoot: user.spiritRoot,
        spiritRootGrade: user.spiritRootGrade,
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

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (user.isCharacterCreated) {
      return res.status(400).json({ message: 'Nhân vật đã được tạo trước đó' });
    }

    // Random linh căn
    const { name: spiritRoot, grade: spiritRootGrade } = randomSpiritRoot();

    user.gender = gender;
    user.spiritRoot = spiritRoot;
    user.spiritRootGrade = spiritRootGrade;
    user.isCharacterCreated = true;
    await user.save();

    res.status(200).json({
      message: 'Khai mở linh căn thành công!',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isCharacterCreated: user.isCharacterCreated,
        gender: user.gender,
        spiritRoot: user.spiritRoot,
        spiritRootGrade: user.spiritRootGrade,
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
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isCharacterCreated: user.isCharacterCreated,
        gender: user.gender,
        spiritRoot: user.spiritRoot,
        spiritRootGrade: user.spiritRootGrade,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};