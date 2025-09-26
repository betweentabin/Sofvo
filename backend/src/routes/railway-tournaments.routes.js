import express from 'express';
import { query } from '../config/database.js';
import { verifyAnyAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/railway-tournaments/create
// body: { as_user, name, description, sport_type, start_date, location, status }
router.post('/create', verifyAnyAuth, async (req, res) => {
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
router.get('/my-hosted', verifyAnyAuth, async (req, res) => {
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

// GET /api/railway-tournaments/search?status=upcoming&area=&type=&followingOnly=false&as_user=&limit=50
router.get('/search', async (req, res) => {
  try {
    const {
      status = 'upcoming',
      area = '',
      type = '',
      followingOnly = 'false',
      as_user: asUser = null,
      limit = '50',
    } = req.query;

    const params = [];
    let where = 'WHERE 1=1';
    if (status) { where += ` AND t.status = $${params.push(status)}`; }
    if (area) { where += ` AND t.location ILIKE $${params.push(`%${area}%`)}`; }
    if (type) { where += ` AND t.sport_type ILIKE $${params.push(`%${type}%`)}`; }
    if (followingOnly === 'true' && asUser) {
      where += ` AND t.organizer_id IN (SELECT following_id FROM follows WHERE follower_id = $${params.push(asUser)})`;
    }
    const lim = Math.min(Number(limit) || 50, 100);

    const { rows } = await query(
      `SELECT t.*, 
              (SELECT COUNT(*)::int FROM tournament_participants tp WHERE tp.tournament_id = t.id) as participants_count
       FROM tournaments t
       ${where}
       ORDER BY t.start_date ASC
       LIMIT ${lim}`,
      params
    );
    res.json(rows);
  } catch (e) {
    console.error('railway-tournaments/search error:', e);
    res.status(500).json({ message: 'Failed to search tournaments' });
  }
});
