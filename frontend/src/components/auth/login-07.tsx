"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  User,
  Phone,
  Camera,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { JSX, SVGProps, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService, LoginResponse } from "@/lib/auth";

// Auth step types
type AuthStep = "credentials" | "otp" | "face" | "success";

const CISLogo = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg
    fill="currentColor"
    height="48"
    viewBox="0 0 40 48"
    width="40"
    {...props}
  >
    <clipPath id="a">
      <path d="m0 0h40v48h-40z" />
    </clipPath>
    <g clipPath="url(#a)">
      <path d="m25.0887 5.05386-3.933-1.05386-3.3145 12.3696-2.9923-11.16736-3.9331 1.05386 3.233 12.0655-8.05262-8.0526-2.87919 2.8792 8.83271 8.8328-10.99975-2.9474-1.05385625 3.933 12.01860625 3.2204c-.1376-.5935-.2104-1.2119-.2104-1.8473 0-4.4976 3.646-8.1436 8.1437-8.1436 4.4976 0 8.1436 3.646 8.1436 8.1436 0 .6313-.0719 1.2459-.2078 1.8359l10.9227 2.9267 1.0538-3.933-12.0664-3.2332 11.0005-2.9476-1.0539-3.933-12.0659 3.233 8.0526-8.0526-2.8792-2.87916-8.7102 8.71026z" />
      <path d="m27.8723 26.2214c-.3372 1.4256-1.0491 2.7063-2.0259 3.7324l7.913 7.9131 2.8792-2.8792z" />
      <path d="m25.7665 30.0366c-.9886 1.0097-2.2379 1.7632-3.6389 2.1515l2.8794 10.746 3.933-1.0539z" />
      <path d="m21.9807 32.2274c-.65.1671-1.3313.2559-2.0334.2559-.7522 0-1.4806-.102-2.1721-.2929l-2.882 10.7558 3.933 1.0538z" />
      <path d="m17.6361 32.1507c-1.3796-.4076-2.6067-1.1707-3.5751-2.1833l-7.9325 7.9325 2.87919 2.8792z" />
      <path d="m13.9956 29.8973c-.9518-1.019-1.6451-2.2826-1.9751-3.6862l-10.95836 2.9363 1.05385 3.933z" />
    </g>
  </svg>
);

