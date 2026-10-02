import { createContext, useContext, useEffect, useState } from "react";
import api, { storeTokens, clearTokens, getStoredToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken("mh_access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me/")
      .then(({ data }) => setUser(data))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const register = async ({ username, email, password, password2 }) => {
    const { data } = await api.post("/auth/register/", { username, email, password, password2 });
    storeTokens(data, true);
    setUser(data.user);
    return data.user;
  };

  const login = async ({ identifier, password, remember = true }) => {
    const { data } = await api.post("/auth/login/", { identifier, password });
    storeTokens(data, remember);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    const refresh = getStoredToken("mh_refresh_token");
    try {
      if (refresh) await api.post("/auth/logout/", { refresh });
    } catch {
      // token may already be expired/blacklisted — clearing local state either way
    }
    clearTokens();
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const { data } = await api.post("/auth/forgot-password/", { email });
    return data;
  };

  const resetPassword = async ({ uid, token, new_password }) => {
    const { data } = await api.post("/auth/reset-password/", { uid, token, new_password });
    return data;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.patch("/auth/me/", payload);
    setUser(data);
    return data;
  };

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await api.patch("/auth/me/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setUser(data);
    return data;
  };

  const changePassword = async ({ old_password, new_password }) => {
    const { data } = await api.post("/auth/change-password/", { old_password, new_password });
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user, loading, isAuthenticated: !!user,
        register, login, logout, forgotPassword, resetPassword, updateProfile,
        uploadAvatar, changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
