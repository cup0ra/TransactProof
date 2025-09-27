/*
  Warnings:

  - You are about to alter the column `created_at` on the `nonces` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `expires_at` on the `nonces` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `amount` on the `receipts` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("double precision")` to `Float`.
  - You are about to alter the column `created_at` on the `receipts` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `updated_at` on the `receipts` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `created_at` on the `sessions` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `expires_at` on the `sessions` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `created_at` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.
  - You are about to alter the column `updated_at` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("timestamp(3)")` to `DateTime`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_nonces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wallet_address" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME NOT NULL
);
INSERT INTO "new_nonces" ("created_at", "expires_at", "id", "nonce", "used", "wallet_address") SELECT "created_at", "expires_at", "id", "nonce", "used", "wallet_address" FROM "nonces";
DROP TABLE "nonces";
ALTER TABLE "new_nonces" RENAME TO "nonces";
CREATE UNIQUE INDEX "nonces_nonce_key" ON "nonces"("nonce");
CREATE TABLE "new_receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "tx_hash" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "token" TEXT NOT NULL DEFAULT 'USDT',
    "chain_id" INTEGER NOT NULL DEFAULT 8453,
    "pdf_url" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_receipts" ("amount", "chain_id", "created_at", "description", "id", "pdf_url", "receiver", "sender", "token", "tx_hash", "updated_at", "user_id") SELECT "amount", "chain_id", "created_at", "description", "id", "pdf_url", "receiver", "sender", "token", "tx_hash", "updated_at", "user_id" FROM "receipts";
DROP TABLE "receipts";
ALTER TABLE "new_receipts" RENAME TO "receipts";
CREATE TABLE "new_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "jwt_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME NOT NULL,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sessions" ("created_at", "expires_at", "id", "jwt_id", "user_id") SELECT "created_at", "expires_at", "id", "jwt_id", "user_id" FROM "sessions";
DROP TABLE "sessions";
ALTER TABLE "new_sessions" RENAME TO "sessions";
CREATE UNIQUE INDEX "sessions_jwt_id_key" ON "sessions"("jwt_id");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wallet_address" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("created_at", "id", "updated_at", "wallet_address") SELECT "created_at", "id", "updated_at", "wallet_address" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
