import express from 'express';
import { Client } from 'pg';
import { verifyJwt } from '../utils/jwt.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const pgClient = new Client({
  connectionString: process.env.DATABASE_URL_EXTERNAL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
let connected = false;
async function ensurePg() {
  if (!connected) {
    await pgClient.connect();
    connected = true;
  }
}

function sseInit(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`event: ping\n`);
  res.write(`data: connected\n\n`);
}

function sseSend(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// GET /api/realtime/chat?conversation_id=&as_user=&token=
router.get('/chat', async (req, res) => {
  try {
    const { token, as_user: asUser, conversation_id: convId } = req.query;
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
    const payload = verifyJwt(token, { secret: jwtSecret });
    if (!payload?.sub || payload.sub !== asUser) return res.status(401).end();
    await ensurePg();

    // Verify membership
    const part = await pgClient.query(
      `SELECT 1 FROM conversation_participants WHERE conversation_id=$1 AND user_id=$2 LIMIT 1`,
      [convId, asUser]
    );
    if (!part.rows?.length) return res.status(403).end();

    sseInit(res);
    let lastTs = new Date().toISOString();
    const interval = setInterval(async () => {
      try {
        const { rows } = await pgClient.query(
          `SELECT m.id, m.content, m.type, m.file_url, m.created_at, m.sender_id,
                  p.username, p.display_name, p.avatar_url
           FROM messages m LEFT JOIN profiles p ON p.id = m.sender_id
           WHERE m.conversation_id=$1 AND m.created_at > $2
           ORDER BY m.created_at ASC LIMIT 100`,
          [convId, lastTs]
        );
        if (rows.length) {
          lastTs = rows[rows.length - 1].created_at;
          for (const r of rows) sseSend(res, 'message', r);
        }
        sseSend(res, 'ping', { t: Date.now() });
      } catch (e) {
        sseSend(res, 'error', { message: e.message });
      }
    }, 2000);

    req.on('close', () => clearInterval(interval));
  } catch (e) {
    console.error('realtime/chat error:', e);
    try { res.status(500).end(); } catch {}
  }
});

// GET /api/realtime/notifications?as_user=&token=
router.get('/notifications', async (req, res) => {
  try {
    const { token, as_user: asUser } = req.query;
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
    const payload = verifyJwt(token, { secret: jwtSecret });
    if (!payload?.sub || payload.sub !== asUser) return res.status(401).end();
    await ensurePg();

    sseInit(res);
    let lastTs = new Date().toISOString();
    const interval = setInterval(async () => {
      try {
        const { rows } = await pgClient.query(
          `SELECT * FROM notifications WHERE user_id=$1 AND created_at > $2 ORDER BY created_at ASC LIMIT 100`,
          [asUser, lastTs]
        );
        if (rows.length) {
          lastTs = rows[rows.length - 1].created_at;
          for (const r of rows) sseSend(res, 'notification', r);
        }
        sseSend(res, 'ping', { t: Date.now() });
      } catch (e) {
        sseSend(res, 'error', { message: e.message });
      }
    }, 2500);

    req.on('close', () => clearInterval(interval));
  } catch (e) {
    console.error('realtime/notifications error:', e);
    try { res.status(500).end(); } catch {}
  }
});

export default router;

