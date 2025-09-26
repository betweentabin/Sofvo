import { verifyLocalToken } from './auth-local.middleware.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

export const verifyAuthHybrid = async (req, res, next) => {
  // Try local JWT first
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.replace('Bearer ', '');

  // Try local
  try {
    return verifyLocalToken(req, res, next);
  } catch (_) {
    // ignore, fallthrough to supabase
  }

  // Fallback: Supabase verification (for backward compatibility)
  if (!supabase) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    req.userId = user.id;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

