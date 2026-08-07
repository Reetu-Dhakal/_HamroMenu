const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const TOKENS_KEY = 'hm.tokens';
export const USER_KEY = 'hm.user';

export function getStoredTokens() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY));
  } catch {
    return null;
  }
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function storeTokens(tokens) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function storeUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function storeAuth({ user, accessToken, refreshToken }) {
  storeTokens({ accessToken, refreshToken });
  storeUser(user);
  setAccessToken(accessToken);
}

export function clearAuth() {
  localStorage.removeItem(TOKENS_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function request(path, { method = 'GET', body, headers = {}, _retry = true } = {}) {
  let token = getAccessToken() || getStoredTokensToken();

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const status = res.status;
    const apiError = new ApiError(
      payload?.message || 'Something went wrong',
      status,
      payload?.code,
      payload?.details
    );
    if (status === 401 && _retry && payload?.code === 'UNAUTHORIZED' && getStoredTokensToken()) {
      const refreshed = await tryRefresh();
      if (refreshed) return request(path, { method, body, headers, auth: false, _retry: false });
    }
    throw apiError;
  }
  return payload;
}

function getStoredTokensToken() {
  return getStoredTokens()?.accessToken || null;
}

async function tryRefresh() {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    const json = await res.json();
    if (res.ok && json.data?.accessToken) {
      const next = { ...tokens, ...json.data };
      storeTokens(next);
      setAccessToken(next.accessToken);
      storeUser(json.data.user);
      return true;
    }
    clearAuth();
    return false;
  } catch {
    clearAuth();
    return false;
  }
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

export async function uploadImage(file, folder = 'general') {
  const tokens = getStoredTokens();
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens?.accessToken}` },
    body: fd,
  });
  const json = await res.json();
  if (!res.ok) throw new ApiError(json?.message, res.status, json?.code);
  return json.data;
}

export default api;