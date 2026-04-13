import { getDb, requireAuth, requireAdmin, json, error } from '../../_lib/helpers.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();
  const { id } = req.query;

  // GET /api/events/:id
  if (req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;

    const rows = await sql`SELECT * FROM events WHERE id = ${id}`;
    if (rows.length === 0) return error(res, 'Wydarzenie nie znalezione', 404);
    const event = await withRegistrations(sql, rows[0]);
    return json(res, { event });
  }

  // PUT /api/events/:id
  if (req.method === 'PUT') {
    const user = requireAdmin(req, res);
    if (!user) return;

    const rows = await sql`SELECT * FROM events WHERE id = ${id}`;
    if (rows.length === 0) return error(res, 'Wydarzenie nie znalezione', 404);

    const { title, date, time, location, capacity } = req.body || {};

    const regCount = await sql`SELECT COUNT(*) as count FROM registrations WHERE event_id = ${id}`;
    if (capacity && capacity < parseInt(regCount[0].count)) {
      return error(res, `Nie można zmniejszyć pojemności poniżej liczby zapisanych (${regCount[0].count})`);
    }

    const updated = await sql`
      UPDATE events SET
        title = COALESCE(${title || null}, title),
        date = COALESCE(${date || null}, date),
        time = COALESCE(${time || null}, time),
        location = COALESCE(${location || null}, location),
        capacity = COALESCE(${capacity || null}, capacity)
      WHERE id = ${id} RETURNING *
    `;
    const event = await withRegistrations(sql, updated[0]);
    return json(res, { event });
  }

  // DELETE /api/events/:id
  if (req.method === 'DELETE') {
    const user = requireAdmin(req, res);
    if (!user) return;

    const rows = await sql`SELECT * FROM events WHERE id = ${id}`;
    if (rows.length === 0) return error(res, 'Wydarzenie nie znalezione', 404);

    await sql`DELETE FROM events WHERE id = ${id}`;
    return json(res, { message: 'Wydarzenie usunięte' });
  }

  return error(res, 'Nieprawidłowe żądanie', 405);
}
