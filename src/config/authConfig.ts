export const msalConfig = {
  auth: {
    clientId: "6833e4fd-f717-4fb9-934e-b3397c8e1510",
    authority: "https://login.microsoftonline.com/e3c00919-d393-4fdf-80fa-93cd0a611958",
    redirectUri: "http://localhost:3000"
  },
  cache: {
    cacheLocation: "sessionStorage" as const,
    storeAuthStateInCookie: false
  }
};

export const loginRequest = {
  scopes: ["openid", "profile", "offline_access", "User.Read"]
};

export const graphScopes = {
  onedrive: ["Files.ReadWrite", "offline_access", "User.Read"]
};
