# Ledger — Daily Budget Tracker

A simple expense & income tracker: record daily transactions, organize them by
category, and see a monthly breakdown with a donut chart. Data is stored in a
real Postgres database, so it syncs across every device you sign in from
(there's no login yet — see "Notes" below).

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Deployed on Vercel

## 1. Get a free Postgres database

Pick one — both work identically with this app:

**Option A: Vercel Postgres (easiest, stays in one dashboard)**
1. Go to your project on [vercel.com](https://vercel.com) → **Storage** tab → **Create Database** → **Postgres**.
2. Once created, open the **.env.local** tab it shows you and copy the `DATABASE_URL` value.

**Option B: Neon (also free, works outside Vercel too)**
1. Create an account at [neon.tech](https://neon.tech) → **New Project**.
2. Copy the connection string it gives you (starts with `postgresql://`).

## 2. Run it locally

```bash
npm install
cp .env.example .env      # then paste your DATABASE_URL into .env
npx prisma db push        # creates the tables in your database
npm run db:seed           # adds starter categories (Food, Transport, Salary, etc.)
npm run dev
```

Visit http://localhost:3000.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import that repo.
3. In the project's **Settings → Environment Variables**, add `DATABASE_URL` with
   your connection string (skip this if you used Vercel Postgres in step 1 —
   it's already linked).
4. Deploy. On the first deploy, run the schema push once against your
   production database from your own machine:
   ```bash
   DATABASE_URL="your-production-connection-string" npx prisma db push
   DATABASE_URL="your-production-connection-string" npm run db:seed
   ```
5. Open your `.vercel.app` URL — your ledger is live.

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
3. Invoices are matched by invoice number, so importing the same file twice
   adds nothing new. Cancelled (作廢) invoices are left out.

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
