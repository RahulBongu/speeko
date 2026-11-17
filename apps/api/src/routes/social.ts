import type { FastifyInstance } from 'fastify';
import { and, eq, gte, ilike, or, sql } from 'drizzle-orm';
import {
  computeStreak,
  dayKeyInTimeZone,
  historyFromLessonEvents,
  weekStart,
} from '@speeko/core';
import { getDb } from '../db/client.js';
import {
  follows,
  lessonCompletionRewards,
  lessonEvents,
  user,
  userProfiles,
} from '../db/schema.js';
import { readProgress } from '../progress-store.js';
import { sessionFromHeaders } from './auth.js';

const LEAGUE_MIN_PLAYERS = 10;
const LEAGUE_TZ = 'Asia/Kolkata';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 18);
}

async function ensureProfile(db: ReturnType<typeof getDb>, userId: string) {
  const [existing] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  if (existing) return existing;

  const [account] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const base = slugify(account?.name || account?.email?.split('@')[0] || 'learner') || 'learner';

  for (let index = 0; index < 100; index += 1) {
    const suffix = index === 0 ? '' : `-${Math.random().toString(36).slice(2, 8)}`;
    const username = `${base}${suffix}`;
    try {
      const [created] = await db
        .insert(userProfiles)
        .values({
          userId,
          username,
          displayName: account?.name ?? null,
        })
        .returning();
      return created;
    } catch (error) {
      const code = (error as { code?: string; cause?: { code?: string } })?.code
        ?? (error as { cause?: { code?: string } })?.cause?.code;
      if (code !== '23505') throw error;
    }
  }
  throw new Error('Could not create a unique username.');
}

/**
 * Public profile stats. Lifetime XP and lessons completed derive from the
 * one-time completion-reward ledger, so replaying a lesson adds neither.
 * Streak derives from append-only `lesson_events`, because practice keeps a
 * streak alive even when it grants no new completion reward. Never from the
 * client-editable progress snapshot — a forged snapshot cannot inflate what
 * other learners see. The snapshot only contributes the learner's day
 * boundaries.
 */
async function profileWithStats(db: ReturnType<typeof getDb>, profile: typeof userProfiles.$inferSelect) {
  const [followers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.followeeId, profile.userId));
  const [following] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.followerId, profile.userId));
  const progress = await readProgress(profile.userId);
  const [events, rewards] = await Promise.all([
    db
      .select({
        attemptId: lessonEvents.attemptId,
        createdAt: lessonEvents.createdAt,
        xpEarned: lessonEvents.xpEarned,
      })
      .from(lessonEvents)
      .where(eq(lessonEvents.userId, profile.userId)),
    db
      .select({ xp: lessonCompletionRewards.xp })
      .from(lessonCompletionRewards)
      .where(eq(lessonCompletionRewards.userId, profile.userId)),
  ]);
  const history = historyFromLessonEvents(
    events.map((event) => ({
      attemptId: event.attemptId,
      createdAt: event.createdAt,
      xp: event.xpEarned,
    })),
    progress.timeZone,
  );
  const today = dayKeyInTimeZone(new Date(), progress.timeZone);
  const xp = rewards.reduce((total, reward) => total + reward.xp, 0);
  const lessons = rewards.length;

  return {
    userId: profile.userId,
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    xp,
    streak: computeStreak(history, today).current,
    lessons,
    followers: Number(followers?.count ?? 0),
    following: Number(following?.count ?? 0),
  };
}

