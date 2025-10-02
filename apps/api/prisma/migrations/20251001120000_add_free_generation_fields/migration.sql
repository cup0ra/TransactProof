-- Migration: add free generation fields to users
-- Generated manually on 2025-10-01

-- Safety: only add columns if not exists (PostgreSQL 9.6+ workaround via DO block)
DO $$
BEGIN
  -- free_generations_remaining
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='free_generations_remaining'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "free_generations_remaining" INTEGER NOT NULL DEFAULT 1;
  END IF;

  -- free_until
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='free_until'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "free_until" TIMESTAMP WITH TIME ZONE NULL;
  END IF;
END$$;

-- Backfill strategy note:
-- Existing users automatically receive 1 free generation via DEFAULT.
-- If you don't want to grant retroactively, run:
--   UPDATE "users" SET free_generations_remaining = 0;
-- Or set a promo period, e.g. 7 days from now:
--   UPDATE "users" SET free_until = NOW() + interval '7 days' WHERE free_generations_remaining > 0;
