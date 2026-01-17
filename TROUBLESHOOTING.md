# 🔧 Render Deployment Troubleshooting Guide

Common issues and their solutions when deploying to Render.

---

## 🚨 Backend Issues

### Issue: Backend Service Fails to Build

**Symptoms:**
- Build fails during deployment
- Error message: "Command failed: pip install..."
- Service stuck in "Building" state

**Solutions:**

1. **Check requirements.txt format**
   ```bash
   # Make sure no syntax errors
   cat backend/requirements.txt
   ```

2. **Verify Python version compatibility**
   - Render uses Python 3.11 by default
   - Check if all packages support Python 3.11

3. **Check build logs**
   - Go to Render Dashboard → Your Service → Logs
   - Look for specific package that's failing
   - Google the error message

4. **Try local build**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

---

### Issue: Backend Crashes on Startup

**Symptoms:**
- Build succeeds but service crashes
- Error: "Application failed to respond"
- Logs show import errors or connection issues

**Solutions:**

1. **Check environment variables**
   ```
   Required:
   - MONGO_URL ✅
   - DB_NAME ✅
   ```

2. **Check MongoDB connection string**
   - Format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
   - Password must be URL-encoded (replace special characters)
   - Database name included at the end

3. **Verify port binding**
   - Backend must use `$PORT` environment variable
   - Check start command: `--port $PORT`

4. **Check logs for errors**
   ```
   Common errors:
   - "Authentication failed" → Wrong MongoDB credentials
   - "Module not found" → Missing package in requirements.txt
   - "Cannot connect to host" → MongoDB IP not whitelisted
   ```

---

### Issue: MongoDB Connection Failed

**Symptoms:**
- Error: "ServerSelectionTimeoutError"
- Error: "Authentication failed"
- Health check returns "unhealthy"

**Solutions:**

1. **Verify MongoDB Atlas IP Whitelist**
   - Go to Network Access in MongoDB Atlas
   - Add IP: `0.0.0.0/0` (allows access from anywhere)
   - Wait 2-3 minutes for changes to propagate

2. **Check connection string format**
   ```
   ✅ Correct:
   mongodb+srv://user:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   
   ❌ Wrong:
   mongodb://user:password@cluster.mongodb.net/dbname (missing srv)
   mongodb+srv://user@cluster.mongodb.net/dbname (missing password)
   ```

3. **URL encode special characters in password**
   ```
   Special characters need encoding:
   @ → %40
   : → %3A
   / → %2F
   # → %23
   ? → %3F
   ```

4. **Test connection locally**
   ```python
   from motor.motor_asyncio import AsyncIOMotorClient
   
   client = AsyncIOMotorClient("your_connection_string")
   db = client.your_database
   
   # Try to ping
   await db.command('ping')
   ```

---

### Issue: CORS Errors

**Symptoms:**
- Frontend shows: "Access-Control-Allow-Origin" error
- API calls failing from browser
- Works in Postman but not in browser

**Solutions:**

1. **Check CORS_ORIGINS environment variable**
   ```
   Development: CORS_ORIGINS=*
   Production: CORS_ORIGINS=https://your-frontend.onrender.com
   ```

2. **Verify frontend URL is correct**
   - No trailing slash
   - Must match exactly

3. **Check CORS middleware in server.py**
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_credentials=True,
       allow_origins=["*"],  # or specific origins
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

4. **Restart backend after changing CORS settings**

---

### Issue: Health Check Failing

**Symptoms:**
- Render shows service as "Unhealthy"
- Health check endpoint returns 500 error
- Service keeps restarting

**Solutions:**

