import User from '../models/User.js';
import supabase from '../config/supabase.js';

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

    // Lấy thông tin cảnh giới (cultivation)
    const { data: cultivationData } = await supabase
      .from('cultivations')
      .select('realm, realm_level, total_exp')
      .eq('user_id', user.id)
      .maybeSingle();

    // Lấy tông môn (sect membership)
    const { data: sectData } = await supabase
      .from('sect_members')
      .select('sects(name, level)')
      .eq('user_id', user.id)
      .maybeSingle();

    const sectName = sectData?.sects?.name || null;
    const sectLevel = sectData?.sects?.level || null;

    // Trả về profile công khai (không bao gồm email, password, tokens)
    res.json({
      profile: {
        username: user.username,
        gender: user.gender,
        spiritRoot: user.spiritRoot,
        spiritRootGrade: user.spiritRootGrade,
        isCharacterCreated: user.isCharacterCreated,
        realm: cultivationData?.realm || null,
        realmLevel: cultivationData?.realm_level || null,
        totalExp: cultivationData?.total_exp || 0,
        sectName,
        sectLevel,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
