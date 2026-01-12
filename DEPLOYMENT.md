# Deployment Guide - Tech Support AI

This guide will help you deploy your Tech Support AI application to make it publicly accessible via URLs.

## Overview

The application consists of:
- **Backend**: Node.js/Express API (deploy to Render)
- **Frontend**: Static HTML/CSS/JS (deploy to Vercel or Netlify)

---

## Step 1: Deploy Backend to Render

### Prerequisites
- GitHub account
- Render account (sign up at https://render.com)
- Your repository pushed to GitHub

### Steps:

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Render Dashboard**:
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"

3. **Connect GitHub Repository**:
   - Select "Connect GitHub"
   - Authorize Render to access your repository
   - Select your `Tech_Support_AI` repository

4. **Configure Backend Service**:
   - **Name**: `tech-support-ai-backend` (or any name you prefer)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Choose "Free" (or paid if you need more resources)

5. **Set Environment Variables**:
   Click "Advanced" → "Add Environment Variable":
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (or leave Render to auto-assign)
   - `OPENAI_API_KEY` = `your-openai-api-key-here` (required for AI features)

6. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete (5-10 minutes)
   - Once deployed, you'll get a URL like: `https://tech-support-ai-backend.onrender.com`

7. **Verify Backend**:
   - Visit: `https://your-backend-url.onrender.com/health`
   - You should see: `{"status":"ok"}`

### ⚠️ Important Notes:
- Render free tier services **spin down after 15 minutes of inactivity**
- First request after spin-down may take 30-60 seconds (cold start)
- For production, consider upgrading to a paid plan

---

## Step 2: Deploy Frontend to Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)

### Steps:

1. **Go to Vercel Dashboard**:
   - Visit https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import GitHub Repository**:
   - Select your `Tech_Support_AI` repository
   - Click "Import"

3. **Configure Frontend**:
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: `.` (current directory)

4. **Set Environment Variables** (Optional):
   - Click "Environment Variables"
   - Add: `API_URL` = `https://your-backend-url.onrender.com`
   - This allows dynamic backend URL configuration

5. **Deploy**:
   - Click "Deploy"
   - Wait for deployment (2-5 minutes)
   - Once deployed, you'll get a URL like: `https://tech-support-ai.vercel.app`

6. **Update Backend URL** (if needed):
   - If your backend URL is different from the default in `config.js`, update it:
     - Go to Vercel project → Settings → Environment Variables
     - Add `API_URL` = `https://your-actual-backend-url.onrender.com`
   - Or edit `frontend/config.js` and change the default URL

---

## Step 2 Alternative: Deploy Frontend to Netlify

### Prerequisites
- GitHub account
- Netlify account (sign up at https://netlify.com)

### Steps:

1. **Go to Netlify Dashboard**:
   - Visit https://app.netlify.com
   - Click "Add new site" → "Import an existing project"

2. **Connect GitHub Repository**:
   - Select "GitHub"
   - Authorize Netlify
   - Select your `Tech_Support_AI` repository

3. **Configure Build Settings**:
   - **Base directory**: `frontend`
   - **Build command**: Leave empty
   - **Publish directory**: `frontend` (or `.` if base directory is `frontend`)

4. **Set Environment Variables** (Optional):
   - Go to Site settings → Environment variables
   - Add: `API_URL` = `https://your-backend-url.onrender.com`

5. **Deploy**:
   - Click "Deploy site"
   - Wait for deployment (2-5 minutes)
   - Once deployed, you'll get a URL like: `https://tech-support-ai.netlify.app`

---

## Step 3: Update Frontend Configuration

After deploying both services, ensure your frontend points to the correct backend URL:

### Option 1: Update `config.js` (Recommended)
Edit `Tech_Support_AI/frontend/config.js`:
```javascript
const envApiUrl = window.API_URL || 'https://your-actual-backend-url.onrender.com';
```

### Option 2: Use Environment Variable
Set `API_URL` environment variable in Vercel/Netlify dashboard to your backend URL.

---

## Step 4: Test Your Deployment

1. **Test Backend**:
   - Visit: `https://your-backend-url.onrender.com/health`
   - Should return: `{"status":"ok"}`

2. **Test Frontend**:
   - Visit: `https://your-frontend-url.vercel.app` (or `.netlify.app`)
   - Try logging in or signing up
   - Verify API calls work (check browser console for errors)

3. **Test Full Flow**:
   - Sign up → Login → Create issue → Upload image → Get AI response

---

## Public URLs

After deployment, you'll have:

- **Backend URL**: `https://tech-support-ai-backend.onrender.com` (or your custom name)
- **Frontend URL**: `https://tech-support-ai.vercel.app` (or your custom name)

**Share the Frontend URL** with your GitHub collaborators - this is the URL they should use to access the application!

---

## Troubleshooting

### Backend Issues:

1. **Backend not responding**:
   - Check Render logs: Dashboard → Your Service → Logs
   - Verify environment variables are set correctly
   - Ensure `OPENAI_API_KEY` is set

2. **Database errors**:
   - Render free tier uses ephemeral storage (data may reset)
   - Consider using Render PostgreSQL for persistent storage

3. **CORS errors**:
   - Verify `cors()` middleware is enabled in `server.js`
   - Check that frontend URL is allowed (currently set to `*`)

### Frontend Issues:

1. **API calls failing**:
   - Check browser console for errors
   - Verify `config.js` has correct backend URL
   - Check Network tab to see actual API calls

2. **Environment variables not working**:
   - Vercel/Netlify may require redeployment after adding env vars
   - Verify variable name matches `window.API_URL` in `config.js`

3. **404 errors on routes**:
   - Vercel: Check `vercel.json` redirects configuration
   - Netlify: Check `netlify.toml` redirects configuration

---

## Custom Domain (Optional)

### Vercel:
1. Go to Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Netlify:
1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS records as instructed

---

## Cost Estimate

- **Render (Free Tier)**: $0/month (with limitations)
- **Vercel (Free Tier)**: $0/month (generous limits)
- **Netlify (Free Tier)**: $0/month (generous limits)

**Total**: $0/month for basic usage!

---

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel/Netlify
3. ✅ Test all functionality
4. ✅ Share frontend URL with collaborators
5. ✅ Monitor usage and upgrade plans if needed

---

## Support

If you encounter issues:
1. Check deployment logs in Render/Vercel/Netlify dashboards
2. Review browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure GitHub repository is properly synced

---

**🎉 Congratulations! Your application is now live and accessible to anyone with the URL!**
