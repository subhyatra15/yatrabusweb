// @ts-nocheck

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  Bus,
  Car,
  User,
  Phone,
  Star,
  Wifi,
  Battery,
  Snowflake,
  Tv,
  Users,
  Armchair ,
  Wallet,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  OctagonX,
  ChevronRight,
  X,
  Loader2,
  RefreshCw,
  Info,
  Award,
  Shield,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface Passenger {
  id: number;
  name: string;
  seatNumber: string;
  bookingId: string;
  status: "confirmed" | "checked_in" | "cancelled";
  phone?: string;
  email?: string;
}

interface TripDetail {
  id: number;
  route: string;
  from: string;
  to: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  duration: string;
  vehicle: string;
  vehicleNumber: string;
  vehicleType: string;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  fare: number;
  status: "upcoming" | "active" | "completed" | "cancelled";
  driver: {
    name: string;
    phone: string;
    rating: number;
  };
  passengers: Passenger[];
  earnings: {
    total: number;
    platformFee: number;
    driverEarnings: number;
  };
  amenities: string[];
  stops: {
    name: string;
    time: string;
    type: "boarding" | "dropping";
  }[];
}

// Demo Data
const DEMO_TRIP: TripDetail = {
  id: 1,
  route: "Kathmandu → Pokhara",
  from: "Kathmandu",
  to: "Pokhara",
  departureDate: "2024-01-15T08:00:00",
  departureTime: "2024-01-15T08:00:00",
  arrivalDate: "2024-01-15T13:30:00",
  arrivalTime: "2024-01-15T13:30:00",
  duration: "5h 30m",
  vehicle: "Sajha Bus",
  vehicleNumber: "BA 1 KA 1234",
  vehicleType: "AC",
  totalSeats: 40,
  availableSeats: 8,
  bookedSeats: 32,
  fare: 1500,
  status: "active",
  driver: {
    name: "Ramesh Thapa",
    phone: "+977 980-1234567",
    rating: 4.8,
  },
  passengers: [
    {
      id: 1,
      name: "Rahul Sharma",
      seatNumber: "A1",
      bookingId: "BK-12345",
      status: "checked_in",
      phone: "+977 984-1234567",
      email: "rahul@example.com",
    },
    {
      id: 2,
      name: "Sita Giri",
      seatNumber: "A2",
      bookingId: "BK-12346",
      status: "confirmed",
      phone: "+977 984-1234568",
      email: "sita@example.com",
    },
    {
      id: 3,
      name: "Hari Poudel",
      seatNumber: "B1",
      bookingId: "BK-12347",
      status: "confirmed",
      phone: "+977 984-1234569",
      email: "hari@example.com",
    },
    {
      id: 4,
      name: "Gita Adhikari",
      seatNumber: "B2",
      bookingId: "BK-12348",
      status: "checked_in",
      phone: "+977 984-1234570",
      email: "gita@example.com",
    },
  ],
  earnings: {
    total: 48000,
    platformFee: 4800,
    driverEarnings: 43200,
  },
  amenities: ["WiFi", "Charging", "AC", "TV"],
  stops: [
    { name: "Kathmandu", time: "08:00 AM", type: "boarding" },
    { name: "Naubise", time: "09:30 AM", type: "boarding" },
    { name: "Malekhu", time: "10:30 AM", type: "dropping" },
    { name: "Pokhara", time: "01:30 PM", type: "dropping" },
  ],
};

 function TripDetailsPageComp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tripDetails, setTripDetails] = useState<TripDetail | null>(null);
  const [showPassengersModal, setShowPassengersModal] = useState(false);
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [showPassengerDetailModal, setShowPassengerDetailModal] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#22c55e";
      case "upcoming":
        return "#3b82f6";
      case "completed":
        return "#8b5cf6";
      case "cancelled":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "upcoming":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "completed":
        return "bg-purple-50 text-purple-600 border-purple-100";
      case "cancelled":
        return "bg-red-50 text-red-600 border-red-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return Play;
      case "upcoming":
        return Clock;
      case "completed":
        return CheckCircle;
      case "cancelled":
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const getPassengerStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#3b82f6";
      case "checked_in":
        return "#22c55e";
      case "cancelled":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const getPassengerStatusBgColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-50 text-blue-600";
      case "checked_in":
        return "bg-emerald-50 text-emerald-600";
      case "cancelled":
        return "bg-red-50 text-red-500";
      default:
        return "bg-slate-50 text-slate-400";
    }
  };

  const formatDate = (datetime: string) => {
    if (!datetime) return "N/A";
    try {
      const date = new Date(datetime);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatTime = (datetime: string) => {
    if (!datetime) return "N/A";
    try {
      const date = new Date(datetime);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "N/A";
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "WiFi":
        return Wifi;
      case "Charging":
        return Battery;
      case "AC":
        return Snowflake;
      case "TV":
        return Tv;
      default:
        return CheckCircle;
    }
  };

  // Fetch trip details
  const fetchTripDetails = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.log("No token found, using demo data");
        useDemoData();
        return;
      }

      const response = await axios.get(`${API_URL}/api/v1/driver/trips/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.id) {
        setTripDetails(response.data);
        setUsingDemoData(false);
      } else {
        console.log("Empty response, using demo data");
        useDemoData();
      }
    } catch (error: any) {
      console.error("Error fetching trip details:", error);
      useDemoData();

      if (error.response?.status === 401) {
        alert("Session Expired. Please login again.");
        router.push("/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, router]);

  const useDemoData = () => {
    setTripDetails(DEMO_TRIP);
    setUsingDemoData(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTripDetails();
  };

  // Load data
  useEffect(() => {
    if (id) {
      fetchTripDetails();
    }
  }, [id, fetchTripDetails]);

  const StatusIcon = tripDetails ? getStatusIcon(tripDetails.status) : AlertCircle;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
              <Bus className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Loading trip details...</p>
        </motion.div>
      </div>
    );
  }

  if (!tripDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mt-4">Trip not found</h3>
        <button
          onClick={() => router.back()}
          className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

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
              <h1 className="text-lg font-bold text-gray-900">Trip Details</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 transition-colors"
            >
              <Share2 className="w-5 h-5 text-indigo-600" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-24">
        {/* Demo Banner */}
        {usingDemoData && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
            <Info className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-600 font-medium">Showing demo data</span>
          </div>
        )}

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 mb-4 text-white shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${getStatusColor(tripDetails.status)}, ${getStatusColor(tripDetails.status)}dd)`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className="w-6 h-6" />
              <div>
                <p className="text-lg font-extrabold">
                  {tripDetails.status.charAt(0).toUpperCase() + tripDetails.status.slice(1)}
                </p>
                <p className="text-sm text-white/80">{tripDetails.route}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-white/80">
              {formatDate(tripDetails.departureDate)}
            </span>
          </div>
        </motion.div>

        {/* Route Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1 pt-0.5">
              <div className="w-3 h-3 rounded-full bg-indigo-600" />
              <div className="w-0.5 flex-1 bg-slate-200 min-h-[20px]" />
              <div className="w-3 h-3 rounded-full bg-purple-600 border-2 border-purple-200" />
            </div>
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">{tripDetails.from}</p>
                <p className="text-sm text-slate-400">{formatTime(tripDetails.departureTime)}</p>
              </div>
              <div className="flex-1 mx-4 text-center">
                <div className="h-px bg-slate-200 w-full" />
                <p className="text-xs text-slate-400 mt-1">{tripDetails.duration}</p>
                <div className="h-px bg-slate-200 w-full" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{tripDetails.to}</p>
                <p className="text-sm text-slate-400">{formatTime(tripDetails.arrivalTime)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-4"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-xl font-extrabold text-gray-900">{tripDetails.bookedSeats}</p>
            <p className="text-xs text-slate-400 font-medium">Booked Seats</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
              <Armchair  className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xl font-extrabold text-gray-900">{tripDetails.availableSeats}</p>
            <p className="text-xs text-slate-400 font-medium">Available</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
              <Wallet className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xl font-extrabold text-gray-900">Rs. {tripDetails.earnings.total}</p>
            <p className="text-xs text-slate-400 font-medium">Total Earnings</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
              <Bus className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xl font-extrabold text-gray-900">{tripDetails.totalSeats}</p>
            <p className="text-xs text-slate-400 font-medium">Total Seats</p>
          </div>
        </motion.div>

        {/* Vehicle Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <h3 className="font-bold text-gray-900 mb-3">Vehicle Information</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{tripDetails.vehicle}</p>
              <p className="text-sm text-slate-400">{tripDetails.vehicleNumber}</p>
            </div>
            <div className="bg-indigo-50 px-3 py-1 rounded-full">
              <span className="text-xs font-semibold text-indigo-600">{tripDetails.vehicleType}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            {tripDetails.amenities.map((amenity, index) => {
              const Icon = getAmenityIcon(amenity);
              return (
                <span key={index} className="flex items-center gap-1.5 bg-indigo-50/50 px-2.5 py-1 rounded-lg text-xs text-indigo-600 font-medium">
                  <Icon className="w-3.5 h-3.5" />
                  {amenity}
                </span>
              );
            })}
          </div>
        </motion.div>

        {/* Driver Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <h3 className="font-bold text-gray-900 mb-3">Driver Information</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{tripDetails.driver.name}</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-gray-700">{tripDetails.driver.rating}</span>
              </div>
            </div>
            <button className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 transition-colors">
              <Phone className="w-5 h-5 text-indigo-600" />
            </button>
          </div>
        </motion.div>

        {/* Passengers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Passengers</h3>
            <button
              onClick={() => setShowPassengersModal(true)}
              className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition-colors"
            >
              View All ({tripDetails.passengers.length})
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {tripDetails.passengers.slice(0, 3).map((passenger, index) => (
            <div
              key={passenger.id}
              className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors"
              onClick={() => {
                setSelectedPassenger(passenger);
                setShowPassengerDetailModal(true);
              }}
            >
              <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-indigo-600">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{passenger.name}</p>
                <p className="text-sm text-slate-400">Seat {passenger.seatNumber}</p>
              </div>
              <span className={cn(
                "text-xs font-semibold px-2.5 py-0.5 rounded-full",
                getPassengerStatusBgColor(passenger.status)
              )}>
                {passenger.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
          ))}
          {tripDetails.passengers.length > 3 && (
            <button
              onClick={() => setShowPassengersModal(true)}
              className="w-full text-center text-sm font-semibold text-indigo-600 py-2 mt-2 hover:text-indigo-700 transition-colors"
            >
              +{tripDetails.passengers.length - 3} more passengers
            </button>
          )}
          {tripDetails.passengers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-400 mt-2">No passengers booked yet</p>
            </div>
          )}
        </motion.div>

        {/* Stops */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Stops</h3>
            <button
              onClick={() => setShowStopsModal(true)}
              className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition-colors"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {tripDetails.stops.slice(0, 3).map((stop, index) => (
            <div key={index} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  stop.type === "boarding" ? "bg-emerald-500" : "bg-red-500"
                )} />
                {index < tripDetails.stops.length - 1 && (
                  <div className="w-0.5 flex-1 bg-slate-200 min-h-[12px]" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{stop.name}</p>
                <p className="text-sm text-slate-400">{stop.time}</p>
              </div>
              <span className={cn(
                "text-xs font-semibold px-2.5 py-0.5 rounded-full",
                stop.type === "boarding"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500"
              )}>
                {stop.type.toUpperCase()}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Earnings Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <h3 className="font-bold text-gray-900 mb-3">Earnings Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Bookings</span>
              <span className="font-semibold text-gray-900">Rs. {tripDetails.earnings.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Platform Fee</span>
              <span className="font-semibold text-red-500">- Rs. {tripDetails.earnings.platformFee}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Driver Earnings</span>
                <span className="text-lg font-extrabold text-indigo-600">
                  Rs. {tripDetails.earnings.driverEarnings}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        {(tripDetails.status === "upcoming" || tripDetails.status === "active") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-3"
          >
            {tripDetails.status === "upcoming" && (
              <button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all">
                <Play className="w-5 h-5" />
                Start Trip
              </button>
            )}
            {tripDetails.status === "active" && (
              <button className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
                <CheckCircle className="w-5 h-5" />
                Complete Trip
              </button>
            )}
            {/* <button className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all">
              <XCircle className="w-5 h-5" />
              Cancel Trip
            </button> */}
          </motion.div>
        )}
      </main>

      {/* Passengers Modal */}
      <AnimatePresence>
        {showPassengersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowPassengersModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Passengers</h3>
                  <button
                    onClick={() => setShowPassengersModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto max-h-[60vh]">
                {tripDetails.passengers.length > 0 ? (
                  <div className="space-y-2">
                    {tripDetails.passengers.map((passenger, index) => (
                      <button
                        key={passenger.id}
                        onClick={() => {
                          setSelectedPassenger(passenger);
                          setShowPassengerDetailModal(true);
                          setShowPassengersModal(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900">{passenger.name}</p>
                          <p className="text-sm text-slate-400">Seat {passenger.seatNumber}</p>
                        </div>
                        <span className={cn(
                          "text-xs font-semibold px-2.5 py-0.5 rounded-full",
                          getPassengerStatusBgColor(passenger.status)
                        )}>
                          {passenger.status.replace("_", " ").toUpperCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-400 mt-2">No passengers yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stops Modal */}
      <AnimatePresence>
        {showStopsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowStopsModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">All Stops</h3>
                  <button
                    onClick={() => setShowStopsModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto max-h-[60vh]">
                {tripDetails.stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        stop.type === "boarding" ? "bg-emerald-500" : "bg-red-500"
                      )} />
                      {index < tripDetails.stops.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 min-h-[12px]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{stop.name}</p>
                      <p className="text-sm text-slate-400">{stop.time}</p>
                    </div>
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-0.5 rounded-full",
                      stop.type === "boarding"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-500"
                    )}>
                      {stop.type.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Passenger Detail Modal */}
      <AnimatePresence>
        {showPassengerDetailModal && selectedPassenger && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPassengerDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Passenger Details</h3>
                <button
                  onClick={() => setShowPassengerDetailModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-900" />
                </button>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mt-3">{selectedPassenger.name}</h4>
                <p className="text-sm text-slate-400">Booking #{selectedPassenger.bookingId}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50/80 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 font-medium">Seat Number</p>
                  <p className="font-bold text-gray-900">{selectedPassenger.seatNumber}</p>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 font-medium">Status</p>
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full inline-block",
                    getPassengerStatusBgColor(selectedPassenger.status)
                  )}>
                    {selectedPassenger.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 font-medium">Phone</p>
                  <p className="font-semibold text-gray-900">{selectedPassenger.phone || "N/A"}</p>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 font-medium">Email</p>
                  <p className="font-semibold text-gray-900">{selectedPassenger.email || "N/A"}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all">
                  <Phone className="w-4 h-4" />
                  Call
                </button>
                <button className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
                  <CheckCircle className="w-4 h-4" />
                  Check In
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default function TripDetailsPage() {
return (
    <>
    <Suspense fallback={<h1>Loading....</h1>}>
      <TripDetailsPageComp/>
    </Suspense>
    </>
)
}