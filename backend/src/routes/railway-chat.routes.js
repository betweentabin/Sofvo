import express from 'express';
import { query } from '../config/database.js';
import { verifySupabaseToken } from '../middleware/supabase-auth.middleware.js';

const router = express.Router();

// Utility: get participants with profile for a conversation
const getParticipants = async (conversationId) => {
  const { rows } = await query(
    `SELECT cp.user_id, p.username, p.display_name, p.avatar_url
     FROM conversation_participants cp
     JOIN profiles p ON p.id = cp.user_id
     WHERE cp.conversation_id = $1`,
    [conversationId]
  );
  return rows || [];
};

// GET /api/railway-chat/test-accounts
router.get('/test-accounts', verifySupabaseToken, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, username, display_name, avatar_url
       FROM profiles
       WHERE username IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 20`
    );
    res.json(rows || []);
  } catch (e) {
    console.error('railway-chat test-accounts error:', e);
    res.status(500).json({ message: 'Failed to list test accounts' });
  }
});

// GET /api/railway-chat/conversations?as_user=<uuid>
router.get('/conversations', verifySupabaseToken, async (req, res) => {
  const asUser = req.query.as_user;
  if (!asUser) return res.status(400).json({ message: 'as_user is required' });
  try {
    const { rows } = await query(
      `SELECT c.id, c.type, c.name, c.updated_at
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id
       WHERE cp.user_id = $1
       ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC
       LIMIT 50`,
      [asUser]
    );
    // attach participants and last_message
    const result = [];
    for (const c of rows) {
      const participants = await getParticipants(c.id);
      const { rows: lastRows } = await query(
        `SELECT m.id, m.content, m.type, m.created_at, p.username AS sender_username
         FROM messages m
         LEFT JOIN profiles p ON p.id = m.sender_id
         WHERE m.conversation_id = $1
         ORDER BY m.created_at DESC
         LIMIT 1`,
        [c.id]
      );
      result.push({ ...c, participants, last_message: lastRows?.[0] || null });
    }
    res.json(result);
  } catch (e) {
    console.error('railway-chat conversations error:', e);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// POST /api/railway-chat/conversations
// body: { as_user: uuid, type?: 'direct'|'group', participant_ids: uuid[], name? }
router.post('/conversations', verifySupabaseToken, async (req, res) => {
  try {
    const { as_user: asUser, type = 'direct', participant_ids = [], name = null } = req.body;
    if (!asUser) return res.status(400).json({ message: 'as_user is required' });
    if (!Array.isArray(participant_ids) || participant_ids.length === 0) {
      return res.status(400).json({ message: 'participant_ids required' });
    }

    // Check existing direct conversation
    if (type === 'direct' && participant_ids.length === 1) {
      const other = participant_ids[0];
      const { rows: existing } = await query(
        `SELECT c.id
         FROM conversations c
         JOIN conversation_participants a ON a.conversation_id = c.id AND a.user_id = $1
         JOIN conversation_participants b ON b.conversation_id = c.id AND b.user_id = $2
         WHERE c.type = 'direct'
         LIMIT 1`,
        [asUser, other]
      );
      if (existing?.length) {
        return res.json({ conversation_id: existing[0].id, existing: true });
      }
    }

    // Create conversation
    const { rows: convRows } = await query(
      `INSERT INTO conversations(type, name) VALUES ($1, $2) RETURNING id, type, name, created_at, updated_at`,
      [type, name]
    );
    const conversation = convRows[0];

    // Insert participants: asUser + provided
    const participants = [asUser, ...participant_ids];
    const values = participants.map((_, i) => `($1, $${i + 2}::uuid)`).join(',');
    await query(
      `INSERT INTO conversation_participants(conversation_id, user_id) VALUES ${values}`,
      [conversation.id, ...participants]
    );

    res.status(201).json({ conversation_id: conversation.id, conversation });
  } catch (e) {
    console.error('railway-chat create conversation error:', e);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
});

// GET /api/railway-chat/conversations/:id/messages?as_user=<uuid>&limit=50&before=<iso>
router.get('/conversations/:id/messages', verifySupabaseToken, async (req, res) => {
  const { id } = req.params;
  const { as_user: asUser, limit = 50, before } = req.query;
  if (!asUser) return res.status(400).json({ message: 'as_user is required' });
  try {
    // Verify participant
    const { rows: part } = await query(
      `SELECT 1 FROM conversation_participants WHERE conversation_id=$1 AND user_id=$2 LIMIT 1`,
      [id, asUser]
    );
    if (!part?.length) return res.status(403).json({ message: 'Not a participant' });

    let where = 'WHERE m.conversation_id = $1';
    const params = [id];
    if (before) {
      where += ' AND m.created_at < $2';
      params.push(before);
    }

    const { rows } = await query(
      `SELECT m.id, m.content, m.type, m.file_url, m.created_at,
              m.sender_id, p.username, p.display_name, p.avatar_url
       FROM messages m
       LEFT JOIN profiles p ON p.id = m.sender_id
       ${where}
       ORDER BY m.created_at ASC
       LIMIT ${Number(limit) || 50}`,
      params
    );
    res.json(rows || []);
  } catch (e) {
    console.error('railway-chat messages error:', e);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// POST /api/railway-chat/send
// body: { as_user, conversation_id, content, type, file_url }
router.post('/send', verifySupabaseToken, async (req, res) => {
  try {
    const { as_user: asUser, conversation_id, content, type = 'text', file_url = null } = req.body;
    if (!asUser || !conversation_id || !content) {
      return res.status(400).json({ message: 'as_user, conversation_id and content are required' });
    }
    // Verify participant
    const { rows: part } = await query(
      `SELECT 1 FROM conversation_participants WHERE conversation_id=$1 AND user_id=$2 LIMIT 1`,
      [conversation_id, asUser]
    );
    if (!part?.length) return res.status(403).json({ message: 'Not a participant' });

    const { rows } = await query(
      `INSERT INTO messages (conversation_id, sender_id, content, type, file_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, conversation_id, sender_id, content, type, file_url, created_at`,
      [conversation_id, asUser, content, type, file_url]
    );
    // bump conversation updated_at
    await query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [conversation_id]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('railway-chat send error:', e);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

export default router;

