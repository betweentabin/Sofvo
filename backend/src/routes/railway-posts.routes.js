import express from 'express';
import { query } from '../config/database.js';
import { verifyAnyAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

const mapPost = (r) => ({
  id: r.id,
  user_id: r.user_id,
  team_id: r.team_id,
  content: r.content,
  type: r.type,
  visibility: r.visibility,
  tournament_id: r.tournament_id,
  is_pinned: r.is_pinned,
  created_at: r.created_at,
  updated_at: r.updated_at,
  profiles: {
    id: r.p_id,
    username: r.p_username,
    display_name: r.p_display_name,
    avatar_url: r.p_avatar_url,
  }
});

// GET /api/railway-posts/latest?limit=30
router.get('/latest', verifyAnyAuth, async (req, res) => {
  const limit = Number(req.query.limit) || 30;
  try {
    const { rows } = await query(
      `SELECT p.*, pr.id as p_id, pr.username as p_username, pr.display_name as p_display_name, pr.avatar_url as p_avatar_url
       FROM posts p
       JOIN profiles pr ON pr.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(rows.map(mapPost));
  } catch (e) {
    console.error('railway-posts/latest error:', e);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

// GET /api/railway-posts/following?as_user=<uuid>&limit=30
router.get('/following', verifyAnyAuth, async (req, res) => {
  const { as_user: asUser } = req.query;
  const limit = Number(req.query.limit) || 30;
  if (!asUser) return res.status(400).json({ message: 'as_user is required' });
  try {
    const { rows } = await query(
      `SELECT p.*, pr.id as p_id, pr.username as p_username, pr.display_name as p_display_name, pr.avatar_url as p_avatar_url
       FROM posts p
       JOIN follows f ON f.following_id = p.user_id AND f.follower_id = $1
       JOIN profiles pr ON pr.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT $2`,
      [asUser, limit]
    );
    res.json(rows.map(mapPost));
  } catch (e) {
    console.error('railway-posts/following error:', e);
    res.status(500).json({ message: 'Failed to fetch following posts' });
  }
});

// POST /api/railway-posts/create { as_user, content, visibility }
router.post('/create', verifyAnyAuth, async (req, res) => {
  try {
    const { as_user: asUser, content, visibility = 'public' } = req.body || {};
    if (!asUser || !content) return res.status(400).json({ message: 'as_user and content are required' });
    const { rows } = await query(
      `INSERT INTO posts (user_id, content, visibility)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [asUser, content, visibility]
    );
    const post = rows[0];
    const { rows: p } = await query('SELECT id as p_id, username as p_username, display_name as p_display_name, avatar_url as p_avatar_url FROM profiles WHERE id=$1', [asUser]);
    const mapped = mapPost({ ...post, ...p[0] });
    res.status(201).json(mapped);
  } catch (e) {
    console.error('railway-posts/create error:', e);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

export default router;
