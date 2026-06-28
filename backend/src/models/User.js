import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username là bắt buộc'],
      unique: true,
      trim: true,
      minlength: [3, 'Username phải có ít nhất 3 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: {
      type: String,
      required: [true, 'Password là bắt buộc'],
      minlength: [6, 'Password phải có ít nhất 6 ký tự'],
      select: false,
    },
    gender: {
      type: String,
      enum: ['male', 'female', null],  // null hợp lệ khi chưa tạo nhân vật
      default: null,
    },
    spiritRoot: {
      type: String,
      default: null,
    },
    spiritRootGrade: {
      type: String,
      enum: ['Thiên', 'Địa', 'Huyền', 'Hoàng', null],  // chỉ chấp nhận các phẩm cấp hợp lệ
      default: null,
    },
    isCharacterCreated: {
      type: Boolean,
      default: false,
    },

    // ─── Linh Thạch (Spirit Stones) ─────────────────────────────────────────
    spiritStones: {
      type: Number,
      default: 100,
      min: 0,
    },

    // Thời điểm thu thập Linh Thạch idle lần cuối
    lastStoneCollectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// Hash password trước khi lưu
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});


// Method kiểm tra password khi đăng nhập
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
