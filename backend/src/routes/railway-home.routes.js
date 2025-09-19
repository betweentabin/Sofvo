import express from 'express';
import { query } from '../config/database.js';
import { verifySupabaseToken } from '../middleware/supabase-auth.middleware.js';

const router = express.Router();

// Normalize a result row into the shape expected by HomeScreen
const mapResultRow = (r) => ({
  id: r.id,
  tournament_id: r.tournament_id,
  position: r.position,
  points: r.points,
  memo: r.notes || null,
  created_at: r.created_at,
  tournaments: {
    id: r.t_id,
    name: r.t_name,
    start_date: r.t_start_date,
    end_date: r.t_end_date,
    location: r.t_location,
    sport_type: r.t_sport_type,
  },
  profiles: {
    id: r.p_id,
    username: r.p_username,
    display_name: r.p_display_name,
    avatar_url: r.p_avatar_url,
  },
});

// GET /api/railway-home/following?as_user=<uuid>&limit=10
router.get('/following', verifySupabaseToken, async (req, res) => {
  const { as_user: asUser, limit = 10 } = req.query;
  if (!asUser) return res.status(400).json({ message: 'as_user is required' });
  try {
    const sql = `
      WITH following AS (
        SELECT following_id FROM follows WHERE follower_id = $1
      )
      SELECT 
        tr.id,
        tr.tournament_id,
        tr.participant_id,
        tr.position,
        tr.points,
        tr.notes,
        tr.created_at,
        t.id as t_id,
        t.name as t_name,
        t.start_date as t_start_date,
        t.end_date as t_end_date,
        t.location as t_location,
        t.sport_type as t_sport_type,
        p.id as p_id,
        p.username as p_username,
        p.display_name as p_display_name,
        p.avatar_url as p_avatar_url
      FROM tournament_results tr
      JOIN tournament_participants tp ON tp.id = tr.participant_id
      JOIN tournaments t ON t.id = tr.tournament_id
      JOIN profiles p ON p.id = tp.user_id
      WHERE tp.user_id IN (SELECT following_id FROM following)
      ORDER BY tr.created_at DESC
      LIMIT $2`;
    const { rows } = await query(sql, [asUser, Number(limit) || 10]);
    res.json(rows.map(mapResultRow));
  } catch (e) {
    console.error('railway-home/following error:', e);
    res.status(500).json({ message: 'Failed to fetch following results' });
  }
});

// GET /api/railway-home/recommended?limit=10
router.get('/recommended', async (req, res) => {
  const { limit = 10 } = req.query;
  try {
    const sql = `
      SELECT 
        tr.id,
        tr.tournament_id,
        tr.participant_id,
        tr.position,
        tr.points,
        tr.notes,
        tr.created_at,
        t.id as t_id,
        t.name as t_name,
        t.start_date as t_start_date,
        t.end_date as t_end_date,
        t.location as t_location,
        t.sport_type as t_sport_type,
        p.id as p_id,
        p.username as p_username,
        p.display_name as p_display_name,
        p.avatar_url as p_avatar_url
      FROM tournament_results tr
      JOIN tournament_participants tp ON tp.id = tr.participant_id
      JOIN tournaments t ON t.id = tr.tournament_id
      JOIN profiles p ON p.id = tp.user_id
      ORDER BY tr.created_at DESC
      LIMIT $1`;
    const { rows } = await query(sql, [Number(limit) || 10]);
    res.json(rows.map(mapResultRow));
  } catch (e) {
    console.error('railway-home/recommended error:', e);
    res.status(500).json({ message: 'Failed to fetch recommended results' });
  }
});

// GET /api/railway-home/recommended-diaries?limit=3
router.get('/recommended-diaries', async (req, res) => {
  const { limit = 3 } = req.query;
  try {
    const { rows } = await query(
      `SELECT id, username, display_name, avatar_url, bio, updated_at
       FROM profiles
       WHERE bio IS NOT NULL AND bio <> ''
       ORDER BY updated_at DESC
       LIMIT $1`,
      [Number(limit) || 3]
    );
    res.json(rows || []);
  } catch (e) {
    console.error('railway-home/recommended-diaries error:', e);
    res.status(500).json({ message: 'Failed to fetch recommended diaries' });
  }
});

export default router;

