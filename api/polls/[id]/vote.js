import { getDb, requireAuth, json, error } from '../../../_lib/helpers.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const sql = getDb();
  const { id } = req.query;
  const pollId = parseInt(id);

  // Sprawdź że ankieta istnieje
  const polls = await sql`SELECT * FROM polls WHERE id = ${pollId}`;
  if (polls.length === 0) return error(res, 'Ankieta nie znaleziona', 404);

  // POST — oddaj głos
  if (req.method === 'POST') {
    const { optionId } = req.body || {};
    if (!optionId) return error(res, 'Wybierz opcję');

    // Sprawdź że opcja należy do tej ankiety
    const options = await sql`
      SELECT * FROM poll_options WHERE id = ${optionId} AND poll_id = ${pollId}
    `;
    if (options.length === 0) return error(res, 'Nieprawidłowa opcja');

    // Czy już głosował?
    const existing = await sql`
      SELECT * FROM poll_votes WHERE poll_id = ${pollId} AND user_id = ${user.id}
    `;

    if (existing.length > 0) {
      // Aktualizuj głos (zmiana zdania)
      await sql`
        UPDATE poll_votes SET option_id = ${optionId}, voted_at = NOW()
        WHERE poll_id = ${pollId} AND user_id = ${user.id}
      `;
    } else {
      await sql`
        INSERT INTO poll_votes (poll_id, option_id, user_id)
        VALUES (${pollId}, ${optionId}, ${user.id})
      `;
    }

    return json(res, { message: 'Głos zapisany' });
  }

  // DELETE — cofnij głos
  if (req.method === 'DELETE') {
    await sql`DELETE FROM poll_votes WHERE poll_id = ${pollId} AND user_id = ${user.id}`;
    return json(res, { message: 'Głos cofnięty' });
  }

  return error(res, 'Nieprawidłowe żądanie', 405);
}
