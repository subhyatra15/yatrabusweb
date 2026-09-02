// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Scan,
  Flashlight,
  FlashlightOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  Bus,
  Car,
  User,
  MapPin,
  Calendar,
  Clock,
  Ticket,
  CreditCard,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

import { Html5Qrcode } from "html5-qrcode";

import dynamic from "next/dynamic";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface BookingDetails {
  id: number;
  booking_number: string;
  customer: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
  };
  schedule: {
    id: number;
    bus_name: string;
    bus_number: string;
    bus_type: string;
    source_city: string;
    destination_city: string;
    departure_datetime: string;
    arrival_datetime: string;
    total_seats: number;
    available_seats: number;
    booked_seats: number;
  };
  boarding_stop: {
    id: number;
    city: string;
    stop_order: number;
  };
  dropping_stop: {
    id: number;
    city: string;
    stop_order: number;
  };
  booking_status: string;
  total_amount: string;
  booking_seats: any[];
  created_at: string;
  vehicle_type?: "bus" | "hiace";
}

export default function QRScannerPage() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const scannerRef = useRef<any>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  // Initialize QR scanner
  useEffect(() => {
    const initScanner = async () => {
      try {
        setIsLoading(true);
        
        // Check if we're in a browser environment
        if (typeof window === "undefined") return;

        // Initialize the QR scanner
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        const onScanSuccess = (decodedText: string, decodedResult: any) => {
          if (scanned || isVerifying) return;
          handleBarCodeScanned(decodedText);
        };

        const onScanError = (err: any) => {
          // Silently handle errors
          console.debug("Scan error:", err);
        };

        await scanner.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          onScanError
        );

        setHasPermission(true);
        setError(null);
      } catch (err: any) {
        console.error("Scanner initialization error:", err);
        setHasPermission(false);
        setError(err.message || "Failed to access camera");
      } finally {
        setIsLoading(false);
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
          scannerRef.current.clear();
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      }
    };
  }, []);

  // Handle torch toggle
  useEffect(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.applyVideoConstraints({
          facingMode: "environment",
          ...(torchOn && { advanced: [{ torch: true }] }),
        });
      } catch (e) {
        console.error("Torch toggle error:", e);
      }
    }
  }, [torchOn]);

  // Handle QR code scan
  const handleBarCodeScanned = async (data: string) => {
    if (scanned || isVerifying) return;

    setScanned(true);
    setIsVerifying(true);

    try {
      let qrData: any;
      let vehicleType = "bus";
      let qrToken = "";

      try {
        qrData = JSON.parse(data);
        qrToken = qrData.qr_token || qrData.raw || data;
        vehicleType = qrData.vehicleType || "bus";
      } catch {
        qrData = { raw: data };
        qrToken = data;
        vehicleType = "bus";
      }

      console.log("QR Data:", qrData);
      console.log("QR Token:", qrToken);
      console.log("Vehicle Type:", vehicleType);

      const result = await verifyTicket(qrToken, vehicleType);

      if (result.success) {
        setVerificationResult({
          success: true,
          message: result.message || "Ticket verified successfully!",
          booking: result.booking,
          vehicleType: vehicleType,
        });
      } else {
        setVerificationResult({
          success: false,
          message: result.message || "Invalid ticket",
          booking: null,
          vehicleType: vehicleType,
        });
      }

      setShowResultModal(true);
    } catch (error: any) {
      console.error("Verification error:", error);
      setVerificationResult({
        success: false,
        message: error.message || "Verification failed. Please try again.",
        booking: null,
      });
      setShowResultModal(true);
    } finally {
      setIsVerifying(false);
    }
  };

  // Verify ticket with API
  const verifyTicket = async (qrToken: string, vehicleType: string) => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      throw new Error("Please login to verify tickets");
    }

    if (!qrToken) {
      throw new Error("Invalid QR code. Missing booking information.");
    }

    let response = null;
    let error = null;

    // Try both endpoints based on vehicle type
    if (vehicleType === "hiace") {
      try {
        response = await axios.get(
          `${API_URL}/api/v1/hiace-bookings/verify/?qr_token=${qrToken}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            timeout: 15000,
          }
        );
      } catch (err) {
        error = err;
        console.log("Hiace verification failed, trying bus...");
      }
    }

    // If hiace failed or vehicle type is bus, try bus endpoint
    if (!response && vehicleType !== "hiace") {
      try {
        response = await axios.get(
          `${API_URL}/api/v1/bookings/verify/?qr_token=${qrToken}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            timeout: 15000,
          }
        );
      } catch (err) {
        error = err;
        console.log("Bus verification failed");
      }
    }

    // If still no response, try the other endpoint as fallback
    if (!response) {
      try {
        response = await axios.get(
          `${API_URL}/api/v1/bookings/verify/?qr_token=${qrToken}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            timeout: 15000,
          }
        );
      } catch (err) {
        error = err;
      }
    }

    if (!response) {
      try {
        response = await axios.get(
          `${API_URL}/api/v1/hiace-bookings/verify/?qr_token=${qrToken}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            timeout: 15000,
          }
        );
      } catch (err) {
        error = err;
      }
    }

    if (!response) {
      throw new Error(error?.response?.data?.message || "Invalid ticket or booking not found");
    }

    console.log("Verification Response:", response.data);

    if (response.data) {
      if (response.data.booking) {
        const booking = response.data.booking;

        const isValidStatus = booking.booking_status === "PAID" ||
          booking.booking_status === "CONFIRMED";

        if (isValidStatus) {
          return {
            success: true,
            message: response.data.message || "Ticket verified successfully!",
            booking: booking,
          };
        } else {
          return {
            success: false,
            message: `Booking is ${booking.booking_status.toLowerCase()}. Cannot verify.`,
            booking: null,
          };
        }
      } else {
        return {
          success: false,
          message: response.data.message || "Invalid ticket",
          booking: null,
        };
      }
    } else {
      throw new Error("Invalid ticket or booking not found");
    }
  };

  // Extract seat numbers
  const getSeatNumbers = (bookingSeats: any[]) => {
    if (!bookingSeats || bookingSeats.length === 0) return "N/A";

    const seatNumbers = bookingSeats.map((seat: any) => {
      if (seat.seat_number) return seat.seat_number;
      if (seat.seat && seat.seat.seat_number) return seat.seat.seat_number;
      if (seat.seat) return `Seat ${seat.seat}`;
      return `Seat ${seat.id || '?'}`;
    });

    return seatNumbers.join(", ");
  };

  // Get vehicle info
  const getVehicleInfo = (vehicleType: string) => {
    const isHiace = vehicleType === "hiace";
    return {
      icon: isHiace ? Car : Bus,
      label: isHiace ? "Hiace" : "Bus",
      emoji: isHiace ? "🚐" : "🚌",
      color: isHiace ? "#059669" : "#4f46e5",
      bgColor: isHiace ? "bg-emerald-50" : "bg-indigo-50",
      textColor: isHiace ? "text-emerald-600" : "text-indigo-600",
    };
  };

  // Format date
  const formatDate = (datetime: string) => {
    if (!datetime) return "N/A";
    const date = new Date(datetime);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (datetime: string) => {
    if (!datetime) return "N/A";
    const date = new Date(datetime);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Handle scan again
  const handleScanAgain = () => {
    setScanned(false);
    setIsScanning(true);
    setVerificationResult(null);
    setShowResultModal(false);
  };

  // Handle close
  const handleClose = () => {
    router.back();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
              <Scan className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-white font-medium">Initializing scanner...</p>
        </motion.div>
      </div>
    );
  }

  // Permission denied
  if (hasPermission === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
        <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mt-4">No Camera Access</h3>
        <p className="text-sm text-slate-400 text-center mt-2 max-w-sm">
          Please enable camera access in your browser settings to scan QR codes.
        </p>
        <button
          onClick={handleClose}
          className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  const vehicleInfo = verificationResult?.vehicleType
    ? getVehicleInfo(verificationResult.vehicleType)
    : getVehicleInfo("bus");
  const Icon = vehicleInfo.icon;

  return (
    <div className="min-h-screen bg-black relative">
      {/* Scanner Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-8 pb-4 flex items-center justify-between">
        <button
          onClick={handleClose}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-lg font-bold text-white">Scan QR Code</h2>
        <div className="w-11" />
      </div>

      {/* QR Scanner */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-[300px] h-[300px]">
          {/* Scanner Frame */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500" />
          </div>

          {/* Scanner View */}
          <div
            id="qr-reader"
            className="w-full h-full"
            ref={videoRef}
          />

          {/* Scan Line Animation */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{
                top: ["10%", "90%", "10%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-lg shadow-indigo-500/50"
            />
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-10">
        <p className="text-center text-white/60 text-sm mb-6">
          Position the QR code within the frame
        </p>

        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => setTorchOn(!torchOn)}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
              {torchOn ? (
                <Flashlight className="w-6 h-6 text-yellow-400" />
              ) : (
                <FlashlightOff className="w-6 h-6 text-white/60" />
              )}
            </div>
            <span className="text-xs text-white/50">
              {torchOn ? "Flash On" : "Flash Off"}
            </span>
          </button>

          <button
            onClick={() => {
              setScanned(false);
              setIsScanning(true);
            }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
              <RefreshCw className="w-6 h-6 text-white/60" />
            </div>
            <span className="text-xs text-white/50">Reset</span>
          </button>
        </div>

        {isVerifying && (
          <div className="flex items-center justify-center gap-3 mt-4 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mx-auto max-w-[200px]">
            <Loader2 className="w-4 h-4 text-white animate-spin" />
            <span className="text-white text-sm font-medium">Verifying ticket...</span>
          </div>
        )}
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResultModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowResultModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Result Icon */}
              <div className="flex justify-center mb-4">
                <div
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center",
                    verificationResult?.success
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                      : "bg-gradient-to-r from-red-500 to-red-600"
                  )}
                >
                  {verificationResult?.success ? (
                    <CheckCircle className="w-10 h-10 text-white" />
                  ) : (
                    <XCircle className="w-10 h-10 text-white" />
                  )}
                </div>
              </div>

              {/* Result Text */}
              <h3 className="text-2xl font-extrabold text-center text-gray-900">
                {verificationResult?.success ? "Verified!" : "Verification Failed"}
              </h3>
              <p className="text-sm text-center text-slate-500 mt-1">
                {verificationResult?.message || "Unable to verify ticket"}
              </p>

              {/* Vehicle Badge */}
              {verificationResult?.success && verificationResult?.booking && (
                <div className="flex justify-center mt-4">
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full border",
                    vehicleInfo.bgColor,
                    vehicleInfo.textColor
                  )}>
                    <Icon className="w-4 h-4" />
                    <span className="font-semibold text-sm">
                      {vehicleInfo.emoji} {vehicleInfo.label}
                    </span>
                  </div>
                </div>
              )}

              {/* Booking Details */}
              {verificationResult?.success && verificationResult?.booking && (
                <div className="bg-slate-50/80 rounded-xl p-4 mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Booking Number</span>
                    <span className="text-sm font-semibold text-gray-900">
                      #{verificationResult.booking.booking_number || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Passenger</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {verificationResult.booking.customer?.fullName || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Seat Numbers</span>
                    <span className="text-sm font-semibold text-indigo-600">
                      {getSeatNumbers(verificationResult.booking.booking_seats)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Route</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {verificationResult.booking.schedule?.source_city || "N/A"} →{" "}
                      {verificationResult.booking.schedule?.destination_city || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Vehicle</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {verificationResult.booking.schedule?.bus_name ||
                       verificationResult.booking.schedule?.hiace_name ||
                       "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Vehicle Number</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {verificationResult.booking.schedule?.bus_number ||
                       verificationResult.booking.schedule?.hiace_number ||
                       "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Date</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDate(verificationResult.booking.schedule?.departure_datetime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Time</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatTime(verificationResult.booking.schedule?.departure_datetime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Boarding</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {verificationResult.booking.boarding_stop?.city || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Dropping</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {verificationResult.booking.dropping_stop?.city || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Status</span>
                    <span className={cn(
                      "text-xs font-semibold px-3 py-1 rounded-full",
                      verificationResult.booking.booking_status === "PAID" ||
                      verificationResult.booking.booking_status === "CONFIRMED"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    )}>
                      {verificationResult.booking.booking_status || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-sm font-bold text-gray-900">Amount</span>
                    <span className="text-lg font-extrabold text-indigo-600">
                      Rs. {verificationResult.booking.total_amount || 0}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleScanAgain}
                  className={cn(
                    "w-full rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-lg transition-all",
                    verificationResult?.success
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40"
                  )}
                >
                  {verificationResult?.success ? (
                    <>
                      <Scan className="w-5 h-5" />
                      Scan Another
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Try Again
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowResultModal(false);
                    handleScanAgain();
                  }}
                  className="w-full text-slate-400 font-medium py-2 hover:text-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}