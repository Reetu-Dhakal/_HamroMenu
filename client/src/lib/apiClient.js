import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'hm_access_token';
const REFRESH_KEY = 'hm_refresh_token';
const USER_KEY = 'hm_user';

export const authStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  setSession: ({ accessToken, refreshToken, user }) => {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

const api = axios.create({
  baseURL: API_BASE,
  timeout: 25000,
  headers: { 'Content-Type': 'application/json' },
});

let refreshing = null;

api.interceptors.request.use((config) => {
  const token = authStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

async function refreshTokens() {
  const refreshToken = authStorage.getRefresh();
  if (!refreshToken) throw new Error('no-refresh-token');
  const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken }, { timeout: 15000 });
  authStorage.setSession(data.data);
  return data.data.accessToken;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    const isUnAuth = response?.status === 401;
    const isRefreshCall = config?.url?.includes('/auth/refresh');
    if (isUnAuth && !isRefreshCall && authStorage.getRefresh() && !config?._retried) {
      config._retried = true;
      try {
        if (!refreshing) refreshing = refreshTokens().finally(() => (refreshing = null));
        const token = await refreshing;
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      } catch (_) {
        /* fallthrough to error handling below */
      }
    }
    if (isUnAuth && !isRefreshCall) {
      api.clearSession?.();
      window.dispatchEvent(new CustomEvent('hm:auth-expired'));
    }
    return Promise.reject(error);
  }
);

api.clearAuth = () => authStorage.clear();

/** Unwrap the HamroMenu API envelope; throws a friendly Error on failure. */
export async function request(url, options = {}) {
  try {
    const res = await api({ url, method: options.method || 'GET', data: options.body || options.data, params: options.params, ...options });
    return options.raw ? res : res.data?.data;
  } catch (err) {
    const status = err?.response?.status;
    const message = err?.response?.data?.message || err?.message || 'Something went wrong';
    const code = err?.response?.data?.code;
    if (status === 401 && !options.silent) window.dispatchEvent(new CustomEvent('hm:auth-expired'));
    const e = new Error(message);
    e.status = status;
    e.code = code;
    throw e;
  }
}

api.fileUpload = async (url, file, folder) => {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder || 'general');
  const res = await api.post(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data?.data;
};

export default api;