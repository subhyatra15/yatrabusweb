// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";

// Get API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      alert("Validation Error", "Please enter your full name");
      return false;
    }
    if (!email.trim()) {
      alert("Validation Error", "Please enter your email address");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    if (!phoneNumber.trim()) {
      alert("Validation Error", "Please enter your phone number");
      return false;
    }
    if (phoneNumber.length < 10) {
      alert("Validation Error", "Please enter a valid phone number");
      return false;
    }
    if (!password.trim()) {
      alert("Validation Error", "Please create a password");
      return false;
    }
    if (password.length < 6) {
      alert("Validation Error", "Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      alert("Validation Error", "Passwords do not match");
      return false;
    }
    if (!agreeTerms) {
      alert("Validation Error", "Please agree to the Terms & Conditions");
      return false;
    }
    return true;
  };

  // Custom alert function for web
  const alert = (title: string, message: string) => {
    // You can replace this with a toast notification library like react-hot-toast
    window.alert(`${title}\n\n${message}`);
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const requestBody = {
        fullName: fullName.trim(),
        phone: phoneNumber.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      };

      const response = await axios.post(`${API_URL}/api/v1/register/`, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.data && response.data.success) {
        alert(
          "Registration Successful! 🎉",
          "Your account has been created successfully. Welcome to SubhYatra!"
        );
        router.push("/login");
      } else {
        alert(
          "Registration Failed",
          response.data.message || "Something went wrong. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Registration Error:", error);

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || "Server error occurred";

        if (status === 409) {
          alert(
            "Registration Failed",
            "This email or phone number is already registered. Please login or use different credentials."
          );
        } else if (status === 400) {
          alert("Registration Failed", message);
        } else if (status === 500) {
          alert(
            "Server Error",
            "Our servers are experiencing issues. Please try again later."
          );
        } else {
          alert("Registration Failed", message);
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
              Create your account and start your journey
            </p>
          </div>

          {/* Register Card */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Create Account
              </h2>
              <p className="text-gray-400 font-medium">
                Fill in the details to register
              </p>
            </div>

            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-indigo-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-indigo-600" />
                </div>
                <input
                  type="email"
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-indigo-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
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
                  placeholder="Create a password"
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

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-indigo-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <button
              onClick={() => !isLoading && setAgreeTerms(!agreeTerms)}
              className="flex items-center gap-3 mt-2"
              disabled={isLoading}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
                  agreeTerms
                    ? "bg-indigo-600 border-indigo-600"
                    : "border-gray-300 bg-white"
                )}
              >
                {agreeTerms && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-sm text-gray-600">
                I agree to the{" "}
                <span className="text-indigo-600 font-semibold">
                  Terms & Conditions
                </span>{" "}
                and{" "}
                <span className="text-indigo-600 font-semibold">
                  Privacy Policy
                </span>
              </span>
            </button>

            {/* Register Button */}
            <button
              onClick={handleRegister}
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
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center">
              <span className="text-gray-600 font-medium">
                Already have an account?{" "}
              </span>
              <Link
                href="/signin"
                className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs font-medium mt-8">
            By registering, you agree to our Terms & Conditions
          </p>
        </div>
      </div>
    </div>
  );
}