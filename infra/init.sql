-- Initialize database (runs only on first init)
CREATE DATABASE transactproof;

-- Create user if not exists
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'transactproof_user') THEN
      CREATE ROLE transactproof_user LOGIN PASSWORD 'secure_password_change_this';
   END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE transactproof TO transactproof_user;
