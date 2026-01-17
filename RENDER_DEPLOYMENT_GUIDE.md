# 🚀 Render Deployment Guide for Expense Tracker

This guide will help you deploy your full-stack expense tracking application to Render.

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ GitHub account with your code pushed to a repository
2. ✅ Render account (sign up at https://render.com)
3. ✅ MongoDB Atlas account (free tier: https://www.mongodb.com/cloud/atlas)
4. ✅ Google OAuth credentials (if using Google Sign-In)

---

## 🗄️ Step 1: Set Up MongoDB Atlas

### 1.1 Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click **"Build a Database"**
4. Choose **FREE** tier (M0)
5. Select a cloud provider and region (choose closest to your users)
6. Name your cluster (e.g., `expense-tracker-cluster`)
7. Click **"Create"**

### 1.2 Create Database User

1. In **Security → Database Access**, click **"Add New Database User"**
2. Choose **"Password"** authentication
3. Username: `expense_user` (or any name you prefer)
4. Generate a strong password and **SAVE IT** securely
5. Set privileges to **"Read and write to any database"**
6. Click **"Add User"**

### 1.3 Configure Network Access

1. In **Security → Network Access**, click **"Add IP Address"**
2. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This is required for Render to connect
3. Click **"Confirm"**

### 1.4 Get Connection String

1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Select **Driver: Python**, **Version: 3.11 or later**
4. Copy the connection string - it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your actual credentials
6. Add your database name at the end:
   ```
   mongodb+srv://expense_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/expense_tracker_db?retryWrites=true&w=majority
   ```

**SAVE THIS CONNECTION STRING** - you'll need it in Step 3!

---

## 🔐 Step 2: Set Up Google OAuth (If Using Authentication)

### 2.1 Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services → Credentials**
4. Click **"Create Credentials" → "OAuth 2.0 Client ID"**
5. Configure consent screen if prompted:
   - User Type: **External**
   - App name: `Expense Tracker`
   - Add your email
   - Save and continue

### 2.2 Configure OAuth Client

1. Application type: **Web application**
2. Name: `Expense Tracker Production`
3. **Authorized JavaScript origins:**
   ```
   https://your-frontend-name.onrender.com
   ```
   (You'll update this after deploying)

4. **Authorized redirect URIs:**
   ```
   https://your-backend-name.onrender.com/api/auth/google/callback
   ```
   (You'll update this after deploying)

5. Click **"Create"**
6. **SAVE** your Client ID and Client Secret securely

---

## 🎯 Step 3: Deploy to Render

### 3.1 Push Code to GitHub

```bash
# If not already initialized
git init
git add .
git commit -m "Prepare for Render deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 3.2 Deploy Using Render Blueprint

#### Option A: Using render.yaml (Recommended)

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account if not already connected
4. Select your repository
5. Render will detect `render.yaml` and show all services
6. Click **"Apply"**

#### Option B: Manual Service Creation

If Blueprint doesn't work, create services manually:

##### 3.2.1 Deploy Backend

1. Click **"New +"** → **"Web Service"**
2. Connect your repository
3. Configure:
   - **Name:** `expense-tracker-backend`
   - **Region:** Oregon (or nearest)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free

4. Click **"Advanced"** and add environment variables:
   - `MONGO_URL`: (Your MongoDB Atlas connection string from Step 1.4)
   - `DB_NAME`: `expense_tracker_db`
   - `CORS_ORIGINS`: `*`
   - `GOOGLE_CLIENT_ID`: (From Step 2.2)
   - `GOOGLE_CLIENT_SECRET`: (From Step 2.2)
   - `FRONTEND_URL`: (Leave blank for now, update after frontend deployment)

5. Click **"Create Web Service"**

**SAVE YOUR BACKEND URL:** `https://expense-tracker-backend.onrender.com`

##### 3.2.2 Deploy Frontend

1. Click **"New +"** → **"Static Site"**
2. Connect your repository
3. Configure:
   - **Name:** `expense-tracker-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `yarn install && yarn build`
   - **Publish Directory:** `build`

4. Add environment variable:
   - `REACT_APP_BACKEND_URL`: `https://expense-tracker-backend.onrender.com`
     (Use the backend URL from step 3.2.1)

5. Click **"Create Static Site"**

**SAVE YOUR FRONTEND URL:** `https://expense-tracker-frontend.onrender.com`

---

## 🔄 Step 4: Update Configuration

### 4.1 Update Backend Environment Variables

1. Go to your backend service in Render
2. Click **"Environment"**
3. Update `FRONTEND_URL` with your actual frontend URL:
   ```
   https://expense-tracker-frontend.onrender.com
   ```
4. Click **"Save Changes"**

Your backend will automatically redeploy.

### 4.2 Update Google OAuth Credentials

1. Go back to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Update **Authorized JavaScript origins:**
   ```
   https://expense-tracker-frontend.onrender.com
   ```
4. Update **Authorized redirect URIs:**
   ```
   https://expense-tracker-backend.onrender.com/api/auth/google/callback
   ```
5. Save changes

---

## ✅ Step 5: Verify Deployment

### 5.1 Check Backend Health

Visit: `https://your-backend-name.onrender.com/api/health`

You should see a health check response.

### 5.2 Check Frontend

Visit: `https://your-frontend-name.onrender.com`

Your application should load successfully!

### 5.3 Test Key Features

- ✅ Google Sign-In works
- ✅ Can add expenses
- ✅ Can create categories
- ✅ Dashboard displays data
- ✅ Budget tracking works

---

## 🐛 Troubleshooting

### Backend Issues

#### Error: "Application failed to start"

1. Check logs in Render dashboard
2. Common issues:
   - Missing environment variables
   - Invalid MongoDB connection string
   - Missing dependencies in requirements.txt

**Fix:** Review environment variables and logs

#### Error: "Cannot connect to MongoDB"

1. Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
2. Check connection string format
3. Verify database user credentials

#### CORS Errors

1. Check `CORS_ORIGINS` environment variable
2. Ensure frontend URL is correctly set

### Frontend Issues

#### Blank Page or Build Fails

1. Check build logs in Render
2. Verify `REACT_APP_BACKEND_URL` is set correctly
3. Ensure all dependencies are in package.json

#### API Calls Failing

1. Check browser console for errors
2. Verify backend URL is correct (with /api prefix)
3. Check backend service is running

### Google OAuth Issues

#### "redirect_uri_mismatch" Error

1. Ensure redirect URIs in Google Console exactly match your backend URL
2. Include `/api/auth/google/callback` path
3. No trailing slashes

---

## 🔒 Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` files
   - Use Render's environment variable management
   - Rotate secrets periodically

2. **MongoDB:**
   - Use strong passwords
   - Restrict IP access when possible
   - Enable authentication

3. **CORS:**
   - In production, set `CORS_ORIGINS` to your frontend URL only:
     ```
     CORS_ORIGINS=https://expense-tracker-frontend.onrender.com
     ```

4. **HTTPS:**
   - Render provides free SSL certificates
   - Always use HTTPS URLs

---

## 📊 Monitoring

### Render Dashboard

- Monitor service status
- View logs in real-time
- Check deployment history
- Monitor resource usage

### MongoDB Atlas

- Monitor database performance
- Track connection count
- View query performance
- Set up alerts

---

## 🚀 Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] MongoDB connection string obtained
- [ ] Google OAuth credentials configured
- [ ] Code pushed to GitHub
- [ ] Backend service deployed on Render
- [ ] Frontend static site deployed on Render
- [ ] Environment variables configured
- [ ] Google OAuth URIs updated
- [ ] Backend health check passing
- [ ] Frontend loads successfully
- [ ] Authentication works
- [ ] Database operations work
- [ ] All features tested

---

## 💡 Tips

1. **Free Tier Limitations:**
   - Render free tier services spin down after 15 minutes of inactivity
   - First request after spin-down may take 30-60 seconds
   - Consider upgrading to paid tier for production

2. **Custom Domain:**
   - You can add custom domains in Render dashboard
   - Update OAuth credentials with new domain

3. **Continuous Deployment:**
   - Render auto-deploys on git push to main branch
   - Use branches for staging environments

4. **Environment-Specific Config:**
   - Use different MongoDB databases for staging/production
   - Create separate OAuth credentials for each environment

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

---

## 🆘 Need Help?

If you encounter issues:

1. Check service logs in Render dashboard
2. Review MongoDB Atlas metrics
3. Test API endpoints manually
4. Check browser console for frontend errors
5. Review this guide's troubleshooting section

---

## 🎉 Success!

Once everything is deployed and working:

✅ Your backend is running on Render
✅ Your frontend is served as a static site
✅ MongoDB Atlas is hosting your database
✅ Google OAuth is configured
✅ Your app is live and accessible worldwide!

**Your live app URL:** `https://expense-tracker-frontend.onrender.com`

Enjoy your deployed application! 🚀
