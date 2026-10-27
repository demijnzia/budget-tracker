-- Ledger database setup for Supabase.
-- Paste all of this into Supabase > SQL Editor > New query, then press Run.
-- It is safe to run more than once. It matches prisma/schema.prisma, so you can
-- use this instead of running `npx prisma db push`.
-- Already have the tables from an earlier version? Run prisma/add-users.sql instead.

DO $$ BEGIN
  CREATE TYPE "TxType" AS ENUM ('EXPENSE', 'INCOME');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Category" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "userId"    TEXT,
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
  "userId"     TEXT NOT NULL,
  "invoiceNo"  TEXT,
  "date"       TIMESTAMP(3) NOT NULL,
  "categoryId" TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_userId_name_key" ON "Category"("userId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_userId_invoiceNo_key" ON "Transaction"("userId", "invoiceNo");
CREATE INDEX IF NOT EXISTS "Transaction_userId_date_idx" ON "Transaction"("userId", "date");
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

-- Built-in categories, shared by every user (userId stays empty).
INSERT INTO "Category" ("id", "name", "icon", "color", "type")
SELECT gen_random_uuid()::text, v.name, v.icon, v.color, v.type::"TxType"
FROM (VALUES
  ('Food',          'food',          '#B3452F', 'EXPENSE'),
  ('Transport',     'transport',     '#C9962C', 'EXPENSE'),
  ('Shopping',      'shopping',      '#8A5A9E', 'EXPENSE'),
  ('Bills',         'bills',         '#3B6B4A', 'EXPENSE'),
  ('Health',        'health',        '#3C7A89', 'EXPENSE'),
  ('Entertainment', 'entertainment', '#C24E6B', 'EXPENSE'),
  ('Travel',        'travel',        '#4E7FC2', 'EXPENSE'),
  ('Social',        'social',        '#D97B4F', 'EXPENSE'),
  ('Home',          'home',          '#6B7A3B', 'EXPENSE'),
  ('Other',         'other',         '#7A7268', 'EXPENSE'),
  ('Salary',        'salary',        '#3B6B4A', 'INCOME'),
  ('Gift',          'gift',          '#C9962C', 'INCOME'),
  ('Investment',    'investment',    '#4E7FC2', 'INCOME'),
  ('Other Income',  'other',         '#7A7268', 'INCOME')
) AS v(name, icon, color, type)
WHERE NOT EXISTS (
  SELECT 1 FROM "Category" c WHERE c."userId" IS NULL AND c."name" = v.name
);
