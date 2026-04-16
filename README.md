# Cellgenic Operations & Intelligence Platform

A centralized operations platform replacing WhatsApp-based workflows with structured, auditable, and automated systems. Built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## Features

- **Dashboard** - Real-time KPIs, revenue charts, alerts, top products
- **Inventory Management** - Multi-location stock tracking, thresholds, reorder points
- **Location Transfers** - Request & approve inventory transfers between 6+ locations with status workflow, incoming/outgoing alerts, tracking numbers, and auto-adjusting stock levels
- **Locations** - Catalog of warehouses, distribution centers, retail stores, and depots with manager contacts
- **Product Database** - Product catalog with COAs, lab tests, brochures, and documents
- **Sales & Insights** - Revenue trends, top products, channel & category breakdowns
- **Task Management** - Kanban board with priorities, assignees, due dates
- **Order Management** - Sales/purchase orders with threaded communication log
- **Alerts Center** - Automated low-stock, incoming shipment, and overdue-task alerts
- **Settings** - Katana MRP and QuickBooks integration configuration
- **Real Katana Integration** - Sync products, variants, inventory, locations, and sales orders

## Deploy to Vercel

### 1. Provision PostgreSQL

Any of:
- **Vercel Postgres** (recommended): Project → Storage → Create Database
- **Neon**: https://neon.tech/ (free tier)
- **Supabase**: https://supabase.com/ (free tier)

### 2. Set Environment Variables

In the Vercel project settings (Settings → Environment Variables), add:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL pooled connection string |
| `DIRECT_URL` | PostgreSQL direct (non-pooled) connection string. For Vercel Postgres, use `POSTGRES_URL_NON_POOLING` |
| `KATANA_API_KEY` | Your Katana API key (Bearer token) |
| `KATANA_BASE_URL` | *(optional)* Default: `https://api.katanamrp.com/v1` |

### 3. Deploy

```bash
vercel --prod
```

Or push to a branch connected to Vercel. The build will automatically run `prisma generate && next build`.

### 4. Initialize the Database (first deploy only)

After the first deploy, open the Vercel dashboard → Storage → your database → SQL Editor, and run migrations/seed from your local machine:

```bash
# With production DATABASE_URL in .env.local
npx prisma db push
npm run db:seed
```

## Katana Integration

The platform integrates with the Katana MRP API. Once `KATANA_API_KEY` is set:

1. Go to **Settings** in the app
2. Click **Test Connection** to verify credentials
3. Click **Full Sync** to import all data, or sync individual scopes (Locations, Products, Inventory, Sales Orders)

Sync operations map:
- Katana **products** + **variants** → `Product` table (keyed by `katanaId`/`sku`)
- Katana **inventory** → `Inventory` table (per variant × location)
- Katana **locations** → `Location` table
- Katana **sales_orders** → `Order` table (with `katanaOrderId`) + `SaleRecord` rows for delivered/invoiced orders

You can trigger sync programmatically via:

```
POST /api/katana/sync?scope=all
POST /api/katana/sync?scope=products
POST /api/katana/sync?scope=inventory
POST /api/katana/sync?scope=locations
POST /api/katana/sync?scope=sales_orders
```

Set up a Vercel Cron job to automate syncs on a schedule.

## Local Development

```bash
# 1. Install deps
npm install

# 2. Copy .env.example → .env and fill in your values
cp .env.example .env

# 3. Push schema to your Postgres and seed demo data
npm run setup

# 4. Start dev server
npm run dev
```

Open http://localhost:3000

## Tech Stack

- **Framework**: Next.js 14 (App Router) + React 18
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **UI**: Tailwind CSS + Lucide icons + Recharts
- **Auth**: Ready to integrate NextAuth
- **Deployment**: Vercel-native (edge-ready APIs, Postgres connection pooling)

## Architecture

```
src/
├── app/
│   ├── api/              # REST API routes
│   │   ├── katana/       # Katana integration endpoints
│   │   ├── transfers/    # Location transfer workflow
│   │   ├── locations/    # Location catalog
│   │   └── ...
│   ├── dashboard, inventory, products, transfers, locations,
│   │   sales, tasks, orders, alerts, settings/
│   └── layout.tsx
├── components/
│   ├── layout/           # Sidebar, Header
│   └── ui/               # Metric cards, spinner, empty state
├── lib/
│   ├── db.ts             # Prisma client singleton
│   ├── katana.ts         # Katana API client + sync logic
│   └── utils.ts
└── types/
```

## Security Notes

- **Never commit API keys**. Use environment variables.
- Integration keys stored in the DB are plain-text for simplicity. For production, encrypt them at rest using a KMS or Vercel's secret manager.
- Add NextAuth before exposing this to real users - current demo has no authentication layer.
