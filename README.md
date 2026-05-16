# WeldDesign Production

Web app terpadu untuk operasional produksi las: dashboard personal, estimasi biaya, inventaris, monitoring proyek, portofolio siswa, automation spreadsheet, sosial media, e-learning, client portal, dan PWA.

Target domain: `krisavaaerovin.my.id`  
Target hosting: Vercel

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma schema untuk PostgreSQL
- JWT/bcrypt demo endpoint
- API route mock untuk estimasi biaya, audit log, export CSV, sosial media, dan sinkronisasi Google Spreadsheet

## Jalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

Di PowerShell Windows, gunakan `npm.cmd` bila `npm.ps1` diblokir:

```bash
npm.cmd run dev
```

## Database

Schema ada di `prisma/schema.prisma`. Untuk Vercel, gunakan PostgreSQL managed seperti Vercel Postgres, Neon, Supabase, atau provider lain.

```bash
cp .env.example .env
npm run db:validate
npm run db:generate
npm run db:push
```

Isi `DATABASE_URL` dan secret lain lewat environment variables lokal atau Vercel Project Settings.

## Endpoint Awal

- `GET /api/health`
- `POST /api/estimates`
- `GET /api/export/estimates`
- `POST /api/auth/demo`
- `GET /api/audit`
- `GET /api/social/schedule`
- `POST /api/social/schedule`

## Deploy Vercel

1. Push project ke GitHub/GitLab/Bitbucket.
2. Import repository di Vercel.
3. Tambahkan environment variables dari `.env.example`.
4. Tambahkan custom domain `krisavaaerovin.my.id` di Vercel Project Settings.
5. Ikuti DNS record yang diberikan Vercel untuk domain tersebut.

## Status Implementasi

Versi ini adalah production foundation yang runnable: UI terpadu, data domain, API scaffold, security headers, RBAC map, dan schema DB lengkap. Integrasi nyata yang masih perlu disambungkan berikutnya: provider OTP/WhatsApp, Google OAuth, storage media, model AI vision/generator, PDF exporter, dan push notification.
