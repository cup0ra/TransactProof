/*
  Warnings:

  - A unique constraint covering the columns `[refresh_token]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "refresh_expires_at" DATETIME;
ALTER TABLE "sessions" ADD COLUMN "refresh_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");
