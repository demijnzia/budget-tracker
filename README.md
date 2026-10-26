# Ledger — Daily Budget Tracker

A simple expense & income tracker: record daily transactions, organize them by
category, and see a monthly breakdown with a donut chart. Data is stored in a
real Postgres database, so it syncs across every device you sign in from
(there's no login yet — see "Notes" below).

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL on Supabase
- Deployed on Vercel

## 1. Set up the Supabase database

1. In your Supabase project, click **Connect** at the top and copy two strings:
   the **Transaction pooler** string (port 6543) and the **Session pooler**
   string (port 5432).
2. Put them in `.env` (see `.env.example`):
   - `DATABASE_URL` is the Transaction pooler string, with `?pgbouncer=true` on
     the end. The running app uses it.
   - `DIRECT_URL` is the Session pooler string. `prisma db push` uses it.
3. Replace `[YOUR-PASSWORD]` in both with your database password
   (Project Settings → Database). If the password has special characters such
   as `@` or `#`, URL-encode them.

Free Supabase projects pause after about a week without use. If the app says it
can't reach the database, restart the project from the Supabase dashboard.

## 2. Run it locally

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL and DIRECT_URL
npx prisma db push        # creates the tables in your database
npm run db:seed           # adds starter categories (Food, Transport, Salary, etc.)
npm run dev
```

Visit http://localhost:3000.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import that repo.
3. In the project's **Settings → Environment Variables**, add `DATABASE_URL` and
   `DIRECT_URL` with the same values as your `.env`.
4. Deploy. Create the tables once. The easiest way, which needs no computer, is
   to open `prisma/setup.sql` in this repo, copy all of it, paste it into
   Supabase → SQL Editor → New query, and press Run. It creates the tables and
   the starter categories. (Developers can run `npx prisma db push` and
   `npm run db:seed` from a machine that has your `.env` instead.)
5. Open your `.vercel.app` URL. Your ledger is live.

## Features

- Add income/expense entries with amount, category, date, and an optional note
- Monthly view with previous/next navigation
- Donut chart of spending by category, with percentages
- Add and remove your own categories (icon + color)
- Entries grouped by day, running daily totals, tap to delete

## Import Taiwan e-invoices (載具)

1. Sign in to the Ministry of Finance e-invoice platform (財政部電子發票整合服務平台,
   einvoice.nat.gov.tw) with your mobile barcode (手機條碼) account and open your
   carrier invoice list. Download the invoice details for the months you want
   as a CSV/text file. Menu names can change, so look for the carrier invoice
   list and its download or export button.
2. In the app, tap **Import invoices**, choose the file, check the preview,
   change any wrong categories, and tap **Import**.
3. Each invoice becomes one entry with its total. When the file lists an invoice
   on several lines, the lines are added up, and the item names (消費明細) go
   into the entry's note. Importing an invoice again replaces the earlier entry
   with the same invoice number, so you can fix mistakes by importing again.
   Cancelled (作廢) invoices are left out.

The reader in `lib/einvoice.ts` finds columns by header name (發票日期, 發票號碼,
商店店名, 總金額, 發票狀態 and a few alternatives), accepts pipe-delimited or
comma-separated files, and understands ROC dates such as 1141025. If your file
uses other header names, add them to the `HEADERS` list at the top of that
file. Store names are matched to categories with the keyword list in the same
file.

After updating from an earlier version, run `npx prisma db push` once so the
new `invoiceNo` column exists.

## Notes / possible next steps

- There's currently no login — anyone with the URL can see and edit the data,
  same as a shared spreadsheet. If you want it private, the simplest option is
  to turn on **Vercel Authentication** (Settings → Deployment Protection) or
  ask to have a login screen added.
- Amounts are stored in cents internally to avoid floating-point rounding.
- To change the currency symbol, edit `formatMoney` in `lib/utils.ts`.
