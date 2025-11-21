# 🚀 Supabase Deployment - Quick Start

## For Vercel Deployment

### 1. Update Vercel Environment Variables

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Add these for **Production**, **Preview**, and **Development**:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://aimrdgwyaqezypestica.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbXJkZ3d5YXFlenlwZXN0aWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODAzMTksImV4cCI6MjA3OTI1NjMxOX0.Y6nWdplH_VXVYqEFJ7seK124nxzngTRiTpfXwjnOVvM
SUPABASE_SERVICE_ROLE_KEY=[GET-FROM-SUPABASE-DASHBOARD]
```

**To get your password and service key:**

- Supabase Dashboard: https://supabase.com/dashboard/project/aimrdgwyaqezypestica
- Settings → Database (for password reset if needed)
- Settings → API (for service_role key)

### 2. Commit and Push

```bash
git add package.json prisma/schema.prisma .env.example
git add SUPABASE_MIGRATION.md SUPABASE_DEPLOYMENT.md DEPLOYMENT_QUICKSTART.md
git commit -m "feat: Migrate database to Supabase

- Update Prisma schema with Supabase connections
- Add postinstall script for Prisma client generation
- Update environment variable documentation

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main
```

### 3. Vercel Auto-Deploys

- Vercel will automatically build and deploy
- Monitor: https://vercel.com/dashboard
- Check build logs for any errors

### 4. Verify Production

Visit your production URL and test:

- [ ] Homepage loads
- [ ] User login works
- [ ] Venue submission works
- [ ] Database reads/writes work

## That's It! 🎉

Your app is now running on Supabase in production.

---

## Important Notes

✅ **Keep these variables secret:**

- `SUPABASE_SERVICE_ROLE_KEY`
- Database password
- `JWT_SECRET`

✅ **Safe to expose (NEXT*PUBLIC*\*):**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- All other `NEXT_PUBLIC_*` variables

⚠️ **Data Status:**

- Schema ✅ Deployed
- Users ✅ 7 users migrated
- Venues ⚠️ Fresh database (old venues in Neon export if needed)

---

## Troubleshooting

**Build fails?**

- Check environment variables are set in Vercel
- Verify `postinstall` script exists in package.json

**Database connection errors?**

- Verify `DATABASE_URL` is correct
- Check Supabase project isn't paused (free tier)

**Need help?**

- Read: `SUPABASE_DEPLOYMENT.md` (full guide)
- Read: `SUPABASE_MIGRATION.md` (migration details)