export async function socialRoutes(app: FastifyInstance) {
  app.get('/api/leagues', async (request, reply) => {
    const session = await sessionFromHeaders(request.headers);
    const userId = session?.user.id ?? null;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    await ensureProfile(getDb(), userId);

    const db = getDb();
    const now = new Date();
    const today = dayKeyInTimeZone(now, LEAGUE_TZ);
    const startDay = weekStart(today);
    const weekStartMs = Date.parse(`${startDay}T00:00:00+05:30`);

    // Weekly standings use the same first-completion ledger as profiles.
    // Practice replays are activity, not league progress, so they cannot pad
    // the lesson count or re-earn weekly XP.
    const rewards = await db
      .select({
        userId: lessonCompletionRewards.userId,
        xp: lessonCompletionRewards.xp,
      })
      .from(lessonCompletionRewards)
      .where(gte(lessonCompletionRewards.createdAt, new Date(weekStartMs)));

    const totals = new Map<string, { xp: number; lessons: number }>();
    for (const reward of rewards) {
      const current = totals.get(reward.userId) ?? { xp: 0, lessons: 0 };
      current.xp += reward.xp;
      current.lessons += 1;
      totals.set(reward.userId, current);
    }

    // Ensure every active learner has a profile so usernames are followable.
    for (const activeUserId of totals.keys()) {
      await ensureProfile(db, activeUserId);
    }

    const activeUsers = totals.size;
    const earlyCommunity = activeUsers < LEAGUE_MIN_PLAYERS;

    const profiles = await db.select().from(userProfiles);
    const profileByUser = new Map(profiles.map((profile) => [profile.userId, profile]));

    const standings = [...totals.entries()]
      .map(([activeUserId, total]) => {
        const profile = profileByUser.get(activeUserId);
        return {
          userId: activeUserId,
          username: profile?.username ?? `learner-${activeUserId.slice(0, 6)}`,
          displayName: profile?.displayName ?? null,
          weeklyXp: total.xp,
          lessons: total.lessons,
        };
      })
      .sort((a, b) => b.weeklyXp - a.weeklyXp || a.username.localeCompare(b.username))
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    let me: { rank: number; zone: 'promotion' | 'safe' | 'demotion' } | null = null;
    if (userId) {
      const index = standings.findIndex((entry) => entry.userId === userId);
      if (index >= 0) {
        const rank = index + 1;
        const zone =
          rank <= 3 ? 'promotion' : rank >= Math.max(1, activeUsers - 2) ? 'demotion' : 'safe';
        me = { rank, zone };
      }
    }

    return reply.send({
      earlyCommunity,
      minimumPlayers: LEAGUE_MIN_PLAYERS,
      activeUsers,
      weekStart: startDay,
      standings,
      me,
    });
  });

  app.get('/api/profiles/me', async (request, reply) => {
    const session = await sessionFromHeaders(request.headers);
    if (!session?.user.id) return reply.status(401).send({ error: 'Unauthorized' });
    const db = getDb();
    const profile = (await ensureProfile(db, session.user.id))!;
    const stats = await profileWithStats(db, profile);
    return reply.send({ ...stats, isSelf: true, isFollowing: false });
  });

  app.get('/api/profiles/search', async (request, reply) => {
    const session = await sessionFromHeaders(request.headers);
    if (!session?.user.id) return reply.status(401).send({ error: 'Unauthorized' });

    const query = String((request.query as { q?: string })?.q ?? '').trim();
    if (query.length < 2) return reply.send({ results: [] });

    const db = getDb();
    const rows = await db
      .select()
      .from(userProfiles)
      .where(
        or(
          ilike(userProfiles.username, `%${query}%`),
          ilike(userProfiles.displayName, `%${query}%`),
        ),
      )
      .limit(10);

    return reply.send({
      results: rows.map((row) => ({
        username: row.username,
        displayName: row.displayName,
      })),
    });
  });

  app.get('/api/profiles/:username', async (request, reply) => {
    const session = await sessionFromHeaders(request.headers);
    if (!session?.user.id) return reply.status(401).send({ error: 'Unauthorized' });

    const username = String((request.params as { username: string }).username);
    const db = getDb();
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.username, username))
      .limit(1);
    if (!profile) return reply.status(404).send({ error: 'Profile not found.' });

    const viewerId = session.user.id;
    const stats = await profileWithStats(db, profile);
    const [followRow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, viewerId), eq(follows.followeeId, profile.userId)))
      .limit(1);

    return reply.send({
      ...stats,
      isSelf: viewerId === profile.userId,
      isFollowing: Boolean(followRow),
    });
  });

  app.post('/api/follows', async (request, reply) => {
    const session = await sessionFromHeaders(request.headers);
    if (!session?.user.id) return reply.status(401).send({ error: 'Unauthorized' });
    const userId = session.user.id;

    const body = (request.body ?? {}) as { username?: unknown };
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    if (!username) return reply.status(400).send({ error: 'Username is required.' });

    const db = getDb();
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.username, username))
      .limit(1);
    if (!profile) return reply.status(404).send({ error: 'Profile not found.' });
    if (profile.userId === userId) {
      return reply.status(400).send({ error: 'You cannot follow yourself.' });
    }

    await db
      .insert(follows)
      .values({ followerId: userId, followeeId: profile.userId })
      .onConflictDoNothing({ target: [follows.followerId, follows.followeeId] });

    return reply.send({ following: true });
  });

  app.delete('/api/follows', async (request, reply) => {
    const session = await sessionFromHeaders(request.headers);
    if (!session?.user.id) return reply.status(401).send({ error: 'Unauthorized' });
    const userId = session.user.id;

    const body = (request.body ?? {}) as { username?: unknown };
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    if (!username) return reply.status(400).send({ error: 'Username is required.' });

    const db = getDb();
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.username, username))
      .limit(1);
    if (!profile) return reply.status(404).send({ error: 'Profile not found.' });

    await db
      .delete(follows)
      .where(and(eq(follows.followerId, userId), eq(follows.followeeId, profile.userId)));

    return reply.send({ following: false });
  });
}