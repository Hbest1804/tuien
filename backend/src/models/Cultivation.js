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

// ─── Hệ thống Thọ Nguyên ──────────────────────────────────────────────────────
// 1 giờ thực = 1 năm tu luyện
export const SECONDS_PER_YEAR = 3600;

// Thọ nguyên tối đa theo từng cảnh giới (năm)
export const REALM_LIFESPAN = [100, 200, 500, 1000, Infinity];

// Thọ nguyên hao mòn mỗi năm khi trì hoãn đột phá (năm/năm)
export const LIFESPAN_DRAIN_PER_YEAR = [1, 2, 5, 10, 0];

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

    // ─── Thọ Nguyên & Đột Phá ──────────────────────────────────────────────
    // Thời điểm EXP chạm ngưỡng và dừng tu luyện (chờ đột phá)
    breakthroughReadyAt: {
      type: Date,
      default: null,
    },

    // Thọ nguyên hiện tại (năm) — được flush mỗi khi có hành động quan trọng
    lifespan: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// ─── Method: tính EXP hiện tại (bao gồm offline, có cap ở ngưỡng cảnh giới) ──
cultivationSchema.methods.computeCurrentExp = function (spiritRootGrade) {
  if (!this.isTraining || !this.trainingStartedAt) {
    return this.expAccumulated;
  }

  const now = Date.now();
  const elapsed = (now - this.trainingStartedAt.getTime()) / 1000; // giây
  const speed = this.computeSpeed(spiritRootGrade);
  const gained = Math.max(0, elapsed * speed);
  const raw = this.expAccumulated + gained;

  // Cap EXP ở ngưỡng đột phá của cảnh giới hiện tại
  const realm = REALMS[this.realmIndex];
  const cap = realm?.expRequired ?? Infinity;
  return cap === Infinity ? raw : Math.min(raw, cap);
};

// ─── Method: tốc độ tu luyện hiện tại (EXP/giây) ─────────────────────────────
cultivationSchema.methods.computeSpeed = function (spiritRootGrade) {
  const base = this.sectName ? BASE_SPEED['宗门'] : BASE_SPEED['散修'];
  const multiplier = SPIRIT_ROOT_MULTIPLIER[spiritRootGrade] || 1.0;
  return base * multiplier;
};

// ─── Method: số năm đã chờ kể từ khi EXP đầy (real-time) ─────────────────────
cultivationSchema.methods.computeYearsWaiting = function () {
  if (!this.breakthroughReadyAt) return 0;
  const elapsed = (Date.now() - this.breakthroughReadyAt.getTime()) / 1000; // giây
  return elapsed / SECONDS_PER_YEAR;
};

// ─── Method: thọ nguyên hiện tại (sau khi trừ hao mòn real-time) ─────────────
cultivationSchema.methods.computeCurrentLifespan = function () {
  const yearsWaiting = this.computeYearsWaiting();
  const drainPerYear = LIFESPAN_DRAIN_PER_YEAR[this.realmIndex] ?? 0;
  return Math.max(0, this.lifespan - yearsWaiting * drainPerYear);
};

const Cultivation = mongoose.model('Cultivation', cultivationSchema);

export default Cultivation;
