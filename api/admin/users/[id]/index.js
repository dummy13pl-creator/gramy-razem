import { getDb, requireAdmin, json, error } from '../../../_lib/helpers.js';

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
  const userId = parseInt(id);

  if (userId === user.id) return error(res, 'Nie możesz usunąć własnego konta');

  const rows = await sql`SELECT * FROM users WHERE id = ${userId}`;
  if (rows.length === 0) return error(res, 'Użytkownik nie znaleziony', 404);

  if (rows[0].role === 'admin') {
    const admins = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`;
    if (parseInt(admins[0].count) <= 1) return error(res, 'Nie można usunąć ostatniego administratora');
  }

  // Usuń powiązane dane w odpowiedniej kolejności
  await sql`UPDATE invite_codes SET used_by = NULL, used_at = NULL WHERE used_by = ${userId}`;
  await sql`DELETE FROM invite_codes WHERE created_by = ${userId} AND used_by IS NULL`;
  await sql`DELETE FROM registrations WHERE user_id = ${userId}`;
  // Usuń rejestracje z wydarzeń stworzonych przez tego użytkownika, potem same wydarzenia
  const userEvents = await sql`SELECT id FROM events WHERE created_by = ${userId}`;
  for (const ev of userEvents) {
    await sql`DELETE FROM registrations WHERE event_id = ${ev.id}`;
  }
  await sql`DELETE FROM events WHERE created_by = ${userId}`;
  await sql`DELETE FROM users WHERE id = ${userId}`;
  return json(res, { message: 'Użytkownik usunięty' });
}
