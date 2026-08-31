// app/payment/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bus,
  Wallet,
  CreditCard,
  Receipt,
  Calendar,
  Clock,
  Armchair,
  Shield,
  Check,
  Loader2,
  AlertCircle,
  Info,
  ChevronRight,
  Timer,
  DollarSign,
  Tag,
  CheckCircle,
  X,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import Image from "next/image";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface BookingData {
  busName: string;
  from: string;
  to: string;
  date: string;
  departure: string;
  arrival: string;
  seats: string[];
  seatCount: number;
  pricePerSeat: number;
  total: number;
  bookingFee: number;
  tax: number;
  grandTotal: number;
  bookingStatus: string;
  bookingNumber: string;
  discount: number;
}

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const formatTime = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "N/A";
  }
};

const formatExpiryTime = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "N/A";
  }
};

function PaymentPageComp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [selectedPayment, setSelectedPayment] = useState("esewa");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState({
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);
  const [expiredAt, setExpiredAt] = useState<string | null>(null);

  // Timer effect
  useEffect(() => {
    if (!expiredAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiryTime = new Date(expiredAt).getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeRemaining({ minutes: 0, seconds: 0 });
        return;
      }

      const minutes = Math.floor(difference / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiredAt]);

  // Fetch booking data
  useEffect(() => {
    if (id) {
      fetchBookingDetails(id);
    }
  }, [id]);

  const fetchBookingDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(`${API_URL}/api/v1/bookings/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 15000,
      });

      if (response.data) {
        const data = response.data;
        setBookingId(data.id);

        if (data.expired_at) {
          setExpiredAt(data.expired_at);
          const now = new Date().getTime();
          const expiryTime = new Date(data.expired_at).getTime();
          if (now >= expiryTime) {
            setIsExpired(true);
          }
        }

        const transformedData: BookingData = {
          busName: data.schedule?.bus_name || "Bus",
          from: data.boarding_stop?.city || "Source",
          to: data.dropping_stop?.city || "Destination",
          date: formatDate(data.schedule?.departure_datetime),
          departure: formatTime(data.schedule?.departure_datetime),
          arrival: formatTime(data.schedule?.arrival_datetime),
          seats: data.booking_seats?.map((seat: any) => seat.seat_number?.toString()) || [],
          seatCount: data.booking_seats?.length || 0,
          pricePerSeat: data.booking_seats?.length > 0 ? parseFloat(data.booking_seats[0].price) || 0 : 0,
          total: parseFloat(data.subtotal) || 0,
          bookingFee: 0,
          tax: parseFloat(data.tax) || 0,
          grandTotal: parseFloat(data.total_amount) || 0,
          bookingStatus: data.booking_status,
          bookingNumber: data.booking_number,
          discount: parseFloat(data.discount) || 0,
        };

        setBookingData(transformedData);
      }
    } catch (error: any) {
      console.error("Error fetching booking:", error);
      alert("Failed to load booking details. Please try again.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  // Pay With Esewa
  const payWithEsewa = async (booking_id: number) => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("Please login to continue");
        setIsProcessing(false);
        return;
      }

      if (!booking_id) {
        alert("Booking ID not found");
        setIsProcessing(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/v1/payments/esewa/initiate/`,
        {
          booking_id: booking_id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const d = response.data;

      if (!d.payment_url || !d.signature) {
        throw new Error("Invalid payment response");
      }

      // Build the form HTML for eSewa
      const formHtml = `
        <html>
          <head>
            <title>eSewa Payment</title>
            <style>
              body { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                background: #f5f5f5;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .container {
                text-align: center;
                padding: 40px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                max-width: 400px;
                width: 90%;
              }
              .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid #e2e8f0;
                border-top: 4px solid #4f46e5;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              h2 { color: #0f172a; margin-bottom: 8px; }
              p { color: #64748b; margin: 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="spinner"></div>
              <h2>Redirecting to eSewa</h2>
              <p>Please wait while we redirect you to the payment gateway...</p>
            </div>
            <form id="esewaForm" action="${d.payment_url}" method="POST" style="display:none;">
              <input type="hidden" name="amount" value="${d.amount}" />
              <input type="hidden" name="tax_amount" value="${d.tax_amount}" />
              <input type="hidden" name="total_amount" value="${d.total_amount}" />
              <input type="hidden" name="transaction_uuid" value="${d.transaction_uuid}" />
              <input type="hidden" name="product_code" value="${d.product_code}" />
              <input type="hidden" name="product_service_charge" value="${d.product_service_charge}" />
              <input type="hidden" name="product_delivery_charge" value="${d.product_delivery_charge}" />
              <input type="hidden" name="success_url" value="${d.success_url}" />
              <input type="hidden" name="failure_url" value="${d.failure_url}" />
              <input type="hidden" name="signed_field_names" value="${d.signed_field_names}" />
              <input type="hidden" name="signature" value="${d.signature}" />
            </form>
            <script>
              document.getElementById('esewaForm').submit();
            </script>
          </body>
        </html>
      `;

      // Open eSewa in a new window
      const newWindow = window.open(
        "",
        "eSewa Payment",
        "width=600,height=700,scrollbars=yes"
      );

      if (newWindow) {
        newWindow.document.write(formHtml);
        newWindow.document.close();
      } else {
        // Fallback: direct navigation
        window.location.href = d.payment_url;
      }
    } catch (error: any) {
      console.error("eSewa payment error:", error);
      alert(error.response?.data?.message || "Failed to initiate payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Pay With Khalti
  const payWithKhalti = async (booking_id: number) => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("Please login to continue");
        setIsProcessing(false);
        return;
      }

      if (!booking_id) {
        alert("Booking ID not found");
        setIsProcessing(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/v1/payments/khalti/initiate/`,
        {
          booking_id: booking_id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const d = response.data;

      if (!d.payment_url) {
        throw new Error("Invalid payment response");
      }

      // Open Khalti in a new window
      const newWindow = window.open(
        d.payment_url,
        "Khalti Payment",
        "width=600,height=700,scrollbars=yes"
      );

      if (!newWindow) {
        // Fallback: direct navigation
        window.location.href = d.payment_url;
      }
    } catch (error: any) {
      console.error("Khalti payment error:", error);
      alert(error.response?.data?.message || "Failed to initiate payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: "esewa",
      name: "eSewa",
      icon: Wallet,
      color: "#4f46e5",
      bg: "rgba(79, 70, 229, 0.1)",
      description: "Nepal's leading digital wallet",
    },
    {
      id: "khalti",
      name: "Khalti",
      icon: CreditCard,
      color: "#7c3aed",
      bg: "rgba(124, 58, 237, 0.1)",
      description: "Fast & secure digital payment",
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: CreditCard,
      color: "#2563eb",
      bg: "rgba(37, 99, 235, 0.1)",
      description: "Visa, Mastercard, and more",
    },
  ];

  const handlePayment = async () => {
    if (!bookingId) {
      alert("Booking ID not found. Please try again.");
      return;
    }

    if (!isBookingValid) {
      alert(`This booking is ${bookingData?.bookingStatus?.toLowerCase()}. Payment cannot be processed.`);
      return;
    }

    if (isExpired) {
      alert("This booking has expired. Please make a new booking.");
      return;
    }

    if (selectedPayment === "esewa") {
      await payWithEsewa(bookingId);
    } else if (selectedPayment === "khalti") {
      await payWithKhalti(bookingId);
    } else if (selectedPayment === "card") {
      alert("Card payment integration coming soon!");
    }
  };

  // Render Timer Component
  const renderTimer = () => {
    const { minutes, seconds } = timeRemaining;

    if (isExpired || (minutes === 0 && seconds === 0)) {
      return (
        <div className="flex items-center gap-2 bg-red-50 mx-4 mt-4 px-4 py-3 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold text-red-600">Booking Expired</span>
        </div>
      );
    }

    const totalSeconds = minutes * 60 + seconds;
    const totalInitialSeconds = 15 * 60;
    const progress = Math.min(totalSeconds / totalInitialSeconds, 1);

    return (
      <div className="bg-white mx-4 mt-4 rounded-xl border border-indigo-100/50 shadow-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-slate-600">Time Remaining</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              <span className={cn(
                "text-xl font-bold font-mono min-w-[24px] text-center",
                seconds < 10 && minutes === 0 ? "text-red-500" : "text-gray-900"
              )}>
                {String(minutes).padStart(2, "0")}
              </span>
              <span className="text-xs text-slate-400 font-medium">m</span>
            </div>
            <span className="text-lg font-bold text-slate-300">:</span>
            <div className="flex items-center gap-0.5">
              <span className={cn(
                "text-xl font-bold font-mono min-w-[24px] text-center",
                seconds < 10 && minutes === 0 ? "text-red-500" : "text-gray-900"
              )}>
                {String(seconds).padStart(2, "0")}
              </span>
              <span className="text-xs text-slate-400 font-medium">s</span>
            </div>
          </div>
        </div>
        <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              totalSeconds < 60 ? "bg-red-500" : "bg-indigo-600"
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
              <Receipt className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Loading booking details...</p>
        </motion.div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mt-4">Booking not found</h3>
        <button
          onClick={() => router.back()}
          className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isBookingValid =
    bookingData.bookingStatus !== "EXPIRED" &&
    bookingData.bookingStatus !== "CANCELLED" &&
    !isExpired;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </motion.button>
              <h1 className="text-lg font-bold text-gray-900">Payment</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Secure Payment</span>
            </div>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-32">
        {/* Timer Section */}
        {expiredAt && renderTimer()}

        {/* Booking Status Warning */}
        {!isBookingValid && (
          <div className="flex items-center gap-3 bg-red-50 mx-0 my-4 px-4 py-3 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium text-red-600">
              {isExpired
                ? "This booking has expired. Please make a new booking."
                : `This booking is ${bookingData.bookingStatus.toLowerCase()}. Payment cannot be processed.`}
            </span>
          </div>
        )}

        {/* Booking Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden mb-4"
        >
          <div className="p-5">
            <h3 className="font-bold text-gray-900 mb-4">Booking Summary</h3>

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{bookingData.busName}</p>
                  <p className="text-sm text-slate-500">
                    {bookingData.from} → {bookingData.to}
                  </p>
                </div>
              </div>
              <span className={cn(
                "text-xs font-semibold px-3 py-1 rounded-full",
                bookingData.bookingStatus === "CONFIRMED" && "bg-emerald-50 text-emerald-600",
                bookingData.bookingStatus === "EXPIRED" && "bg-red-50 text-red-600",
                bookingData.bookingStatus === "CANCELLED" && "bg-slate-100 text-slate-500",
                !bookingData.bookingStatus && "bg-amber-50 text-amber-600"
              )}>
                {bookingData.bookingStatus || "PENDING"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{bookingData.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{bookingData.departure} - {bookingData.arrival}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Armchair  className="w-4 h-4 text-slate-400" />
                <span>Seats: {bookingData.seats.join(", ")}</span>
              </div>
              {bookingData.bookingNumber && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span>#{bookingData.bookingNumber}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <h3 className="font-bold text-gray-900 mb-3">Payment Method</h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <motion.button
                key={method.id}
                whileHover={isBookingValid ? { scale: 1.01 } : {}}
                whileTap={isBookingValid ? { scale: 0.99 } : {}}
                onClick={() => {
                  if (isBookingValid) {
                    setSelectedPayment(method.id);
                  }
                }}
                disabled={!isBookingValid}
                className={cn(
                  "w-full flex items-center gap-4 bg-white/70 backdrop-blur-sm p-4 rounded-2xl border-2 transition-all shadow-sm",
                  selectedPayment === method.id
                    ? "border-indigo-500 bg-indigo-50/30 shadow-md shadow-indigo-500/10"
                    : "border-slate-200/50 hover:border-indigo-200",
                  !isBookingValid && "opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: method.bg }}
                >
                  <method.icon className="w-6 h-6" style={{ color: method.color }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">{method.name}</p>
                  <p className="text-sm text-slate-400">{method.description}</p>
                </div>
                {selectedPayment === method.id && (
                  <Check className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Price Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <h3 className="font-bold text-gray-900 mb-3">Price Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                {bookingData.seatCount} seats × Rs. {bookingData.pricePerSeat.toFixed(2)}
              </span>
              <span className="font-semibold text-gray-900">Rs. {bookingData.total.toFixed(2)}</span>
            </div>
            {bookingData.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600">Discount</span>
                <span className="font-semibold text-emerald-600">-Rs. {bookingData.discount.toFixed(2)}</span>
              </div>
            )}
            {bookingData.bookingFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Booking Fee</span>
                <span className="font-semibold text-gray-900">Rs. {bookingData.bookingFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax</span>
              <span className="font-semibold text-gray-900">Rs. {bookingData.tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="text-xl font-extrabold text-indigo-600">
                  Rs. {bookingData.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Promo Code */}
        {isBookingValid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 mb-4"
          >
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Enter promo code"
                className="flex-1 bg-transparent outline-none text-gray-900 placeholder-slate-400 font-medium"
              />
              <button className="bg-indigo-50 text-indigo-600 font-semibold px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors">
                Apply
              </button>
            </div>
          </motion.div>
        )}

        {/* Terms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-start gap-3 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50"
        >
          <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-500 leading-relaxed">
            By proceeding, you agree to our Terms & Conditions and Privacy Policy
          </p>
        </motion.div>
      </main>

      {/* Bottom Bar */}
      {isBookingValid && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 px-4 py-4 z-40"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total including fees</p>
              <p className="text-2xl font-extrabold text-indigo-600">
                Rs. {bookingData.grandTotal.toFixed(2)}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePayment}
              disabled={isProcessing}
              className={cn(
                "bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all",
                isProcessing && "opacity-70 cursor-not-allowed"
              )}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Pay Now
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25 mb-4">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900">Payment Successful! 🎉</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Your booking has been confirmed. You will receive a confirmation email shortly.
                </p>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 mt-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 font-medium">Booking ID</p>
                    <p className="font-bold text-gray-900">#{bookingData.bookingNumber || "N/A"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 font-medium">Amount Paid</p>
                    <p className="font-bold text-indigo-600">Rs. {bookingData.grandTotal.toFixed(2)}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push("/bookings");
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-3.5 font-semibold mt-4 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                >
                  View My Bookings
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push("/");
                  }}
                  className="w-full text-slate-400 font-medium py-2 mt-2 hover:text-slate-600 transition-colors"
                >
                  Go to Home
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentPageComp />
    </Suspense>
  );
}