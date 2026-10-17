# Rentry Engineering backend

Next.js API service for the storefront. Supabase is the persistent database; no SQLite/local disk is used.

## Local
1. `npm ci`
2. Copy `.env.example` to `.env.local`; keep the Supabase service role key only in this backend environment.
3. `npm run dev` (port 3001).

## Render
Deploy from `render.yaml`. Enter its `sync: false` values as secrets in Render. Set `FRONTEND_URL` to the deployed frontend origin. Google and Daraja callback URIs use the frontend `/api/...` URLs; the frontend proxy forwards these requests here.

Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend config or Git. Health check: `/api/health`.
