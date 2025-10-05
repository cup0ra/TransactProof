-- Fix migration: adjust user_branding FK to TEXT to match existing users.id (TEXT)
-- Safe & idempotent pattern: drop failing table if it exists with wrong type

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name='user_branding'
  ) THEN
    -- Check column type; if already correct (TEXT) skip recreation
    PERFORM 1 FROM information_schema.columns 
      WHERE table_name='user_branding' AND column_name='user_id' AND data_type='text';
    IF NOT FOUND THEN
      DROP TABLE "user_branding" CASCADE;
    ELSE
      -- Already correct, nothing to do
      RETURN;
    END IF;
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "user_branding" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "company_name" VARCHAR(80),
  "website" VARCHAR(120),
  "logo_data_url" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ensure timestamp trigger function exists (idempotent)
CREATE OR REPLACE FUNCTION set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if not exists (Postgres 14+ lacks CREATE TRIGGER IF NOT EXISTS, emulate)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_user_branding'
  ) THEN
    CREATE TRIGGER set_timestamp_user_branding
    BEFORE UPDATE ON "user_branding"
    FOR EACH ROW
    EXECUTE PROCEDURE set_timestamp();
  END IF;
END$$;
