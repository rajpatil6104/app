# Production Custom Google OAuth Setup

This document provides step-by-step instructions for migrating from Emergent-managed Google Auth (testing) to your own custom Google OAuth setup for production.

## Current Implementation (Testing)
Currently, your app uses **Emergent-managed Google Auth** which redirects to:
```
https://auth.emergentagent.com/?redirect={your_app_url}
```

This is perfect for testing and development, but for production, you may want your own OAuth credentials.

---

## Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name: "ZenTrack Production" (or your preferred name)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "Google People API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (for public use) or "Internal" (for organization only)
   - Fill in:
     - App name: "ZenTrack"
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue

5. **Create OAuth Client ID**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "ZenTrack Web Client"
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     https://your-production-domain.com
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:3000/auth/callback
     https://your-production-domain.com/auth/callback
     ```
   - Click "Create"
   - **Save your Client ID and Client Secret** (you'll need these)

---

## Step 2: Update Backend Code

### Add Environment Variables
Add to `/app/backend/.env`:
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback
```

### Install Required Package
```bash
cd /app/backend
pip install google-auth google-auth-oauthlib google-auth-httplib2
pip freeze > requirements.txt
```

### Update `/app/backend/server.py`

Replace the auth endpoints with:

```python
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import secrets

# Add these imports at the top

# Store temporary auth states (in production, use Redis)
auth_states = {}

@api_router.get("/auth/google/login")
async def google_login():
    """Redirect user to Google OAuth"""
    state = secrets.token_urlsafe(32)
    auth_states[state] = datetime.now(timezone.utc)
    
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={os.environ['GOOGLE_CLIENT_ID']}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&redirect_uri={os.environ['GOOGLE_REDIRECT_URI']}"
        f"&state={state}"
    )
    
    return {"auth_url": google_auth_url}

@api_router.get("/auth/google/callback")
async def google_callback(code: str, state: str, response: Response):
    """Handle Google OAuth callback"""
    
    # Verify state
    if state not in auth_states:
        raise HTTPException(status_code=400, detail="Invalid state")
    
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": os.environ['GOOGLE_CLIENT_ID'],
                "client_secret": os.environ['GOOGLE_CLIENT_SECRET'],
                "redirect_uri": os.environ['GOOGLE_REDIRECT_URI'],
                "grant_type": "authorization_code"
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get token")
        
        token_data = token_response.json()
        id_token_str = token_data["id_token"]
    
    # Verify ID token
    try:
        idinfo = id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            os.environ['GOOGLE_CLIENT_ID']
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid token: {str(e)}")
    
    # Extract user info
    email = idinfo.get("email")
    name = idinfo.get("name")
    picture = idinfo.get("picture")
    
    # Create or update user (same as before)
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
        
        # Create predefined categories (same as before)
        predefined_categories = [
            {"name": "Food", "color": "#E15554"},
            {"name": "Transport", "color": "#3D9970"},
            {"name": "Bills", "color": "#2E4F4F"},
            {"name": "Shopping", "color": "#F59E0B"},
            {"name": "Entertainment", "color": "#8B5CF6"},
            {"name": "Healthcare", "color": "#EC4899"},
            {"name": "Other", "color": "#6B7280"}
        ]
        
        for cat in predefined_categories:
            cat_doc = {
                "category_id": f"cat_{uuid.uuid4().hex[:12]}",
                "user_id": user_id,
                "name": cat["name"],
                "color": cat["color"],
                "is_predefined": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.categories.insert_one(cat_doc)
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    # Redirect to dashboard
    return RedirectResponse(url="/dashboard")
```

---

## Step 3: Update Frontend Code

### Update `/app/frontend/src/pages/Login.js`

Replace the `handleGoogleLogin` function:

```javascript
const handleGoogleLogin = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google/login`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    window.location.href = data.auth_url;
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Create Callback Page `/app/frontend/src/pages/GoogleCallback.js`

```javascript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      // Backend will handle this automatically via redirect
      // Just navigate to dashboard after a moment
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-background to-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-stone-200 border-t-primary"></div>
        <p className="text-stone-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
```

### Update `/app/frontend/src/App.js`

Add the new route:

```javascript
import GoogleCallback from './pages/GoogleCallback';

// Add this route
<Route path="/auth/callback" element={<GoogleCallback />} />
```

---

## Step 4: Testing Custom OAuth

1. **Test Locally First**
   ```bash
   # Update .env files with your credentials
   # Restart backend
   sudo supervisorctl restart backend
   ```

2. **Test the Login Flow**
   - Visit `http://localhost:3000/login`
   - Click "Continue with Google"
   - Should redirect to Google login
   - After login, should redirect to `/auth/callback`
   - Then to `/dashboard`

3. **Verify Session Management**
   - Check that cookies are set
   - Test `/api/auth/me` endpoint
   - Test logout functionality

---

## Step 5: Deploy to Production

1. **Update Environment Variables** on your production server:
   ```env
   GOOGLE_CLIENT_ID=your_production_client_id
   GOOGLE_CLIENT_SECRET=your_production_client_secret
   GOOGLE_REDIRECT_URI=https://your-production-domain.com/auth/callback
   ```

2. **Update Google Cloud Console**
   - Add your production domain to authorized origins
   - Add production callback URL to authorized redirect URIs

3. **Deploy and Test**
   - Deploy your updated code
   - Test the complete OAuth flow
   - Monitor for any errors

---

## Important Notes

### Security Best Practices

1. **Never commit secrets to Git**
   - Keep `.env` files in `.gitignore`
   - Use environment variables for all sensitive data

2. **Use HTTPS in Production**
   - Google OAuth requires HTTPS for production
   - Get SSL certificate (Let's Encrypt is free)

3. **Implement Rate Limiting**
   - Add rate limiting to auth endpoints
   - Prevent brute force attacks

4. **Session Storage**
   - For production at scale, use Redis instead of MongoDB for sessions
   - Implement session cleanup for expired sessions

### Troubleshooting

**Error: redirect_uri_mismatch**
- Double-check that redirect URI in Google Console exactly matches your app
- Include protocol (https://) and no trailing slash

**Error: invalid_client**
- Verify Client ID and Client Secret are correct
- Check environment variables are loaded properly

**Session not persisting**
- Verify cookies are being set correctly
- Check browser cookie settings
- Ensure SameSite attribute is correct for your setup

---

## Comparison: Emergent Auth vs Custom OAuth

| Feature | Emergent Auth (Current) | Custom OAuth |
|---------|------------------------|--------------|
| Setup Time | 0 minutes | ~30 minutes |
| Configuration | None required | Multiple steps |
| Credentials | Managed by Emergent | You manage |
| Cost | Included | Free (Google) |
| Customization | Limited | Full control |
| Best For | Testing, MVP | Production, Scale |

---

## Support

If you encounter any issues during migration:
1. Check Google Cloud Console logs
2. Review backend logs: `tail -f /var/log/supervisor/backend.*.log`
3. Test OAuth flow with Postman/curl first
4. Verify all environment variables are set correctly

---

**Current Status**: Your app is using Emergent-managed Google Auth, which is perfect for testing and MVP. Migrate to custom OAuth when you're ready for production deployment.
