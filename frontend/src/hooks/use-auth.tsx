"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService, User } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      return authService.getStoredUser();
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Mark loading as false after mount
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = useCallback((token: string, userData: User) => {
    authService.storeAuth(token, userData);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    router.push("/");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getProfile();
      setUser(userData);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // If refresh fails, logout
      await logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// HOC for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: "officer" | "administrator"
) {
  return function ProtectedRoute(props: P) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/");
      }

      if (
        !isLoading &&
        isAuthenticated &&
        requiredRole &&
        user?.role !== requiredRole
      ) {
        // Redirect to appropriate dashboard based on role as a fallback
        const dashboard =
          user?.role === "administrator" ? "/admin" : "/dashboard";
        router.push(dashboard);
      }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requiredRole && user?.role !== requiredRole) {
      return null;
    }

    return <Component {...props} />;
  };
}
