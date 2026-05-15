# CLAUDE.md

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # Lint check
```

## Architecture

This is a Next.js 16 web app (TypeScript, Tailwind CSS, Supabase).

### Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Auth + DB**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Deploy**: Vercel

### Directory Structure
```
src/
├── app/
│   ├── (auth)/login/         ← Login page
│   ├── (auth)/register/      ← Register page
│   ├── (main)/dashboard/     ← User dashboard (protected)
│   ├── (main)/become-donor/  ← Donor registration (protected)
│   ├── (main)/request/       ← Blood request form (protected)
│   ├── admin/                ← Admin panel (admin only)
│   ├── donor/[id]/           ← Donor profile (public)
│   ├── auth/callback/        ← Google OAuth callback
│   └── page.tsx              ← Home / Donor search (public)
├── components/
│   ├── Navbar.tsx
│   └── DonorSearch.tsx
├── lib/supabase/
│   ├── client.ts             ← Browser Supabase client
│   └── server.ts             ← Server Supabase client
├── types/index.ts            ← Shared types & enums
└── proxy.ts                  ← Auth route protection (Next.js 16 proxy)
```

### Auth
- Supabase Auth handles email/password + Google OAuth
- `src/proxy.ts` protects routes: `/dashboard`, `/become-donor`, `/request`, `/admin`
- Admin check: `profiles.is_admin = true` in DB

### Database Schema
See `supabase-schema.sql` — run this in Supabase SQL Editor to set up tables + RLS policies.

Tables: `profiles`, `donors`, `blood_requests`, `donation_records`

### Desktop App
The original JavaFX desktop app is preserved on the `desktop-app` branch.
