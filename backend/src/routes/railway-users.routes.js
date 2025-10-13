import express from 'express';
import { query } from '../config/database.js';
import { verifyAnyAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/railway-users/profile?user_id=<uuid>
router.get('/profile', verifyAnyAuth, async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ message: 'user_id is required' });
  try {
    const { rows } = await query('SELECT * FROM profiles WHERE id = $1 LIMIT 1', [userId]);
    if (!rows?.length) return res.status(404).json({ message: 'Profile not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('railway-users/profile error:', e);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// GET /api/railway-users/follow-status?as_user=<uuid>&target_id=<uuid>
router.get('/follow-status', verifyAnyAuth, async (req, res) => {
  const { as_user: asUser, target_id: targetId } = req.query;
  if (!asUser || !targetId) return res.status(400).json({ message: 'as_user and target_id are required' });
  try {
    const { rows } = await query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1',
      [asUser, targetId]
    );
    res.json({ following: !!rows?.length });
  } catch (e) {
    console.error('railway-users/follow-status error:', e);
    res.status(500).json({ message: 'Failed to fetch follow status' });
  }
});

// POST /api/railway-users/follow { as_user, target_id }
router.post('/follow', verifyAnyAuth, async (req, res) => {
  const { as_user: asUser, target_id: targetId } = req.body || {};
  if (!asUser || !targetId) return res.status(400).json({ message: 'as_user and target_id are required' });
  try {
    await query(
      `INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING`,
      [asUser, targetId]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('railway-users/follow error:', e);
    res.status(500).json({ message: 'Failed to follow' });
  }
});

// DELETE /api/railway-users/follow { as_user, target_id }
router.delete('/follow', verifyAnyAuth, async (req, res) => {
  const { as_user: asUser, target_id: targetId } = req.body || {};
  if (!asUser || !targetId) return res.status(400).json({ message: 'as_user and target_id are required' });
  try {
    await query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [asUser, targetId]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('railway-users/unfollow error:', e);
    res.status(500).json({ message: 'Failed to unfollow' });
  }
});

// GET /api/railway-users/stats?user_id=<uuid>
router.get('/stats', verifyAnyAuth, async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ message: 'user_id is required' });
  try {
    const [{ rows: following }, { rows: followers }, { rows: teams }, { rows: participations }] = await Promise.all([
      query('SELECT COUNT(*)::int as c FROM follows WHERE follower_id = $1', [userId]),
      query('SELECT COUNT(*)::int as c FROM follows WHERE following_id = $1', [userId]),
      query('SELECT COUNT(*)::int as c FROM team_members WHERE user_id = $1', [userId]),
      query('SELECT COUNT(*)::int as c FROM tournament_participants WHERE user_id = $1', [userId]),
    ]);

    // total/yearly points via results join
    const { rows: total } = await query(
      `SELECT COALESCE(SUM(tr.points),0)::int as points
       FROM tournament_results tr
       JOIN tournament_participants tp ON tp.id = tr.participant_id
       WHERE tp.user_id = $1`,
      [userId]
    );
    const { rows: yearly } = await query(
      `SELECT COALESCE(SUM(tr.points),0)::int as points
       FROM tournament_results tr
       JOIN tournament_participants tp ON tp.id = tr.participant_id
       WHERE tp.user_id = $1 AND tr.created_at >= date_trunc('year', now())`,
      [userId]
    );

    res.json({
      yearlyPoints: yearly[0]?.points ?? 0,
      totalPoints: total[0]?.points ?? 0,
      followingCount: following[0]?.c ?? 0,
      followersCount: followers[0]?.c ?? 0,
      tournamentCount: participations[0]?.c ?? 0,
      teamCount: teams[0]?.c ?? 0,
      awardsCount: 0,
      badgesCount: 0,
    });
  } catch (e) {
    console.error('railway-users/stats error:', e);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// GET /api/railway-users/tournaments?user_id=<uuid>&limit=5
router.get('/tournaments', verifyAnyAuth, async (req, res) => {
  const userId = req.query.user_id;
  const limit = Number(req.query.limit) || 5;
  if (!userId) return res.status(400).json({ message: 'user_id is required' });
  try {
    const { rows } = await query(
      `SELECT 
        tp.tournament_id,
        tp.registered_at,
        t.id as t_id,
        t.name as t_name,
        t.start_date as t_start_date,
        t.end_date as t_end_date,
        tr.position as r_position,
        tr.points as r_points
       FROM tournament_participants tp
       JOIN tournaments t ON t.id = tp.tournament_id
       LEFT JOIN tournament_results tr ON tr.participant_id = tp.id
       WHERE tp.user_id = $1
       ORDER BY tp.registered_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    const mapped = rows.map(r => ({
      tournament_id: r.tournament_id,
      tournaments: {
        id: r.t_id,
        name: r.t_name,
        start_date: r.t_start_date,
        end_date: r.t_end_date,
      },
      tournament_results: (r.r_position || r.r_points) ? [{ position: r.r_position, points: r.r_points }] : []
    }));
    res.json(mapped);
  } catch (e) {
    console.error('railway-users/tournaments error:', e);
    res.status(500).json({ message: 'Failed to fetch tournaments' });
  }
});

// GET /api/railway-users/search?term=<text>&limit=10&followingOnly=false&as_user=<uuid>
router.get('/search', verifyAnyAuth, async (req, res) => {
  const term = (req.query.term || '').toString().trim();
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const followingOnly = String(req.query.followingOnly || 'false') === 'true';
  const asUser = req.query.as_user || null;
  if (!term) return res.json([]);
  try {
    const like = `%${term}%`;
    let where = 'WHERE (username ILIKE $1 OR display_name ILIKE $1)';
    const params = [like];
    if (followingOnly && asUser) {
      where += ` AND id IN (SELECT following_id FROM follows WHERE follower_id = $${params.push(asUser)})`;
    }
    const { rows } = await query(
      `SELECT id, username, display_name, avatar_url
       FROM profiles
       ${where}
       ORDER BY updated_at DESC
       LIMIT ${limit}`,
      params
    );
    res.json(rows || []);
  } catch (e) {
    console.error('railway-users/search error:', e);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

// PUT /api/railway-users/profile
router.put('/profile', verifyAnyAuth, async (req, res) => {
  try {
    const fields = req.body || {};
    const allowed = ['display_name','username','age','gender','experience_years','team_name','location','bio','privacy_settings'];
    const updateCols = [];
    const params = [];
    let idx = 1;
    for (const k of allowed) {
      if (k in fields) {
        updateCols.push(`${k}=$${idx++}`);
        params.push(fields[k]);
      }
    }
    if (!updateCols.length) return res.status(400).json({ message: 'No fields to update' });
    params.push(req.userId);
    const { rows } = await query(
      `UPDATE profiles SET ${updateCols.join(', ')}, updated_at=NOW() WHERE id=$${idx} RETURNING *`,
      params
    );
    if (!rows?.length) return res.status(404).json({ message: 'Profile not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('railway-users/profile update error:', e);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

export default router;
