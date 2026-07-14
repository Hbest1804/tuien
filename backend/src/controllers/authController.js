import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { sendResetOtpEmail } from '../config/emailService.js';

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

// ── POST /api/auth/change-password ───────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    // Lấy user với password (findById không omit password)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Xác thực mật khẩu cũ
    const isMatch = await User.comparePassword(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.updatePassword(req.user.id, hashedPassword);

    // Revoke tất cả refresh tokens cũ (bảo mật: buộc đăng nhập lại trên các thiết bị khác)
    await RefreshToken.revokeAllForUser(req.user.id);

    res.json({ message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    // Luôn trả 200 dù email tồn tại hay không (tránh enum attack)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'Nếu email tồn tại, bạn sẽ nhận được mã OTP trong vài phút.' });
    }

    // Tạo OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    await User.saveResetOtp(user.id, otp, expiresAt);

    // Gửi email (không await để trả response nhanh hơn)
    sendResetOtpEmail(user.email, otp).catch((err) =>
      console.error('[forgotPassword] Lỗi gửi email:', err.message)
    );

    res.status(200).json({ message: 'Nếu email tồn tại, bạn sẽ nhận được mã OTP trong vài phút.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ── POST /api/auth/verify-otp ───────────────────────────────────────────────
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mã OTP' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOtp) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    // Kiểm tra OTP khớp và chưa hết hạn
    if (user.resetOtp !== otp.toString()) {
      return res.status(400).json({ message: 'Mã OTP không đúng' });
    }
    if (new Date() > user.resetOtpExpiresAt) {
      await User.clearResetOtp(user.id);
      return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    // Tạo reset token tạm thời (5 phút)
    const resetToken = jwt.sign(
      { id: user.id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    // Xóa OTP đã dùng
    await User.clearResetOtp(user.id);

    res.json({ message: 'Xác thực OTP thành công', resetToken });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Xác thực reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ message: 'Token không hợp lệ' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.updatePassword(decoded.id, hashedPassword);
    // Revoke tất cả refresh tokens cũ
    await RefreshToken.revokeAllForUser(decoded.id);

    res.json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};