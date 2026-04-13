import { getDb, requireAdmin, json, error } from '../../_lib/helpers.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'DELETE') return error(res, 'Nieprawidłowe żądanie', 405);

  const user = requireAdmin(req, res);
  if (!user) return;

  const sql = getDb();
  const { id } = req.query;

  const rows = await sql`SELECT * FROM invite_codes WHERE id = ${id}`;
  if (rows.length === 0) return error(res, 'Kod nie znaleziony', 404);
  if (rows[0].used_by) return error(res, 'Nie można usunąć wykorzystanego kodu');

  await sql`DELETE FROM invite_codes WHERE id = ${id}`;
  return json(res, { message: 'Kod usunięty' });
}
