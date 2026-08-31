// app/esewa-payment/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Shield,
  Lock,
  CreditCard,
  Wallet,
} from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

function EsewaPaymentComp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const html = searchParams.get("html");
  const transactionUuid = searchParams.get("transactionUuid");

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Handle payment verification
  const verifyPayment = async (data: string) => {
    try {
      setIsVerifying(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setStatus("error");
        setErrorMessage("Authentication token not found. Please login again.");
        setIsVerifying(false);
        return;
      }

      let paymentData;
      try {
        paymentData = JSON.parse(atob(data));
      } catch (error) {
        console.log("Failed to decode eSewa data:", error);
        setStatus("error");
        setErrorMessage("Could not read eSewa payment response.");
        setIsVerifying(false);
        return;
      }

      console.log("eSewa response:", paymentData);

      const uuid = paymentData.transaction_uuid || transactionUuid;

      if (!uuid) {
        setStatus("error");
        setErrorMessage("Transaction UUID is missing.");
        setIsVerifying(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/v1/payments/esewa/verify/`,
        {
          transaction_uuid: uuid,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Verify response:", response.data);

      setStatus("success");
      setIsVerifying(false);

      // Redirect to bookings after delay
      setTimeout(() => {
        router.push("/tickets");
      }, 3000);
    } catch (error: any) {
      console.log("eSewa verification error:", error?.response?.data || error);
      setStatus("error");
      setErrorMessage(
        error?.response?.data?.message || "Could not verify your payment."
      );
      setIsVerifying(false);
    }
  };

  // Handle navigation events from iframe
  const handleMessage = (event: MessageEvent) => {
    const url = event.data;
    console.log("Iframe URL:", url);

    if (typeof url !== "string") return;

    if (url.includes("/api/payment/esewa/success")) {
      try {
        const parsedUrl = new URL(url);
        const data = parsedUrl.searchParams.get("data");
        console.log("eSewa callback data:", data);

        if (data) {
          verifyPayment(data);
        } else {
          setStatus("error");
          setErrorMessage("eSewa did not return payment data.");
        }
      } catch (error) {
        console.log("Failed to parse eSewa callback:", error);
        setStatus("error");
        setErrorMessage("Failed to process payment response.");
      }
      return;
    }

    if (url.includes("/api/payment/esewa/failure")) {
      setStatus("error");
      setErrorMessage("Your eSewa payment was not completed.");
      return;
    }
  };

  // Handle iframe load
  useEffect(() => {
    if (html) {
      setIsLoading(false);
      setIframeLoaded(true);
    }
  }, [html]);

  // Listen for messages from iframe
  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  if (!html) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-indigo-50/30">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h3 className="text-xl font-bold text-gray-900 mt-4">Invalid Payment</h3>
          <p className="text-sm text-slate-400 mt-2">No payment data found.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // If verification is complete
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-emerald-100/30">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center"
        >
          <div className="w-24 h-24 rounded-full bg-linear-to-r from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-4">Payment Successful! 🎉</h2>
          <p className="text-slate-500 mt-2">
            Your payment has been completed. Redirecting to bookings...
          </p>
          <div className="mt-6">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          </div>
        </motion.div>
      </div>
    );
  }

  // If verification failed
  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-red-100/30">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center"
        >
          <div className="w-24 h-24 rounded-full bg-linear-to-r from-red-500 to-red-600 flex items-center justify-center mx-auto shadow-lg shadow-red-500/25">
            <XCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-4">Payment Failed</h2>
          <p className="text-slate-500 mt-2">{errorMessage || "Something went wrong."}</p>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() => {
                setStatus("loading");
                setErrorMessage("");
                setIframeLoaded(true);
                window.location.reload();
              }}
              className="bg-linear-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="text-slate-400 font-medium hover:text-slate-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-indigo-50/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Loading payment gateway...</p>
        </motion.div>
      </div>
    );
  }

  // If status is idle or verifying
  const isVerifyingStatus = status === "loading" && isVerifying;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">eSewa Payment</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Secure Payment</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Payment Status */}
        {isVerifyingStatus && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            <span className="text-sm font-medium text-amber-700">
              Verifying your payment...
            </span>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-indigo-700">Secure Payment</p>
            <p className="text-xs text-indigo-600">
              Your payment is being processed through eSewa's secure gateway.
              Please do not close this window.
            </p>
          </div>
        </div>

        {/* eSewa Payment Iframe */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
          <div className="relative w-full" style={{ height: "600px" }}>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                  <p className="mt-4 text-sm text-slate-400 font-medium">
                    Loading eSewa payment...
                  </p>
                </div>
              </div>
            )}
            <iframe
              srcDoc={decodeURIComponent(html)}
              className="w-full h-full border-0"
              title="eSewa Payment"
              onLoad={() => {
                setIframeLoaded(true);
                setIsLoading(false);
              }}
              sandbox="allow-scripts allow-forms allow-same-origin"
              allow="payment"
            />
          </div>
        </div>

        {/* Payment Information */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50">
            <p className="text-xs text-slate-400 font-medium">Payment Method</p>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              eSewa
            </p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50">
            <p className="text-xs text-slate-400 font-medium">Transaction ID</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {transactionUuid ? transactionUuid.slice(0, 20) + "..." : "N/A"}
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400">
            Having issues? Contact our support team at{" "}
            <a href="mailto:support@subhyatra.com" className="text-indigo-600 font-medium hover:underline">
              support@subhyatra.com
            </a>
          </p>
        </div>
      </main>

      {/* Verification Overlay */}
      {isVerifyingStatus && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
            <h3 className="text-xl font-bold text-gray-900 mt-4">Verifying Payment</h3>
            <p className="text-sm text-slate-400 mt-2">
              Please wait while we confirm your payment...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EsewaPayment() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EsewaPaymentComp />
    </Suspense>
  );
}