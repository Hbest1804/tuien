import Cultivation from '../models/Cultivation.js';
import Inventory from '../models/Inventory.js';
import { ITEMS } from '../data/items.js';
import supabase from '../config/supabase.js';

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

    const { data, error } = await supabase.rpc('exchange_pavilion_item', {
      p_user_id: req.user.id,
      p_item_id: itemId,
      p_price: price
    });

    if (error) {
      console.error('Lỗi RPC exchange_pavilion_item:', error);
      return res.status(500).json({ message: 'Lỗi server khi đổi vật phẩm.' });
    }

    if (!data.success) {
      return res.status(400).json({ message: data.message });
    }

    res.json({
      message: `Đổi thành công ${itemData.name}!`,
      remainingContribution: data.remainingContribution,
    });
  } catch (err) {
    console.error('Lỗi đổi vật phẩm:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
