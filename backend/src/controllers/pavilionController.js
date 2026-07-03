import Cultivation from '../models/Cultivation.js';
import Inventory from '../models/Inventory.js';
import { ITEMS } from '../data/items.js';

export const getPavilionItems = async (req, res) => {
  try {
    const pavilionItems = Object.values(ITEMS)
      .filter(item => item.sectContributionPrice && item.sectContributionPrice > 0)
      .map(item => ({
        itemId: item.id,
        name: item.name,
        type: item.type,
        subType: item.subType,
        description: item.description,
        effectDesc: item.effectDesc || '',
        rarity: item.rarity,
        price: item.sectContributionPrice,
      }));

    res.json({ items: pavilionItems });
  } catch (err) {
    console.error('Lỗi lấy danh sách Tàng Kinh Các:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const exchangeItem = async (req, res) => {
  try {
    const { itemId } = req.body;
    const itemData = ITEMS[itemId];

    if (!itemData || !itemData.sectContributionPrice) {
      return res.status(400).json({ message: 'Vật phẩm không tồn tại trong Tàng Kinh Các.' });
    }

    const price = itemData.sectContributionPrice;

    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || cult.sectContribution < price) {
      return res.status(400).json({ message: 'Không đủ Điểm Cống Hiến.' });
    }

    cult.sectContribution -= price;
    await Cultivation.save(cult);

    let inventory = await Inventory.findOne({ userId: req.user.id });
    if (!inventory) {
      inventory = await Inventory.findOneAndUpdate(
        { userId: req.user.id }, {}, { upsert: true, new: true }
      );
    }

    const existingItem = inventory.items.find(i => i.itemId === itemId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      if (inventory.items.length >= inventory.maxSlots) {
        // Hoàn điểm nếu túi đầy
        cult.sectContribution += price;
        await Cultivation.save(cult);
        return res.status(400).json({ message: 'Túi đồ đã đầy!' });
      }
      inventory.items.push({ itemId, quantity: 1 });
    }

    await Inventory.save(inventory);

    res.json({
      message: `Đổi thành công ${itemData.name}!`,
      remainingContribution: cult.sectContribution,
    });
  } catch (err) {
    console.error('Lỗi đổi vật phẩm:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
