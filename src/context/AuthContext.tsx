"use client";

import type { User, Token } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode"; // Ensure jwt-decode is installed: npm install jwt-decode

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (tokenData: Token) => void;
  logout: () => void;
  isAdmin: boolean; // Simplified admin check
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface DecodedToken {
  sub: string; // Assuming 'sub' is user ID
  // Add other claims you expect, e.g., email, roles
  [key: string]: any; 
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(storedToken);
        // Basic check for token expiry
        if (decodedToken.exp && decodedToken.exp * 1000 > Date.now()) {
          setToken(storedToken);
          // Extract user info from token; adapt as per your JWT structure
          const userData: User = { 
            id: decodedToken.sub, // Example: subject as user ID
            email: decodedToken.email || null, // Example: if email is in token
            mobile_number: decodedToken.mobile_number || null // Example
          };
          setUser(userData);
        } else {
          localStorage.removeItem("authToken"); // Token expired
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem("authToken");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (tokenData: Token) => {
    localStorage.setItem("authToken", tokenData.access_token);
    setToken(tokenData.access_token);
     try {
        const decodedToken = jwtDecode<DecodedToken>(tokenData.access_token);
        const userData: User = { 
            id: decodedToken.sub,
            email: decodedToken.email || null,
            mobile_number: decodedToken.mobile_number || null
         };
        setUser(userData);
      } catch (error) {
        console.error("Failed to decode token on login:", error);
        setUser(null); // Ensure user is null if token is bad
      }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  };

  // Simplified admin check: for now, any logged-in user is considered admin.
  // In a real app, this would involve checking roles from the JWT or a user profile API.
  const isAdmin = !!user; 

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
