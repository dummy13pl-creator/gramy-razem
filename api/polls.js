import { getDb, verifyToken, json, error } from './_lib/helpers.js';

async function getPollWithStats(sql, pollId, currentUserId, isAdmin) {
  const polls = await sql`
    SELECT p.*, u.name as "createdByName"
    FROM polls p JOIN users u ON u.id = p.created_by
    WHERE p.id = ${pollId}
  `;
  if (polls.length === 0) return null;
  const poll = polls[0];

  const options = await sql`
    SELECT id, content, display_order as "displayOrder"
    FROM poll_options WHERE poll_id = ${pollId}
    ORDER BY display_order ASC
  `;

  const votes = await sql`
    SELECT option_id as "optionId", COUNT(*)::int as count
    FROM poll_votes WHERE poll_id = ${pollId}
    GROUP BY option_id
  `;
  const voteMap = {};
  votes.forEach(v => { voteMap[v.optionId] = v.count; });

  const userVote = await sql`
    SELECT option_id FROM poll_votes
    WHERE poll_id = ${pollId} AND user_id = ${currentUserId}
  `;
  const userVotedOptionId = userVote.length > 0 ? userVote[0].option_id : null;
  const totalVotes = votes.reduce((s, v) => s + v.count, 0);

  const optionsWithStats = options.map(o => ({
    ...o,
    votes: voteMap[o.id] || 0,
  }));

  let voters = null;
  if (isAdmin) {
    const allVoters = await sql`
      SELECT pv.option_id as "optionId", u.id as "userId", u.name as "userName"
      FROM poll_votes pv JOIN users u ON u.id = pv.user_id
      WHERE pv.poll_id = ${pollId} ORDER BY u.name
    `;
    voters = {};
    for (const v of allVoters) {
      if (!voters[v.optionId]) voters[v.optionId] = [];
      voters[v.optionId].push({ userId: v.userId, userName: v.userName });
    }
  }

  return {
    id: poll.id,
    question: poll.question,
    createdByName: poll.createdByName,
    created_at: poll.created_at,
    options: optionsWithStats,
    totalVotes,
    userVotedOptionId,
    voters,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const user = verifyToken(req);
    if (!user) return error(res, 'Brak autoryzacji', 401);

    const sql = getDb();
    const isAdmin = user.role === 'admin';

    // Akcja przekazywana jako ?action=vote lub ?action=delete
    // ID ankiety jako ?id=5
    const { action, id } = req.query;

    console.log('[polls]', req.method, 'action:', action, 'id:', id, 'user:', user.id);

    // ── GET /api/polls — lista wszystkich ankiet ──────────────────────────
    if (req.method === 'GET' && !action) {
      const polls = await sql`SELECT id FROM polls ORDER BY created_at DESC`;
      const result = await Promise.all(
        polls.map(p => getPollWithStats(sql, p.id, user.id, isAdmin))
      );
      return json(res, { polls: result });
    }

    // ── POST /api/polls — utwórz ankietę (admin) ──────────────────────────
    if (req.method === 'POST' && !action) {
      if (!isAdmin) return error(res, 'Brak uprawnień administratora', 403);

      const { question, options } = req.body || {};
      if (!question || question.trim().length < 3) {
        return error(res, 'Pytanie musi mieć co najmniej 3 znaki');
      }
      if (!Array.isArray(options) || options.length < 2) {
        return error(res, 'Ankieta musi mieć co najmniej 2 opcje');
      }
      if (options.length > 10) {
        return error(res, 'Ankieta może mieć maksymalnie 10 opcji');
      }
      const cleaned = options.map(o => (o || '').trim()).filter(Boolean);
      if (cleaned.length < 2) return error(res, 'Podaj co najmniej 2 niepuste opcje');

      const inserted = await sql`
        INSERT INTO polls (question, created_by) VALUES (${question.trim()}, ${user.id})
        RETURNING id
      `;
      const pollId = inserted[0].id;

      for (let i = 0; i < cleaned.length; i++) {
        await sql`
          INSERT INTO poll_options (poll_id, content, display_order)
          VALUES (${pollId}, ${cleaned[i]}, ${i})
        `;
      }

      const poll = await getPollWithStats(sql, pollId, user.id, isAdmin);
      return json(res, { poll }, 201);
    }

    // Wszystkie pozostałe akcje wymagają ID ankiety
    const pollId = parseInt(id);
    if (!pollId || isNaN(pollId)) return error(res, 'Brak ID ankiety');

    const pollCheck = await sql`SELECT * FROM polls WHERE id = ${pollId}`;
    if (pollCheck.length === 0) return error(res, 'Ankieta nie znaleziona', 404);

    // ── DELETE /api/polls?id=5 — usuń ankietę ─────────────────────────────
    if (req.method === 'DELETE' && !action) {
      if (!isAdmin) return error(res, 'Brak uprawnień administratora', 403);
      await sql`DELETE FROM poll_votes WHERE poll_id = ${pollId}`;
      await sql`DELETE FROM poll_options WHERE poll_id = ${pollId}`;
      await sql`DELETE FROM polls WHERE id = ${pollId}`;
      return json(res, { message: 'Ankieta usunięta' });
    }

    // ── POST /api/polls?action=vote&id=5 — oddaj głos ─────────────────────
    if (req.method === 'POST' && action === 'vote') {
      const { optionId } = req.body || {};
      const optId = parseInt(optionId);
      if (!optId || isNaN(optId)) return error(res, 'Wybierz opcję');

      const options = await sql`
        SELECT * FROM poll_options WHERE id = ${optId} AND poll_id = ${pollId}
      `;
      if (options.length === 0) return error(res, 'Nieprawidłowa opcja');

      const existing = await sql`
        SELECT * FROM poll_votes WHERE poll_id = ${pollId} AND user_id = ${user.id}
      `;

      if (existing.length > 0) {
        await sql`
          UPDATE poll_votes SET option_id = ${optId}, voted_at = NOW()
          WHERE poll_id = ${pollId} AND user_id = ${user.id}
        `;
      } else {
        await sql`
          INSERT INTO poll_votes (poll_id, option_id, user_id)
          VALUES (${pollId}, ${optId}, ${user.id})
        `;
      }

      const poll = await getPollWithStats(sql, pollId, user.id, isAdmin);
      return json(res, { message: 'Głos zapisany', poll });
    }

    // ── DELETE /api/polls?action=vote&id=5 — cofnij głos ──────────────────
    if (req.method === 'DELETE' && action === 'vote') {
      await sql`DELETE FROM poll_votes WHERE poll_id = ${pollId} AND user_id = ${user.id}`;
      const poll = await getPollWithStats(sql, pollId, user.id, isAdmin);
      return json(res, { message: 'Głos cofnięty', poll });
    }

    return error(res, 'Nieprawidłowe żądanie', 405);
  } catch (err) {
    console.error('[polls error]', err);
    return error(res, `Błąd serwera: ${err.message}`, 500);
  }
}
