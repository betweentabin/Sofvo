import express from 'express';
import { query } from '../config/database.js';
import { verifyAnyAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/railway-notifications?limit=50&offset=0
router.get('/', verifyAnyAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  try {
    const { rows } = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.userId, limit, offset]
    );
    res.json(rows || []);
  } catch (e) {
    console.error('railway-notifications index error:', e);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// GET /api/railway-notifications/unread-count
router.get('/unread-count', verifyAnyAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id=$1 AND read=false`,
      [req.userId]
    );
    res.json({ count: rows[0]?.count || 0 });
  } catch (e) {
    console.error('railway-notifications unread-count error:', e);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// PUT /api/railway-notifications/:id/read
router.put('/:id/read', verifyAnyAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2 RETURNING *`,
      [req.params.id, req.userId]
    );
    if (!rows?.length) return res.status(404).json({ message: 'Notification not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('railway-notifications mark read error:', e);
    res.status(500).json({ message: 'Failed to mark as read' });
  }
});

// PUT /api/railway-notifications/read-all
router.put('/read-all', verifyAnyAuth, async (req, res) => {
  try {
    await query(`UPDATE notifications SET read=true WHERE user_id=$1 AND read=false`, [req.userId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('railway-notifications read-all error:', e);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

// DELETE /api/railway-notifications/:id
router.delete('/:id', verifyAnyAuth, async (req, res) => {
  try {
    await query(`DELETE FROM notifications WHERE id=$1 AND user_id=$2`, [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('railway-notifications delete error:', e);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// DELETE /api/railway-notifications/clear-all
router.delete('/clear-all', verifyAnyAuth, async (req, res) => {
  try {
    await query(`DELETE FROM notifications WHERE user_id=$1 AND read=true`, [req.userId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('railway-notifications clear-all error:', e);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
});

// POST /api/railway-notifications/device-tokens { token, platform, device_info }
router.post('/device-tokens', verifyAnyAuth, async (req, res) => {
  try {
    const { token, platform = 'unknown', device_info = {} } = req.body || {};
    if (!token) return res.status(400).json({ message: 'token is required' });
    await query(
      `INSERT INTO device_tokens(user_id, token, platform, device_info, is_active, last_used_at)
       VALUES($1,$2,$3,$4,true,NOW())
       ON CONFLICT (user_id, token)
       DO UPDATE SET platform=EXCLUDED.platform, device_info=EXCLUDED.device_info, is_active=true, last_used_at=NOW()`,
      [req.userId, token, platform, device_info]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('device-tokens upsert error:', e);
    res.status(500).json({ message: 'Failed to save device token' });
  }
});

// DELETE /api/railway-notifications/device-tokens { token }
router.delete('/device-tokens', verifyAnyAuth, async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ message: 'token is required' });
    await query(`UPDATE device_tokens SET is_active=false WHERE user_id=$1 AND token=$2`, [req.userId, token]);
    res.json({ ok: true });
  } catch (e) {
    console.error('device-tokens delete error:', e);
    res.status(500).json({ message: 'Failed to remove device token' });
  }
});

// GET /api/railway-notifications/settings
router.get('/settings', verifyAnyAuth, async (req, res) => {
  try {
    const { rows } = await query(`SELECT * FROM notification_settings WHERE user_id=$1 LIMIT 1`, [req.userId]);
    res.json(rows[0] || null);
  } catch (e) {
    console.error('notification settings get error:', e);
    res.status(500).json({ message: 'Failed to get settings' });
  }
});

// PUT /api/railway-notifications/settings
router.put('/settings', verifyAnyAuth, async (req, res) => {
  try {
    const fields = req.body || {};
    const cols = [
      'follow_notification','like_notification','comment_notification','mention_notification',
      'tournament_notification','team_notification','message_notification','announcement_notification',
      'email_enabled','push_enabled'
    ];
    const updates = cols.filter(k => k in fields).map((k, i) => `${k}=$${i+2}`).join(',');
    if (!updates) return res.status(400).json({ message: 'no settings to update' });
    const params = [req.userId, ...cols.filter(k => k in fields).map(k => fields[k])];
    const { rows } = await query(
      `INSERT INTO notification_settings(user_id)
       VALUES($1)
       ON CONFLICT (user_id) DO UPDATE SET ${updates}, updated_at=NOW()
       RETURNING *`,
      params
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('notification settings update error:', e);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

export default router;
