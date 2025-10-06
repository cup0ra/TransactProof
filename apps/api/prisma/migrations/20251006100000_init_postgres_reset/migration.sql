-- Manual baseline migration for PostgreSQL
-- Date: 2025-10-06
-- WARNING: Apply only to an empty/new Postgres database.

CREATE TABLE "users" (
    id UUID PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    free_generations_remaining INTEGER NOT NULL DEFAULT 1,
    free_until TIMESTAMPTZ NULL
);

CREATE TABLE "nonces" (
    id UUID PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    nonce TEXT UNIQUE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE "sessions" (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    jwt_id TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    refresh_expires_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES "users"(id) ON DELETE CASCADE
);

CREATE TABLE "receipts" (
    id UUID PRIMARY KEY,
    user_id UUID NULL,
    tx_hash TEXT NOT NULL,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    token TEXT NOT NULL DEFAULT 'USDT',
    chain_id INTEGER NOT NULL DEFAULT 8453,
    pdf_url TEXT NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_receipts_user FOREIGN KEY (user_id) REFERENCES "users"(id) ON DELETE SET NULL
);

CREATE TABLE "user_branding" (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    company_name VARCHAR(80) NULL,
    website VARCHAR(120) NULL,
    logo_data_url TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_branding_user FOREIGN KEY (user_id) REFERENCES "users"(id) ON DELETE CASCADE
);

-- Indexes (if any additional needed)
-- (Currently relying on UNIQUE constraints)

-- Trigger to update updated_at (Optional: use application side updatedAt)
-- You can add a trigger if you wish Postgres-level automatic timestamp updates.
