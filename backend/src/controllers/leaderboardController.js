import User from '../models/User.js';
import Cultivation, { REALMS } from '../models/Cultivation.js';

export const getLeaderboard = async (req, res) => {
  try {
    const { type = 'realm' } = req.query;

    if (type === 'stones') {
      const topUsers = await User.find(
        { isCharacterCreated: true },
        { sort: { spiritStones: -1 }, limit: 50 }
      );

      const userIds = topUsers.map(u => u.id);
      const cultivations = await Cultivation.find(
        { userId: { $in: userIds } },
        {}
      );

      const cultMap = {};
      for (const c of cultivations) {
        cultMap[c.userId] = c;
      }

      const result = topUsers.map((user, index) => {
        const cult = cultMap[user.id] || {};
        const realm = REALMS[cult.realmIndex || 0];
        return {
          rank: index + 1,
          userId: user.id,
          username: user.username,
          spiritRoot: user.spiritRoot,
          spiritRootGrade: user.spiritRootGrade,
          spiritStones: user.spiritStones || 0,
          realmIndex: cult.realmIndex || 0,
          realmName: realm?.name || 'Luyện Khí',
          realmColor: realm?.color || '#7ed99e',
          expAccumulated: cult.expAccumulated || 0,
          sectName: cult.sectName || null,
        };
      });

      return res.json({ leaderboard: result, type });
    }

    // Mặc định: xếp hạng theo cảnh giới + EXP
    const topCults = await Cultivation.find(
      {},
      { sort: { realmIndex: -1 }, limit: 50 }
    );

    const userIds = topCults.map(c => c.userId);
    const users = await User.find({ isCharacterCreated: true, _id: { $in: userIds } }, { limit: 200 });

    const userMap = {};
    for (const u of users) {
      userMap[u.id] = u;
    }

    const result = [];
    let rank = 1;
    for (const cult of topCults) {
      const user = userMap[cult.userId];
      if (!user) continue;
      const realm = REALMS[cult.realmIndex || 0];
      result.push({
        rank: rank++,
        userId: cult.userId,
        username: user.username,
        spiritRoot: user.spiritRoot,
        spiritRootGrade: user.spiritRootGrade,
        spiritStones: user.spiritStones || 0,
        realmIndex: cult.realmIndex || 0,
        realmName: realm?.name || 'Luyện Khí',
        realmColor: realm?.color || '#7ed99e',
        expAccumulated: cult.expAccumulated || 0,
        sectName: cult.sectName || null,
      });
    }

    res.json({ leaderboard: result, type });
  } catch (err) {
    console.error('Lỗi getLeaderboard:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
