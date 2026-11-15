CREATE TABLE "lesson_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"course_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"xp_earned" integer NOT NULL,
	"accuracy_bp" integer NOT NULL,
	"hearts_left" integer NOT NULL,
	"max_combo" integer NOT NULL,
	"answers" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_events" ADD CONSTRAINT "lesson_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_events_user_attempt_idx" ON "lesson_events" USING btree ("user_id","attempt_id");