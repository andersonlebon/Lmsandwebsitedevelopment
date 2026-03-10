-- Promotion contains classes (not programs); optional subset of classes per program
CREATE TABLE IF NOT EXISTS "promotion_classes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "promotion_id" uuid NOT NULL,
  "class_id" uuid NOT NULL,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone
);
CREATE UNIQUE INDEX IF NOT EXISTS "promotion_classes_promotion_id_class_id_unique" ON "promotion_classes" ("promotion_id", "class_id");
