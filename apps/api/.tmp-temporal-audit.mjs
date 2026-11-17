import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

const full = 'C:/duo/apps/api/drizzle';
const temp = 'C:/Users/rahul/AppData/Local/Temp/opencode/speeko-temporal-audit';
const old = join(temp, 'drizzle-0004');
const dataDir = join(temp, 'db');

await rm(temp, { recursive: true, force: true });
await mkdir(old, { recursive: true });
await cp(full, old, { recursive: true });
await rm(join(old, '0005_lesson_completion_rewards.sql'), { force: true });
const journal = JSON.parse(await readFile(join(old, 'meta', '_journal.json'), 'utf8'));
journal.entries = journal.entries.filter((e) => e.tag !== '0005_lesson_completion_rewards');
await writeFile(join(old, 'meta', '_journal.json'), JSON.stringify(journal, null, 2));

const client = new PGlite(dataDir);
const db = drizzle(client);

function weekKey(ts) {
  // Asia/Kolkata (+05:30), Monday week start.
  const d = new Date(ts);
  const local = new Date(d.getTime() + 5.5 * 3600 * 1000);
  const day = local.getUTCDay(); // 0 Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(local.getTime() + mondayOffset * 86400 * 1000);
  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}-${String(monday.getUTCDate()).padStart(2, '0')}`;
}

await migrate(db, { migrationsFolder: old });

await client.query(`
  INSERT INTO "user" (id, name, email) VALUES
    ('uA','A','a@example.com'),
    ('uB','B','b@example.com'),
    ('uC','C','c@example.com'),
    ('uD','D','d@example.com'),
    ('uE','E','e@example.com')
`);

// uA: one lesson twice in different weeks; multiple attempts same week; week-boundary replay.
await client.query(`
  INSERT INTO lesson_events (id,user_id,attempt_id,course_id,lesson_id,xp_earned,accuracy_bp,hearts_left,max_combo,answers,created_at) VALUES
    ('a1','uA','a1','hi-starter','lesson-a',21,10000,5,3,'[]'::jsonb,'2026-11-03T10:00:00+05:30'),
    ('a2','uA','a2','hi-starter','lesson-a',21,10000,5,3,'[]'::jsonb,'2026-11-10T10:00:00+05:30'),
    ('c1','uA','c1','hi-starter','lesson-c',20,10000,5,3,'[]'::jsonb,'2026-11-04T10:00:00+05:30'),
    ('c2','uA','c2','hi-starter','lesson-c',20,10000,5,3,'[]'::jsonb,'2026-11-05T10:00:00+05:30'),
    ('d1','uA','d1','hi-starter','lesson-d',21,10000,5,3,'[]'::jsonb,'2026-11-08T23:30:00+05:30'),
    ('d2','uA','d2','hi-starter','lesson-d',21,10000,5,3,'[]'::jsonb,'2026-11-09T00:30:00+05:30')
`);

// uB: two lessons in different weeks.
await client.query(`
  INSERT INTO lesson_events (id,user_id,attempt_id,course_id,lesson_id,xp_earned,accuracy_bp,hearts_left,max_combo,answers,created_at) VALUES
    ('b1','uB','b1','hi-starter','lesson-b1',20,10000,5,3,'[]'::jsonb,'2026-11-03T12:00:00+05:30'),
    ('b2','uB','b2','hi-starter','lesson-b2',20,10000,5,3,'[]'::jsonb,'2026-11-10T12:00:00+05:30')
`);

// uC: existing XP + gems.
await client.query(`
  INSERT INTO lesson_events (id,user_id,attempt_id,course_id,lesson_id,xp_earned,accuracy_bp,hearts_left,max_combo,answers,created_at) VALUES
    ('cU','uC','cU','hi-starter','lesson-cU',21,10000,5,3,'[]'::jsonb,'2026-11-03T09:00:00+05:30')
`);
await client.query(`
  INSERT INTO gem_ledger (id,user_id,amount,reason,source_key,created_at) VALUES
    ('g1','uC',5,'lesson','lesson:attempt-cU','2026-11-03T09:00:00+05:30'),
    ('g2','uC',10,'quest','quest:daily-lessons:2026-11-03','2026-11-03T09:00:00+05:30')
`);

// uE: historical activity with no eligible completion reward (0 XP).
await client.query(`
  INSERT INTO lesson_events (id,user_id,attempt_id,course_id,lesson_id,xp_earned,accuracy_bp,hearts_left,max_combo,answers,created_at) VALUES
    ('e1','uE','e1','hi-starter','lesson-e',0,0,0,0,'[]'::jsonb,'2026-11-04T09:00:00+05:30')
