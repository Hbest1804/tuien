import supabase from '../config/supabase.js';
import Cultivation from '../models/Cultivation.js';
import Inventory from '../models/Inventory.js';
import { ITEMS } from '../data/items.js';
import { BLACKSMITH_RECIPES, ENCHANT_GEMS } from '../data/blacksmithRecipes.js';

// ─── GET /api/blacksmith/recipes ──────────────────────────────────────────────
export const getRecipes = async (req, res) => {
  try {
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult) return res.status(403).json({ message: 'Chưa tạo nhân vật.' });

    const realmIndex = cult.realmIndex;
    const inventory = await Inventory.findOne({ userId: req.user.id });
    const items = inventory?.items || [];

    const recipes = Object.values(BLACKSMITH_RECIPES).map(recipe => {
      const canCraft = recipe.requiredRealmIndex <= realmIndex &&
        recipe.materials.every(mat => {
          const slot = items.find(i => i.itemId === mat.itemId);
          return (slot?.quantity || 0) >= mat.quantity;
        });

      return {
        ...recipe,
        resultItem: ITEMS[recipe.resultItemId] || null,
        materials: recipe.materials.map(m => ({
          ...m,
          itemData: ITEMS[m.itemId] || null,
          owned: items.find(i => i.itemId === m.itemId)?.quantity || 0,
        })),
        canCraft,
        realmUnlocked: recipe.requiredRealmIndex <= realmIndex,
      };
    });

    res.json({ recipes, gems: Object.values(ENCHANT_GEMS) });
  } catch (err) {
    console.error('getRecipes error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/blacksmith/craft ────────────────────────────────────────────────
export const craftItem = async (req, res) => {
  try {
    const { recipeId } = req.body;
    const recipe = BLACKSMITH_RECIPES[recipeId];
    if (!recipe) return res.status(400).json({ message: 'Công thức không tồn tại.' });

    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult) return res.status(403).json({ message: 'Chưa tạo nhân vật.' });

    if (cult.realmIndex < recipe.requiredRealmIndex) {
      return res.status(400).json({ message: 'Cảnh giới chưa đủ để dùng công thức này!' });
    }

    const inventory = await Inventory.findOne({ userId: req.user.id });
    if (!inventory) return res.status(400).json({ message: 'Không tìm thấy túi đồ.' });

    const items = inventory.items || [];

    // Check materials
    for (const mat of recipe.materials) {
      const slot = items.find(i => i.itemId === mat.itemId);
      if (!slot || slot.quantity < mat.quantity) {
        const itemData = ITEMS[mat.itemId];
        return res.status(400).json({
          message: `Thiếu nguyên liệu: cần ${mat.quantity}x ${itemData?.name || mat.itemId}, hiện có ${slot?.quantity || 0}.`
        });
      }
    }

    // Deduct materials
    for (const mat of recipe.materials) {
      const slot = items.find(i => i.itemId === mat.itemId);
      slot.quantity -= mat.quantity;
    }

    // Roll success
    const success = Math.random() < recipe.successRate;

    if (success) {
      // Add result item
      const existing = items.find(i => i.itemId === recipe.resultItemId);
      if (existing) {
        existing.quantity += recipe.resultQuantity;
      } else {
        items.push({ itemId: recipe.resultItemId, quantity: recipe.resultQuantity });
      }
    }

    // Clean up zero-quantity items
    inventory.items = items.filter(i => i.quantity > 0);
    inventory.markModified('items');
    await Inventory.save(inventory);

    const resultItem = ITEMS[recipe.resultItemId];

    res.json({
      success,
      message: success
        ? `✅ Chế tạo thành công! Tạo ra ${recipe.resultQuantity}x ${resultItem?.name || recipe.resultItemId}!`
        : `❌ Chế tạo thất bại! Nguyên liệu bị tiêu hao. Hãy thử lại.`,
      resultItem: success ? { ...resultItem, quantity: recipe.resultQuantity } : null,
    });
  } catch (err) {
    console.error('craftItem error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/blacksmith/enchant ──────────────────────────────────────────────
export const enchantItem = async (req, res) => {
  try {
    const { targetItemId, gemId } = req.body;
    const gem = ENCHANT_GEMS[gemId];
    if (!gem) return res.status(400).json({ message: 'Đá khảm không tồn tại.' });

    const targetItemDef = ITEMS[targetItemId];
    if (!targetItemDef) return res.status(400).json({ message: 'Vật phẩm không tồn tại.' });

    // Only artifacts can be enchanted
    if (targetItemDef.type !== 'ARTIFACT') {
      return res.status(400).json({ message: 'Chỉ có thể khảm đá vào Pháp Bảo!' });
    }

    const inventory = await Inventory.findOne({ userId: req.user.id });
    if (!inventory) return res.status(400).json({ message: 'Không tìm thấy túi đồ.' });

    const items = inventory.items || [];

    // Check target item owned
    const targetSlot = items.find(i => i.itemId === targetItemId);
    if (!targetSlot || targetSlot.quantity < 1) {
      return res.status(400).json({ message: `Không có ${targetItemDef.name} trong túi đồ!` });
    }

    // Apply enchant (store in enchants JSONB field)
    const enchants = inventory.enchants || {};
    const currentEnchants = enchants[targetItemId] || [];

    // Max 3 enchants per item — check BEFORE deducting materials
    if (currentEnchants.length >= 3) {
      return res.status(400).json({ message: 'Pháp Bảo đã đạt tối đa 3 ngọc khảm!' });
    }

    // Check gem materials
    for (const mat of gem.craftMaterials) {
      const slot = items.find(i => i.itemId === mat.itemId);
      if (!slot || slot.quantity < mat.quantity) {
        const matData = ITEMS[mat.itemId];
        return res.status(400).json({
          message: `Thiếu nguyên liệu khảm: cần ${mat.quantity}x ${matData?.name || mat.itemId}.`
        });
      }
    }

    // Deduct gem materials
    for (const mat of gem.craftMaterials) {
      const slot = items.find(i => i.itemId === mat.itemId);
      slot.quantity -= mat.quantity;
    }

    if (!enchants[targetItemId]) enchants[targetItemId] = [];
    enchants[targetItemId].push({ gemId, ...gem.bonus, appliedAt: new Date().toISOString() });

    inventory.items = items.filter(i => i.quantity > 0);
    inventory.enchants = enchants;
    inventory.markModified('items');

    // Save to DB including enchants
    const { error } = await supabase
      .from('inventories')
      .update({ items: inventory.items, enchants })
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      message: `💎 Khảm ${gem.name} vào ${targetItemDef.name} thành công! ${JSON.stringify(gem.bonus)}`,
      enchants: enchants[targetItemId],
      gem,
    });
  } catch (err) {
    console.error('enchantItem error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
