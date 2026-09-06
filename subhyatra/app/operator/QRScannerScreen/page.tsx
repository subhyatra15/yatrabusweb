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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Html5Qrcode } from "html5-qrcode";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

export default function QRScannerPage() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScannerReady, setIsScannerReady] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    const startScanner = async () => {
      try {
        console.log("Creating scanner instance...");
        
        // Create instance
        html5QrCodeRef.current = new Html5Qrcode("qr-reader-container");
        
        const onScanSuccess = async (decodedText: string) => {
          if (isScanningRef.current || scanned || isVerifying) return;
          isScanningRef.current = true;
          console.log("QR Code scanned:", decodedText);
          await handleBarCodeScanned(decodedText);
          isScanningRef.current = false;
        };

        const onScanError = (errorMessage: string) => {
          // Ignore - this is called for every frame
          // Only log actual errors
          if (errorMessage && errorMessage.includes('NotAllowedError')) {
            setError("Camera permission denied. Please enable camera access.");
          } else if (errorMessage && errorMessage.includes('NotFoundError')) {
            setError("No camera found. Please ensure your device has a camera.");
          }
        };

        // Start scanning
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          onScanSuccess,
          onScanError
        );
        
        setIsScannerReady(true);
        console.log("Camera started successfully!");
      } catch (err: any) {
        console.error("Error starting scanner:", err);
        if (err.message?.includes('Permission')) {
          setError("Camera permission denied. Please enable camera access.");
        } else if (err.message?.includes('NotFound')) {
          setError("No camera found. Please ensure your device has a camera.");
        } else {
          setError("Could not access camera. Please check permissions and try again.");
        }
      }
    };

    // Start scanner after a small delay to ensure DOM is ready
    const timer = setTimeout(startScanner, 500);

    return () => {
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear().catch(() => {});
      }
    };
  }, []);

  // Handle torch
  useEffect(() => {
    if (html5QrCodeRef.current && isScannerReady) {
      try {
        // @ts-ignore - applyVideoConstraints might not be in types
        html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: torchOn }],
        }).catch(() => {
          console.log("Torch not supported");
        });
      } catch (e) {
        console.error("Torch error:", e);
      }
    }
  }, [torchOn, isScannerReady]);

  const handleBarCodeScanned = async (data: string) => {
    if (scanned || isVerifying) return;

    setScanned(true);
    setIsVerifying(true);

    // Pause scanner while verifying
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.pause();
      } catch (e) {
        console.error("Error pausing scanner:", e);
      }
    }

    try {
      let qrToken = data.trim();
      let vehicleType = "bus";

      // Try to parse JSON
      try {
        const qrData = JSON.parse(data);
        qrToken = qrData.qr_token || qrData.raw || data;
        vehicleType = qrData.vehicleType || "bus";
      } catch {
        qrToken = data.trim();
      }

      // Validate token
      if (!qrToken || qrToken.length < 3 || qrToken === "ok" || qrToken === "OK") {
        setVerificationResult({
          success: false,
          message: "Invalid QR code. Please scan a valid ticket.",
          booking: null,
        });
        setShowResultModal(true);
        setIsVerifying(false);
        setScanned(false);
        // Resume scanner
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.resume();
          } catch (e) {
            console.error("Error resuming scanner:", e);
          }
        }
        return;
      }

      const result = await verifyTicket(qrToken, vehicleType);

      setVerificationResult({
        success: result.success,
        message: result.message,
        booking: result.booking,
        vehicleType: vehicleType,
      });
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

  const verifyTicket = async (qrToken: string, vehicleType: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Please login to verify tickets");
    }

    let response = null;
    let error = null;

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
      } catch (err2) {
        error = err2;
      }
    }

    if (!response) {
      if (error?.response?.status === 401) {
        throw new Error("Session expired. Please login again.");
      } else if (error?.response?.status === 404) {
        throw new Error("Ticket not found. Please check the QR code.");
      } else {
        throw new Error("Could not verify ticket. Please check your connection.");
      }
    }

    if (response.data?.booking) {
      const booking = response.data.booking;
      const isValidStatus = booking.booking_status === "PAID" || 
                           booking.booking_status === "CONFIRMED";

      if (isValidStatus) {
        return {
          success: true,
          message: "Ticket verified successfully!",
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
        message: response.data?.message || "Invalid ticket",
        booking: null,
      };
    }
  };

  const handleScanAgain = async () => {
    setScanned(false);
    setVerificationResult(null);
    setShowResultModal(false);
    
    // Resume scanner
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.resume();
      } catch (e) {
        console.error("Error resuming scanner:", e);
        // If resume fails, try restarting
        try {
          await html5QrCodeRef.current.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            async (decodedText: string) => {
              if (isScanningRef.current || scanned || isVerifying) return;
              isScanningRef.current = true;
              await handleBarCodeScanned(decodedText);
              isScanningRef.current = false;
            },
            (errorMessage: string) => {
              if (errorMessage && errorMessage.includes('NotAllowedError')) {
                setError("Camera permission denied.");
              }
            }
          );
        } catch (e) {
          console.error("Error restarting scanner:", e);
        }
      }
    }
  };

  const handleClose = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.error("Error closing scanner:", e);
      }
    }
    router.back();
  };

  const getSeatNumbers = (bookingSeats: any[]) => {
    if (!bookingSeats || bookingSeats.length === 0) return "N/A";
    return bookingSeats.map((seat: any) => 
      seat.seat_number || seat.seat?.seat_number || `Seat ${seat.id || '?'}`
    ).join(", ");
  };

  const getVehicleInfo = (vehicleType: string) => {
    const isHiace = vehicleType === "hiace";
    return {
      icon: isHiace ? Car : Bus,
      label: isHiace ? "Hiace" : "Bus",
      emoji: isHiace ? "🚐" : "🚌",
      bgColor: isHiace ? "bg-emerald-50" : "bg-indigo-50",
      textColor: isHiace ? "text-emerald-600" : "text-indigo-600",
    };
  };

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

  const vehicleInfo = verificationResult?.vehicleType
    ? getVehicleInfo(verificationResult.vehicleType)
    : getVehicleInfo("bus");
  const Icon = vehicleInfo.icon;

  return (
    <div className="min-h-screen bg-black relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-8 pb-4 flex items-center justify-between">
        <button
          onClick={handleClose}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-lg font-bold text-white">Scan QR Code</h2>
        <div className="w-11" />
      </div>

      {/* Scanner Container */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="relative w-full max-w-md aspect-square">
          {/* Camera feed - Html5Qrcode renders here */}
          <div 
            id="qr-reader-container" 
            className="w-full h-full bg-black rounded-2xl overflow-hidden"
          />

          {/* Error message if any */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl">
              <div className="text-center p-6">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-white text-sm">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-white/10 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/20"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Scanner Frame Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-3 border-l-3 border-indigo-500 rounded-tl" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-3 border-r-3 border-indigo-500 rounded-tr" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-3 border-l-3 border-indigo-500 rounded-bl" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-3 border-r-3 border-indigo-500 rounded-br" />
            
            {/* Scan line */}
            <motion.div
              animate={{
                top: ["15%", "85%", "15%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-lg shadow-indigo-500/50"
            />
          </div>

          {/* Dark overlay around QR box */}
          <div className="absolute inset-0 pointer-events-none bg-black/40" />

          {/* Scanning indicator */}
          {!scanned && !isVerifying && !error && isScannerReady && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-white/60 text-xs font-medium">Scanning...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-10">
        <p className="text-center text-white/60 text-sm mb-6">
          Position QR code within the frame
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
            onClick={handleScanAgain}
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
            <span className="text-white text-sm font-medium">Verifying...</span>
          </div>
        )}
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResultModal && verificationResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
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
                    verificationResult.success
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                      : "bg-gradient-to-r from-red-500 to-red-600"
                  )}
                >
                  {verificationResult.success ? (
                    <CheckCircle className="w-10 h-10 text-white" />
                  ) : (
                    <XCircle className="w-10 h-10 text-white" />
                  )}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-center text-gray-900">
                {verificationResult.success ? "Verified!" : "Verification Failed"}
              </h3>
              <p className="text-sm text-center text-slate-500 mt-1">
                {verificationResult.message}
              </p>

              {/* Booking Details */}
              {verificationResult.success && verificationResult.booking && (
                <>
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

                  <div className="bg-slate-50/80 rounded-xl p-4 mt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Booking #</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {verificationResult.booking.booking_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Passenger</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {verificationResult.booking.customer?.fullName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Seats</span>
                      <span className="text-sm font-semibold text-indigo-600">
                        {getSeatNumbers(verificationResult.booking.booking_seats)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Route</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {verificationResult.booking.schedule?.source_city} →{" "}
                        {verificationResult.booking.schedule?.destination_city}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Vehicle</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {verificationResult.booking.schedule?.bus_name ||
                         verificationResult.booking.schedule?.hiace_name}
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
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="text-sm font-bold text-gray-900">Amount</span>
                      <span className="text-lg font-bold text-indigo-600">
                        Rs. {verificationResult.booking.total_amount}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleScanAgain}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                >
                  <Scan className="w-5 h-5" />
                  {verificationResult.success ? "Scan Another" : "Try Again"}
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