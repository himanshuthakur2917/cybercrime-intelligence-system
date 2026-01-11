"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "officer">("officer");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      console.log("Attempting login with:", { email });

      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        // Check if it's an email confirmation error
        if (error.message?.includes("Email not confirmed")) {
          setError("Please confirm your email before logging in.");
          setShowResendEmail(true);
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        console.log("Login successful, redirecting...");
        // Small delay to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Login failed. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login fetch error:", err);
      setError(`Network error: ${err?.message || "Failed to connect to server"}`);
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      console.log("Attempting signup with:", { email, role });

      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        const errorMsg = error.message?.toLowerCase() || "";
        
        // Check if user is already registered
        if (errorMsg.includes("already registered") || errorMsg.includes("user already exists")) {
          setError("This email is already registered. You can sign in or delete this account to create a new one.");
          setShowResendEmail(true); // Reuse this flag to show delete button
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        console.log("Signup successful, redirecting...");
        // Small delay to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Signup failed. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Signup fetch error:", err);
      setError(`Network error: ${err?.message || "Failed to connect to server"}`);
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resendEnvelope({
        type: "signup",
        email,
      });

      if (error) {
        setError(`Failed to resend email: ${error.message}`);
      } else {
        setError("Confirmation email sent! Please check your inbox.");
        setShowResendEmail(false);
      }
    } catch (err: any) {
      setError(`Network error: ${err?.message || "Failed to resend email"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the user with email ${email}? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(`Failed to delete user: ${data.error}`);
        return;
      }

      setError("User deleted successfully! You can now sign up with this email.");
      setShowResendEmail(false);
      // Clear form
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(`Network error: ${err?.message || "Failed to delete user"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
      <div className="w-full max-w-md bg-[#0f172a] p-8 rounded-xl shadow-xl border border-[#1e293b]">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          CIS | Secure Authentication
        </h1>
        <p className="text-center text-gray-400 text-sm mb-6">
          {isSignup ? "Create a new account" : "Sign in to your account"}
        </p>

        <form onSubmit={isSignup ? handleSignup : handleLogin}>
          {/* Email Input */}
          <div className="mb-4">
            <label className="text-white text-sm font-medium mb-2 block">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full p-3 rounded bg-[#020617] text-white placeholder-gray-600 border border-[#1e293b] focus:border-blue-500 focus:outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="text-white text-sm font-medium mb-2 block">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-3 rounded bg-[#020617] text-white placeholder-gray-600 border border-[#1e293b] focus:border-blue-500 focus:outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Role Selection Dropdown - Only show on signup */}
          {isSignup && (
            <div className="mb-4">
              <label className="text-white text-sm font-medium mb-2 block">
                Select Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "officer")}
                className="w-full p-3 rounded bg-[#020617] text-white border border-[#1e293b] focus:border-blue-500 focus:outline-none transition cursor-pointer appearance-none bg-no-repeat bg-right pr-10"
              >
                <option value="officer" className="bg-[#020617] text-white">
                  Officer
                </option>
                <option value="admin" className="bg-[#020617] text-white">
                  Admin
                </option>
              </select>
              <p className="text-gray-400 text-xs mt-1">
                Choose your role in the system
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded bg-red-900 bg-opacity-30 border border-red-600">
              <p className="text-red-400 text-sm">{error}</p>
              {showResendEmail && isSignup && (
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={loading}
                    className="block text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Resend confirmation email
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    disabled={loading}
                    className="block text-red-400 hover:text-red-300 text-sm underline"
                  >
                    Delete this account and start over
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded font-medium transition duration-200"
          >
            {loading ? "Processing..." : isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Toggle between login and signup */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {isSignup
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
              className="text-blue-500 hover:text-blue-400 font-medium transition"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
