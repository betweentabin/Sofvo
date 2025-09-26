import { verifyJwt } from '../utils/jwt.js';
import { createClient } from '@supabase/supabase-js';

const supabaseEnabled = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const supabase = supabaseEnabled ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY) : null;

export const verifyAnyAuth = async (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing Authorization header' });

  // 1) Try Railway JWT first
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
  const payload = verifyJwt(token, { secret: jwtSecret });
  if (payload?.sub) {
    req.userId = payload.sub;
    req.user = { id: payload.sub, email: payload.email };
    return next();
  }

  // 2) Fallback to Supabase token (for transition period)
  if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        req.userId = user.id;
        req.user = user;
        return next();
      }
    } catch {}
  }

  return res.status(401).json({ message: 'Invalid or expired token' });
};

