import supabase from '../config/supabase.js';
import Cultivation from '../models/Cultivation.js';

// ─── Building definitions ──────────────────────────────────────────────────────
export const SECT_BUILDINGS = {
  tuLinhTran: {
    id: 'tuLinhTran',
    name: 'Tụ Linh Trận',
    description: 'Pháp trận hút tụ linh khí thiên địa, tăng tốc tu luyện cho toàn bộ đệ tử.',
    maxLevel: 5,
    upgradeCosts: [0, 5000, 15000, 40000, 100000], // cost to upgrade TO this level
    benefits: ['Gốc', '+10% EXP/giờ', '+25% EXP/giờ', '+50% EXP/giờ', '+100% EXP/giờ', '+200% EXP/giờ'],
    icon: '🌀',
  },
  luyenDanPhong: {
    id: 'luyenDanPhong',
    name: 'Luyện Đan Phòng',
    description: 'Lò luyện đan cổ đại, tăng số lượng đan dược thu được khi luyện đan.',
    maxLevel: 5,
    upgradeCosts: [0, 3000, 10000, 25000, 60000],
    benefits: ['Gốc', '+1 đan/mẻ', '+2 đan/mẻ', '+3 đan/mẻ', '+5 đan/mẻ', '+8 đan/mẻ'],
    icon: '⚗️',
  },
  thienVongCac: {
    id: 'thienVongCac',
    name: 'Thiên Vọng Các',
    description: 'Đài quan sát tiên cổ, tăng tỷ lệ rớt đồ trong bí cảnh.',
    maxLevel: 5,
    upgradeCosts: [0, 4000, 12000, 30000, 80000],
    benefits: ['Gốc', '+5% drop rate', '+12% drop rate', '+20% drop rate', '+35% drop rate', '+60% drop rate'],
    icon: '🗼',
  },
  linh_vuc: {
    id: 'linh_vuc',
    name: 'Linh Vực',
    description: 'Kết giới bảo vệ tông môn, giảm thiệt hại khi bị tấn công trong Tông Môn Chiến.',
    maxLevel: 5,
    upgradeCosts: [0, 6000, 18000, 45000, 120000],
    benefits: ['Gốc', '-10% thiệt hại', '-20% thiệt hại', '-35% thiệt hại', '-50% thiệt hại', '-70% thiệt hại'],
    icon: '🛡️',
  },
};

// ─── GET /api/sect/buildings ──────────────────────────────────────────────────
export const getSectBuildings = async (req, res) => {
  try {
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || !cult.sectName) {
      return res.status(400).json({ message: 'Chưa gia nhập tông môn.' });
    }

    // Get sect's building data (shared among all members of the sect)
    const { data: sectData } = await supabase
      .from('sects')
      .select('*')
      .eq('name', cult.sectName)
      .maybeSingle();

    const buildings = sectData?.buildings || {
      tuLinhTran: 0,
      luyenDanPhong: 0,
      thienVongCac: 0,
      linh_vuc: 0,
    };

    const buildingList = Object.values(SECT_BUILDINGS).map(b => ({
      ...b,
      currentLevel: buildings[b.id] || 0,
      nextLevelCost: buildings[b.id] < b.maxLevel ? b.upgradeCosts[(buildings[b.id] || 0) + 1] : null,
      currentBenefit: b.benefits[buildings[b.id] || 0],
      nextBenefit: buildings[b.id] < b.maxLevel ? b.benefits[(buildings[b.id] || 0) + 1] : null,
    }));

    res.json({
      buildings: buildingList,
      sectName: cult.sectName,
      sectRank: cult.sectRank,
      sectContribution: cult.sectContribution,
      sectResources: sectData?.resources || { linh_thach: 0 },
    });
  } catch (err) {
    console.error('getSectBuildings error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/sect/buildings/upgrade ─────────────────────────────────────────
export const upgradeSectBuilding = async (req, res) => {
  try {
    const { buildingId } = req.body;
    const building = SECT_BUILDINGS[buildingId];
    if (!building) return res.status(400).json({ message: 'Kiến trúc không tồn tại.' });

    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || !cult.sectName) return res.status(400).json({ message: 'Chưa gia nhập tông môn.' });

    // Only Tông Chủ (rank Tông Chủ) can upgrade
    if (cult.sectRank !== 'Tông Chủ' && cult.sectRank !== 'Trưởng Lão') {
      return res.status(403).json({ message: 'Chỉ Tông Chủ hoặc Trưởng Lão mới có thể nâng cấp kiến trúc!' });
    }

    // Get sect data
    let { data: sectData } = await supabase
      .from('sects')
      .select('*')
      .eq('name', cult.sectName)
      .maybeSingle();

    if (!sectData) {
      // Create sect record if not exists
      const { data: newSect } = await supabase
        .from('sects')
        .insert({ name: cult.sectName, buildings: {}, resources: { linh_thach: 0 } })
        .select('*')
        .single();
      sectData = newSect;
    }

    const buildings = sectData.buildings || {};
    const currentLevel = buildings[buildingId] || 0;

    if (currentLevel >= building.maxLevel) {
      return res.status(400).json({ message: 'Kiến trúc đã đạt cấp tối đa!' });
    }

    const cost = building.upgradeCosts[currentLevel + 1];

    // Deduct from player's spirit stones (Tông Chủ pays)
    const { data: userRow } = await supabase
      .from('users')
      .select('spirit_stones')
      .eq('id', req.user.id)
      .single();

    if ((userRow?.spirit_stones || 0) < cost) {
      return res.status(400).json({ message: `Không đủ Linh Thạch! Cần ${cost.toLocaleString()}.` });
    }

    // Deduct spirit stones
    await supabase.rpc('adjust_spirit_stones', { p_user_id: req.user.id, p_delta: -cost });

    // Upgrade building
    const newBuildings = { ...buildings, [buildingId]: currentLevel + 1 };
    await supabase
      .from('sects')
      .update({ buildings: newBuildings })
      .eq('name', cult.sectName);

    const newLevel = currentLevel + 1;
    res.json({
      message: `🏯 Nâng cấp ${building.name} lên cấp ${newLevel} thành công!`,
      buildingId,
      newLevel,
      benefit: building.benefits[newLevel],
      costPaid: cost,
    });
  } catch (err) {
    console.error('upgradeSectBuilding error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
