import mongoose from 'mongoose';

// Helper: tạo mảng 36 tầng (4 kỳ × 9 tầng con)
const REALM_STAGES = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Đại Viên Mãn']
  .flatMap(k => Array.from({ length: 9 }, (_, i) => `${k} Tầng ${i + 1}`));
// ['Sơ Kỳ Tầng 1', ..., 'Sơ Kỳ Tầng 9', 'Trung Kỳ Tầng 1', ..., 'Đại Viên Mãn Tầng 9']

// ─── Cảnh giới tu luyện ───────────────────────────────────────────────────────
// Mỗi cảnh giới có 9 tầng (Sơ Kỳ → Trung Kỳ → Hậu Kỳ → Đại Viên Mãn → ...)
// exp_required: tổng kinh nghiệm cần để đột phá từ cảnh giới này
export const REALMS = [
  {
    id: 0,
    name: 'Luyện Khí',
    color: '#7ed99e',
    expRequired: 1000,        // tán tu ~1000 giây, tông môn ~500 giây
    stages: REALM_STAGES,
  },
  {
    id: 1,
    name: 'Trúc Cơ',
    color: '#f2ca50',
    expRequired: 5000,
    stages: REALM_STAGES,
  },
  {
    id: 2,
    name: 'Kim Đan',
    color: '#f2ca50',
    expRequired: 20000,
    stages: REALM_STAGES,
  },
  {
    id: 3,
    name: 'Nguyên Anh',
    color: '#b066ff',
    expRequired: 80000,
    stages: REALM_STAGES,
  },
  {
    id: 4,
    name: 'Hóa Thần',
    color: '#b066ff',
    expRequired: Infinity,
    stages: REALM_STAGES,// cảnh giới cao nhất của phàm giới 
  },
];

// ─── Tốc độ tu luyện cơ bản (EXP/giây) ──────────────────────────────────────
export const BASE_SPEED = {
  散修: 0.1,   // tán tu (không tông môn) — tu luyện chậm nhất
  宗门: 0.25,  // tông môn — nhanh hơn 2.5×
};

// Hệ số bonus theo phẩm cấp linh căn
export const SPIRIT_ROOT_MULTIPLIER = {
  Hoàng: 1.0,
  Huyền: 1.5,
  Địa: 2.0,
  Thiên: 3.0,
};

const cultivationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // Trạng thái tu luyện
    isTraining: {
      type: Boolean,
      default: false,
    },

    // Thời điểm bắt đầu tu luyện lần gần nhất
    trainingStartedAt: {
      type: Date,
      default: null,
    },

    // EXP tích lũy trước lần tu luyện hiện tại
    expAccumulated: {
      type: Number,
      default: 0,
    },

    // Cảnh giới hiện tại (0 = Luyện Khí, 4 = Hóa Thần)
    realmIndex: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },

    // Tổng exp trong cảnh giới hiện tại
    realmExp: {
      type: Number,
      default: 0,
    },

    // Tông môn (null = tán tu)
    sectName: {
      type: String,
      default: null,
    },

    // Thời điểm gia nhập tông môn
    sectJoinedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// ─── Virtual: tính EXP hiện tại bao gồm cả phần đang train offline ────────────
cultivationSchema.methods.computeCurrentExp = function (spiritRootGrade) {
  if (!this.isTraining || !this.trainingStartedAt) {
    return this.expAccumulated;
  }

  const now = Date.now();
  const elapsed = (now - this.trainingStartedAt) / 1000; // giây
  const speed = this.computeSpeed(spiritRootGrade);
  const gained = Math.max(0, elapsed * speed);

  return this.expAccumulated + gained;
};

// ─── Method: tốc độ tu luyện hiện tại (EXP/giây) ─────────────────────────────
cultivationSchema.methods.computeSpeed = function (spiritRootGrade) {
  const base = this.sectName ? BASE_SPEED['宗门'] : BASE_SPEED['散修'];
  const multiplier = SPIRIT_ROOT_MULTIPLIER[spiritRootGrade] || 1.0;
  return base * multiplier;
};

const Cultivation = mongoose.model('Cultivation', cultivationSchema);

export default Cultivation;
