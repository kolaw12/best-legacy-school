# Vercel Deployment Troubleshooting

## Issue: 404 Error on Production URL

The preview URL works but `best-legacy-school.vercel.app` shows 404 errors.

## Solution:

### Option 1: Update Vercel Settings (Recommended)
1. Go to https://vercel.com/dashboard
2. Click on your `best-legacy-school` project
3. Go to **Settings** → **General**
4. Find **Root Directory**
5. Set it to: `frontend`
6. Click **Save**
7. Go to **Deployments** tab
8. Find the latest successful deployment
9. Click three dots (•••) → **"Promote to Production"**

### Option 2: Trigger Auto-Deploy
Make a small code change and push to GitHub. Vercel will automatically redeploy.

## Verification
After deployment completes, test:
- https://best-legacy-school.vercel.app/
- https://best-legacy-school.vercel.app/admin-login
- https://best-legacy-school.vercel.app/academics

All should work without 404 errors.
