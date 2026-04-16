import { getDb, verifyToken, json, error } from '../_lib/helpers.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const user = verifyToken(req);
    if (!user) return error(res, 'Brak autoryzacji', 401);

    const sql = getDb();

    // ── GET — pobierz status nieprzeczytanych ─────────────────────────────
    if (req.method === 'GET') {
      // Najnowszy ID wiadomości czatu
      const latestChat = await sql`SELECT id FROM chat_messages ORDER BY id DESC LIMIT 1`;
      const latestChatId = latestChat.length > 0 ? latestChat[0].id : 0;

      // Najnowszy ID ankiety
      const latestPoll = await sql`SELECT id FROM polls ORDER BY id DESC LIMIT 1`;
      const latestPollId = latestPoll.length > 0 ? latestPoll[0].id : 0;

      // Ostatnio widziane ID przez tego użytkownika
      const seen = await sql`
        SELECT last_seen_message_id, last_seen_poll_id
        FROM chat_last_seen WHERE user_id = ${user.id}
      `;
      const lastSeenChatId = seen.length > 0 ? (seen[0].last_seen_message_id || 0) : 0;
      const lastSeenPollId = seen.length > 0 ? (seen[0].last_seen_poll_id || 0) : 0;

      // Liczba nieprzeczytanych wiadomości (od innych użytkowników)
      let unreadChat = 0;
      if (latestChatId > lastSeenChatId) {
        const c = await sql`
          SELECT COUNT(*)::int as count FROM chat_messages
          WHERE id > ${lastSeenChatId} AND user_id != ${user.id}
        `;
        unreadChat = c[0].count;
      }

      // Liczba nowych ankiet (stworzonych przez innych)
      let unreadPolls = 0;
      if (latestPollId > lastSeenPollId) {
        const p = await sql`
          SELECT COUNT(*)::int as count FROM polls
          WHERE id > ${lastSeenPollId} AND created_by != ${user.id}
        `;
        unreadPolls = p[0].count;
      }

      return json(res, {
        unreadChat, latestChatId, lastSeenChatId,
        unreadPolls, latestPollId, lastSeenPollId,
      });
    }

    // ── POST — oznacz jako widziane ──────────────────────────────────────
    if (req.method === 'POST') {
      const { type } = req.query; // 'chat' lub 'polls'
      const { lastSeenId } = req.body || {};

      if (lastSeenId === undefined || lastSeenId === null) {
        return error(res, 'Brak parametru lastSeenId');
      }

      const seenId = parseInt(lastSeenId);
      if (isNaN(seenId)) return error(res, 'Nieprawidłowy lastSeenId');

      if (type === 'polls') {
        await sql`
          INSERT INTO chat_last_seen (user_id, last_seen_poll_id, updated_at)
          VALUES (${user.id}, ${seenId}, NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET last_seen_poll_id = ${seenId}, updated_at = NOW()
        `;
      } else {
        // domyślnie chat (zachowana wsteczna kompatybilność)
        await sql`
          INSERT INTO chat_last_seen (user_id, last_seen_message_id, updated_at)
          VALUES (${user.id}, ${seenId}, NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET last_seen_message_id = ${seenId}, updated_at = NOW()
        `;
      }

      return json(res, { lastSeenId: seenId });
    }

    return error(res, 'Nieprawidłowe żądanie', 405);
  } catch (err) {
    console.error('[chat/status error]', err);
    return error(res, `Błąd serwera: ${err.message}`, 500);
  }
}
