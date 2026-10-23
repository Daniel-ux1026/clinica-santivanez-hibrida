import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 8,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false });
export const hash = value => createHash('sha256').update(value).digest('hex');
export function passwordHash(value) { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(value, salt, 64).toString('hex')}`; }
export function passwordMatches(value, stored) {
  const [salt, digest] = stored.split(':');
  return timingSafeEqual(Buffer.from(digest, 'hex'), scryptSync(value, salt, 64));
}
export async function transaction(fn) {
  const c = await pool.connect();
  try { await c.query('BEGIN'); const value = await fn(c); await c.query('COMMIT'); return value; }
  catch (error) { await c.query('ROLLBACK'); throw error; } finally { c.release(); }
}
export async function migrate(mode) {
  await pool.query(await readFile(new URL(`../../infra/sql/${mode}.sql`, import.meta.url), 'utf8'));
  if (mode === 'private') {
    for (const [name, role, key, doctor] of [
      ['recepcion','recepcion','RECEPTION_PASSWORD',null],
      ['medico','medico','DOCTOR_PASSWORD','med-001'],
      ['administrador','administrador','ADMIN_PASSWORD',null]]) {
      const password = process.env[key];
      if (!password || password.length < 16) throw new Error(`Configurar ${key} con al menos 16 caracteres`);
      await pool.query('INSERT INTO staff(username,role,password_hash,doctor_id) VALUES($1,$2,$3,$4) ON CONFLICT(username) DO NOTHING', [name,role,passwordHash(password),doctor]);
    }
  }
}
