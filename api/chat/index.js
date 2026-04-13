import { getDb, requireAuth, json, error } from '../_lib/helpers.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const sql = getDb();

  // GET — pobierz wiadomości z ostatnich 14 dni
  if (req.method === 'GET') {
    // Usuń wiadomości starsze niż 14 dni
    await sql`DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '14 days'`;

    const messages = await sql`
      SELECT m.id, m.content, m.created_at as "createdAt",
        u.id as "userId", u.name as "userName", u.role as "userRole"
      FROM chat_messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.created_at > NOW() - INTERVAL '14 days'
      ORDER BY m.created_at ASC
    `;
    return json(res, { messages });
  }

  // POST — wyślij wiadomość
  if (req.method === 'POST') {
    const { content } = req.body || {};

    if (!content || content.trim().length === 0) {
      return error(res, 'Wiadomość nie może być pusta');
    }

    if (content.trim().length > 1000) {
      return error(res, 'Wiadomość może mieć maksymalnie 1000 znaków');
    }

    const inserted = await sql`
      INSERT INTO chat_messages (user_id, content)
      VALUES (${user.id}, ${content.trim()})
      RETURNING id, content, created_at as "createdAt"
    `;

    const message = {
      ...inserted[0],
      userId: user.id,
      userName: user.name || 'Użytkownik',
      userRole: user.role,
    };

    return json(res, { message }, 201);
  }

  return error(res, 'Nieprawidłowe żądanie', 405);
}
