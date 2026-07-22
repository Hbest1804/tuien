import User from '../models/User.js';
import supabase from '../config/supabase.js';
import { REALMS } from '../models/Cultivation.js';

// ─── GET /api/users/:username ─────────────────────────────────────────────────
export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ message: 'Thiếu username' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người chơi này' });
    }

    // Lấy thông tin cảnh giới và tông môn từ cultivations
    const { data: cultivationData } = await supabase
      .from('cultivations')
      .select('realm_index, exp_accumulated, sect_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const sectName = cultivationData?.sect_name || null;
    const realmIndex = cultivationData?.realm_index ?? null;
    const realmName = realmIndex !== null ? (REALMS[realmIndex]?.name || null) : null;

    // Trả về profile công khai (không bao gồm email, password, tokens)
    res.json({
      profile: {
        username: user.username,
        gender: user.gender,
        spiritRoot: user.spiritRoot,
        spiritRootGrade: user.spiritRootGrade,
        isCharacterCreated: user.isCharacterCreated,
        realm: realmName,
        realmLevel: null,
        totalExp: cultivationData?.exp_accumulated || 0,
        sectName,
        sectLevel: null,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
