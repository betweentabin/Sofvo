import express from 'express';
import { query } from '../config/database.js';
import { verifySupabaseToken } from '../middleware/supabase-auth.middleware.js';

const router = express.Router();

// POST /api/railway-tournaments/create
// body: { as_user, name, description, sport_type, start_date, location, status }
router.post('/create', verifySupabaseToken, async (req, res) => {
  const { as_user: asUser, name, description = null, sport_type = null, start_date = null, location = null, status = 'upcoming' } = req.body || {};
  if (!asUser || !name || !start_date || !location) {
    return res.status(400).json({ message: 'as_user, name, start_date, location are required' });
  }
  try {
    const { rows } = await query(
      `INSERT INTO tournaments (name, description, sport_type, start_date, location, organizer_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [name, description, sport_type, start_date, location, asUser, status]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('railway-tournaments/create error:', e);
    res.status(500).json({ message: 'Failed to create tournament' });
  }
});

// GET /api/railway-tournaments/my-hosted?as_user=<uuid>
router.get('/my-hosted', verifySupabaseToken, async (req, res) => {
  const asUser = req.query.as_user;
  if (!asUser) return res.status(400).json({ message: 'as_user is required' });
  try {
    const { rows } = await query(
      `SELECT * FROM tournaments WHERE organizer_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [asUser]
    );
    res.json(rows || []);
  } catch (e) {
    console.error('railway-tournaments/my-hosted error:', e);
    res.status(500).json({ message: 'Failed to fetch hosted tournaments' });
  }
});

export default router;

