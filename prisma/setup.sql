-- Ledger database setup for Supabase.
-- Paste all of this into Supabase > SQL Editor > New query, then press Run.
-- It is safe to run more than once. It matches prisma/schema.prisma, so you can
-- use this instead of running `npx prisma db push`.

DO $$ BEGIN
  CREATE TYPE "TxType" AS ENUM ('EXPENSE', 'INCOME');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Category" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "icon"      TEXT NOT NULL DEFAULT 'dot',
  "color"     TEXT NOT NULL DEFAULT '#3B6B4A',
  "type"      "TxType" NOT NULL DEFAULT 'EXPENSE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Transaction" (
  "id"         TEXT NOT NULL,
  "amount"     INTEGER NOT NULL,
  "type"       "TxType" NOT NULL,
  "note"       TEXT,
  "invoiceNo"  TEXT,
  "date"       TIMESTAMP(3) NOT NULL,
  "categoryId" TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_invoiceNo_key" ON "Transaction"("invoiceNo");
CREATE INDEX IF NOT EXISTS "Transaction_date_idx" ON "Transaction"("date");
CREATE INDEX IF NOT EXISTS "Transaction_categoryId_idx" ON "Transaction"("categoryId");

DO $$ BEGIN
  ALTER TABLE "Transaction"
    ADD CONSTRAINT "Transaction_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Keep the tables closed to Supabase's public API. The app connects with the
-- database password, which is not affected by this.
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

-- Starter categories (same as `npm run db:seed`).
INSERT INTO "Category" ("id", "name", "icon", "color", "type") VALUES
  (gen_random_uuid()::text, 'Food',          'food',          '#B3452F', 'EXPENSE'),
  (gen_random_uuid()::text, 'Transport',     'transport',     '#C9962C', 'EXPENSE'),
  (gen_random_uuid()::text, 'Shopping',      'shopping',      '#8A5A9E', 'EXPENSE'),
  (gen_random_uuid()::text, 'Bills',         'bills',         '#3B6B4A', 'EXPENSE'),
  (gen_random_uuid()::text, 'Health',        'health',        '#3C7A89', 'EXPENSE'),
  (gen_random_uuid()::text, 'Entertainment', 'entertainment', '#C24E6B', 'EXPENSE'),
  (gen_random_uuid()::text, 'Travel',        'travel',        '#4E7FC2', 'EXPENSE'),
  (gen_random_uuid()::text, 'Social',        'social',        '#D97B4F', 'EXPENSE'),
  (gen_random_uuid()::text, 'Home',          'home',          '#6B7A3B', 'EXPENSE'),
  (gen_random_uuid()::text, 'Other',         'other',         '#7A7268', 'EXPENSE'),
  (gen_random_uuid()::text, 'Salary',        'salary',        '#3B6B4A', 'INCOME'),
  (gen_random_uuid()::text, 'Gift',          'gift',          '#C9962C', 'INCOME'),
  (gen_random_uuid()::text, 'Investment',    'investment',    '#4E7FC2', 'INCOME'),
  (gen_random_uuid()::text, 'Other Income',  'other',         '#7A7268', 'INCOME')
ON CONFLICT ("name") DO NOTHING;
