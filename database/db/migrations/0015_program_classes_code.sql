-- Add unique code and optional promotion to program_classes
ALTER TABLE "program_classes" ADD COLUMN IF NOT EXISTS "promotion_id" uuid;
ALTER TABLE "program_classes" ADD COLUMN IF NOT EXISTS "code" text;
CREATE UNIQUE INDEX IF NOT EXISTS "program_classes_code_unique" ON "program_classes" ("code");
