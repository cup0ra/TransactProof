-- CreateTable
CREATE TABLE "user_branding" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "company_name" VARCHAR(80),
  "website" VARCHAR(120),
  "logo_data_url" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Trigger to auto update updated_at (Postgres specific)
CREATE OR REPLACE FUNCTION set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_user_branding
BEFORE UPDATE ON "user_branding"
FOR EACH ROW
EXECUTE PROCEDURE set_timestamp();
