import supabase from '../config/supabase.js';
import Cultivation from '../models/Cultivation.js';
import { broadcast } from '../config/wsServer.js';

// ─── GET /api/disciple/status ─────────────────────────────────────────────────
export const getDiscipleStatus = async (req, res) => {
  try {
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult) return res.status(403).json({ message: 'Chưa tạo nhân vật.' });

    // Get disciples info
    const disciples = cult.disciples || [];
    let discipleDetails = [];
    if (disciples.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, spirit_root_grade')
        .in('id', disciples);
      discipleDetails = users || [];
    }

    // Get master info
    let masterDetail = null;
    if (cult.masterId) {
      const { data: masterUser } = await supabase
        .from('users')
        .select('id, username, spirit_root_grade')
        .eq('id', cult.masterId)
        .maybeSingle();
      masterDetail = masterUser;
    }

    // Get partner info
    let partnerDetail = null;
    if (cult.partnerId) {
      const { data: partnerUser } = await supabase
        .from('users')
        .select('id, username, spirit_root_grade')
        .eq('id', cult.partnerId)
        .maybeSingle();
      partnerDetail = partnerUser;
    }

    res.json({
      disciples: discipleDetails,
      master: masterDetail,
      partner: partnerDetail,
      bonuses: {
        discipleBonus: disciples.length > 0 ? 0.05 : 0, // +5% EXP
        masterBonus: cult.masterId ? 0.05 : 0,
        partnerBonus: cult.partnerId ? 0.10 : 0,
      },
    });
  } catch (err) {
    console.error('getDiscipleStatus error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/disciple/accept ────────────────────────────────────────────────
export const acceptDisciple = async (req, res) => {
  try {
    const { targetUsername } = req.body;
    if (!targetUsername) return res.status(400).json({ message: 'Cần nhập tên đệ tử.' });

    const { data: targetUser } = await supabase
      .from('users')
      .select('id, username, is_character_created')
      .eq('username', targetUsername)
      .maybeSingle();

    if (!targetUser) return res.status(404).json({ message: 'Người chơi không tồn tại.' });
    if (targetUser.id === req.user.id) return res.status(400).json({ message: 'Không thể nhận bản thân làm đệ tử!' });
    if (!targetUser.is_character_created) return res.status(400).json({ message: 'Người này chưa tạo nhân vật.' });

    const [myCult, targetCult] = await Promise.all([
      Cultivation.findOne({ userId: req.user.id }),
      Cultivation.findOne({ userId: targetUser.id }),
    ]);

    if (!myCult) return res.status(403).json({ message: 'Chưa tạo nhân vật.' });

    // Realm check: must be higher realm than disciple
    if (myCult.realmIndex <= (targetCult?.realmIndex || 0)) {
      return res.status(400).json({ message: 'Sư Phụ phải có cảnh giới cao hơn đệ tử!' });
    }

    // Check disciple already has master
    if (targetCult?.masterId) {
      return res.status(400).json({ message: 'Người này đã có Sư Phụ rồi!' });
    }

    // Check max disciples (5)
    const disciples = myCult.disciples || [];
    if (disciples.length >= 5) {
      return res.status(400).json({ message: 'Đã đạt tối đa 5 đệ tử!' });
    }

    if (disciples.includes(targetUser.id)) {
      return res.status(400).json({ message: 'Người này đã là đệ tử của bạn!' });
    }

    // Add disciple
    myCult.disciples = [...disciples, targetUser.id];
    await Cultivation.save(myCult);

    // Set master for disciple
    targetCult.masterId = req.user.id;
    await Cultivation.save(targetCult);

    broadcast(`notify:${targetUser.id}`, {
      type: 'disciple_accepted',
      master: req.user.username,
      message: `${req.user.username} đã nhận bạn làm đệ tử! Nhận bonus +5% EXP/giờ.`,
    });

    res.json({
      message: `🎓 Đã nhận ${targetUser.username} làm đệ tử! Cả hai sẽ được thêm bonus tu luyện.`,
      disciples: myCult.disciples,
    });
  } catch (err) {
    console.error('acceptDisciple error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/disciple/release ───────────────────────────────────────────────
export const releaseDisciple = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const myCult = await Cultivation.findOne({ userId: req.user.id });
    if (!myCult) return res.status(403).json({ message: 'Chưa tạo nhân vật.' });

    const disciples = myCult.disciples || [];
    if (!disciples.includes(targetUserId)) {
      return res.status(400).json({ message: 'Người này không phải đệ tử của bạn.' });
    }

    myCult.disciples = disciples.filter(id => id !== targetUserId);
    await Cultivation.save(myCult);

    const targetCult = await Cultivation.findOne({ userId: targetUserId });
    if (targetCult && targetCult.masterId === req.user.id) {
      targetCult.masterId = null;
      await Cultivation.save(targetCult);
    }

    broadcast(`notify:${targetUserId}`, {
      type: 'disciple_released',
      message: `${req.user.username} đã đuổi bạn ra khỏi cửa! Bạn không còn là đệ tử.`,
    });

    res.json({ message: 'Đã trục xuất đệ tử.', disciples: myCult.disciples });
  } catch (err) {
    console.error('releaseDisciple error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/disciple/partner-request ──────────────────────────────────────
export const requestPartner = async (req, res) => {
  try {
    const { targetUsername } = req.body;
    if (!targetUsername) return res.status(400).json({ message: 'Cần nhập tên Đạo Lữ.' });

    const { data: targetUser } = await supabase
      .from('users')
      .select('id, username, is_character_created')
      .eq('username', targetUsername)
      .maybeSingle();

    if (!targetUser) return res.status(404).json({ message: 'Người chơi không tồn tại.' });
    if (targetUser.id === req.user.id) return res.status(400).json({ message: 'Không thể kết Đạo Lữ với bản thân!' });

    const [myCult, targetCult] = await Promise.all([
      Cultivation.findOne({ userId: req.user.id }),
      Cultivation.findOne({ userId: targetUser.id }),
    ]);

    if (myCult?.partnerId) return res.status(400).json({ message: 'Bạn đã có Đạo Lữ rồi!' });
    if (targetCult?.partnerId) return res.status(400).json({ message: 'Người này đã có Đạo Lữ!' });

    // Auto accept (for simplicity as approved in plan)
    myCult.partnerId = targetUser.id;
    await Cultivation.save(myCult);

    targetCult.partnerId = req.user.id;
    await Cultivation.save(targetCult);

    broadcast(`notify:${targetUser.id}`, {
      type: 'partner_bonded',
      partner: req.user.username,
      message: `${req.user.username} đã kết Đạo Lữ với bạn! Cả hai nhận +10% EXP khi online đồng thời.`,
    });

    res.json({
      message: `💑 Đã kết Đạo Lữ với ${targetUser.username}! Cả hai nhận bonus +10% EXP.`,
      partnerId: targetUser.id,
      partnerName: targetUser.username,
    });
  } catch (err) {
    console.error('requestPartner error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/disciple/divorce ───────────────────────────────────────────────
export const divorcePartner = async (req, res) => {
  try {
    const myCult = await Cultivation.findOne({ userId: req.user.id });
    if (!myCult || !myCult.partnerId) {
      return res.status(400).json({ message: 'Bạn không có Đạo Lữ.' });
    }

    const partnerId = myCult.partnerId;
    const partnerCult = await Cultivation.findOne({ userId: partnerId });

    myCult.partnerId = null;
    await Cultivation.save(myCult);

    if (partnerCult) {
      partnerCult.partnerId = null;
      await Cultivation.save(partnerCult);
    }

    broadcast(`notify:${partnerId}`, {
      type: 'partner_divorced',
      message: `${req.user.username} đã chia tay Đạo Lữ. Bonus đã bị xóa.`,
    });

    res.json({ message: 'Đã hủy kết Đạo Lữ.' });
  } catch (err) {
    console.error('divorcePartner error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
