import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Tokens live in localStorage when "Remember me" was checked at login,
// otherwise in sessionStorage (cleared when the tab closes).
export function getStoredToken(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

export function storeTokens({ access, refresh }, remember = true) {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  store.setItem("mh_access_token", access);
  store.setItem("mh_refresh_token", refresh);
  other.removeItem("mh_access_token");
  other.removeItem("mh_refresh_token");
}

export function clearTokens() {
  localStorage.removeItem("mh_access_token");
  localStorage.removeItem("mh_refresh_token");
  sessionStorage.removeItem("mh_access_token");
  sessionStorage.removeItem("mh_refresh_token");
}

// Attach the JWT access token (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getStoredToken("mh_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, attempt a single silent refresh using the stored refresh token.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = getStoredToken("mh_refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh });
          const rememberedInLocal = !!localStorage.getItem("mh_refresh_token");
          (rememberedInLocal ? localStorage : sessionStorage).setItem("mh_access_token", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch (refreshError) {
          clearTokens();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
