
"use client";

import type { User, Token } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode, type JwtPayload } from "jwt-decode";
import { getCurrentUserAction } from "@/lib/actions";
import { usePathname, useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (tokenData: Token) => Promise<void>; // Made async
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface DecodedToken extends JwtPayload {
  // Standard claims like 'sub', 'exp' are in JwtPayload
  // Add custom claims if your JWT has them, e.g.
  // email?: string;
  // mobile_number?: string;
  // For JobConnect, user details are primarily fetched via /users/me
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        try {
          const decodedToken = jwtDecode<DecodedToken>(storedToken);
          if (decodedToken.exp && decodedToken.exp * 1000 > Date.now()) {
            setToken(storedToken);
            const currentUser = await getCurrentUserAction(storedToken);
            setUser(currentUser);
          } else {
            console.log("Stored token expired.");
            localStorage.removeItem("authToken");
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to initialize auth from stored token:", error);
          localStorage.removeItem("authToken");
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (tokenData: Token) => {
    setIsLoading(true);
    localStorage.setItem("authToken", tokenData.access_token);
    setToken(tokenData.access_token);
    try {
      const currentUser = await getCurrentUserAction(tokenData.access_token);
      setUser(currentUser);
      // Redirect logic after successful login is handled by pages/guards
    } catch (error) {
      console.error("Failed to fetch user details after login:", error);
      // If fetching user fails, revert auth state
      localStorage.removeItem("authToken");
      setToken(null);
      setUser(null);
      // Optionally, show a toast message to the user
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
    // After logout, always redirect to login page
    if (pathname !== "/login" && pathname !== "/verify-otp") {
         router.push("/login");
    }
  };

  const isAdmin = !!user && user.is_admin;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
