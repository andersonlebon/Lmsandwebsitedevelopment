-- Class belongs to program only; promotion–class is many-to-many via promotion_classes
ALTER TABLE "program_classes" DROP COLUMN IF EXISTS "promotion_id";
