// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";

// Get API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const userData = localStorage.getItem("userData");

        if (token && userData) {
          // Verify token validity with backend
          try {
            const response = await axios.get(
              `${API_URL}/api/v1/verify-token/`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                timeout: 5000,
              }
            );

            if (response.data && response.data.refresh) {
              const user = JSON.parse(userData);
              router.replace(user.role === "P" ? "/(tabs)" : "/(operator)");
              return;
            } else {
              // Token is invalid, clear storage
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              localStorage.removeItem("userData");
            }
          } catch (error) {
            // Token verification failed, clear storage
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userData");
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const validateForm = () => {
    if (!phoneNumber.trim()) {
      alert("Validation Error", "Please enter your phone number");
      return false;
    }
    if (phoneNumber.length < 10) {
      alert("Validation Error", "Please enter a valid phone number");
      return false;
    }
    if (!password.trim()) {
      alert("Validation Error", "Please enter your password");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const requestBody = {
        phone: phoneNumber.trim(),
        password: password,
      };

      const response = await axios.post(
        `${API_URL}/api/v1/login/`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.user.fullName) {
        // Store tokens
        if (response.data.access) {
          localStorage.setItem("accessToken", response.data.access);
        }
        if (response.data.refresh) {
          localStorage.setItem("refreshToken", response.data.refresh);
        }
        if (response.data.user) {
          localStorage.setItem(
            "userData",
            JSON.stringify(response.data.user)
          );
        }

        alert("Login Successful! 🎉", "Welcome back to SubhYatra!");
        router.push(response.data.user.role === "P" ? "/(tabs)" : "/(operator)");
      } else {
        alert(
          "Login Failed",
          response.data.message || "Invalid credentials. Please try again."
        );
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
          alert(
            "Login Failed",
            "Invalid phone number or password. Please check your credentials and try again."
          );
        } else if (status === 404) {
          alert(
            "Login Failed",
            "Account not found. Please register first or check your phone number."
          );
        } else if (status === 400) {
          alert("Login Failed", message);
        } else if (status === 500) {
          alert(
            "Server Error",
            "Our servers are experiencing issues. Please try again later."
          );
        } else {
          alert("Login Failed", message);
        }
      } else if (error.request) {
        alert(
          "Network Error",
          "Unable to connect to the server. Please check your internet connection and try again."
        );
      } else {
        alert(
          "Error",
          error.message || "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-4 text-indigo-600 font-medium">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-indigo-50/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20 mb-4">
              <div className="bg-white rounded-xl p-2">
                <Image
                  src="/eticketlogo.jpeg"
                  alt="SubhYatra Logo"
                  width={64}
                  height={64}
                  className="rounded-lg"
                />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              SubhYatra
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Your journey begins with a single click
            </p>
          </div>

          {/* Login Card */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Welcome Back
              </h2>
              <p className="text-gray-400 font-medium">
                Login to continue your journey
              </p>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-indigo-600" />
                </div>
                <input
                  type="tel"
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-indigo-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="98XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-indigo-600" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-indigo-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => !isLoading && setRememberMe(!rememberMe)}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                    rememberMe
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300 bg-white"
                  )}
                >
                  {rememberMe && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm font-medium text-gray-600">
                  Remember me
                </span>
              </button>
              {/* <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Forgot Password?
              </button> */}
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className={cn(
                "w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-3.5 font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40",
                isLoading && "opacity-70 cursor-not-allowed"
              )}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Register Link */}
            <div className="text-center">
              <span className="text-gray-600 font-medium">
                Don&apos;t have an account?{" "}
              </span>
              <Link
                href="/signup"
                className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
              >
                Register Now
              </Link>
            </div>

            {/* Guest Login - Commented out as in original */}
            {/* <div className="border-t border-gray-100 pt-4">
              <button
                onClick={() => router.push("/(tabs)")}
                className="w-full flex items-center justify-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors py-2"
                disabled={isLoading}
              >
                <span>Continue as Guest</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div> */}
          </div>

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs font-medium mt-8">
            By continuing, you agree to our Terms & Conditions
          </p>
        </div>
      </div>
    </div>
  );
}