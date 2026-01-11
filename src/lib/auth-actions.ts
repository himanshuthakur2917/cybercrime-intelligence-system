"use server";

import { createClient } from "@/lib/supabase/server";

export async function login(email: string, password: string) {
  try {
    // Validate inputs
    if (!email || !password) {
      return { error: "Email and password are required", success: false };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login error:", error);
      return { error: error.message, success: false };
    }

    if (!data?.user) {
      return { error: "Login failed", success: false };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Login error:", err);
    return { error: err?.message || "Login failed", success: false };
  }
}

export async function signup(
  email: string,
  password: string,
  role: "admin" | "officer"
) {
  try {
    // Validate inputs
    if (!email || !password) {
      return { error: "Email and password are required", success: false };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters", success: false };
    }

    const supabase = await createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
        },
      },
    });

    if (signUpError) {
      console.error("Supabase signup error:", signUpError);
      return { error: signUpError.message, success: false };
    }

    if (!data?.user) {
      return { error: "Failed to create user account", success: false };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Signup error:", err);
    return { error: err?.message || "Signup failed", success: false };
  }
}

export async function logout() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch (err: any) {
    console.error("Logout error:", err);
    return { error: err?.message || "Logout failed", success: false };
  }
}

export async function getSession() {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  } catch (err) {
    console.error("Session fetch error:", err);
    return null;
  }
}

export async function getUserRole() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.user_metadata?.role || null;
  } catch (err) {
    console.error("User role fetch error:", err);
    return null;
  }
}
