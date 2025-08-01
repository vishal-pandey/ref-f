
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
  login: (tokenData: Token) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isProfileComplete: boolean; 
  updateCurrentUser: (updatedUserData: User) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface DecodedToken extends JwtPayload {
  // Standard claims like 'sub', 'exp' are in JwtPayload
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
            // Token is not expired client-side, try to fetch user
            const currentUser = await getCurrentUserAction(storedToken);
            setUser(currentUser);
            setToken(storedToken); // Set token only after successful user fetch
          } else {
            console.log("Stored token expired (client-side check).");
            localStorage.removeItem("authToken");
            setToken(null);
            setUser(null);
          }
        } catch (error: any) {
          console.error("Failed to initialize auth from stored token:", error.message);
          // If getCurrentUserAction fails (e.g., 401), or decoding fails, clear auth state
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
    } catch (error) {
      console.error("Failed to fetch user details after login:", error);
      localStorage.removeItem("authToken");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
    if (pathname !== "/login" && pathname !== "/verify-otp" && pathname !== "/complete-profile") {
         router.push("/login");
    }
  };
  
  const updateCurrentUser = (updatedUserData: User) => {
    setUser(updatedUserData);
  };

  const isAdmin = !!user && user.is_admin;
  
  // Updated isProfileComplete logic
  const isProfileComplete = !!(
    user &&
    user.full_name &&
    user.full_name.trim() !== "" &&
    user.mobile_number &&
    user.mobile_number.trim() !== ""
  );

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAdmin, isProfileComplete, updateCurrentUser }}>
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

