import { RECIPES } from '../data/recipes.js';
import { ITEMS } from '../data/items.js';
import { REALMS } from '../models/Cultivation.js';
import Inventory from '../models/Inventory.js';
import Cultivation from '../models/Cultivation.js';
import { checkAndUnlock } from '../models/Achievement.js';
import { updateDailyQuestProgress } from './dailyQuestController.js';
import { updateMainQuestProgress } from './mainQuestController.js';
import { broadcast } from '../config/wsServer.js';

// ── GET /api/alchemy/recipes ──────────────────────────────────────────────────
export const getRecipes = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const inventory = await Inventory.findOne({ userId: user.id });
    const cult = await Cultivation.findOne({ userId: user.id });
    const realmIndex = cult?.realmIndex || 0;

    const recipes = Object.values(RECIPES).map(recipe => {
      // Kiểm tra đủ nguyên liệu
      const canCraft = recipe.realmRequired <= realmIndex &&
        recipe.ingredients.every(ing => {
          const slot = inventory?.items?.find(i => i.itemId === ing.itemId);
          return slot && slot.quantity >= ing.quantity;
        });

      // Số lần có thể craft tối đa
      const maxCraftable = recipe.realmRequired > realmIndex ? 0 : Math.min(
        ...recipe.ingredients.map(ing => {
          const slot = inventory?.items?.find(i => i.itemId === ing.itemId);
          return slot ? Math.floor(slot.quantity / ing.quantity) : 0;
        })
      );

      return {
        ...recipe,
        outputItem: ITEMS[recipe.output.itemId] || null,
        ingredientsDetails: recipe.ingredients.map(ing => ({
          ...ing,
          itemData: ITEMS[ing.itemId] || { name: ing.itemId },
          have: inventory?.items?.find(i => i.itemId === ing.itemId)?.quantity || 0,
        })),
        canCraft,
        maxCraftable,
        realmUnlocked: recipe.realmRequired <= realmIndex,
        currentRealm: REALMS[realmIndex]?.name || 'Luyện Khí',
      };
    });

    res.json({ recipes });
  } catch (err) {
    console.error('getRecipes error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ── POST /api/alchemy/craft ───────────────────────────────────────────────────
export const craftItem = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { recipeId, quantity = 1 } = req.body;
    if (!recipeId || !RECIPES[recipeId]) {
      return res.status(400).json({ message: 'Công thức không tồn tại' });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return res.status(400).json({ message: 'Số lượng phải từ 1 đến 10' });
    }

    const recipe = RECIPES[recipeId];
    const cult = await Cultivation.findOne({ userId: user.id });
    const realmIndex = cult?.realmIndex || 0;

    if (recipe.realmRequired > realmIndex) {
      return res.status(403).json({
        message: `Cần đạt cảnh giới ${REALMS[recipe.realmRequired]?.name || recipe.realmRequired} để luyện công thức này`,
      });
    }

    const inventory = await Inventory.findOne({ userId: user.id });
    if (!inventory) return res.status(404).json({ message: 'Không tìm thấy túi đồ' });

    // Kiểm tra và tiêu thụ nguyên liệu
    for (const ing of recipe.ingredients) {
      const slot = inventory.items.find(i => i.itemId === ing.itemId);
      const needed = ing.quantity * quantity;
      if (!slot || slot.quantity < needed) {
        const itemData = ITEMS[ing.itemId];
        return res.status(400).json({
          message: `Không đủ ${itemData?.name || ing.itemId} (cần ${needed}, có ${slot?.quantity || 0})`,
        });
      }
    }

    // Trừ nguyên liệu
    for (const ing of recipe.ingredients) {
      const idx = inventory.items.findIndex(i => i.itemId === ing.itemId);
      inventory.items[idx].quantity -= ing.quantity * quantity;
      if (inventory.items[idx].quantity <= 0) {
        inventory.items.splice(idx, 1);
      }
    }

    // Roll thành công
    let successCount = 0;
    const results = [];
    for (let i = 0; i < quantity; i++) {
      // Tỷ lệ thành công tăng theo cảnh giới (mỗi realm +5%)
      const finalRate = Math.min(1.0, recipe.successRate + (realmIndex - recipe.realmRequired) * 0.05);
      const success = Math.random() <= finalRate;
      results.push({ attempt: i + 1, success });
      if (success) {
        successCount++;
        // Cộng output vào túi đồ
        const outSlot = inventory.items.find(i => i.itemId === recipe.output.itemId);
        if (outSlot) {
          outSlot.quantity += recipe.output.quantity;
        } else {
          if (inventory.items.length >= (inventory.maxSlots || 50)) {
            // Túi đầy — dừng craft, trả phần đã thành công
            break;
          }
          inventory.items.push({ itemId: recipe.output.itemId, quantity: recipe.output.quantity });
        }
      }
    }

    inventory.markModified('items');
    await Inventory.save(inventory);

    // Trigger achievements + daily quests
    const newAchievements = await checkAndUnlock(user.id, 'alchemy_craft');
    await updateDailyQuestProgress(user.id, 'alchemy_craft');
    await updateMainQuestProgress(user.id, 'alchemy_craft', { craftedPill: successCount > 0 });

    // WebSocket notify nếu mở thành tựu
    if (newAchievements.length > 0) {
      broadcast(`notify:${user.id}`, { type: 'achievement', achievements: newAchievements });
    }

    const outputItem = ITEMS[recipe.output.itemId];
    res.json({
      message: successCount > 0
        ? `⚗️ Luyện Đan thành công ${successCount}/${quantity} lần! Nhận được ${successCount} ${outputItem?.name || recipe.output.itemId}.`
        : `❌ Luyện Đan thất bại ${quantity} lần. Nguyên liệu đã tiêu tốn.`,
      successCount,
      totalAttempts: quantity,
      results,
      newAchievements,
    });
  } catch (err) {
    console.error('craftItem error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
