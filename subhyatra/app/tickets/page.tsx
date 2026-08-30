// @ts-nocheck

// app/bookings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  Bus,
  Car,
  Ticket,
  Clock,
  Calendar,
  MapPin,
  ArrowRight,
  ChevronRight,
  X,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Share2,
  QrCode,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  Info,
  Eye,
  MoreVertical,
  CalendarDays,
  User,
  Phone,
  Mail,
  MapPin as MapPinIcon,
  DollarSign,
  CreditCard,
  Receipt,
  Printer,
  Download,
  Star,
  TrendingUp,
  Award,
  Shield,
  Check,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface BookingSeat {
  seat: number;
  price: string;
  seat_number?: string;
}

interface Schedule {
  id: number;
  route: {
    id: number;
    operator: number;
    operator_name: string;
    bus: number;
    bus_name: string;
    source_city: number;
    source_city_name: string;
    destination_city: number;
    destination_city_name: string;
    distance: string;
    duration: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  departure_datetime: string;
  arrival_datetime: string;
  fare: string;
}

interface Customer {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
}

interface TransformedBooking {
  id: number;
  bookingNumber: string;
  from: string;
  to: string;
  date: string;
  time: string;
  busName: string;
  seat: string;
  price: string;
  status: "upcoming" | "completed" | "cancelled" | "pending" | "expired";
  duration: string;
  totalAmount: string;
  subtotal: string;
  discount: string;
  tax: string;
  seats: BookingSeat[];
  schedule: Schedule;
  customer: Customer;
  bookingStatus: string;
  createdAt: string;
  seatNumbers?: string[];
  expiredAt?: string;
  qrToken: string;
  vehicleType: "bus" | "hiace";
}

// Components
const TabButton = ({ 
  label, 
  count, 
  isActive, 
  onClick 
}: { 
  label: string; 
  count: number; 
  isActive: boolean; 
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap",
      isActive
        ? "bg-indigo-50/80 border-indigo-200 text-indigo-600"
        : "bg-slate-50/80 border-transparent text-slate-400 hover:bg-slate-100/80"
    )}
  >
    <span className="font-semibold text-sm capitalize">{label}</span>
    <span className={cn(
      "text-xs font-bold px-2 py-0.5 rounded-full",
      isActive
        ? "bg-indigo-100 text-indigo-600"
        : "bg-slate-200 text-slate-400"
    )}>
      {count}
    </span>
  </motion.button>
);

