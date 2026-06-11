const LIVE_API_BASE_URL = 'https://photoai.betaplanets.com';
const LOCAL_API_BASE_URL = 'http://127.0.0.1:3001';
const LOCAL_MIRROR_HOSTS = new Set(['photohealthy.htbluestone.com']);

const getRuntimeHost = () => {
  if (typeof window === 'undefined') return '';
  return window.location.hostname;
};

const isLocalHost = (host: string) =>
  host === 'localhost' || host === '127.0.0.1' || host === '::1';

const getApiBaseUrl = () => {
  const host = getRuntimeHost();
  if (isLocalHost(host)) return LOCAL_API_BASE_URL;
  if (LOCAL_MIRROR_HOSTS.has(host) && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return LIVE_API_BASE_URL;
};

export const API_BASE_URL = getApiBaseUrl();

export const IS_LOCAL_API = API_BASE_URL !== LIVE_API_BASE_URL;

export const apiUrl = (path: string) =>
  path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

export const fullUrl = (url?: string | null) =>
  url ? (url.startsWith('http') ? url : `${API_BASE_URL}${url}`) : undefined;
