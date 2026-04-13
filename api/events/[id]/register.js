import { getDb, requireAuth, json, error } from '../../_lib/helpers.js';

async function withRegistrations(sql, event) {
  if (!event) return null;
  const regs = await sql`
    SELECT r.id, r.user_id as "userId", u.name as "userName", r.created_at as "registeredAt"
    FROM registrations r JOIN users u ON u.id = r.user_id
    WHERE r.event_id = ${event.id} ORDER BY r.created_at
  `;
  return { ...event, registrations: regs };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const sql = getDb();
  const { id } = req.query;

  const eventRows = await sql`SELECT * FROM events WHERE id = ${id}`;
  if (eventRows.length === 0) return error(res, 'Wydarzenie nie znalezione', 404);
  const event = eventRows[0];

  // POST — zapisz się
  if (req.method === 'POST') {
    const existing = await sql`
      SELECT * FROM registrations WHERE event_id = ${event.id} AND user_id = ${user.id}
    `;
    if (existing.length > 0) return error(res, 'Już jesteś zapisany na to wydarzenie', 409);

    const regCount = await sql`SELECT COUNT(*) as count FROM registrations WHERE event_id = ${event.id}`;
    if (parseInt(regCount[0].count) >= event.capacity) return error(res, 'Brak wolnych miejsc');

    await sql`INSERT INTO registrations (event_id, user_id) VALUES (${event.id}, ${user.id})`;
    const updated = await withRegistrations(sql, event);
    return json(res, { event: updated }, 201);
  }

  // DELETE — wypisz się
  if (req.method === 'DELETE') {
    const reg = await sql`
      SELECT * FROM registrations WHERE event_id = ${event.id} AND user_id = ${user.id}
    `;
    if (reg.length === 0) return error(res, 'Nie jesteś zapisany na to wydarzenie', 404);

    await sql`DELETE FROM registrations WHERE event_id = ${event.id} AND user_id = ${user.id}`;
    const updated = await withRegistrations(sql, event);
    return json(res, { event: updated });
  }

  return error(res, 'Nieprawidłowe żądanie', 405);
}
