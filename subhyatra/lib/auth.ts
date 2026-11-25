import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const USER_KEY = "userData";

export type StoredUser = {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  role: string;
  image: string | null;
  address: string | null;
  emergency_contact: string | null;
  emergency_name: string | null;
  has_phone?: boolean;
};

export const authStorage = {
  setTokens(access: string, refresh: string, user: StoredUser) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getAccessToken() {
    return localStorage.getItem(ACCESS_KEY);
  },
  getUser(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export async function persistAuthAndNavigate(
  data: { access: string; refresh: string; user: StoredUser },
): Promise<{ route: string; isNewGoogleUser: boolean }> {
  authStorage.setTokens(data.access, data.refresh, data.user);

  try {
    // Web has no real FCM token. Skip unless you have a web push token.
    // await api.post("/api/v1/notification/token/", {
    //   token: "web-placeholder",
    //   device: "web",
    // });
  } catch (error) {
    console.warn("Failed to register device token:", error);
  }

  const isNewGoogleUser = data.user?.phone?.startsWith?.("g_") ?? false;

  return {
    route: data.user.role === "P" ? "/tabs" : "/operator",
    isNewGoogleUser,
  };
}