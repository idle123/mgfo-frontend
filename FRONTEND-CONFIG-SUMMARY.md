# Frontend Configuration Summary

## ✅ All localhost references have been replaced with https://20.174.11.164

### Configuration Files

#### 1. `.env` (Environment Variables)
```bash
VITE_BACKEND_URL=https://20.174.11.164
VITE_FRONTEND_URL=http://20.174.11.164:3000
```

#### 2. `src/config/apiConfig.ts` (API Configuration)
```typescript
const DEFAULT_BACKEND = 'https://20.174.11.164';  // ✅ HTTPS
const DEFAULT_FRONTEND = 'http://20.174.11.164:3000';

export const BACKEND_URL = env.VITE_BACKEND_URL || DEFAULT_BACKEND;
export const FRONTEND_URL = env.VITE_FRONTEND_URL || DEFAULT_FRONTEND;

// Endpoints
export const INGEST_ENDPOINT = 'https://20.174.11.164/ingest_onedrive';
export const QUERY_ENDPOINT = 'https://20.174.11.164/query';
```

#### 3. `src/config/authConfig.ts` (MSAL Configuration)
```typescript
import { FRONTEND_URL } from './apiConfig';

export const msalConfig = {
  auth: {
    clientId: "653b929d-0932-4290-af54-92d1bd32756a",
    authority: "https://login.microsoftonline.com/a6874e29-7cb4-4303-a2ad-ac96fcb0012b",
    redirectUri: FRONTEND_URL,  // http://20.174.11.164:3000
  },
  // ...
};
```

### All API Calls Will Use HTTPS

When your frontend makes API calls, they will go to:
- ✅ `https://20.174.11.164/ingest_onedrive` (POST - file upload)
- ✅ `https://20.174.11.164/query` (POST - search query)
- ✅ `https://20.174.11.164/healthz` (GET - health check)
- ✅ `https://20.174.11.164/metrics` (GET - metrics)

### Authentication Flow

1. User accesses frontend at `http://20.174.11.164:3000`
2. MSAL redirects to Microsoft login
3. After login, redirects back to `http://20.174.11.164:3000`
4. Frontend makes API calls to `https://20.174.11.164` (HTTPS backend)

### Network Flow

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                 │
│  http://20.174.11.164:3000                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS API Requests
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Nginx Reverse Proxy                                     │
│  https://20.174.11.164 (port 443)                       │
│  - SSL/TLS Termination                                  │
│  - Security Headers                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP (internal)
                     ↓
┌─────────────────────────────────────────────────────────┐
│  FastAPI Backend                                         │
│  http://api:8000 (Docker internal)                      │
└─────────────────────────────────────────────────────────┘
```

### Component Usage

All components that need to call the backend will automatically use the correct HTTPS URL:

**OneDriveFileBrowser.tsx**:
```typescript
import { INGEST_ENDPOINT } from "../config/apiConfig";

// Uses: https://20.174.11.164/ingest_onedrive
const resp = await fetch(ingestEndpoint, {
  method: "POST",
  headers: { Authorization: `Bearer ${apiToken}` },
  body: form,
});
```

**ChatInterface.tsx** (if implemented):
```typescript
import { QUERY_ENDPOINT } from "../config/apiConfig";

// Uses: https://20.174.11.164/query
const response = await fetch(QUERY_ENDPOINT, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({ query: userInput })
});
```

### Verification

To verify the configuration:

```bash
# Check .env
cat /home/akanksha/mgfo-frontend/.env

# Search for any remaining localhost
grep -r "localhost" /home/akanksha/mgfo-frontend/src/

# Build and test
cd /home/akanksha/mgfo-frontend
npm run build
npm run dev
```

### Browser Console Checks

After starting the frontend, open browser DevTools and check:

1. **Network Tab**: All API requests should go to `https://20.174.11.164`
2. **Console**: Should show no mixed content warnings
3. **Application Tab**: Check sessionStorage for MSAL tokens

### Common Issues

**Mixed Content Warning**:
- ✅ Fixed: Backend is HTTPS
- Frontend can be HTTP (less secure) or HTTPS (more secure)

**CORS Errors**:
- Backend `main.py` has CORS configured for all origins
- Nginx passes CORS headers through

**Certificate Warnings**:
- Expected with self-signed certificates
- Users must click "Advanced" → "Proceed to site"
- Use Let's Encrypt for production to avoid this

### Next Steps

1. **Rebuild frontend** to pick up new environment variables:
   ```bash
   cd /home/akanksha/mgfo-frontend
   npm run build
   ```

2. **Test the ingest endpoint**:
   ```bash
   # From command line
   curl -k https://20.174.11.164/healthz
   
   # From frontend (DevTools Console)
   fetch('https://20.174.11.164/healthz')
     .then(r => r.json())
     .then(console.log)
   ```

3. **Update Azure AD redirect URIs** (if needed):
   - Go to Azure Portal → App Registrations
   - Update redirect URI to match `FRONTEND_URL`

## Status: ✅ Complete

All localhost references have been replaced with `https://20.174.11.164`.
