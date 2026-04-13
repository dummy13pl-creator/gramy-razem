import { getDb, requireAdmin, json, error } from '../../../_lib/helpers.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'PATCH') return error(res, 'Nieprawidłowe żądanie', 405);

  const user = requireAdmin(req, res);
  if (!user) return;

  const sql = getDb();
  const { id } = req.query;
  const userId = parseInt(id);
  const { role } = req.body || {};

  if (!role || !['user', 'admin'].includes(role)) {
    return error(res, 'Nieprawidłowa rola. Dozwolone: user, admin');
  }

  if (userId === user.id) return error(res, 'Nie możesz zmienić własnej roli');

  const rows = await sql`SELECT * FROM users WHERE id = ${userId}`;
  if (rows.length === 0) return error(res, 'Użytkownik nie znaleziony', 404);

  if (rows[0].role === 'admin' && role === 'user') {
    const admins = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`;
    if (parseInt(admins[0].count) <= 1) {
      return error(res, 'Nie można odebrać roli ostatniemu administratorowi');
    }
  }

  const updated = await sql`
    UPDATE users SET role = ${role} WHERE id = ${userId}
    RETURNING id, name, email, role, created_at
  `;
  return json(res, { user: updated[0] });
}
