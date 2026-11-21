import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: any | null;
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token:
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
      ? window.localStorage.getItem("token")
      : null,
  user:
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
      ? JSON.parse(window.localStorage.getItem("user") || "null")
      : null,
  setToken: (token: string) => {
    if (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    ) {
      window.localStorage.setItem("token", token);
    }
    set({ token });
  },
  setUser: (user: any) => {
    if (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    ) {
      window.localStorage.setItem("user", JSON.stringify(user));
    }
    set({ user });
  },
  logout: () => {
    if (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    ) {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
    }
    set({ token: null, user: null });
  },
}));

// Custom hook for easy access
export const useAuth = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  return { token, user, setToken, setUser, logout };
};

/**
 * Always read the token from localStorage at call time. Login/signup write
 * to localStorage first, so a page mounted later in the same SPA session can
 * otherwise read a stale `null` token from the Zustand store.
 * Use this for building Authorization headers in API calls.
 */
export const getStoredToken = (): string | null => {
  if (
    typeof window === "undefined" ||
    typeof window.localStorage === "undefined"
  ) {
    return null;
  }
  return window.localStorage.getItem("token");
};

/** Re-sync the Zustand store from localStorage (e.g. after OAuth redirects). */
export const syncAuthFromStorage = () => {
  if (
    typeof window === "undefined" ||
    typeof window.localStorage === "undefined"
  ) {
    return;
  }
  useAuthStore.setState({
    token: window.localStorage.getItem("token"),
    user: JSON.parse(window.localStorage.getItem("user") || "null"),
  });
};
