CREATE TABLE "promotion_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promotion_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
-- Migrate existing promotion→program links (if column still exists)
INSERT INTO "promotion_programs" ("promotion_id", "program_id", "sort_order")
SELECT id, program_id, 0 FROM "promotions" WHERE "program_id" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "promotions" DROP COLUMN "program_id";