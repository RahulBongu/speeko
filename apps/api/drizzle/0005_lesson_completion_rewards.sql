CREATE TABLE "lesson_completion_rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"xp" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_completion_rewards" ADD CONSTRAINT "lesson_completion_rewards_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_completion_rewards_user_lesson_idx" ON "lesson_completion_rewards" USING btree ("user_id","course_id","lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_completion_rewards_created_idx" ON "lesson_completion_rewards" USING btree ("created_at");--> statement-breakpoint
-- Backfill one claim per already-completed lesson. `xp` is the sum of the
-- lesson's historical event XP so profile lifetime XP remains exactly what
-- learners already saw; `created_at` is the first attempt so a migration
-- does not flood the current week's league. Only events that actually earned
-- completion XP qualify: a zero-XP event is not a completion and must not
-- create a reward row or count as a completed lesson. No gem rows are minted
-- here: historical gem balances are left untouched and are never clawed back.
INSERT INTO "lesson_completion_rewards" ("id", "user_id", "course_id", "lesson_id", "attempt_id", "xp", "created_at")
SELECT
	'legacy-' || md5(x."user_id" || ':' || x."course_id" || ':' || x."lesson_id"),
	x."user_id",
	x."course_id",
	x."lesson_id",
	x."attempt_id",
	x."total_xp"::integer,
	x."first_at"
FROM (
	SELECT DISTINCT ON ("user_id", "course_id", "lesson_id")
		"user_id",
		"course_id",
		"lesson_id",
		"attempt_id",
		SUM("xp_earned") OVER (PARTITION BY "user_id", "course_id", "lesson_id") AS "total_xp",
		MIN("created_at") OVER (PARTITION BY "user_id", "course_id", "lesson_id") AS "first_at"
	FROM "lesson_events"
	WHERE "xp_earned" > 0
	ORDER BY "user_id", "course_id", "lesson_id", "created_at", "attempt_id"
) x
ON CONFLICT ("user_id", "course_id", "lesson_id") DO NOTHING;
