import { getDb, requireAuth, json, error } from '../_lib/helpers.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const sql = getDb();

  // GET — sprawdź czy są nieprzeczytane wiadomości
  if (req.method === 'GET') {
    // Pobierz najnowszy ID wiadomości
    const latest = await sql`
      SELECT id FROM chat_messages ORDER BY id DESC LIMIT 1
    `;
    const latestId = latest.length > 0 ? latest[0].id : 0;

    // Pobierz ostatni widziany ID przez tego użytkownika
    const seen = await sql`
      SELECT last_seen_message_id FROM chat_last_seen WHERE user_id = ${user.id}
    `;
    const lastSeenId = seen.length > 0 ? seen[0].last_seen_message_id : 0;

    // Policz nieprzeczytane (od innych użytkowników)
    let unread = 0;
    if (latestId > lastSeenId) {
      const countResult = await sql`
        SELECT COUNT(*) as count FROM chat_messages
        WHERE id > ${lastSeenId} AND user_id != ${user.id}
      `;
      unread = parseInt(countResult[0].count);
    }

    return json(res, { unread, latestId, lastSeenId });
  }

  // POST — zapisz ostatni widziany ID
  if (req.method === 'POST') {
    const { lastSeenId } = req.body || {};

    if (!lastSeenId && lastSeenId !== 0) {
      return error(res, 'Brak parametru lastSeenId');
    }

    // Upsert — wstaw lub zaktualizuj
    await sql`
      INSERT INTO chat_last_seen (user_id, last_seen_message_id, updated_at)
      VALUES (${user.id}, ${lastSeenId}, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET last_seen_message_id = ${lastSeenId}, updated_at = NOW()
    `;

    return json(res, { lastSeenId });
  }

  return error(res, 'Nieprawidłowe żądanie', 405);
}
