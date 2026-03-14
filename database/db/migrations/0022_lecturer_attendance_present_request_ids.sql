-- Store student attendance request IDs when submitting lecturer attendance (to link to request comment etc.)
ALTER TABLE "lecturer_attendance" ADD COLUMN IF NOT EXISTS "present_request_ids" jsonb DEFAULT '[]';
