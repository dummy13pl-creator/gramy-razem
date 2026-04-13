import { getDb, requireAdmin, json, error } from '../../_lib/helpers.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return error(res, 'Nieprawidłowe żądanie', 405);

  const user = requireAdmin(req, res);
  if (!user) return;

  const sql = getDb();
  const users = await sql`
    SELECT u.id, u.name, u.email, u.role, u.created_at,
      (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id)::int as "registrationCount"
    FROM users u ORDER BY u.created_at DESC
  `;

  return json(res, { users });
}