1. **Test health endpoint manually**
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```

2. **Check health endpoint exists**
   - Verify `/api/health` route is defined
   - Should return 200 status code

3. **Verify health check path in render.yaml**
   ```yaml
   healthCheckPath: /api/health
   ```

4. **Check database connection in health endpoint**
   - Health check should handle database errors gracefully

---

## 🎨 Frontend Issues

### Issue: Frontend Build Fails

**Symptoms:**
- Build fails during yarn/npm install
- Error: "ENOENT: no such file or directory"
- Module not found errors

**Solutions:**

1. **Verify package.json exists in frontend directory**
   ```bash
   ls frontend/package.json
   ```

2. **Check for syntax errors in package.json**
   ```bash
   cat frontend/package.json | jq .
   ```

3. **Try local build**
   ```bash
   cd frontend
   yarn install
   yarn build
   ```

4. **Check Node version**
   - Render uses Node 18 by default
   - Verify compatibility with your dependencies

5. **Clear build cache** (in Render dashboard)
   - Settings → "Clear build cache & deploy"

---

### Issue: Frontend Shows Blank Page

**Symptoms:**
- White/blank page after deployment
- No console errors, just empty page
- Works locally but not on Render

**Solutions:**

1. **Check browser console**
   - Press F12
   - Look for errors (red messages)
   - Check Network tab for failed requests

2. **Verify REACT_APP_BACKEND_URL is set**
   ```
   Must be set BEFORE build, not after
   ```

3. **Check build output**
   - Render Logs → Build logs
   - Verify build completed successfully
   - Check for warnings about missing variables

4. **Verify publish directory**
   ```yaml
   staticPublishPath: ./build  # for Create React App
   ```

5. **Redeploy from scratch**
   - Sometimes Render cache causes issues
   - Manual Deploy → Clear cache & deploy

---

### Issue: API Calls Failing (404 Not Found)

**Symptoms:**
- Frontend loads but can't fetch data
- Console shows 404 errors for API calls
- Network tab shows failed requests

**Solutions:**

1. **Verify REACT_APP_BACKEND_URL is correct**
   ```javascript
   console.log(process.env.REACT_APP_BACKEND_URL);
   ```

2. **Check API endpoint paths**
   ```javascript
   ❌ Wrong: `${backendUrl}expenses`
   ✅ Correct: `${backendUrl}/api/expenses`
   ```

3. **Ensure backend is running**
   - Check backend service status in Render
   - Visit health check endpoint

4. **Check for CORS errors** (see CORS section above)

---

### Issue: Environment Variables Not Working

**Symptoms:**
- `process.env.REACT_APP_BACKEND_URL` is undefined
- API calls go to wrong URL
- Works locally but not on Render

**Solutions:**

1. **Environment variables must be set BEFORE build**
   - React apps embed env vars at build time
   - Changing them after build has no effect
   - Must redeploy to apply changes

2. **Verify variable name**
   ```
   ✅ Correct: REACT_APP_BACKEND_URL
   ❌ Wrong: BACKEND_URL (missing REACT_APP_ prefix)
   ```

3. **Redeploy after setting variables**
   - Render Dashboard → Your Static Site
   - Environment → Add variable
   - Manual Deploy → Deploy latest commit

---

## 🔐 Authentication Issues

### Issue: Google OAuth Not Working

**Symptoms:**
- "redirect_uri_mismatch" error
- "invalid_client" error
- Can't sign in with Google

**Solutions:**

1. **Verify redirect URIs in Google Console**
   ```
   Authorized redirect URIs must include:
   https://your-backend.onrender.com/api/auth/google/callback
   
   No trailing slash!
   ```

2. **Verify authorized origins**
   ```
   Authorized JavaScript origins:
   https://your-frontend.onrender.com
   ```

3. **Check credentials are set in backend**
   ```
   Environment variables:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   ```

4. **Verify callback URL in code**
   - Must match Google Console exactly
   - Check protocol (https vs http)
   - Check domain spelling

---

### Issue: Session/Cookie Issues

**Symptoms:**
- User logged out after refresh
- "Not authenticated" errors
- Cookies not being set

**Solutions:**

1. **Check cookie settings**
   ```python
   # For cross-domain cookies:
   response.set_cookie(
       key="session_token",
       value=token,
       httponly=True,
       secure=True,  # Must be True for HTTPS
       samesite="none"  # For cross-origin
   )
   ```

2. **Verify HTTPS is used**
   - Render provides HTTPS by default
   - Cookies with `secure=True` only work over HTTPS

3. **Check CORS credentials**
   ```python
   allow_credentials=True  # Required for cookies
   ```

---

## 🐌 Performance Issues

### Issue: Slow First Load (15-30 seconds)

**Symptoms:**
- First request takes very long
- Subsequent requests are fast
- Happens after period of inactivity

**Cause:**
- Render free tier services "spin down" after 15 minutes
- First request "wakes up" the service

**Solutions:**

1. **Upgrade to paid tier**
   - Paid services don't spin down
   - Starts at $7/month

2. **Use a keep-alive service**
   - External service to ping your app periodically
   - Services like UptimeRobot (free tier available)

3. **Add loading state to frontend**
   ```javascript
   // Show "Waking up service..." message
   // User knows to wait
   ```

---

### Issue: Database Queries Slow

**Symptoms:**
- API responses take several seconds
- MongoDB Atlas shows high query times

**Solutions:**

1. **Create indexes**
   ```python
   # In MongoDB Atlas or via code
   db.expenses.create_index([("user_id", 1)])
   db.expenses.create_index([("date", -1)])
   ```

2. **Optimize queries**
   ```python
   # Use projection to limit fields
   .find({}, {"_id": 0, "field1": 1})
   
   # Add limits
   .limit(100)
   ```

3. **Monitor MongoDB Atlas**
   - Check Performance Advisor
   - Review slow queries
   - Add suggested indexes

---

## 🛠️ General Debugging Steps

### Step 1: Check Service Status
```
1. Go to Render Dashboard
2. Check if service shows "Live" (green)
3. If not, check deploy logs
```

### Step 2: Review Logs
```
1. Click on your service
2. Go to "Logs" tab
3. Look for error messages (red text)
4. Search for "Error", "Failed", "Exception"
```

### Step 3: Verify Environment Variables
```
1. Service → Environment
2. Check all required variables are set
3. No typos in variable names
4. Values are correct (no extra spaces)
```

### Step 4: Test Endpoints Manually
```bash
# Backend health check
curl https://your-backend.onrender.com/api/health

