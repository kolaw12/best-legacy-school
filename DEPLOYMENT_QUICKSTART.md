# QUICK START GUIDE - Deploy Your Website

## Prerequisites
- GitHub account (free)
- Vercel account (free)
- Render account (free)

## Step 1: Push Your Code to GitHub

1. Go to https://github.com and create a new repository
2. Name it: `best-legacy-school`
3. Open terminal in your project folder:

```bash
cd "C:\Users\USER\Desktop\Best legacy school"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/best-legacy-school.git
git push -u origin main
```

## Step 2: Deploy Backend to Render

1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Settings:
   - **Name**: `best-legacy-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate`
   - **Start Command**: `gunicorn school_project.wsgi:application`
   
5. Add Environment Variables (click "Advanced"):
   ```
   DJANGO_SECRET_KEY = (generate at https://djecrety.ir/)
   DEBUG = False
   ALLOWED_HOSTS = your-app.onrender.com
   EMAIL_HOST_USER = towshk3@gmail.com
   EMAIL_HOST_PASSWORD = ansg frqd kfkz zqzn
   ```

6. Click "Create Web Service"
7. Wait 5-10 minutes for deployment
8. **Copy your backend URL**: `https://best-legacy-backend.onrender.com`

## Step 3: Update Frontend API URLs

Before deploying frontend, update the API URLs:

1. Create `frontend/.env.production`:
```
VITE_API_URL=https://best-legacy-backend.onrender.com
```

2. Update all `http://127.0.0.1:8000` to use `import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'`

## Step 4: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign up with GitHub
2. Click "Add New..." → "Project"
3. Import your repository
4. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   
5. Add Environment Variable:
   ```
   VITE_API_URL = https://best-legacy-backend.onrender.com
   ```

6. Click "Deploy"
7. Wait 2-3 minutes
8. **Your website is live!** Copy the URL: `https://best-legacy-school.vercel.app`

## Step 5: Update Backend CORS Settings

Go back to Render dashboard:
1. Open your backend service
2. Add environment variable:
   ```
   FRONTEND_URL = https://best-legacy-school.vercel.app
   ```
3. Service will auto-redeploy

## Step 6: Test Your Website

Visit your Vercel URL and test:
- [ ] Home page loads
- [ ] Contact form works
- [ ] Admission form submits
- [ ] Admin login at `/admin-login`
- [ ] Email notifications arrive

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify all environment variables are set
- Ensure `requirements.txt` is correct

### Frontend can't reach backend
- Check CORS settings in Django
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors

### Emails not sending
- Verify Gmail App Password is correct
- Check Gmail security settings
- Test with console backend first

## Cost
- **Render Free Tier**: Backend sleeps after 15 min inactivity (wakes on request)
- **Vercel Free Tier**: Unlimited bandwidth, 100GB/month
- **Total**: $0/month (perfect for school project!)

## Next Steps
1. Buy a custom domain (~$10/year)
2. Connect domain in Vercel settings
3. Update ALLOWED_HOSTS to include your domain
4. Enable HTTPS (automatic on Vercel/Render)

## Need Help?
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Django Deploy: https://docs.djangoproject.com/en/stable/howto/deployment/

Good luck! 🚀