`);

// uD: guest-like account with progress snapshot only.
await client.query(`
  INSERT INTO progress_snapshots (user_id,data,updated_at) VALUES
    ('uD','{"version":2,"xp":99,"streak":0,"lastActiveDate":null,"todayDate":"2026-11-03","todayXp":0,"completed":{},"lastCourseId":null,"lastLessonId":null,"srs":{},"activity":{},"dailyGoal":50,"timeZone":null,"equippedCosmetic":null}'::jsonb, now())
`);

// Before snapshot: old weekly aggregation from events.
const beforeEvents = await client.query(`
  SELECT user_id, created_at, xp_earned FROM lesson_events ORDER BY user_id, created_at
`);
const beforeByUserWeek = new Map();
const beforeLifetime = new Map();
const beforeLessons = new Map();
for (const row of beforeEvents.rows) {
  const w = weekKey(row.created_at);
  const key = `${row.user_id}|${w}`;
  beforeByUserWeek.set(key, (beforeByUserWeek.get(key) ?? 0) + row.xp_earned);
  beforeLifetime.set(row.user_id, (beforeLifetime.get(row.user_id) ?? 0) + row.xp_earned);
  beforeLessons.set(row.user_id, (beforeLessons.get(row.user_id) ?? 0) + 1);
}

const beforeGems = await client.query(`
  SELECT user_id, COALESCE(SUM(amount),0)::int AS balance FROM gem_ledger GROUP BY user_id
`);
const beforeGemMap = new Map(beforeGems.rows.map((r) => [r.user_id, r.balance]));

console.log('=== BEFORE MIGRATION ===');
console.log('Weekly XP (user|week):');
for (const [k, v] of [...beforeByUserWeek.entries()].sort()) console.log(`  ${k} = ${v}`);
console.log('Lifetime XP:', Object.fromEntries(beforeLifetime));
console.log('Lesson-event counts:', Object.fromEntries(beforeLessons));
console.log('Gem balances:', Object.fromEntries(beforeGemMap));

await migrate(db, { migrationsFolder: full });
console.log('\nmigrated to 0005');

// Duplicate migration execution.
await migrate(db, { migrationsFolder: full });
console.log('re-ran migrate (should be no-op)');

const rewardRows = await client.query(`
  SELECT user_id, course_id, lesson_id, attempt_id, xp,
         to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
  FROM lesson_completion_rewards ORDER BY user_id, lesson_id
`);
console.log('\n=== REWARD ROWS ===');
console.log(JSON.stringify(rewardRows.rows, null, 2));

const afterByUserWeek = new Map();
const afterLifetime = new Map();
const afterLessons = new Map();
for (const row of rewardRows.rows) {
  const w = weekKey(row.created_at);
  const key = `${row.user_id}|${w}`;
  afterByUserWeek.set(key, (afterByUserWeek.get(key) ?? 0) + row.xp);
  afterLifetime.set(row.user_id, (afterLifetime.get(row.user_id) ?? 0) + row.xp);
  afterLessons.set(row.user_id, (afterLessons.get(row.user_id) ?? 0) + 1);
}

const afterGems = await client.query(`
  SELECT user_id, COALESCE(SUM(amount),0)::int AS balance FROM gem_ledger GROUP BY user_id
`);
const afterGemMap = new Map(afterGems.rows.map((r) => [r.user_id, r.balance]));

console.log('\n=== AFTER MIGRATION ===');
console.log('Weekly XP (user|week):');
for (const [k, v] of [...afterByUserWeek.entries()].sort()) console.log(`  ${k} = ${v}`);
console.log('Lifetime XP:', Object.fromEntries(afterLifetime));
console.log('Reward rows (lesson count):', Object.fromEntries(afterLessons));
console.log('Gem balances:', Object.fromEntries(afterGemMap));

// Compare.
console.log('\n=== COMPARISON ===');
console.log('Lifetime preserved:', [...beforeLifetime.keys()].every((u) => beforeLifetime.get(u) === (afterLifetime.get(u) ?? 0)));
console.log('Gem balances unchanged:', [...new Set([...beforeGemMap.keys(), ...afterGemMap.keys()])].every((u) => (beforeGemMap.get(u) ?? 0) === (afterGemMap.get(u) ?? 0)));
console.log('uE has reward row?', rewardRows.rows.some((r) => r.user_id === 'uE'));
console.log('uD has reward row?', rewardRows.rows.some((r) => r.user_id === 'uD'));

// Distinct reward uniqueness.
const dupCheck = await client.query(`
  SELECT user_id, course_id, lesson_id, COUNT(*)::int AS n
  FROM lesson_completion_rewards GROUP BY user_id, course_id, lesson_id HAVING COUNT(*) > 1
`);
console.log('Duplicate reward groups:', dupCheck.rows.length);

await client.close();
console.log('\nTEMPORAL AUDIT FIXTURE DONE');
