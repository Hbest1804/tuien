import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';

// Danh sách linh căn và tỷ lệ random
const SPIRIT_ROOTS = [
  // ── HUYỀN THOẠI — Cực kỳ hiếm ──────────────────────────────────
  { name: 'Hỗn Nguyên', grade: 'Thiên', weight: 1 },
  { name: 'Âm Dương',   grade: 'Thiên', weight: 2 },
  { name: 'Không Gian', grade: 'Thiên', weight: 2 },

  // ── THIÊN PHẨM ───────────────────────────────────────────────────
  { name: 'Kim',  grade: 'Thiên', weight: 4 },
  { name: 'Mộc',  grade: 'Thiên', weight: 4 },
  { name: 'Thủy', grade: 'Thiên', weight: 4 },
  { name: 'Hỏa',  grade: 'Thiên', weight: 4 },
  { name: 'Thổ',  grade: 'Thiên', weight: 4 },
  { name: 'Lôi',  grade: 'Thiên', weight: 3 },
  { name: 'Băng', grade: 'Thiên', weight: 3 },
  { name: 'Phong',grade: 'Thiên', weight: 3 },

  // ── ĐỊA PHẨM ─────────────────────────────────────────────────────
  { name: 'Kim',       grade: 'Địa', weight: 10 },
  { name: 'Mộc',       grade: 'Địa', weight: 10 },
  { name: 'Thủy',      grade: 'Địa', weight: 10 },
  { name: 'Hỏa',       grade: 'Địa', weight: 10 },
  { name: 'Thổ',       grade: 'Địa', weight: 10 },
  { name: 'Lôi',       grade: 'Địa', weight: 7  },
  { name: 'Băng',      grade: 'Địa', weight: 7  },
  { name: 'Phong',     grade: 'Địa', weight: 7  },
  { name: 'Quang',     grade: 'Địa', weight: 6  },
  { name: 'Ám',        grade: 'Địa', weight: 6  },
  { name: 'Huyết',     grade: 'Địa', weight: 5  },
  { name: 'Độc',       grade: 'Địa', weight: 5  },
  { name: 'Tinh Thần', grade: 'Địa', weight: 5  },

  // ── HUYỀN PHẨM ───────────────────────────────────────────────────
  { name: 'Kim',       grade: 'Huyền', weight: 18 },
  { name: 'Mộc',       grade: 'Huyền', weight: 18 },
  { name: 'Thủy',      grade: 'Huyền', weight: 18 },
  { name: 'Hỏa',       grade: 'Huyền', weight: 18 },
  { name: 'Thổ',       grade: 'Huyền', weight: 18 },
  { name: 'Lôi',       grade: 'Huyền', weight: 10 },
  { name: 'Băng',      grade: 'Huyền', weight: 10 },
  { name: 'Phong',     grade: 'Huyền', weight: 10 },
  { name: 'Quang',     grade: 'Huyền', weight: 8  },
  { name: 'Ám',        grade: 'Huyền', weight: 8  },
  { name: 'Độc',       grade: 'Huyền', weight: 7  },
  { name: 'Tinh Thần', grade: 'Huyền', weight: 7  },

  // ── HOÀNG PHẨM ───────────────────────────────────────────────────
  { name: 'Kim',       grade: 'Hoàng', weight: 22 },
  { name: 'Mộc',       grade: 'Hoàng', weight: 22 },
  { name: 'Thủy',      grade: 'Hoàng', weight: 22 },
  { name: 'Hỏa',       grade: 'Hoàng', weight: 22 },
  { name: 'Thổ',       grade: 'Hoàng', weight: 22 },
  { name: 'Lôi',       grade: 'Hoàng', weight: 12 },
  { name: 'Băng',      grade: 'Hoàng', weight: 12 },
  { name: 'Phong',     grade: 'Hoàng', weight: 12 },
  { name: 'Huyết',     grade: 'Hoàng', weight: 8  },
  { name: 'Độc',       grade: 'Hoàng', weight: 8  },
  { name: 'Tinh Thần', grade: 'Hoàng', weight: 8  },
];

const TOTAL_WEIGHT = SPIRIT_ROOTS.reduce((sum, r) => sum + r.weight, 0);

const randomSpiritRoot = () => {
  let rand = Math.random() * TOTAL_WEIGHT;
  for (const root of SPIRIT_ROOTS) {
    rand -= root.weight;
    if (rand <= 0) return root;
  }
  return SPIRIT_ROOTS[SPIRIT_ROOTS.length - 1];
};

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ userId, token, expiresAt });
  return token;
};

const formatUser = (user) => ({
  id: user.id,
  _id: user.id,
  username: user.username,
  email: user.email,
  isCharacterCreated: user.isCharacterCreated,
  gender: user.gender,
  spiritRoot: user.spiritRoot,
  spiritRootGrade: user.spiritRootGrade,
  spiritStones: user.spiritStones,
  role: user.role || 'player',
  isBanned: user.isBanned || false,
  isMuted: user.isMuted || false,
});

// ── POST /api/auth/register ──────────────────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }

    const user = await User.create({ username, email, password });
    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    res.status(201).json({
      message: 'Đăng ký thành công',
      token: accessToken,
      refreshToken,
      user: formatUser(user),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Username hoặc Email đã được sử dụng' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc password không đúng' });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc password không đúng' });
    }

    // Chặn login nếu bị ban
    if (user.isBanned) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin để được hỗ trợ.' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token: accessToken,
      refreshToken,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ── POST /api/auth/refresh ───────────────────────────────────────────────────
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Thiếu refresh token' });
    }

    const tokenDoc = await RefreshToken.findOne({ token: refreshToken, isRevoked: false });
    if (!tokenDoc) {
      return res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã bị thu hồi' });
    }

    if (tokenDoc.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: tokenDoc.id });
      return res.status(401).json({ message: 'Refresh token đã hết hạn, vui lòng đăng nhập lại' });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(401).json({ message: 'User không tồn tại' });
    }

    tokenDoc.isRevoked = true;
    await RefreshToken.save(tokenDoc);

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = await generateRefreshToken(user.id);

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ── POST /api/auth/logout ────────────────────────────────────────────────────
export const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.updateOne({ token: refreshToken }, { isRevoked: true });
    }
    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ── POST /api/auth/setup-character ──────────────────────────────────────────
export const setupCharacter = async (req, res) => {
  try {
    const { gender } = req.body;
    if (!gender || !['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'Giới tính không hợp lệ' });
    }

    if (req.user.isCharacterCreated) {
      return res.status(400).json({ message: 'Nhân vật đã được tạo trước đó' });
    }

    const { name: spiritRoot, grade: spiritRootGrade } = randomSpiritRoot();

    const user = await User.findOneAndUpdate(
      { id: req.user.id, isCharacterCreated: false },
      { gender, spiritRoot, spiritRootGrade, isCharacterCreated: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.status(200).json({
      message: 'Khai mở linh căn thành công!',
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.status(200).json({ user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};