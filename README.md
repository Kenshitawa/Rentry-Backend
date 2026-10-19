# Rentry Engineering backend

Next.js API service for the storefront. Supabase is the persistent database; no SQLite/local disk is used.

## Local
1. `npm ci`
2. Copy `.env.example` to `.env.local`; keep the Supabase service role key only in this backend environment.
3. `npm run dev` (port 3001).

## Offline local admin

Set `DATABASE_MODE=local` and `ADMIN_API_KEY` in `.env.local`, then run `npm run dev`. The local store is saved to `data/rentry-local.json` (ignored by Git); its first run includes the three house concepts and images. Local data does not sync to Supabase.

## Render
Deploy from `render.yaml`. Enter its `sync: false` values as secrets in Render. The configured frontend URL is the existing Vercel project `https://rentryengineering-ltd.vercel.app`; update `FRONTEND_URL` and `MPESA_CALLBACK_URL` if you use a different Vercel domain. Google and Daraja callback URIs use the frontend `/api/...` URLs; the frontend proxy forwards these requests here.

Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend config or Git. Health check: `/api/health`.
