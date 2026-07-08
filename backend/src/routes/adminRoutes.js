import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import isAdmin from '../middlewares/adminMiddleware.js';
import {
  getDashboardStats,
  getUsers, getUserDetail, banUser, unbanUser, muteUser, unmuteUser,
  grantResources, adjustStats,
  getSects, deleteSect, renameSect,
  getAuctions, deleteAuction,
  getShopConfig, updateShopConfig,
  getServerConfig, setGlobalBuff, setAnnouncement, sendMail,
  getAuditLogs,
  getTransactionHistory,
  getCheatAlerts,
} from '../controllers/adminController.js';

const router = express.Router();

// Áp dụng protect + isAdmin cho tất cả routes trong file này
router.use(protect, isAdmin);

// ── Dashboard ──────────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboardStats);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.post('/users/:id/ban', banUser);
router.post('/users/:id/unban', unbanUser);
router.post('/users/:id/mute', muteUser);
router.post('/users/:id/unmute', unmuteUser);
router.post('/users/:id/grant-resources', grantResources);
router.post('/users/:id/adjust-stats', adjustStats);

// ── Sects ─────────────────────────────────────────────────────────────────────
router.get('/sects', getSects);
router.delete('/sects/:sectName', deleteSect);
router.patch('/sects/:sectName/rename', renameSect);

// ── Auctions ──────────────────────────────────────────────────────────────────
router.get('/auctions', getAuctions);
router.delete('/auctions/:id', deleteAuction);

// ── Shop Config ───────────────────────────────────────────────────────────────
router.get('/shop-config', getShopConfig);
router.patch('/shop-config', updateShopConfig);

// ── Server Config / Events ────────────────────────────────────────────────────
router.get('/server-config', getServerConfig);
router.patch('/server-config/global-buff', setGlobalBuff);
router.patch('/server-config/announcement', setAnnouncement);

// ── Mail ──────────────────────────────────────────────────────────────────────
router.post('/mail/send', sendMail);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/audit-logs', getAuditLogs);
router.get('/transactions', getTransactionHistory);
router.get('/cheat-alerts', getCheatAlerts);

export default router;
