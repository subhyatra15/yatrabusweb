// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bus,
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Loader2,
  Filter,
  Radio,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  LogIn,
  LogOut,
  X,
  ChevronDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface Passenger {
  id: number;
  name: string;
  seat: string;
}

interface Trip {
  id: number;
  route: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  date: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
  vehicle: string;
  vehicleNumber: string;
  bookedSeats: number;
  totalSeats: number;
  passengers: Passenger[];
}

// Helper functions
const formatTime = (datetime: string) => {
  if (!datetime) return "N/A";
  const date = new Date(datetime);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (datetime: string) => {
  if (!datetime) return "N/A";
  const date = new Date(datetime);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

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
      return Radio;
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

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const tabs = [
  { id: "upcoming", label: "Upcoming", icon: Clock },
  { id: "active", label: "Active", icon: Radio },
  { id: "completed", label: "Completed", icon: CheckCircle },
  { id: "cancelled", label: "Cancelled", icon: XCircle },
];

// Trip Card Component
const TripCard = ({ trip, onPress, onViewPassengers }: { 
  trip: Trip; 
  onPress: () => void; 
  onViewPassengers: () => void;
}) => {
  const StatusIcon = getStatusIcon(trip.status);
  const statusColor = getStatusColor(trip.status);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
      style={{ borderLeftColor: statusColor, borderLeftWidth: 4 }}
      onClick={onPress}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{trip.route}</p>
              <p className="text-sm text-slate-400">{trip.vehicle} • {trip.vehicleNumber}</p>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold",
            getStatusBgColor(trip.status)
          )}>
            <StatusIcon className="w-3.5 h-3.5" style={{ color: statusColor }} />
            {getStatusLabel(trip.status)}
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-3 py-3 border-y border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600" />
            <div>
              <p className="font-medium text-gray-900">{trip.from}</p>
              <p className="text-xs text-slate-400">{formatTime(trip.departure)}</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 px-2">
            <div className="flex-1 h-px border-t border-dashed border-slate-300" />
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="flex-1 h-px border-t border-dashed border-slate-300" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-600" />
            <div>
              <p className="font-medium text-gray-900">{trip.to}</p>
              <p className="text-xs text-slate-400">{formatTime(trip.arrival)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(trip.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              <span>{trip.bookedSeats}/{trip.totalSeats} seats</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewPassengers();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition-colors"
          >
            <User className="w-4 h-4" />
            {trip.passengers?.length || 0}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Passengers Modal Component
const PassengersModal = ({ 
  isOpen, 
  onClose, 
  trip 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  trip: Trip | null;
}) => {
  if (!trip) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={onClose}
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
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Passengers</h3>
                  <p className="text-sm text-slate-400">{trip.route} • {formatDate(trip.date)}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-900" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto max-h-[55vh]">
              {trip.passengers && trip.passengers.length > 0 ? (
                <div className="space-y-2">
                  {trip.passengers.map((passenger, index) => (
                    <motion.div
                      key={passenger.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 bg-slate-50/80 rounded-xl p-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{passenger.name}</p>
                        <p className="text-sm text-slate-400">Seat {passenger.seat}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-600">Checked In</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400 mt-4">No passengers yet</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100">
              <button
                onClick={onClose}
                className="w-full bg-slate-100 text-slate-600 font-semibold py-3.5 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function DriverTripsPage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showPassengersModal, setShowPassengersModal] = useState(false);

  // Fetch trips
  const fetchTrips = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(`${API_URL}/api/v1/driver/trips/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTrips(response.data);
      filterTrips(response.data);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterTrips = (tripData = trips) => {
    const filtered = tripData.filter((trip: Trip) => trip.status === activeTab);
    setFilteredTrips(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  // Load data on mount
  useEffect(() => {
    fetchTrips();
  }, []);

  // Filter when tab changes
  useEffect(() => {
    filterTrips();
  }, [activeTab, trips]);

  // Get counts for tabs
  const getTabCount = (tabId: string) => {
    return trips.filter((t) => t.status === tabId).length;
  };

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
          <p className="mt-6 text-indigo-600 font-medium">Loading trips...</p>
        </motion.div>
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
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">My Trips</h1>
              <p className="text-sm text-slate-400 font-medium">
                {filteredTrips.length} {activeTab} trips
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRefresh}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className={cn(
                  "w-5 h-5 text-slate-600",
                  refreshing && "animate-spin"
                )} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 transition-colors"
              >
                <Filter className="w-5 h-5 text-indigo-600" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-24">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide"
        >
          {tabs.map((tab) => {
            const count = getTabCount(tab.id);
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap",
                  isActive
                    ? "bg-indigo-50/80 border-indigo-200 text-indigo-600"
                    : "bg-slate-50/80 border-transparent text-slate-400 hover:bg-slate-100/80"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{tab.label}</span>
                {count > 0 && (
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    isActive
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-200 text-slate-400"
                  )}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Trip List */}
        <AnimatePresence mode="wait">
          {filteredTrips.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {filteredTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onPress={() => router.push(`/operator/trip-details?id=${trip.id}`)}
                  onViewPassengers={() => {
                    setSelectedTrip(trip);
                    setShowPassengersModal(true);
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white/50 rounded-3xl"
            >
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                {activeTab === "upcoming" && <Clock className="w-10 h-10 text-slate-300" />}
                {activeTab === "active" && <Radio className="w-10 h-10 text-slate-300" />}
                {activeTab === "completed" && <CheckCircle className="w-10 h-10 text-slate-300" />}
                {activeTab === "cancelled" && <XCircle className="w-10 h-10 text-slate-300" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mt-4">No {activeTab} trips</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                {activeTab === "upcoming"
                  ? "You don't have any upcoming trips scheduled"
                  : activeTab === "active"
                    ? "You don't have any active trips right now"
                    : activeTab === "completed"
                      ? "You haven't completed any trips yet"
                      : "You don't have any cancelled trips"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Passengers Modal */}
      <PassengersModal
        isOpen={showPassengersModal}
        onClose={() => {
          setShowPassengersModal(false);
          setSelectedTrip(null);
        }}
        trip={selectedTrip}
      />
    </div>
  );
}