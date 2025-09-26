import crypto from 'crypto';

// Minimal HS256 JWT utilities without external deps
const base64url = (input) => Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const base64urlDecode = (input) => Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();

export function signJwt(payload, { secret, expiresInSec = 60 * 60 * 24 * 7 } = {}) {
  if (!secret) throw new Error('JWT secret is required');
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + expiresInSec, ...payload };
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(body));
  const data = `${encHeader}.${encPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${signature}`;
}

export function verifyJwt(token, { secret } = {}) {
  if (!secret) throw new Error('JWT secret is required');
  const parts = token?.split('.') || [];
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  if (s !== expected) return null;
  try {
    const payload = JSON.parse(base64urlDecode(p));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

