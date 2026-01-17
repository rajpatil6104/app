# 🚀 Render Deployment - Quick Start

## ⚡ TL;DR - Deploy in 15 Minutes

### Prerequisites (5 minutes)
1. ✅ Push code to GitHub
2. ✅ Get MongoDB Atlas connection string: https://www.mongodb.com/cloud/atlas
3. ✅ Get Google OAuth credentials: https://console.cloud.google.com

### Deploy (10 minutes)
1. Go to https://dashboard.render.com
2. Click **"New +" → "Blueprint"**
3. Select your GitHub repository
4. Add these environment variables when prompted:

**Backend:**
```
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/expense_tracker_db
DB_NAME=expense_tracker_db
CORS_ORIGINS=*
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

**Frontend:**
```
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
```

5. Click **"Apply"**
6. Wait for deployment (5-10 minutes)
7. Update Google OAuth redirect URIs with your Render URLs

---

## 📝 Environment Variables Checklist

### Backend Service
- [ ] `MONGO_URL` - From MongoDB Atlas
- [ ] `DB_NAME` - e.g., `expense_tracker_db`
- [ ] `CORS_ORIGINS` - Set to `*` (or your frontend URL)
- [ ] `GOOGLE_CLIENT_ID` - From Google Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Console

### Frontend Service
- [ ] `REACT_APP_BACKEND_URL` - Your backend Render URL

---

## 🔗 Important URLs

After deployment, you'll have:
- **Backend:** `https://expense-tracker-backend.onrender.com`
- **Frontend:** `https://expense-tracker-frontend.onrender.com`
- **Health Check:** `https://expense-tracker-backend.onrender.com/api/health`

---

## 🐛 Quick Troubleshooting

### Backend won't start?
1. Check environment variables are set
2. Verify MongoDB connection string
3. View logs: Render Dashboard → Your Service → Logs

### Frontend shows blank page?
1. Check `REACT_APP_BACKEND_URL` is set correctly
2. View browser console for errors
3. Verify backend is running (check health endpoint)

### Google Login not working?
1. Update redirect URIs in Google Console:
   - `https://your-backend.onrender.com/api/auth/google/callback`
2. Update authorized origins:
   - `https://your-frontend.onrender.com`

---

## 📚 Full Documentation

For detailed step-by-step instructions, see [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)

---

## ⚠️ Important Notes

1. **Free Tier:** Services sleep after 15 min inactivity (first load may be slow)
2. **MongoDB:** Use Atlas free tier (M0) - it's separate from Render
3. **Auto-Deploy:** Render auto-deploys on push to main branch
4. **CORS:** For production, change `CORS_ORIGINS` to your frontend URL only

---

## ✅ Deployment Verification

After deployment, test:
```bash
# Check backend health
curl https://your-backend.onrender.com/api/health

# Should return:
{
  "status": "healthy",
  "service": "expense-tracker-backend",
  "database": "connected"
}
```

Visit your frontend URL and test:
- [ ] Page loads
- [ ] Google Sign-In works
- [ ] Can add/view expenses
- [ ] Dashboard shows data

---

🎉 **You're live!** Share your app: `https://your-frontend.onrender.com`
