# 🚀 Render Deployment Checklist

Use this checklist to track your deployment progress.

## Phase 1: Pre-Deployment Setup

### MongoDB Atlas Setup
- [ ] Created MongoDB Atlas account
- [ ] Created free tier cluster (M0)
- [ ] Created database user with credentials saved
- [ ] Whitelisted IP address (0.0.0.0/0)
- [ ] Copied connection string
- [ ] Tested connection (optional but recommended)

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/expense_tracker_db?retryWrites=true&w=majority
```

---

### Google OAuth Setup (If using authentication)
- [ ] Created/selected Google Cloud project
- [ ] Enabled Google+ API
- [ ] Created OAuth 2.0 credentials
- [ ] Saved Client ID
- [ ] Saved Client Secret
- [ ] (Will update redirect URIs after deployment)

---

### GitHub Setup
- [ ] Code committed to repository
- [ ] Pushed to GitHub
- [ ] Repository is accessible
- [ ] Branch name noted (usually `main`)

---

## Phase 2: Render Deployment

### Account Setup
- [ ] Created Render account at https://render.com
- [ ] Connected GitHub account to Render
- [ ] Verified repository access

---

### Backend Service Deployment
- [ ] Created Web Service or used Blueprint
- [ ] Selected correct repository
- [ ] Set root directory to `backend`
- [ ] Verified build command: `pip install --upgrade pip && pip install -r requirements.txt`
- [ ] Verified start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- [ ] Added all environment variables:
  - [ ] `MONGO_URL`
  - [ ] `DB_NAME`
  - [ ] `CORS_ORIGINS`
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
- [ ] Deployment started successfully
- [ ] Service shows "Live" status
- [ ] Noted backend URL: `https://_________________.onrender.com`

---

### Frontend Service Deployment
- [ ] Created Static Site or used Blueprint
- [ ] Selected correct repository
- [ ] Set root directory to `frontend`
- [ ] Verified build command: `yarn install && yarn build`
- [ ] Verified publish directory: `build`
- [ ] Added environment variable:
  - [ ] `REACT_APP_BACKEND_URL` (using backend URL from above)
- [ ] Deployment started successfully
- [ ] Service shows "Live" status
- [ ] Noted frontend URL: `https://_________________.onrender.com`

---

## Phase 3: Post-Deployment Configuration

### Update Backend Environment
- [ ] Updated `FRONTEND_URL` in backend environment variables
- [ ] Backend service redeployed automatically
- [ ] Verified backend still shows "Live"

---

### Update Google OAuth
- [ ] Opened Google Cloud Console → Credentials
- [ ] Selected OAuth 2.0 Client ID
- [ ] Added Authorized JavaScript origins:
  ```
  https://your-frontend.onrender.com
  ```
- [ ] Added Authorized redirect URIs:
  ```
  https://your-backend.onrender.com/api/auth/google/callback
  ```
- [ ] Saved changes

---

### Update CORS (Production Hardening)
- [ ] Changed backend `CORS_ORIGINS` from `*` to frontend URL:
  ```
  https://your-frontend.onrender.com
  ```
- [ ] Backend redeployed
- [ ] Verified CORS still works

---

## Phase 4: Testing & Verification

### Backend Health Check
- [ ] Visited: `https://your-backend.onrender.com/api/health`
- [ ] Received healthy status response
- [ ] Confirmed database connection

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "expense-tracker-backend",
  "database": "connected",
  "timestamp": "2025-01-XX..."
}
```

---

### Frontend Testing
- [ ] Frontend URL loads successfully
- [ ] No console errors in browser
- [ ] UI displays correctly
- [ ] Responsive design works

---

### Feature Testing
- [ ] Google Sign-In button visible
- [ ] Can sign in with Google account
- [ ] Redirected to dashboard after login
- [ ] Can create new expense
- [ ] Can view expenses list
- [ ] Can edit expense
- [ ] Can delete expense
- [ ] Can create custom category
- [ ] Can set budget
- [ ] Dashboard shows charts/statistics
- [ ] Can export data to CSV
- [ ] Can log out successfully

---

### Performance Testing
- [ ] Initial page load time acceptable
- [ ] API responses are fast
- [ ] No timeout errors
- [ ] Database queries performant

---

## Phase 5: Documentation & Maintenance

### Documentation
- [ ] Updated README with live URLs
- [ ] Documented any custom configuration
- [ ] Saved all credentials securely
- [ ] Noted deployment date

---

### Monitoring Setup
- [ ] Bookmarked Render dashboard
- [ ] Set up MongoDB Atlas alerts (optional)
- [ ] Noted free tier limitations
- [ ] Planned for monitoring strategy

---

### Backup & Recovery
- [ ] Understood MongoDB backup strategy
- [ ] Noted how to rollback deployment
- [ ] Saved render.yaml for reference
- [ ] Repository has all deployment files

---

## 🎉 Deployment Complete!

**Live URLs:**
- Frontend: `https://_________________.onrender.com`
- Backend: `https://_________________.onrender.com`
- Health Check: `https://_________________.onrender.com/api/health`

**Important Notes:**
- Free tier services sleep after 15 min inactivity
- First request after sleep takes ~30 seconds
- Auto-deploys on git push to main branch
- MongoDB Atlas separate from Render (has its own free tier)

---

## 🔧 Next Steps (Optional)

- [ ] Set up custom domain
- [ ] Configure SSL certificate (auto with custom domain)
- [ ] Set up staging environment
- [ ] Add monitoring/analytics
- [ ] Plan for scaling (upgrade to paid tier)
- [ ] Set up automated backups
- [ ] Configure CI/CD pipeline
- [ ] Add error tracking (e.g., Sentry)

---

## 📞 Support Resources

- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Google OAuth Docs: https://developers.google.com/identity
- Project Issues: [Your GitHub Issues URL]

---

**Date Completed:** ________________

**Deployed By:** ________________

**Notes:**
_______________________________________
_______________________________________
_______________________________________
