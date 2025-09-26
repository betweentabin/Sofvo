import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { hashPassword, signToken, authenticateLocal, verifyLocalToken } from '../middleware/auth-local.middleware.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// POST /api/local-auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('username').isLength({ min: 3 }),
  body('display_name').isLength({ min: 1 }),
  validate
], async (req, res) => {
  try {
    const { email, password, username, display_name } = req.body;

    // check email exists
    const { rows: existingEmail } = await query('SELECT 1 FROM users WHERE email=$1 LIMIT 1', [email]);
    if (existingEmail?.length) return res.status(400).json({ message: 'Email already registered' });

    // check username exists
    const { rows: existingUser } = await query('SELECT 1 FROM profiles WHERE username=$1 LIMIT 1', [username]);
    if (existingUser?.length) return res.status(400).json({ message: 'Username already taken' });

    const encrypted = await hashPassword(password);
    const { rows: userRows } = await query(
      `INSERT INTO users(email, encrypted_password, email_confirmed_at)
       VALUES($1,$2,NOW())
       RETURNING id, email` ,
      [email, encrypted]
    );
    const user = userRows[0];

    await query(
      `INSERT INTO profiles(id, username, display_name)
       VALUES($1,$2,$3)` ,
      [user.id, username, display_name]
    );

    const token = signToken({ sub: user.id, email: user.email });
    res.status(201).json({
      user: { id: user.id, email: user.email, username, display_name },
      token
    });
  } catch (e) {
    console.error('local register error:', e);
    res.status(500).json({ message: 'Failed to register' });
  }
});

// POST /api/local-auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  validate
], async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authenticateLocal(email, password);
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const token = signToken({ sub: user.id, email: user.email });
    res.json({
      user: { id: user.id, email: user.email, username: user.username, display_name: user.display_name, avatar_url: user.avatar_url },
      token
    });
  } catch (e) {
    console.error('local login error:', e);
    res.status(500).json({ message: 'Failed to login' });
  }
});

// GET /api/local-auth/me
router.get('/me', verifyLocalToken, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, p.username, p.display_name, p.avatar_url
       FROM users u LEFT JOIN profiles p ON p.id = u.id
       WHERE u.id = $1`,
      [req.userId]
    );
    if (!rows?.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

export default router;

