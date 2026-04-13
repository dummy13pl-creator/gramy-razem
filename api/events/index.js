import { getDb, requireAuth, requireAdmin, json, error } from '../_lib/helpers.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  // GET /api/events
  if (req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;

    const events = await sql`
      SELECT e.*, u.name as "createdByName"
      FROM events e JOIN users u ON u.id = e.created_by
      ORDER BY e.date ASC, e.time ASC
    `;
    const result = await Promise.all(events.map((e) => withRegistrations(sql, e)));
    return json(res, { events: result });
  }

  // POST /api/events
  if (req.method === 'POST') {
    const user = requireAdmin(req, res);
    if (!user) return;

    const { title, date, time, location, capacity } = req.body || {};
    if (!title || !date || !time || !location || !capacity) {
      return error(res, 'Wszystkie pola są wymagane');
    }
    if (capacity < 1 || capacity > 500) {
      return error(res, 'Pojemność musi być między 1 a 500');
    }

    const inserted = await sql`
      INSERT INTO events (title, date, time, location, capacity, created_by)
      VALUES (${title}, ${date}, ${time}, ${location}, ${capacity}, ${user.id})
      RETURNING *
    `;
    const event = await withRegistrations(sql, inserted[0]);
    return json(res, { event }, 201);
  }

  return error(res, 'Nieprawidłowe żądanie', 405);
}
