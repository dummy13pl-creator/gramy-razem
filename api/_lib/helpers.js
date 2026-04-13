import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ── Baza danych ──────────────────────────────────────────────────────────────
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Brak zmiennej DATABASE_URL');
  }
  return neon(process.env.DATABASE_URL);
}

// ── JWT ──────────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.split(' ')[1], JWT_SECRET);
  } catch {
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export { bcrypt };

export function json(res, data, status = 200) {
  res.status(status).json(data);
}

export function error(res, message, status = 400) {
  res.status(status).json({ error: message });
}

export function requireAuth(req, res) {
  const user = verifyToken(req);
  if (!user) {
    error(res, 'Brak autoryzacji', 401);
    return null;
  }
  return user;
}

export function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    error(res, 'Brak uprawnień administratora', 403);
    return null;
  }
  return user;
}