const BookingCard = ({ 
  booking, 
  onPress, 
  onQRPress 
}: { 
  booking: TransformedBooking; 
  onPress: () => void; 
  onQRPress: () => void;
}) => {
  const statusColors = {
    upcoming: "bg-blue-50 text-blue-600 border-blue-200",
    completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
    cancelled: "bg-red-50 text-red-600 border-red-200",
    pending: "bg-amber-50 text-amber-600 border-amber-200",
    expired: "bg-gray-50 text-gray-500 border-gray-200",
  };

  const statusLabels = {
    upcoming: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled",
    pending: "Pending Payment",
    expired: "Expired",
  };

  const statusIcons = {
    upcoming: ClockIcon,
    completed: CheckCircle,
    cancelled: XCircle,
    pending: AlertCircle,
    expired: Clock,
  };

  const StatusIcon = statusIcons[booking.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
      onClick={onPress}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
              booking.vehicleType === "hiace" 
                ? "bg-emerald-50" 
                : "bg-indigo-50"
            )}>
              {booking.vehicleType === "hiace" ? (
                <Car className="w-6 h-6 text-emerald-600" />
              ) : (
                <Bus className="w-6 h-6 text-indigo-600" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{booking.busName}</h4>
              <p className="text-sm text-slate-400">{booking.vehicleType === "hiace" ? "Hiace" : "Bus"}</p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold",
            statusColors[booking.status]
          )}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusLabels[booking.status]}
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-3 py-3 border-y border-slate-100">
          <div className="flex-1">
            <p className="font-bold text-gray-900">{booking.from}</p>
            <p className="text-xs text-slate-400">{booking.time}</p>
          </div>
          <div className="flex-1 text-center">
            <div className="h-px bg-slate-200 w-full relative">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-400" />
            </div>
            <p className="text-xs text-slate-400 mt-1">{booking.duration}</p>
          </div>
          <div className="flex-1 text-right">
            <p className="font-bold text-gray-900">{booking.to}</p>
            <p className="text-xs text-slate-400">{booking.date}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-xs text-slate-400 font-medium">Seats</p>
            <p className="font-semibold text-gray-900">{booking.seatNumbers?.join(", ")}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Total</p>
            <p className="font-extrabold text-indigo-600">Rs. {booking.totalAmount}</p>
          </div>
          {(booking.bookingStatus === "PAID" || booking.bookingStatus === "CONFIRMED") && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onQRPress();
              }}
              className="bg-linear-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <QrCode className="w-3.5 h-3.5" />
              QR Code
            </motion.button>
          )}
          {(booking.bookingStatus === "PENDING") && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onPress();
              }}
              className="bg-linear-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Pay Now
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Pending Payment Modal
const PendingPaymentModal = ({ 
  visible, 
  onClose, 
  booking, 
  onPayNow 
}: { 
  visible: boolean; 
  onClose: () => void; 
  booking: TransformedBooking | null; 
  onPayNow: () => void;
}) => {
  const [timeRemaining, setTimeRemaining] = useState({ minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!booking?.expiredAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiryTime = new Date(booking.expiredAt).getTime();
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
  }, [booking?.expiredAt]);

  if (!booking) return null;

  const totalSeconds = timeRemaining.minutes * 60 + timeRemaining.seconds;
  const totalInitialSeconds = 15 * 60;
  const progress = Math.min(totalSeconds / totalInitialSeconds, 1);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-linear-to-r from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-extrabold text-gray-900">Payment Pending</h3>
              <p className="text-sm text-slate-500 text-center mt-1">
                Complete your payment to confirm your booking
              </p>

              {/* Timer */}
              {!isExpired && booking.expiredAt && (
                <div className="w-full bg-slate-50 rounded-xl p-4 mt-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="text-center">
                      <span className={cn(
                        "text-3xl font-extrabold font-mono",
                        timeRemaining.minutes === 0 && timeRemaining.seconds < 60 ? "text-red-500" : "text-gray-900"
                      )}>
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-sm text-slate-400 font-medium ml-1">m</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-300">:</span>
                    <div className="text-center">
                      <span className={cn(
                        "text-3xl font-extrabold font-mono",
                        timeRemaining.minutes === 0 && timeRemaining.seconds < 60 ? "text-red-500" : "text-gray-900"
                      )}>
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-sm text-slate-400 font-medium ml-1">s</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        totalSeconds < 60 ? "bg-red-500" : "bg-amber-500"
                      )}
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {isExpired && (
                <div className="w-full bg-red-50 rounded-xl p-3 mt-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-semibold text-red-600">Booking has expired</span>
                </div>
              )}

              {/* Booking Summary */}
              <div className="w-full bg-slate-50 rounded-xl p-4 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Vehicle</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {booking.vehicleType === "hiace" ? "🚐 Hiace" : "🚌 Bus"} - {booking.busName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Route</span>
                  <span className="text-sm font-semibold text-gray-900">{booking.from} → {booking.to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Seats</span>
                  <span className="text-sm font-semibold text-gray-900">{booking.seatNumbers?.join(", ")}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-extrabold text-indigo-600">Rs. {booking.totalAmount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border-2 border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onPayNow}
                  disabled={isExpired || !booking.expiredAt}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all",
                    isExpired || !booking.expiredAt
                      ? "bg-slate-300 cursor-not-allowed"
                      : "bg-linear-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                  )}
                >
                  Pay Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// QR Code Modal
const QRCodeModal = ({ 
  visible, 
  onClose, 
  booking 
}: { 
  visible: boolean; 
  onClose: () => void; 
  booking: TransformedBooking | null;
}) => {
  const [showShare, setShowShare] = useState(false);

  if (!booking) return null;

  const handleShare = async () => {
    try {
      const shareMessage = 
        `🎫 Booking #${booking.bookingNumber}\n` +
        `🚌 Vehicle: ${booking.vehicleType === "hiace" ? "Hiace" : "Bus"} - ${booking.busName}\n` +
        `🔑 QR Token: ${booking.qrToken}\n` +
        `💺 Seats: ${booking.seatNumbers?.join(", ")}\n` +
        `📍 ${booking.from} → ${booking.to}\n` +
        `📅 ${booking.date}\n` +
        `🕐 ${booking.time}\n\n` +
        `Show this QR code to the conductor for verification.`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Booking ${booking.bookingNumber}`,
          text: shareMessage,
        });
      } else {
        await navigator.clipboard.writeText(shareMessage);
        alert("Booking details copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Booking QR Code</h3>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-900" />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-xl border-2 border-slate-200">
                {booking.qrToken ? (
                  <QRCodeCanvas
                    value={booking.qrToken}
                    size={200}
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                    level="H"
                  />
                ) : (
                  <div className="w-48 h-48 flex flex-col items-center justify-center bg-slate-50 rounded-lg">
                    <QrCode className="w-16 h-16 text-slate-300" />
                    <p className="text-sm text-slate-400 mt-2">No QR Code Available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-indigo-50 rounded-xl p-3 mb-4 space-y-1">
              <div className="flex items-center gap-2 text-sm text-indigo-600">
                <Info className="w-4 h-4" />
                <span className="font-medium">Scan this QR code for verification</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-600">
                <Ticket className="w-4 h-4" />
                <span className="font-medium">Token: {booking.qrToken.substring(0, 8)}...</span>
              </div>
            </div>

            {/* Details */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Booking #</span>
                <span className="text-sm font-semibold text-gray-900">{booking.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Vehicle</span>
                <span className="text-sm font-semibold text-gray-900">
                  {booking.vehicleType === "hiace" ? "🚐 Hiace" : "🚌 Bus"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Seats</span>
                <span className="text-sm font-semibold text-gray-900">{booking.seatNumbers?.join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Route</span>
                <span className="text-sm font-semibold text-gray-900">{booking.from} → {booking.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Date</span>
                <span className="text-sm font-semibold text-gray-900">{booking.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Time</span>
                <span className="text-sm font-semibold text-gray-900">{booking.time}</span>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <Share2 className="w-5 h-5" />
              Share Booking
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Empty State
const EmptyState = ({ tab, onExplore }: { tab: string; onExplore: () => void }) => {
  const messages = {
    upcoming: "No upcoming bookings found",
    completed: "No completed bookings yet",
    cancelled: "No cancelled bookings",
  };

  const icons = {
    upcoming: ClockIcon,
    completed: CheckCircle,
    cancelled: XCircle,
  };

  const Icon = icons[tab as keyof typeof icons] || Ticket;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
        <Icon className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mt-4">{messages[tab as keyof typeof messages] || "No bookings"}</h3>
      <p className="text-sm text-slate-400 mt-2">Start your journey with SubhYatra</p>
      <button
        onClick={onExplore}
        className="mt-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
      >
        Explore Buses
      </button>
    </motion.div>
  );
};

// Main Component
export default function BookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [bookings, setBookings] = useState<TransformedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<TransformedBooking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<TransformedBooking | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);

  // Helper functions
  const formatDate = (datetime: string): string => {
    if (!datetime) return "N/A";
    try {
      return format(new Date(datetime), "MMMM d, yyyy");
    } catch {
      return "N/A";
    }
  };

  const formatTime = (datetime: string): string => {
    if (!datetime) return "N/A";
    try {
      return format(new Date(datetime), "h:mm a");
    } catch {
      return "N/A";
    }
  };

  // Transform bookings
  const transformBookings = (apiBookings: any[]): TransformedBooking[] => {
    return apiBookings.map((booking) => {
      let status: "upcoming" | "completed" | "cancelled" | "pending" | "expired";
      const now = new Date();
      const departureDate = new Date(booking.schedule.departure_datetime);
      const bookingStatus = booking.booking_status?.toUpperCase() || "PENDING";
      const expiredAt = booking.expired_at ? new Date(booking.expired_at) : null;

      switch (bookingStatus) {
        case "PENDING":
          if (expiredAt && now > expiredAt) {
            status = "expired";
          } else {
            status = "pending";
          }
          break;
        case "PAID":
        case "CONFIRMED":
          if (departureDate < now) {
            status = "completed";
          } else {
            status = "upcoming";
          }
          break;
        case "COMPLETED":
          status = "completed";
          break;
        case "EXPIRED":
          status = "expired";
          break;
        case "CANCELLED":
          status = "cancelled";
          break;
        default:
          status = "pending";
      }

      const seatNumbers = booking.booking_seats.map((s: any) => {
        if (s.seat_number) return s.seat_number;
        return s.seat.toString();
      });

      const vehicleType = booking.vehicle_type || 'bus';

      return {
        id: booking.id,
        bookingNumber: booking.booking_number,
        from: booking.boarding_stop?.city || "N/A",
        to: booking.dropping_stop?.city || "N/A",
        date: formatDate(booking.schedule.departure_datetime),
        time: formatTime(booking.schedule.departure_datetime),
        busName: booking.schedule.route.bus_name || 
                booking.schedule?.bus_name || 
                (vehicleType === "hiace" ? "Hiace" : "Bus"),
        seat: seatNumbers.join(", ") || "N/A",
        seatNumbers: seatNumbers,
        price: `Rs. ${parseFloat(booking.total_amount).toFixed(2)}`,
        status: status,
        duration: booking.schedule.route.duration || "N/A",
        totalAmount: booking.total_amount,
        subtotal: booking.subtotal,
        discount: booking.discount,
        tax: booking.tax,
        seats: booking.booking_seats,
        schedule: booking.schedule,
        customer: booking.customer,
        bookingStatus: booking.booking_status,
        createdAt: booking.created_at,
        expiredAt: booking.expired_at,
        qrToken: booking.qr_token || "",
        vehicleType: vehicleType,
      };
    });
  };

  // Fetch customer details
  const fetchCustomerDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/api/v1/verify-token/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (response.data) {
        setCustomerDetails(response.data.user);
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  }, []);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");
      
      const [busBookingsResponse, hiaceBookingsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/v1/bookings/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 15000,
        }),
        axios.get(`${API_URL}/api/v1/hiace-bookings/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 15000,
        })
      ]);

      let allBookings = [];
      
      if (busBookingsResponse.data && busBookingsResponse.data.results) {
        const busBookings = busBookingsResponse.data.results.map((b: any) => ({
          ...b,
          vehicle_type: 'bus'
        }));
        allBookings = [...allBookings, ...busBookings];
      }
      
      if (hiaceBookingsResponse.data && hiaceBookingsResponse.data.results) {
        const hiaceBookings = hiaceBookingsResponse.data.results.map((b: any) => ({
          ...b,
          vehicle_type: 'hiace'
        }));
        allBookings = [...allBookings, ...hiaceBookings];
      }

      allBookings.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log("Total bookings:", allBookings.length);
      
      if (allBookings.length > 0) {
        const transformedBookings = transformBookings(allBookings);
        setBookings(transformedBookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      if (error.response?.status === 401) {
        // Handle unauthorized
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Get filtered bookings
  const getFilteredBookings = (): TransformedBooking[] => {
    return bookings.filter((booking) => {
      const now = new Date();
      const departureDate = new Date(booking.schedule.departure_datetime);
      
      switch (activeTab) {
        case "upcoming":
          return booking.status === "pending" || 
                 (booking.status === "upcoming" && departureDate >= now);
        case "completed":
          return booking.status === "completed";
        case "cancelled":
          return booking.status === "cancelled" || booking.status === "expired";
        default:
          return true;
      }
    });
  };

  // Handle booking press
  const handleBookingPress = (booking: TransformedBooking) => {
    if (booking.bookingStatus === "PAID" || booking.bookingStatus === "CONFIRMED") {
      setSelectedBooking(booking);
      setShowDetailsModal(true);
    } 
    else if (booking.bookingStatus === "PENDING") {
      if (booking.expiredAt) {
        const now = new Date();
        const expiryDate = new Date(booking.expiredAt);
        if (now > expiryDate) {
          alert("This booking has expired. Please create a new booking.");
          return;
        }
      }
      setPendingBooking(booking);
      setShowPendingModal(true);
    }
    else {
      alert(`This booking is ${booking.bookingStatus?.toLowerCase()}.`);
    }
  };

  // Handle show QR
  const handleShowQR = (booking: TransformedBooking) => {
    console.log("=== QR CODE DEBUG ===");
    console.log("Booking ID:", booking.id);
    console.log("QR Token:", booking.qrToken);
    console.log("Vehicle Type:", booking.vehicleType);

    if (!booking.qrToken) {
      alert("This booking doesn't have a QR code token.");
      return;
    }

    if (booking.bookingStatus === "PAID" || booking.bookingStatus === "CONFIRMED") {
      setSelectedBooking(booking);
      setShowQRModal(true);
    } else {
      alert(`QR code is only available for confirmed bookings. Current status: ${booking.bookingStatus}`);
    }
  };

  // Handle pay now
  const handlePayNow = () => {
    if (pendingBooking) {
      setShowPendingModal(false);
      router.push(`/payment?id=${pendingBooking.id}`);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  // Load data
  useEffect(() => {
    fetchBookings();
    fetchCustomerDetails();
  }, [fetchBookings, fetchCustomerDetails]);

  const filteredBookings = getFilteredBookings();
  const counts = {
    upcoming: bookings.filter(b => b.status === "pending" || b.status === "upcoming").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled" || b.status === "expired").length,
  };

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
              <Ticket className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Loading your bookings...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">My Bookings</h1>
              <p className="text-sm text-slate-400 font-medium">Track your journeys</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              className="w-10 h-10 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <RefreshCw className={cn(
                "w-5 h-5 text-white",
                refreshing && "animate-spin"
              )} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-12">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide"
        >
          {["upcoming", "completed", "cancelled"].map((tab) => (
            <TabButton
              key={tab}
              label={tab}
              count={counts[tab as keyof typeof counts] || 0}
              isActive={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </motion.div>

        {/* Bookings List */}
        <AnimatePresence mode="wait">
          {filteredBookings.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onPress={() => handleBookingPress(booking)}
                  onQRPress={() => handleShowQR(booking)}
                />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              tab={activeTab}
              onExplore={() => router.push("/")}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Pending Payment Modal */}
      <PendingPaymentModal
        visible={showPendingModal}
        onClose={() => {
          setShowPendingModal(false);
          setPendingBooking(null);
          fetchBookings();
        }}
        booking={pendingBooking}
        onPayNow={handlePayNow}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        visible={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
      />
    </div>
  );
}