# Test specific endpoint
curl https://your-backend.onrender.com/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 5: Check Browser Console
```
1. Open your frontend in browser
2. Press F12 (Developer Tools)
3. Check Console tab for errors
4. Check Network tab for failed requests
```

---

## 📞 Getting More Help

### Render Support
- Documentation: https://render.com/docs
- Community: https://community.render.com
- Status page: https://status.render.com

### MongoDB Atlas Support
- Documentation: https://docs.atlas.mongodb.com
- Support: https://support.mongodb.com

### Stack Overflow
- Tag questions with: `render`, `fastapi`, `react`, `mongodb`

### GitHub Issues
- Check if issue already reported
- Provide logs and error messages
- Include steps to reproduce

---

## 🔍 Quick Diagnostic Commands

```bash
# Check if backend is accessible
curl -I https://your-backend.onrender.com/api/health

# Test MongoDB connection locally
mongosh "mongodb+srv://your-connection-string"

# Check DNS resolution
nslookup your-backend.onrender.com

# Check SSL certificate
openssl s_client -connect your-backend.onrender.com:443

# View recent logs (if you have Render CLI)
render logs backend-service

# Check service status
render services list
```

---

## ✅ Prevention Checklist

Before deploying, verify:
- [ ] All environment variables documented
- [ ] Connection strings tested locally
- [ ] Build succeeds locally
- [ ] Tests pass (if you have tests)
- [ ] Requirements.txt / package.json up to date
- [ ] .env files in .gitignore
- [ ] Health check endpoint works
- [ ] Error handling in place
- [ ] Logs are informative

---

**Remember:** Most deployment issues are caused by:
1. Missing or incorrect environment variables (60%)
2. Database connection problems (20%)
3. CORS configuration (10%)
4. Build/dependency issues (10%)

Always check these first! 🎯
