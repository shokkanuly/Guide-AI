"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface User {
  id: string;
  email: string;
  full_name: string;
  age?: number;
  region?: string;
  employment_status?: string;
  monthly_income?: number;
  is_student: boolean;
  has_family: boolean;
  family_size: number;
  is_business_owner: boolean;
  interests?: string[];
  is_premium: boolean;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/users/me");
      setUser(res.data);
    } catch (err) {
      setUser(null);
      localStorage.removeItem("govguide_token");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("govguide_token");
    if (token) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("govguide_token", res.data.access_token);
      await fetchCurrentUser();

      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (err: any) {
      setIsLoading(false);
      const detail = err.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d: any) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(", ")
        : typeof detail === "string"
        ? detail
        : "Login failed";
      throw new Error(message);
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await api.post("/auth/register", {
        full_name: fullName,
        email,
        password,
      });
      setIsLoading(false);
      // Auto login after registration
      await login(email, password);
    } catch (err: any) {
      setIsLoading(false);
      const detail = err.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d: any) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(", ")
        : typeof detail === "string"
        ? detail
        : "Registration failed";
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem("govguide_token");
    setUser(null);
    router.push("/auth");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
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
