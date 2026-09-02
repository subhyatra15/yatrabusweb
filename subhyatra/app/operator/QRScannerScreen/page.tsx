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
  const [isComponentMounted, setIsComponentMounted] = useState(false);

  const scannerRef = useRef<any>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);

  // Mark component as mounted
  useEffect(() => {
    setIsComponentMounted(true);
    return () => {
      setIsComponentMounted(false);
    };
  }, []);

  // Initialize QR scanner
  useEffect(() => {
    if (!isComponentMounted) return;

    let isMounted = true;
    let scannerInstance: any = null;
    let initTimeout: NodeJS.Timeout;

    const initScanner = async () => {
      try {
        setIsLoading(true);
        console.log("Starting scanner initialization...");

        // Check if we're in a browser environment
        if (typeof window === "undefined") {
          console.log("Not in browser environment");
          return;
        }

        // Check if element exists with retry
        let element = document.getElementById("qr-reader");
        let retries = 0;
        const maxRetries = 10;

        while (!element && retries < maxRetries) {
          console.log(`Waiting for QR reader element... Attempt ${retries + 1}`);
          await new Promise(resolve => setTimeout(resolve, 300));
          element = document.getElementById("qr-reader");
          retries++;
        }

        if (!element) {
          console.error("QR reader element not found after retries");
          if (isMounted) {
            setError("Scanner element not ready. Please refresh the page.");
            setIsLoading(false);
          }
          return;
        }

        console.log("QR reader element found:", element);

        // Clear any existing scanner
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
          } catch (e) {
            console.log("Cleanup existing scanner:", e);
          }
        }

        // Create new scanner instance
        scannerInstance = new Html5Qrcode("qr-reader");
        scannerRef.current = scannerInstance;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        console.log("Scanner config:", config);

        const onScanSuccess = (decodedText: string, decodedResult: any) => {
          console.log("QR Code scanned successfully:", decodedText);
          if (scanned || isVerifying) return;
          handleBarCodeScanned(decodedText);
        };

        const onScanError = (err: any) => {
          // Silently handle errors - this is normal during scanning
          console.debug("Scan error:", err);
        };

        console.log("Starting camera...");

        // Start scanning with camera
        await scannerInstance.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          onScanError
        );

        console.log("Camera started successfully!");

        if (isMounted) {
          setHasPermission(true);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Scanner initialization error:", err);
        console.error("Error details:", {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });

        if (isMounted) {
          // Check if it's a permission error
          if (err.message?.includes("permission") || err.message?.includes("denied")) {
            setHasPermission(false);
            setError("Camera permission denied. Please allow camera access in your browser settings.");
          } else if (err.message?.includes("NotFoundError") || err.message?.includes("device not found")) {
            setError("No camera found. Please ensure your device has a camera.");
          } else {
            setHasPermission(false);
            setError(err.message || "Failed to access camera. Please try again.");
          }
          setIsLoading(false);
        }
      }
    };

    // Add a small delay to ensure DOM is ready
    initTimeout = setTimeout(() => {
      initScanner();
    }, 500);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      if (scannerInstance) {
        try {
          scannerInstance.stop().catch(() => {});
          scannerInstance.clear();
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      }
      scannerRef.current = null;
    };
  }, [isComponentMounted]);

  // Handle torch toggle
  useEffect(() => {
    if (scannerRef.current && hasPermission) {
      try {
        scannerRef.current.applyVideoConstraints({
          facingMode: "environment",
          ...(torchOn && { advanced: [{ torch: true }] }),
        });
      } catch (e) {
        console.error("Torch toggle error:", e);
      }
    }
  }, [torchOn, hasPermission]);

  // Handle QR code scan
  const handleBarCodeScanned = async (data: string) => {
    if (scanned || isVerifying) return;

    setScanned(true);
    setIsVerifying(true);

    try {
      let qrToken = "";
      let vehicleType = "bus";

      // Try to parse as JSON first
      try {
        const qrData = JSON.parse(data);
        qrToken = qrData.qr_token || qrData.raw || data;
        vehicleType = qrData.vehicleType || "bus";
        console.log("Parsed QR data:", qrData);
      } catch {
        // Use raw data as token
        qrToken = data.trim();
        vehicleType = "bus";
        console.log("Using raw QR data as token");
      }

      console.log("QR Token:", qrToken);
      console.log("Vehicle Type:", vehicleType);

      // Validate token
      if (!qrToken || qrToken === "ok" || qrToken === "OK" || qrToken.length < 3) {
        setVerificationResult({
          success: false,
          message: "Invalid QR code. Please scan a valid ticket.",
          booking: null,
        });
        setShowResultModal(true);
        setIsVerifying(false);
        setScanned(false);
        return;
      }

      // Stop scanning while verifying
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          console.error("Stop scanner error:", e);
        }
      }

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
      // Don't reset scanned here - we'll reset when user clicks "Scan Another"
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

    // Clean token
    qrToken = qrToken.trim();

    let response = null;
    let error = null;

    console.log("Verifying ticket with token:", qrToken);
    console.log("Vehicle type:", vehicleType);

    // Try both endpoints based on vehicle type
    if (vehicleType === "hiace") {
      try {
        console.log("Trying hiace endpoint...");
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
        console.log("Hiace response:", response.data);
      } catch (err) {
        error = err;
        console.log("Hiace verification failed, trying bus...");
      }
    }

    // If hiace failed or vehicle type is bus, try bus endpoint
    if (!response && vehicleType !== "hiace") {
      try {
        console.log("Trying bus endpoint...");
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
        console.log("Bus response:", response.data);
      } catch (err) {
        error = err;
        console.log("Bus verification failed");
      }
    }

    // If still no response, try the other endpoint as fallback
    if (!response) {
      try {
        console.log("Trying bus endpoint as fallback...");
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
        console.log("Fallback bus response:", response.data);
      } catch (err) {
        error = err;
      }
    }

    if (!response) {
      try {
        console.log("Trying hiace endpoint as fallback...");
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
        console.log("Fallback hiace response:", response.data);
      } catch (err) {
        error = err;
      }
    }

    if (!response) {
      console.error("All verification attempts failed:", error);
      if (error?.response?.status === 401) {
        throw new Error("Session expired. Please login again.");
      } else if (error?.response?.status === 404) {
        throw new Error("Ticket not found. Please check the QR code.");
      } else if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Could not verify ticket. Please check your connection.");
      }
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
  const handleScanAgain = async () => {
    setScanned(false);
    setIsScanning(true);
    setVerificationResult(null);
    setShowResultModal(false);

    // Restart scanner if it was stopped
    if (scannerRef.current && hasPermission) {
      try {
        await scannerRef.current.resume();
      } catch (e) {
        console.error("Resume scanner error:", e);
        // Try to restart
        try {
          await scannerRef.current.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText: string) => {
              if (!scanned && !isVerifying) {
                handleBarCodeScanned(decodedText);
              }
            },
            (err: any) => console.debug(err)
          );
        } catch (restartError) {
          console.error("Restart scanner error:", restartError);
        }
      }
    }
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
          <p className="mt-2 text-white/40 text-sm">Please allow camera access when prompted</p>
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
          {error || "Please enable camera access in your browser settings to scan QR codes."}
        </p>
        <div className="mt-4 flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={() => {
              setIsLoading(true);
              setHasPermission(null);
              setError(null);
              // Re-initialize scanner
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={handleClose}
            className="text-slate-400 font-medium py-2 hover:text-slate-600 transition-colors"
          >
            Go Back
          </button>
        </div>
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
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="relative w-[300px] h-[300px]">
          {/* Scanner Frame */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500" />
          </div>

          {/* Scanner View */}
          <div
            id="qr-reader"
            className="w-full h-full"
            ref={qrReaderRef}
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
              if (scannerRef.current) {
                try {
                  scannerRef.current.resume();
                } catch (e) {
                  console.error("Resume error:", e);
                }
              }
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