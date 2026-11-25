"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { api, persistAuthAndNavigate, authStorage, API_URL } from "@/lib/auth";
import { useGoogle } from "@/app/providers/GoogleProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle } = useGoogle();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // ---- Auth check on mount ----
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authStorage.getAccessToken();
        const user = authStorage.getUser();
        if (token && user) {
          try {
            const response = await api.get("/api/v1/verify-token/", {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            });
            if (response.data?.refresh) {
              router.replace(
                response.data.user.role === "P" ? "/tabs" : "/operator",
              );
              return;
            }
            authStorage.clear();
          } catch {
            authStorage.clear();
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const validateForm = () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    if (!password.trim()) {
      toast.error("Please enter your password");
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await api.post("/api/v1/login/", {
        phone: phoneNumber.trim(),
        password,
      });
      if (response.data?.user?.fullName) {
        const { route } = await persistAuthAndNavigate(response.data);
        toast.success("Login Successful! 🎉");
        setTimeout(() => router.replace(route), 600);
      } else {
        toast.error(response.data?.message || "Invalid credentials.");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.response) {
        const status = error.response.status;
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          "Server error occurred";
        if (status === 401) {
          toast.error(
            "Invalid phone number or password. Please check your credentials.",
          );
        } else if (status === 404) {
          toast.error(
            "Account not found. Please register first or check your phone number.",
          );
        } else if (status === 400) {
          toast.error(message);
        } else if (status === 500) {
          toast.error("Our servers are experiencing issues. Try again later.");
        } else {
          toast.error(message);
        }
      } else if (error.request) {
        toast.error("Network error. Check your connection and try again.");
      } else {
        toast.error(error.message || "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading || isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      const google = await signInWithGoogle();
      if (!google) return; // user cancelled — matches native flow

      const response = await api.post("/api/v1/auth/google/", {
        id_token: google.idToken,
        role: "P",
      });

      if (response.data?.access && response.data?.user) {
        const { route, isNewGoogleUser } = await persistAuthAndNavigate(
          response.data,
        );
        toast.success(
          isNewGoogleUser
            ? "Please add your phone number in Profile."
            : "Welcome back to YatraBus!",
        );
        setTimeout(() => router.replace(route), 600);
      } else {
        toast.error(
          response.data?.message || "Unexpected response from server.",
        );
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Google sign-in failed. Please try again.";
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4338ca] via-[#6d28d9] to-[#7c3aed]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faff] flex flex-col">
      {/* Hero panel */}
      <div className="relative bg-gradient-to-br from-[#4338ca] via-[#6d28d9] to-[#7c3aed] rounded-b-[44px] overflow-hidden">
        <div className="absolute w-[200px] h-[200px] rounded-full bg-white/[0.07] -top-[70px] -right-[60px]" />
        <div className="absolute w-[150px] h-[150px] rounded-full bg-white/[0.05] -bottom-[40px] -left-[40px]" />
        <div className="relative flex flex-col items-center pt-10 pb-16 px-6">
          <div className="relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-[130px] h-[130px] rounded-full bg-white/[0.12]" />
            <div className="relative w-24 h-24 rounded-3xl border-[1.5px] border-white/35 flex items-center justify-center mb-3">
              <div className="w-[78px] h-[78px] rounded-[20px] bg-white/[0.18] flex items-center justify-center">
                <Image
                  src="/eticketlogo.jpeg"
                  alt="YatraBus"
                  width={60}
                  height={60}
                  className="rounded-[14px] bg-white"
                />
              </div>
            </div>
          </div>
          <h1 className="text-[27px] font-extrabold text-white tracking-tight">
            YatraBus
          </h1>
          <p className="text-sm text-white/80 font-medium mt-1 text-center">
            Your journey begins with a single click
          </p>
          <div className="flex items-center gap-2.5 mt-4 bg-white/10 border border-white/[0.16] px-4 py-1.5 rounded-full">
            <span className="text-xs font-semibold text-white/90">Fast</span>
            <span className="w-[3px] h-[3px] rounded-full bg-white/50" />
            <span className="text-xs font-semibold text-white/90">Secure</span>
            <span className="w-[3px] h-[3px] rounded-full bg-white/50" />
            <span className="text-xs font-semibold text-white/90">Reliable</span>
          </div>
        </div>
      </div>

      {/* Floating card */}
      <div className="flex-1 px-5 pb-6">
        <div className="max-w-md w-full mx-auto -mt-14">
          <div className="relative bg-white rounded-[30px] p-6 pt-5 shadow-[0_16px_32px_rgba(49,46,129,0.16)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]" />
            <div className="w-10 h-1 rounded-full bg-[#e2e8f0] mx-auto mb-4 mt-3" />

            <h2 className="text-[23px] font-extrabold text-[#0f172a] tracking-tight text-center">
              Welcome Back
            </h2>
            <p className="text-sm text-[#94a3b8] font-medium mt-1 text-center mb-5">
              Login to continue your journey
            </p>

            <form onSubmit={handleLogin}>
              {/* Phone */}
              <label className="block text-[12.5px] font-bold text-[#475569] mb-1.5 ml-0.5">
                Phone Number
              </label>
              <div className="flex items-center bg-[#f8fafc] rounded-2xl border-[1.5px] border-[#eef1f6] px-2 min-h-[56px] gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#4f46e5]/10 flex items-center justify-center">
                  <svg
                    className="w-[17px] h-[17px] text-[#4f46e5]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <input
                  type="tel"
                  placeholder="98XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                  className="flex-1 bg-transparent outline-none text-[15.5px] font-medium text-[#0f172a] placeholder-[#a3aebd] py-3"
                />
              </div>

              {/* Password */}
              <label className="block text-[12.5px] font-bold text-[#475569] mb-1.5 ml-0.5">
                Password
              </label>
              <div className="flex items-center bg-[#f8fafc] rounded-2xl border-[1.5px] border-[#eef1f6] px-2 min-h-[56px] gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#4f46e5]/10 flex items-center justify-center">
                  <svg
                    className="w-[17px] h-[17px] text-[#4f46e5]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                  className="flex-1 bg-transparent outline-none text-[15.5px] font-medium text-[#0f172a] placeholder-[#a3aebd] py-3"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isLoading || isGoogleLoading}
                  className="text-[#94a3b8]"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Forgot */}
              <div className="flex justify-end mt-1 mb-3.5">
                <Link
                  href="/forgot-password"
                  className="flex items-center gap-1 text-[13px] font-semibold text-[#4f46e5]"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Remember me */}
              <button
                type="button"
                onClick={() => setRememberMe((v) => !v)}
                disabled={isLoading || isGoogleLoading}
                className="flex items-center gap-2.5 mb-5"
              >
                <span
                  className={`w-[42px] h-[25px] rounded-full p-[2.5px] flex items-center transition-colors ${
                    rememberMe ? "bg-[#4f46e5]" : "bg-[#e2e8f0]"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      rememberMe ? "translate-x-[17px]" : "translate-x-0"
                    }`}
                  />
                </span>
                <span className="text-sm font-semibold text-[#475569]">
                  Remember me
                </span>
              </button>

              {/* Login */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white font-bold text-[16.5px] py-4 shadow-[0_10px_20px_rgba(79,70,229,0.3)] disabled:opacity-70 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Login
                    <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                      <svg
                        className="w-3.5 h-3.5 text-[#4f46e5]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* OR */}
            <div className="flex items-center gap-3 mt-6 mb-3.5">
              <div className="flex-1 h-px bg-[#eef1f6]" />
              <span className="text-[12.5px] font-semibold text-[#94a3b8]">
                or
              </span>
              <div className="flex-1 h-px bg-[#eef1f6]" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-[#e2e8f0] bg-white py-3.5 min-h-[54px] shadow-sm disabled:opacity-70"
            >
              {isGoogleLoading ? (
                <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
              ) : (
                <>
                  <span className="w-[26px] h-[26px] rounded-full bg-white flex items-center justify-center">
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </span>
                  <span className="text-[15px] font-bold text-[#1f1f1f]">
                    Continue with Google
                  </span>
                </>
              )}
            </button>

            {/* New here */}
            <div className="flex items-center gap-3 mt-6 mb-3.5">
              <div className="flex-1 h-px bg-[#eef1f6]" />
              <span className="text-[12.5px] font-semibold text-[#94a3b8]">
                New here?
              </span>
              <div className="flex-1 h-px bg-[#eef1f6]" />
            </div>

            <Link
              href="/signup"
              className="block w-full text-center rounded-2xl border-[1.5px] border-[#e0e0fb] bg-[#f5f4ff] py-3.5 text-[15px] font-bold text-[#4f46e5]"
            >
              Create an Account
            </Link>
          </div>
        </div>

        <div className="flex justify-center items-center gap-1.5 mt-5">
          <span className="text-[#94a3b8] text-xs">🛡️</span>
          <p className="text-center text-[#94a3b8] text-xs font-medium">
            By continuing, you agree to our Terms & Conditions
          </p>
        </div>
      </div>
    </div>
  );
}