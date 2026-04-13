import crypto from 'crypto';
import { getDb, requireAdmin, json, error } from '../../_lib/helpers.js';

function generateCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAdmin(req, res);
  if (!user) return;
  const sql = getDb();

  // GET — lista kodów
  if (req.method === 'GET') {
    const codes = await sql`
      SELECT ic.*, 
        creator.name as "createdByName",
        used_user.name as "usedByName",
        used_user.email as "usedByEmail"
      FROM invite_codes ic
      JOIN users creator ON creator.id = ic.created_by
      LEFT JOIN users used_user ON used_user.id = ic.used_by
      ORDER BY ic.created_at DESC
    `;
    return json(res, { codes });
  }

  // POST — generuj kody
  if (req.method === 'POST') {
    const { count = 1 } = req.body || {};
    const amount = Math.min(Math.max(1, count), 20);
    const generated = [];

    for (let i = 0; i < amount; i++) {
      let code;
      let exists = true;
      while (exists) {
        code = generateCode();
        const check = await sql`SELECT id FROM invite_codes WHERE code = ${code}`;
        exists = check.length > 0;
      }
      await sql`INSERT INTO invite_codes (code, created_by) VALUES (${code}, ${user.id})`;
      generated.push(code);
    }

    const codes = await sql`
      SELECT ic.*, 
        creator.name as "createdByName",
        used_user.name as "usedByName",
        used_user.email as "usedByEmail"
      FROM invite_codes ic
      JOIN users creator ON creator.id = ic.created_by
      LEFT JOIN users used_user ON used_user.id = ic.used_by
      ORDER BY ic.created_at DESC
    `;
    return json(res, { generated, codes }, 201);
  }

  return error(res, 'Nieprawidłowe żądanie', 405);
}
