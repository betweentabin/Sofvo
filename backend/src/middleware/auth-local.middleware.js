import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query } from '../config/database.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyLocalToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    // attach user info
    req.userId = decoded.sub || decoded.id || decoded.user_id || decoded.userId;
    req.user = { id: req.userId, email: decoded.email };
    if (!req.userId) return res.status(401).json({ message: 'Invalid token' });
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Authenticate with email/password against local users table
export const authenticateLocal = async (email, password) => {
  const { rows } = await query(
    `SELECT u.id, u.email, u.encrypted_password, p.username, p.display_name, p.avatar_url
     FROM users u
     LEFT JOIN profiles p ON p.id = u.id
     WHERE u.email = $1
     LIMIT 1`,
    [email]
  );
  const user = rows?.[0];
  if (!user) return null;
  const ok = await comparePassword(password, user.encrypted_password);
  if (!ok) return null;
  return user;
};

