import express from 'express';
import { query } from '../config/database.js';
import { verifyAnyAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/railway-teams/owner?as_user=<uuid>&limit=1
router.get('/owner', verifyAnyAuth, async (req, res) => {
  const asUser = req.query.as_user;
  const limit = Number(req.query.limit) || 1;
  if (!asUser) return res.status(400).json({ message: 'as_user is required' });
  try {
    const { rows } = await query(
      `SELECT t.*
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1 AND tm.role = 'owner'
       ORDER BY t.created_at DESC
       LIMIT $2`,
      [asUser, limit]
    );
    res.json(rows || []);
  } catch (e) {
    console.error('railway-teams/owner error:', e);
    res.status(500).json({ message: 'Failed to fetch owner team' });
  }
});

// POST /api/railway-teams/create { as_user, name, description, sport_type }
router.post('/create', verifyAnyAuth, async (req, res) => {
  const { as_user: asUser, name, description = null, sport_type = null } = req.body || {};
  if (!asUser || !name) return res.status(400).json({ message: 'as_user and name are required' });
  try {
    const { rows: teamRows } = await query(
      `INSERT INTO teams (name, description, sport_type, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, sport_type, asUser]
    );
    const team = teamRows[0];
    await query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (team_id, user_id) DO UPDATE SET role='owner'`,
      [team.id, asUser]
    );
    res.status(201).json(team);
  } catch (e) {
    console.error('railway-teams/create error:', e);
    res.status(500).json({ message: 'Failed to create team' });
  }
});

export default router;

// ============ Members ============
// GET /api/railway-teams/members?team_id=<uuid>
router.get('/members', verifyAnyAuth, async (req, res) => {
  const teamId = req.query.team_id;
  if (!teamId) return res.status(400).json({ message: 'team_id is required' });
  try {
    const { rows } = await query(
      `SELECT tm.team_id, tm.user_id, tm.role, tm.joined_at,
              p.username, p.display_name, p.avatar_url, p.location, p.gender, p.bio
       FROM team_members tm
       JOIN profiles p ON p.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY CASE WHEN tm.role='owner' THEN 0 WHEN tm.role='admin' THEN 1 ELSE 2 END, tm.joined_at ASC`,
      [teamId]
    );
    res.json(rows || []);
  } catch (e) {
    console.error('railway-teams/members error:', e);
    res.status(500).json({ message: 'Failed to fetch team members' });
  }
});

// DELETE /api/railway-teams/members { as_user, team_id, user_id }
router.delete('/members', verifyAnyAuth, async (req, res) => {
  const { as_user: asUser, team_id: teamId, user_id: targetUserId } = req.body || {};
  if (!asUser || !teamId || !targetUserId) return res.status(400).json({ message: 'as_user, team_id and user_id are required' });
  try {
    // Check actor role
    const { rows: actorRows } = await query(
      `SELECT role FROM team_members WHERE team_id=$1 AND user_id=$2 LIMIT 1`,
      [teamId, asUser]
    );
    if (!actorRows?.length) return res.status(403).json({ message: 'Not a team member' });
    const actorRole = actorRows[0].role;

    // Target info
    const { rows: targetRows } = await query(
      `SELECT role FROM team_members WHERE team_id=$1 AND user_id=$2 LIMIT 1`,
      [teamId, targetUserId]
    );
    if (!targetRows?.length) return res.status(404).json({ message: 'Target not in team' });
    const targetRole = targetRows[0].role;

    // Only admin/owner can remove others; member can remove self
    const removingSelf = asUser === targetUserId;
    if (!removingSelf && !['owner','admin'].includes(actorRole)) {
      return res.status(403).json({ message: 'Only admins can remove others' });
    }

    // Prevent removing last owner/admin
    if (targetRole === 'owner' || targetRole === 'admin') {
      const { rows: adminCountRows } = await query(
        `SELECT COUNT(*)::int as c FROM team_members WHERE team_id=$1 AND role IN ('owner','admin')`,
        [teamId]
      );
      const adminCount = adminCountRows[0]?.c || 0;
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove last admin/owner' });
      }
    }

    await query(`DELETE FROM team_members WHERE team_id=$1 AND user_id=$2`, [teamId, targetUserId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('railway-teams/members delete error:', e);
    res.status(500).json({ message: 'Failed to remove member' });
  }
});
