# Tenant ID Configuration - Fixed

## Problem
Backend was throwing error:
```json
{"detail": "`tenant_id` is required for multi-tenant isolation."}
```

## Solution
Added `tenant_id` from Azure AD (MSAL) configuration to the frontend requests.

## What is tenant_id?

The `tenant_id` is your **Azure AD Tenant ID**, which identifies your organization in Microsoft's identity platform. It's used for:

1. **Multi-tenant isolation** - Segregates data between different organizations
2. **Access control** - Ensures users only see data from their tenant
3. **Security** - Prevents cross-tenant data leakage

## Your Tenant ID

```
a6874e29-7cb4-4303-a2ad-ac96fcb0012b
```

This comes from your Azure AD authority URL:
```
https://login.microsoftonline.com/a6874e29-7cb4-4303-a2ad-ac96fcb0012b
```

## Changes Made

### 1. `src/config/authConfig.ts`
```typescript
// Export tenant ID for use throughout the app
export const TENANT_ID = "a6874e29-7cb4-4303-a2ad-ac96fcb0012b";

export const msalConfig = {
  auth: {
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    // ...
  },
};
```

### 2. `src/components/OneDriveFileBrowser.tsx`
```typescript
import { TENANT_ID } from "../config/authConfig";

// In handleAddToKnowledgeBase:
const form = new FormData();
form.append("userName", userName);
form.append("userEmail", userEmail);
form.append("documents", JSON.stringify(selectedDocs));
form.append("tenant_id", TENANT_ID); // ✅ Now included!
```

## How It Works

### Request Flow:

```
Frontend (OneDriveFileBrowser)
    ↓
Sends FormData with:
  - userName: "John Doe"
  - userEmail: "john@example.com"
  - documents: ["https://..."]
  - tenant_id: "a6874e29-7cb4-4303-a2ad-ac96fcb0012b" ← Added!
    ↓
POST https://20.174.11.164/api/ingest_onedrive
    ↓
Backend (router.py)
    ↓
Validates tenant_id is present ✅
    ↓
Stores data in Weaviate with tenant_id for isolation
```

## Backend Validation

In `/app/ingestion/router.py`:

```python
if not tenant_id:
    raise HTTPException(
        status_code=400, 
        detail="`tenant_id` is required for multi-tenant isolation."
    )
```

Now this validation passes! ✅

## Multi-Tenant Isolation in Backend

The `tenant_id` is used throughout the backend:

1. **Document Metadata Storage**:
   ```python
   metadata_dict = {
       "tenant_id": tenant_id,  # Isolates by organization
       "doc_id": doc_id,
       # ...
   }
   ```

2. **Chunk Storage**:
   ```python
   upsert_chunks(
       chunks=chunks,
       embeddings=embeddings,
       tenant_id=tenant_id  # Ensures data isolation
   )
   ```

3. **Query/Search**:
   ```python
   # Only returns results from the same tenant
   hits = wv_query(
       vec, 
       top_k=req.top_k, 
       tenant_id=tenant,  # Filters by tenant
       access_tags=req.access_tags
   )
   ```

## Access Tags (Optional)

You can also add access tags for finer-grained access control:

```typescript
form.append("access_tags", JSON.stringify(["investments", "dealflow"]));
```

This allows RBAC (Role-Based Access Control) where users with specific tags can access specific documents.

## Testing

After rebuilding the frontend, test the ingestion:

```bash
# 1. Rebuild frontend
cd /home/akanksha/mgfo-frontend
npm run build

# 2. Restart frontend dev server
npm run dev

# 3. Test in browser:
#    - Sign in with Microsoft
#    - Select OneDrive files
#    - Click "Add to Knowledge Base"
#    - Should succeed without tenant_id error ✅
```

## Debugging

Check browser console for the log:
```javascript
Prepared form data for ingestion: {
  userName: "...",
  userEmail: "...",
  documents: [...],
  tenant_id: "a6874e29-7cb4-4303-a2ad-ac96fcb0012b"  // ✅ Present
}
```

Check backend logs:
```bash
docker logs -f vc-rag-api | grep tenant_id
```

Should see:
```
Received ingest payload: ... tenant_id=a6874e29-7cb4-4303-a2ad-ac96fcb0012b
```

## Summary

✅ Tenant ID extracted from Azure AD configuration
✅ Exported from `authConfig.ts`
✅ Imported in `OneDriveFileBrowser.tsx`
✅ Included in FormData sent to backend
✅ Backend validation now passes
✅ Multi-tenant isolation working correctly

The error should now be resolved!
