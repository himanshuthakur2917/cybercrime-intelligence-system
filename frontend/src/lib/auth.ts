import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const authAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
authAxios.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Cookie utility functions for client-side use
 */
const cookies = {
  set: (name: string, value: string, days = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  },
  get: (name: string) => {
    if (typeof document === "undefined") return null;
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },
  remove: (name: string) => {
    document.cookie = `${name}=; Max-Age=-99999999;path=/;`;
  },
};

// Response types
export interface LoginResponse {
  success: boolean;
  message: string;
  userId?: string;
  requiresOtp: boolean;
  requiresFace: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
    phone: string;
    faceRegistered: boolean;
  };
}

export interface OtpResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
}

export interface FaceVerifyResponse {
  success: boolean;
  message: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
    phone: string;
    department?: string;
    designation?: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  department?: string;
  designation?: string;
}

// Auth service methods
export const authService = {
  /**
   * Step 1: Login with username and password
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await authAxios.post<LoginResponse>("/auth/login", {
      username,
      password,
    });
    return response.data;
  },

  /**
   * Step 2: Verify OTP
   */
  verifyOtp: async (userId: string, otpCode: string): Promise<OtpResponse> => {
    const response = await authAxios.post<OtpResponse>("/auth/verify-otp", {
      userId,
      otpCode,
    });
    return response.data;
  },

  /**
   * Step 3: Verify face encoding
   */
  verifyFace: async (
    userId: string,
    faceEncoding: number[]
  ): Promise<FaceVerifyResponse> => {
    const response = await authAxios.post<FaceVerifyResponse>(
      "/auth/verify-face",
      {
        userId,
        faceEncoding,
      }
    );
    return response.data;
  },

  /**
   * Step 4: Get auth token after all verifications
   */
  getToken: async (userId: string): Promise<AuthToken> => {
    const response = await authAxios.post<AuthToken>("/auth/token", {
      userId,
    });
    return response.data;
  },

  /**
   * Resend OTP
   */
  resendOtp: async (userId: string): Promise<OtpResponse> => {
    const response = await authAxios.post<OtpResponse>("/auth/resend-otp", {
      userId,
    });
    return response.data;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    try {
      await authAxios.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");

    // Clear cookies for middleware
    if (typeof window !== "undefined") {
      cookies.remove("auth_token");
      cookies.remove("user_role");
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await authAxios.get<User>("/auth/me");
    return response.data;
  },

  /**
   * Store auth data in localStorage
   */
  storeAuth: (token: string, user: User): void => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(user));

    // Set cookies for middleware
    if (typeof window !== "undefined") {
      cookies.set("auth_token", token);
      cookies.set("user_role", user.role);
    }
  },

  /**
   * Get stored token
   */
  getStoredToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  },

  /**
   * Get stored user
   */
  getStoredUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!authService.getStoredToken();
  },
};

export default authService;
