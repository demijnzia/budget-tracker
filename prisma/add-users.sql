-- Moves an existing Ledger database to two separate user accounts.
-- Run this ONCE, after you have created the first user in Supabase
-- (Authentication > Users > Add user) and BEFORE you merge the user-accounts branch.
--
-- 1. Change the email on the line marked "EDIT THIS" to the first user's email.
-- 2. Paste the whole script into Supabase > SQL Editor > New query and press Run.
--
-- Everything you have entered so far becomes that user's data. Built-in
-- categories stay shared. Your own custom categories become that user's.

DO $$
DECLARE
  first_email text := 'you@example.com';  -- EDIT THIS
  uid text;
BEGIN
  SELECT id::text INTO uid FROM auth.users WHERE lower(email) = lower(first_email);
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No user with the email %. Create the user first (Authentication > Users > Add user), then fix the email at the top of this script.', first_email;
  END IF;

  ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "userId" TEXT;
  ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "userId" TEXT;

  UPDATE "Transaction" SET "userId" = uid WHERE "userId" IS NULL;

  -- Categories you added yourself belong to the first user. The starter ones stay shared.
  UPDATE "Category" SET "userId" = uid
  WHERE "userId" IS NULL AND "name" NOT IN (
    'Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Travel',
    'Social', 'Home', 'Other', 'Salary', 'Gift', 'Investment', 'Other Income'
  );

  ALTER TABLE "Transaction" ALTER COLUMN "userId" SET NOT NULL;
END $$;

DROP INDEX IF EXISTS "Category_name_key";
DROP INDEX IF EXISTS "Transaction_invoiceNo_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Category_userId_name_key" ON "Category"("userId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_userId_invoiceNo_key" ON "Transaction"("userId", "invoiceNo");
CREATE INDEX IF NOT EXISTS "Transaction_userId_date_idx" ON "Transaction"("userId", "date");
