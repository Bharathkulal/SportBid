"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    credentials: { email: string; password: string },
    redirectUrl?: string | null
  ) => Promise<User>;
  registerPlayer: (data: {
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
  }) => Promise<User>;
  registerOrganizer: (data: {
    full_name: string;
    organization_name?: string;
    email: string;
    phone_number: string;
    password: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = async () => {
    try {
      const currentUser = await apiClient<User>("/auth/me");
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: { email: string; password: string }, redirectUrl?: string | null) => {
    const res = await apiClient<{ message: string; user: User }>("/auth/login", {
      data: credentials,
    });
    setUser(res.user);

    // If a safe internal return URL is provided (e.g. tournament registration link), navigate there
    if (redirectUrl && redirectUrl.startsWith("/")) {
      router.push(redirectUrl);
      return res.user;
    }

    // Default: Navigate to role-specific dashboard
    if (res.user.role === "PLAYER") {
      router.push("/dashboard/player");
    } else if (res.user.role === "ORGANIZER") {
      router.push("/dashboard/organizer");
    } else if (res.user.role === "SUPER_ADMIN") {
      router.push("/admin");
    }
    return res.user;
  };

  const registerPlayer = async (data: {
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
  }) => {
    const registeredUser = await apiClient<User>("/auth/register/player", {
      data,
    });
    return registeredUser;
  };

  const registerOrganizer = async (data: {
    full_name: string;
    organization_name?: string;
    email: string;
    phone_number: string;
    password: string;
  }) => {
    const registeredUser = await apiClient<User>("/auth/register/organizer", {
      data,
    });
    return registeredUser;
  };

  const logout = async () => {
    try {
      await apiClient<{ message: string }>("/auth/logout", {
        method: "POST",
      });
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerPlayer,
        registerOrganizer,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
