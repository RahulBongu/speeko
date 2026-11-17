import { PGlite } from '@electric-sql/pglite';
const client = new PGlite('C:/duo/apps/api/data');
const rewards = await client.query(`SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE xp = 0)::int AS zero FROM lesson_completion_rewards`);
console.log('rewards:', JSON.stringify(rewards.rows));
const zeroRows = await client.query(`SELECT user_id, course_id, lesson_id, xp FROM lesson_completion_rewards WHERE xp = 0 LIMIT 20`);
console.log('zero rows:', JSON.stringify(zeroRows.rows));
await client.close();
