# Deployment Guide

This guide covers deploying the WorldID Identity Registry to production.

## Prerequisites

- [Supabase](https://supabase.com) account (free tier works)
- [Vercel](https://vercel.com) account (free tier works)
- [WorldID Developer Portal](https://developer.worldcoin.org) account
- Git repository for your code

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization and set project name
4. Set database password (save it securely)
5. Select region closest to your users
6. Click "Create new project"

### 1.2 Run Database Migrations

1. Open SQL Editor in Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste into SQL Editor
4. Click "Run" to execute the migration
5. Verify tables were created in "Table Editor"

Expected tables:
- `registrations`
- `registration_sessions`
- `verification_logs`

### 1.3 Get API Credentials

1. Go to Settings → API in Supabase dashboard
2. Copy the following values:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon/public key**: `eyJhbGci...` (public, safe to expose)
   - **service_role key**: `eyJhbGci...` (SECRET, never expose to client)

## Step 2: Register WorldID App

### 2.1 Create WorldID App

1. Go to https://developer.worldcoin.org
2. Sign in or create account
3. Click "Create New App"
4. Fill in app details:
   - **App Name**: "OpenClaw Identity Registry" (or your choice)
   - **Description**: "Proof-of-personhood for OpenClaw molt bots"
   - **Environment**: Start with Staging for testing

### 2.2 Configure Action

1. In your WorldID app dashboard, go to "Actions"
2. Create new action:
   - **Action ID**: `verify-molt`
   - **Description**: "Verify molt bot operator"
   - **Max verifications**: 1 (one registration per person)

### 2.3 Get App Credentials

Copy these values:
- **App ID**: `app_0f66d698a398d7f5d7c3594df5bc53b4` (example)
- **Action**: `verify-molt`

## Step 3: Deploy to Vercel

### 3.1 Push Code to Git

```bash
cd /Users/andy.wang/.openclaw/workspace/onemolt-registry

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: WorldID Identity Registry"

# Push to GitHub/GitLab
git remote add origin https://github.com/yourusername/identity-registry.git
git push -u origin main
```

### 3.2 Import to Vercel

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### 3.3 Configure Environment Variables

In Vercel project settings → Environment Variables, add:

**Supabase Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**WorldID Variables:**
```
NEXT_PUBLIC_WORLDID_APP_ID=app_0f66d698a398d7f5d7c3594df5bc53b4
NEXT_PUBLIC_WORLDID_ACTION=verify-molt
WORLDID_API_URL=https://developer.worldcoin.org/api/v2/verify
```

**App URL:**
```
NEXT_PUBLIC_BASE_URL=https://identity-registry.vercel.app
```

**Important:**
- Mark `SUPABASE_SERVICE_ROLE_KEY` as "Secret" (encrypted)
- Apply to Production, Preview, and Development environments
- Update `NEXT_PUBLIC_BASE_URL` with your actual Vercel URL after first deployment

### 3.4 Deploy

1. Click "Deploy"
2. Wait for build to complete (~2 minutes)
3. Get your deployment URL: `https://identity-registry.vercel.app`

### 3.5 Update Base URL

After first deployment:
1. Go to Vercel project settings → Environment Variables
2. Update `NEXT_PUBLIC_BASE_URL` to your actual URL
3. Redeploy from Vercel dashboard

## Step 4: Test the Deployment

### 4.1 Health Check

```bash
curl https://identity-registry.vercel.app/api/v1/status
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-31T...",
  "version": "1.0.0",
  "database": "connected"
}
```

### 4.2 Test Registration Flow

From your CLI:

```bash
# Configure production server
export IDENTITY_SERVER="https://identity-registry.vercel.app"

# Test registration
cd /Users/andy.wang/.openclaw/workspace/skills/onemolt
./scripts/identity-proof.sh register-worldid
```

This should:
1. Generate and sign a challenge
2. Create a registration session
3. Return a registration URL
4. Open the URL in your browser (if you choose)
5. Show WorldID QR code
6. Complete after scanning with World App

### 4.3 Verify Registration

```bash
./scripts/identity-proof.sh status
```

Expected output:
```
✓ Registered and verified with WorldID
Verification Level: orb
Registered At: 2026-01-31T...
```

## Step 5: Production Checklist

- [ ] Supabase project created and migrated
- [ ] RLS policies enabled (automatic from migration)
- [ ] WorldID app registered and configured
- [ ] Vercel deployment successful
- [ ] Environment variables configured correctly
- [ ] Health check endpoint returns 200 OK
- [ ] Test registration completes successfully
- [ ] CLI configured with production server URL
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up (Vercel Analytics)

## Optional: Custom Domain

### Configure Custom Domain in Vercel

1. Go to Vercel project → Settings → Domains
2. Add your custom domain (e.g., `identity.yourdomain.com`)
3. Add DNS records as instructed by Vercel
4. Update environment variables:
   ```
   NEXT_PUBLIC_BASE_URL=https://identity.yourdomain.com
   ```
5. Redeploy

### Update CLI Configuration

```bash
export IDENTITY_SERVER="https://identity.yourdomain.com"

# Add to shell profile
echo 'export IDENTITY_SERVER="https://identity.yourdomain.com"' >> ~/.bashrc
source ~/.bashrc
```

## Monitoring and Maintenance

### Vercel Analytics

Enable in Vercel dashboard:
1. Go to Analytics tab
2. Enable Web Analytics
3. Monitor traffic, errors, and performance

### Supabase Monitoring

Check in Supabase dashboard:
1. **Database** → Monitor table sizes and query performance
2. **API** → Track API request volume
3. **Logs** → Review error logs

### Database Maintenance

Clean up expired sessions periodically:

```sql
-- Run in Supabase SQL Editor
SELECT cleanup_expired_sessions();

-- Check session cleanup worked
SELECT COUNT(*) FROM registration_sessions WHERE status = 'expired';
```

Consider setting up a Supabase Edge Function to run this weekly.

## Troubleshooting

### Build Failures

**Error: Missing environment variable**
- Ensure all required env vars are set in Vercel
- Check variable names match exactly (case-sensitive)
- Verify no typos in `.env.local.example`

**Error: Type errors**
- Run `npm run build` locally to catch TypeScript issues
- Fix type errors before deploying

### Runtime Errors

**Database connection failed**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check Supabase project is not paused (free tier)
- Verify RLS policies are enabled

**WorldID verification failed**
- Check `NEXT_PUBLIC_WORLDID_APP_ID` matches your app
- Verify action name is correct: `verify-molt`
- Ensure WorldID app is in Production mode (not Staging)

**Registration URL not working**
- Verify `NEXT_PUBLIC_BASE_URL` matches your deployment URL
- Check URL includes protocol (`https://`)
- Test with health check endpoint first

### CLI Issues

**Connection refused**
- Check `IDENTITY_SERVER` is set correctly
- Verify server is accessible: `curl $IDENTITY_SERVER/api/v1/status`
- Ensure no firewall blocking requests

**Registration timeout**
- Default timeout is 15 minutes
- Check browser didn't auto-close registration page
- Verify World App connection is working

## Security Best Practices

1. **Never commit `.env.local` to git** (already in `.gitignore`)
2. **Rotate service role key** if accidentally exposed
3. **Monitor Supabase logs** for suspicious activity
4. **Enable Vercel deployment protection** for production
5. **Use HTTPS only** (automatic with Vercel)
6. **Review RLS policies** periodically
7. **Set up alerts** for failed verifications

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **WorldID Docs**: https://docs.worldcoin.org
- **Next.js Docs**: https://nextjs.org/docs

## Costs

### Free Tier Limits

**Supabase (Free)**:
- 500 MB database
- 1 GB file storage
- 50,000 monthly active users
- Pauses after 1 week inactivity (auto-resumes)

**Vercel (Hobby)**:
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic SSL
- 100 hours serverless function execution

**WorldID**:
- Free for verified apps
- Apply for verification in Developer Portal

### Scaling

When free tier limits are reached:
- **Supabase**: $25/month Pro plan
- **Vercel**: $20/month Pro plan
- Consider migrating to dedicated infrastructure at scale

## Next Steps

After deployment:
1. Share your registry URL with the community
2. Monitor initial registrations
3. Gather feedback on UX
4. Consider adding rate limiting
5. Set up automated backups for Supabase
6. Document API for third-party integrations
