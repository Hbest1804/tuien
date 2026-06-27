import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    
    maxSlots: {
      type: Number,
      default: 50, // Mặc định 50 ô đồ
    },
    
    // Lưu danh sách vật phẩm. Mỗi ô chứa itemId và số lượng
    items: [
      {
        itemId: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: 1,
        },
      }
    ],
    
    // Trang bị hiện tại
    equipment: {
      weapon: {
        type: String, // itemId
        default: null,
      },
      armor: {
        type: String, // itemId
        default: null,
      }
    },
    
    // Các trạng thái buff từ đan dược (VD: x2 tốc độ trong 2 giờ)
    activeBuffs: [
      {
        buffType: {
          type: String, // 'SPEED_X2', vv
          required: true,
        },
        multiplier: {
          type: Number,
          required: true,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
      }
    ]
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// Method: dọn dẹp các buff đã hết hạn
inventorySchema.methods.cleanExpiredBuffs = function () {
  const now = new Date();
  const initialLength = this.activeBuffs.length;
  
  this.activeBuffs = this.activeBuffs.filter(buff => buff.expiresAt > now);
  this.markModified('activeBuffs');
  
  return this.activeBuffs.length !== initialLength; // Trả về true nếu có buff bị xóa
};

// Method: lấy tổng hệ số buff tốc độ (multiplicative)
inventorySchema.methods.getSpeedBuffMultiplier = function () {
  this.cleanExpiredBuffs(); // Dọn dẹp trước khi tính toán
  
  let totalMultiplier = 1.0;
  for (const buff of this.activeBuffs) {
    if (buff.buffType.startsWith('SPEED_')) {
      totalMultiplier *= buff.multiplier;
    }
  }
  return totalMultiplier;
};

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
