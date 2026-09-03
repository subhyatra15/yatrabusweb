// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bus,
  Calendar,
  Wallet,
  TrendingUp,
  Scan,
  ArrowRight,
  Clock,
  Users,
  MapPin,
  ChevronRight,
  RefreshCw,
  Loader2,
  Bell,
  Radio,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  Car,
  Award,
  Shield,
  Star,
  BarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface Trip {
  id: number;
  route: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
  vehicle: string;
  bookedSeats: number;
  totalSeats: number;
}

interface Stats {
  totalTrips: number;
  todayTrips: number;
  activeTrips: number;
  totalEarnings: number;
  todayEarnings: number;
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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

// Trip Card Component
const TripCard = ({ trip, onPress }: { trip: Trip; onPress: () => void }) => {
  const StatusIcon = getStatusIcon(trip.status);
  const statusColor = getStatusColor(trip.status);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 hover:shadow-lg transition-all cursor-pointer"
      onClick={onPress}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{trip.route}</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ backgroundColor: statusColor + "15" }}
        >
          <StatusIcon className="w-3.5 h-3.5" style={{ color: statusColor }} />
          <span className="text-xs font-semibold" style={{ color: statusColor }}>
            {getStatusLabel(trip.status)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <span className="font-medium text-gray-900">{trip.from}</span>
        </div>
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-px border-t border-dashed border-slate-300" />
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="flex-1 h-px border-t border-dashed border-slate-300" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
          <span className="font-medium text-gray-900">{trip.to}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>{formatTime(trip.departure)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Bus className="w-4 h-4" />
            <span>{trip.vehicle}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Users className="w-4 h-4" />
            <span>{trip.bookedSeats}/{trip.totalSeats}</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    </motion.div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, value, label, gradient, color }: any) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="rounded-2xl p-4 shadow-lg flex-1 min-w-[calc(50%-6px)]"
    style={{ background: gradient }}
  >
    <Icon className="w-6 h-6 text-white/80" />
    <p className="text-xl font-extrabold text-white mt-2">{value}</p>
    <p className="text-xs text-white/80 font-medium mt-0.5">{label}</p>
  </motion.div>
);

// Quick Action Component
const QuickAction = ({ icon: Icon, label, onClick, gradient }: any) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2"
  >
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
      style={{ background: gradient }}
    >
      <Icon className="w-7 h-7 text-white" />
    </div>
    <span className="text-xs font-semibold text-slate-600 text-center">
      {label}
    </span>
  </motion.button>
);

export default function DriverDashboardPage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [driverName, setDriverName] = useState("Driver");
  const [stats, setStats] = useState<Stats>({
    totalTrips: 0,
    todayTrips: 0,
    activeTrips: 0,
    totalEarnings: 0,
    todayEarnings: 0,
  });
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    setGreeting(getGreeting());
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.error("No token found");
        router.push("/");
        return;
      }

      // Fetch driver profile
      const profileResponse = await axios.get(`${API_URL}/api/v1/auth/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDriverName(profileResponse.data.user?.fullName || "Driver");

      // Fetch stats
      const statsResponse = await axios.get(`${API_URL}/api/v1/driver/dashboard/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const statsData = statsResponse.data;
      setStats({
        totalTrips: statsData.stats?.total_trips_completed || 0,
        todayTrips: statsData.stats?.today_trips || 0,
        activeTrips: statsData.stats?.active_trips || 0,
        totalEarnings: statsData.stats?.total_earnings || 0,
        todayEarnings: statsData.stats?.today_earnings || 0,
      });

      // Fetch trips
      const tripsResponse = await axios.get(`${API_URL}/api/v1/driver/trips/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const trips = tripsResponse.data || [];

      const active = trips.filter((t: Trip) => t.status === "active");
      const upcoming = trips.filter((t: Trip) => t.status === "upcoming");

      setActiveTrips(active);
      setUpcomingTrips(upcoming);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        router.push("/");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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
          <p className="mt-6 text-indigo-600 font-medium">Loading dashboard...</p>
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
              <p className="text-sm text-slate-400 font-medium">{greeting} 👋</p>
              <h1 className="text-2xl font-extrabold text-gray-900">{driverName}</h1>
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
            
            </div>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-24">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <StatCard
            icon={Calendar}
            value={stats.todayTrips}
            label="Today's Trips"
            gradient="linear-gradient(135deg, #4f46e5, #7c3aed)"
          />
          <StatCard
            icon={Wallet}
            value={`Rs. ${stats.todayEarnings || 0}`}
            label="Today's Earnings"
            gradient="linear-gradient(135deg, #059669, #10b981)"
          />
          <StatCard
            icon={Bus}
            value={stats.activeTrips}
            label="Active Trips"
            gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          />
          <StatCard
            icon={TrendingUp}
            value={`Rs. ${stats.totalEarnings || 0}`}
            label="Total Earnings"
            gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-4">
            <QuickAction
              icon={Scan}
              label="Scan Ticket"
              onClick={() => router.push("/operator/QRScannerScreen")}
              gradient="linear-gradient(135deg, #4f46e5, #7c3aed)"
            />
            <QuickAction
              icon={Calendar}
              label="View Trips"
              onClick={() => router.push("/operator/driver-trips")}
              gradient="linear-gradient(135deg, #059669, #10b981)"
            />
            <QuickAction
              icon={Bus}
              label="My Vehicles"
              onClick={() => router.push("/operator/driver-vehicles")}
              gradient="linear-gradient(135deg, #f59e0b, #d97706)"
            />
          </div>
        </motion.div>

        {/* Active Trips */}
        {activeTrips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Active Trips</h3>
              <button
                onClick={() => router.push("/(operator)/driver-trips")}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                See All →
              </button>
            </div>
            <div className="space-y-3">
              {activeTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onPress={() => router.push(`/driver/trip/${trip.id}`)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Upcoming Trips</h3>
              <button
                onClick={() => router.push("/(operator)/driver-trips")}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                See All →
              </button>
            </div>
            <div className="space-y-3">
              {upcomingTrips.slice(0, 3).map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onPress={() => router.push(`/driver/trip/${trip.id}`)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {activeTrips.length === 0 && upcomingTrips.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16 bg-white/50 rounded-3xl"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
              <Calendar className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-4">No Trips Scheduled</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
              You don't have any active or upcoming trips. Check back later!
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}