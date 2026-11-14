// Central API routing configuration
// Local dev: Vite proxies '/api' to 'http://localhost:3001'
// Hosted production: 
//   - If VITE_API_URL is provided (e.g. backend hosted on separate domain), it prefixes requests with that URL.
//   - If VITE_API_URL is omitted, requests use relative '/api' paths (standard for same-domain / reverse proxy deployments).

const rawBase = (import.meta.env.VITE_API_URL || '').trim();
export const API_BASE_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

export const getApiUrl = (endpoint) => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};

export default getApiUrl;

