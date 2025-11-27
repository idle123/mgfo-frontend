// src/config/apiConfig.ts
// Centralized API endpoint configuration. Uses Vite environment variables.
// Defaults point to the public IP 20.174.11.164 as requested.
// Backend uses HTTPS (port 443) via Nginx reverse proxy

const DEFAULT_BACKEND = 'https://20.174.11.164';
const DEFAULT_FRONTEND = 'http://20.174.11.164:3000';

const env = (import.meta as any).env || {};

export const BACKEND_URL = env.VITE_BACKEND_URL || DEFAULT_BACKEND;
export const FRONTEND_URL = env.VITE_FRONTEND_URL || DEFAULT_FRONTEND;

// Specific endpoints
export const INGEST_ENDPOINT = `${BACKEND_URL.replace(/\/$/, '')}/ingest_onedrive`;
export const QUERY_ENDPOINT = `${BACKEND_URL.replace(/\/$/, '')}/query`;

export default {
  BACKEND_URL,
  FRONTEND_URL,
  INGEST_ENDPOINT,
  QUERY_ENDPOINT,
};
