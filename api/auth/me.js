import { getDb, requireAuth, json, error } from '../_lib/helpers.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const sql = getDb();
  const rows = await sql`SELECT id, name, email, role FROM users WHERE id = ${user.id}`;
  if (rows.length === 0) return error(res, 'Użytkownik nie znaleziony', 404);

  return json(res, { user: rows[0] });
}
