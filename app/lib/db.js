import { neon } from "@neondatabase/serverless";

// Vercel's Neon Marketplace integration injects DATABASE_URL.
// (older setups may call it POSTGRES_URL — supported as a fallback)
// Lazily created so a missing env var only errors when a query actually
// runs, not when this module is first loaded (e.g. during `next build`).
let _sql = null;
function sql(strings, ...values) {
  if (!_sql) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error(
        "ไม่พบ DATABASE_URL — กรุณาเชื่อมต่อฐานข้อมูล Neon ผ่าน Vercel Marketplace ก่อน"
      );
    }
    _sql = neon(connectionString);
  }
  return _sql(strings, ...values);
}

// สร้างตารางอัตโนมัติถ้ายังไม่มี (เรียกใช้ตอน request แรก ๆ)
let initialized = false;
export async function ensureSchema() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      start_time TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at TIMESTAMPTZ
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      image_url TEXT,
      vote_count INTEGER NOT NULL DEFAULT 0
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS voters (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      voter_token TEXT NOT NULL,
      candidate_id INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (session_id, voter_token)
    );
  `;
  initialized = true;
}

// session ปัจจุบัน = อันล่าสุดที่ยังไม่ถูกลบ (ไม่ว่าจะ scheduled/active/ended)
export async function getCurrentSession() {
  await ensureSchema();
  const rows = await sql`
    SELECT * FROM sessions
    WHERE status != 'ended'
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  if (rows.length === 0) return null;
  const session = rows[0];

  // ถ้าถึงเวลาเริ่มแล้วและยัง scheduled อยู่ ให้เปลี่ยนเป็น active อัตโนมัติ
  if (session.status === "scheduled" && new Date(session.start_time) <= new Date()) {
    await sql`UPDATE sessions SET status = 'active' WHERE id = ${session.id};`;
    session.status = "active";
  }
  return session;
}

export async function getSessionById(id) {
  await ensureSchema();
  const rows = await sql`SELECT * FROM sessions WHERE id = ${id};`;
  return rows[0] || null;
}

export async function getCandidates(sessionId) {
  await ensureSchema();
  const rows = await sql`
    SELECT * FROM candidates WHERE session_id = ${sessionId} ORDER BY id ASC;
  `;
  return rows;
}

export async function getHistorySessions() {
  await ensureSchema();
  const rows = await sql`
    SELECT * FROM sessions WHERE status = 'ended' ORDER BY ended_at DESC;
  `;
  return rows;
}

export async function createSession({ title, startTime, candidates }) {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO sessions (title, start_time, status)
    VALUES (${title}, ${startTime}, 'scheduled')
    RETURNING *;
  `;
  const session = rows[0];
  for (const c of candidates) {
    await sql`
      INSERT INTO candidates (session_id, name, image_url)
      VALUES (${session.id}, ${c.name}, ${c.imageUrl});
    `;
  }
  return session;
}

export async function endSession(id) {
  await ensureSchema();
  await sql`
    UPDATE sessions SET status = 'ended', ended_at = NOW() WHERE id = ${id};
  `;
}

export async function deleteSession(id) {
  await ensureSchema();
  await sql`DELETE FROM sessions WHERE id = ${id};`;
}

export async function castVote({ sessionId, candidateId, voterToken }) {
  await ensureSchema();
  try {
    await sql`
      INSERT INTO voters (session_id, voter_token, candidate_id)
      VALUES (${sessionId}, ${voterToken}, ${candidateId});
    `;
  } catch (err) {
    // unique constraint violation = โหวตไปแล้ว
    if (String(err.message).includes("duplicate key")) {
      const error = new Error("ALREADY_VOTED");
      throw error;
    }
    throw err;
  }
  await sql`
    UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ${candidateId};
  `;
}

export async function hasVoted({ sessionId, voterToken }) {
  await ensureSchema();
  const rows = await sql`
    SELECT 1 FROM voters WHERE session_id = ${sessionId} AND voter_token = ${voterToken};
  `;
  return rows.length > 0;
}
