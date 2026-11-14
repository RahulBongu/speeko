import 'dotenv/config';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as schema from './schema.js';

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_FOLDER = resolve(here, '../../drizzle');

type Db = ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

let pool: Pool | null = null;
let pglite: PGlite | null = null;
let db: Db | null = null;

export function getDb() {
  if (db) return db;
  const url = process.env.DATABASE_URL;
  if (url) {
    pool = new Pool({ connectionString: url });
    db = drizzlePg(pool, { schema });
  } else {
    const dataDir = process.env.PGLITE_DATA_DIR ?? resolve(here, '../../data');
    pglite = new PGlite(dataDir);
    db = drizzlePglite(pglite, { schema });
  }
  return db;
}

export async function runMigrations() {
  const database = getDb();
  if (pool) {
    await migratePg(database as any, { migrationsFolder: MIGRATIONS_FOLDER });
  } else {
    await migratePglite(database as any, { migrationsFolder: MIGRATIONS_FOLDER });
  }
}

export async function closeDb() {
  if (pool) await pool.end();
  if (pglite) await pglite.close();
  pool = null;
  pglite = null;
  db = null;
}

export type { Db };
