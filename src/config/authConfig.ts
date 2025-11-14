// src/config/authConfig.ts

export const msalConfig = {
  auth: {
    clientId: "653b929d-0932-4290-af54-92d1bd32756a", // frontend app (SPA) client id
    // Authority should be the tenant endpoint (ok to use tenant id here)
    authority: "https://login.microsoftonline.com/a6874e29-7cb4-4303-a2ad-ac96fcb0012b",
    redirectUri: "http://localhost:3000",
  },
  cache: {
    cacheLocation: "sessionStorage" as const,
    storeAuthStateInCookie: false,
  },
};

// API scope (backend app) — make sure this matches your vc-rag-api app's client id and exposed scope
export const apiScope = ["api://b337ff34-f1b0-4a44-b56b-96446478984f/user_impersonation"];

// Initial login request (OIDC) — keep minimal; don't request Graph API scopes here unless you want them at sign-in
export const loginRequest = {
  scopes: ["openid", "profile", "offline_access"],
};

// Graph scopes used when the frontend needs to call Microsoft Graph (OneDrive).
// Use least privilege required. This is exported as an array to match your components' expectation.
export const graphScopes = ["Files.Read", "offline_access"];

// Optional: keep a named set if you prefer using graphScopesByName.onedrive elsewhere
export const graphScopesByName = {
  onedrive: ["Files.Read", "offline_access", "User.Read"],
};
