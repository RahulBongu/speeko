import { emptyProgress, migrateProgress, type ProgressState } from '@speeko/core';
import { eq } from 'drizzle-orm';
import { getDb } from './db/client.js';
import { progressSnapshots } from './db/schema.js';

/** Reads a learner's cloud snapshot, or an empty one when none exists yet. */
export async function readProgress(userId: string): Promise<ProgressState> {
  const db = getDb();
  const [row] = await db
    .select({ data: progressSnapshots.data })
    .from(progressSnapshots)
    .where(eq(progressSnapshots.userId, userId))
    .limit(1);
  return row ? migrateProgress(row.data) : emptyProgress();
}
