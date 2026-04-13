import { getDb, generateToken, bcrypt, json, error } from '../_lib/helpers.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();

  // Rozpoznaj akcję z URL: /api/auth/login lub /api/auth/register
  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.pathname.split('/').pop(); // 'login' | 'register'

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if (req.method === 'POST' && action === 'login') {
    const { name, password } = req.body || {};
    if (!name || !password) return error(res, 'Podaj imię i nazwisko oraz hasło');

    const rows = await sql`SELECT * FROM users WHERE LOWER(name) = LOWER(${name.trim()})`;
    const user = rows[0];
    if (!user) return error(res, 'Nieprawidłowe imię lub hasło', 401);

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return error(res, 'Nieprawidłowe imię lub hasło', 401);

    const token = generateToken(user);
    return json(res, {
      token,
      user: { id: user.id, name: user.name, role: user.role },
    });
  }

  // ── REGISTER ─────────────────────────────────────────────────────────────
  if (req.method === 'POST' && action === 'register') {
    const { name, password, inviteCode } = req.body || {};

    if (!name || !password || !inviteCode) {
      return error(res, 'Wszystkie pola są wymagane (imię, hasło, kod zaproszenia)');
    }

    // Sprawdź kod zaproszenia
    const codeRows = await sql`
      SELECT * FROM invite_codes WHERE code = ${inviteCode.toUpperCase().trim()} AND used_by IS NULL
    `;
    if (codeRows.length === 0) {
      return error(res, 'Nieprawidłowy lub już wykorzystany kod zaproszenia');
    }

    if (name.trim().length < 2) return error(res, 'Imię musi mieć co najmniej 2 znaki');
    if (password.length < 6) return error(res, 'Hasło musi mieć co najmniej 6 znaków');

    // Sprawdź czy nazwa już zajęta
    const existing = await sql`SELECT id FROM users WHERE LOWER(name) = LOWER(${name.trim()})`;
    if (existing.length > 0) return error(res, 'Użytkownik o tym imieniu już istnieje', 409);

    const hash = bcrypt.hashSync(password, 10);
    const inserted = await sql`
      INSERT INTO users (name, email, password, role) 
      VALUES (${name.trim()}, ${name.trim().toLowerCase().replace(/\s+/g, '.')}, ${hash}, 'user')
      RETURNING id, name, role
    `;
    const user = inserted[0];

    // Oznacz kod jako wykorzystany
    await sql`
      UPDATE invite_codes SET used_by = ${user.id}, used_at = NOW() WHERE id = ${codeRows[0].id}
    `;

    const token = generateToken(user);
    return json(res, { token, user }, 201);
  }

  return error(res, 'Nieprawidłowe żądanie', 404);
}
