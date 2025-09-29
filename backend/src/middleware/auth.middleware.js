import { verifyJwt } from '../utils/jwt.js';

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

  return res.status(401).json({ message: 'Invalid or expired token' });
};
