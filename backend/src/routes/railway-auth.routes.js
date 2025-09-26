import express from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { query } from '../config/database.js';
import { signJwt } from '../utils/jwt.js';
import { verifyAnyAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('username').isLength({ min: 3 }),
    body('display_name').isLength({ min: 1 }),
    handleValidation,
  ],
  async (req, res) => {
    const { email, password, username, display_name, sport_type = null } = req.body;
    try {
      // email unique
      const { rows: e1 } = await query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email]);
      if (e1.length) return res.status(400).json({ message: 'Email already registered' });
      // username unique
      const { rows: e2 } = await query('SELECT 1 FROM profiles WHERE username = $1 LIMIT 1', [username]);
      if (e2.length) return res.status(400).json({ message: 'Username already taken' });

      // create user
      const { rows: u } = await query(
        `INSERT INTO users (email, encrypted_password, email_confirmed_at)
         VALUES ($1, $2, NOW()) RETURNING id, email`,
        [email, hashPassword(password)]
      );
      const userId = u[0].id;
      await query(
        `INSERT INTO profiles (id, username, display_name, sport_type)
         VALUES ($1, $2, $3, $4)`,
        [userId, username, display_name, sport_type]
      );

      const token = signJwt({ sub: userId, email }, { secret: process.env.JWT_SECRET || 'dev-secret', expiresInSec: 60 * 60 * 24 * 7 });
      res.status(201).json({ user: { id: userId, email, username, display_name }, token });
    } catch (e) {
      console.error('railway-auth/register error:', e);
      res.status(500).json({ message: 'Failed to register' });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').isLength({ min: 1 }), handleValidation],
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const { rows } = await query('SELECT id, email, encrypted_password FROM users WHERE email = $1 LIMIT 1', [email]);
      if (!rows.length) return res.status(401).json({ message: 'Invalid email or password' });
      const user = rows[0];
      if (user.encrypted_password !== hashPassword(password)) return res.status(401).json({ message: 'Invalid email or password' });
      const { rows: p } = await query('SELECT username, display_name FROM profiles WHERE id = $1', [user.id]);
      const token = signJwt({ sub: user.id, email: user.email }, { secret: process.env.JWT_SECRET || 'dev-secret', expiresInSec: 60 * 60 * 24 * 7 });
      res.json({ user: { id: user.id, email: user.email, username: p[0]?.username || null, display_name: p[0]?.display_name || null }, token });
    } catch (e) {
      console.error('railway-auth/login error:', e);
      res.status(500).json({ message: 'Failed to login' });
    }
  }
);

router.get('/me', verifyAnyAuth, async (req, res) => {
  try {
    const { rows } = await query('SELECT id, username, display_name, avatar_url, bio FROM profiles WHERE id = $1', [req.userId]);
    res.json({ user: { id: req.userId, email: req.user?.email || null, ...rows[0] } });
  } catch (e) {
    console.error('railway-auth/me error:', e);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

export default router;

