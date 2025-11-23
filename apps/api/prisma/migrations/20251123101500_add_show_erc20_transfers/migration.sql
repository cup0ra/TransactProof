-- Migration: add show_erc20_transfers flag to user_branding
-- Date: 2025-11-23
-- Adds a persisted preference for showing ERC20 transfer logs in receipts.

ALTER TABLE "user_branding" ADD COLUMN "show_erc20_transfers" BOOLEAN NOT NULL DEFAULT FALSE;