// Step indicator component
const StepIndicator = ({ currentStep }: { currentStep: AuthStep }) => {
  const steps = [
    { key: "credentials", label: "Credentials", icon: Lock },
    { key: "otp", label: "OTP", icon: Phone },
    { key: "face", label: "Face ID", icon: Camera },
  ];

  const getStepStatus = (stepKey: string) => {
    const stepOrder = ["credentials", "otp", "face", "success"];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => {
        const status = getStepStatus(step.key);
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                status === "completed"
                  ? "bg-green-500 border-green-500 text-white"
                  : status === "current"
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30 text-muted-foreground/50"
              }`}
            >
              {status === "completed" ? (
                <CheckCircle size={16} />
              ) : (
                <Icon size={14} />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  status === "completed" ? "bg-green-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function Login07() {
  const router = useRouter();

  // Redirection is now handled by middleware for initial load
  // But we still handle it after login success below

  // Auth state
  const [step, setStep] = useState<AuthStep>("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Credentials state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // User data from login
  const [loginData, setLoginData] = useState<LoginResponse | null>(null);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle credentials submission
  const handleCredentialsSubmit = async () => {
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(username, password);

      if (response.success) {
        setLoginData(response);
        setStep("otp");
        setOtpTimer(300); // Reset timer
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Invalid credentials";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1); // Only take last digit
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otpCode];
    pastedData.split("").forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtpCode(newOtp);
  };

  // Handle OTP verification
  const handleOtpSubmit = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.verifyOtp(loginData!.userId!, code);

      if (response.success) {
        // Check if face verification is required
        if (loginData?.requiresFace && loginData?.user?.faceRegistered) {
          setStep("face");
        } else {
          // Skip face verification, get token directly
          await completeLogin();
        }
      } else {
        setError(response.message || "Invalid OTP");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "OTP verification failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.resendOtp(loginData!.userId!);

      if (response.success) {
        setOtpTimer(300);
        setOtpCode(["", "", "", "", "", ""]);
        setError(null);
      } else {
        setError(response.message || "Failed to resend OTP");
      }
    } catch {
      setError("Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle face verification (simplified - skip for now)
  const handleFaceSkip = async () => {
    // For now, skip face verification
    await completeLogin();
  };

  // Complete login and redirect
  const completeLogin = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const tokenResponse = await authService.getToken(loginData!.userId!);

      // Store auth data
      authService.storeAuth(tokenResponse.access_token, tokenResponse.user);

      setStep("success");

      // Redirect based on role
      setTimeout(() => {
        const dashboard =
          tokenResponse.user.role === "administrator" ? "/admin" : "/dashboard";
        router.push(dashboard);
      }, 1500);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to complete login";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [loginData, router]);

  // Render based on current step
  const renderStep = () => {
    switch (step) {
      case "credentials":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="relative mt-2.5">
                <Input
                  id="username"
                  className="peer ps-9"
                  placeholder="Enter your username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCredentialsSubmit()
                  }
                />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <User size={16} aria-hidden="true" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-primary hover:underline">
                  Reset Password
                </a>
              </div>
              <div className="relative mt-2.5">
                <Input
                  id="password"
                  className="ps-9 pe-9"
                  placeholder="Enter your password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCredentialsSubmit()
                  }
                />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <Lock size={16} aria-hidden="true" />
                </div>
                <button
                  className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  aria-label={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                >
                  {isPasswordVisible ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleCredentialsSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue to Verification
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        );

      case "otp":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Phone className="h-12 w-12 mx-auto text-primary mb-3" />
              <h2 className="text-lg font-semibold">OTP Verification</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the 6-digit code sent to your registered phone
              </p>
              {loginData?.user?.phone && (
                <p className="text-xs text-muted-foreground mt-1">
                  Phone: {loginData.user.phone.replace(/\d(?=\d{4})/g, "*")}
                </p>
              )}
            </div>

            <div className="flex justify-center gap-2">
              {otpCode.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-12 text-center text-xl font-bold"
                />
              ))}
            </div>

            <div className="text-center">
              {otpTimer > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Code expires in{" "}
                  <span className="font-mono font-semibold text-primary">
                    {formatTimer(otpTimer)}
                  </span>
                </p>
              ) : (
                <Button
                  variant="link"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sm"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Resend OTP
                </Button>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleOtpSubmit}
              disabled={isLoading || otpCode.some((d) => !d)}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Verify OTP
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep("credentials");
                setOtpCode(["", "", "", "", "", ""]);
                setError(null);
              }}
            >
              Back to Login
            </Button>
          </div>
        );

      case "face":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Camera className="h-12 w-12 mx-auto text-primary mb-3" />
              <h2 className="text-lg font-semibold">Face Verification</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Look at the camera for identity verification
              </p>
            </div>

            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Camera className="h-16 w-16 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Camera Preview</p>
                <p className="text-xs mt-1">(Face recognition coming soon)</p>
              </div>
            </div>

            <Button className="w-full" onClick={handleFaceSkip}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Skip for Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        );

      case "success":
        return (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-green-600">
                Login Successful!
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to dashboard...
              </p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="mx-auto w-full max-w-sm space-y-6 p-6">
        <div className="space-y-2 text-center">
          <CISLogo className="mx-auto h-16 w-16" />
          <h1 className="text-3xl font-semibold">CIS Portal</h1>
          <p className="text-muted-foreground">
            Cybercrime Intelligence System
          </p>
        </div>

        {step !== "success" && <StepIndicator currentStep={step} />}

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {step === "credentials" && (
            <>
              <Button variant="outline" className="w-full justify-center gap-2">
                <Lock className="h-4 w-4" />
                Sign in with Government SSO
              </Button>

              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">
                  or sign in with credentials
                </span>
                <Separator className="flex-1" />
              </div>
            </>
          )}

          {renderStep()}

          {step === "credentials" && (
            <div className="text-center text-sm text-muted-foreground">
              Authorized personnel only. All access is monitored.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
