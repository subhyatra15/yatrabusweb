
// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Wallet,
  Bus,
  Ticket,
  Star,
  Download,
  BarChart,
  PieChart,
  LineChart,
  Users,
  Award,
  Shield,
  Clock,
  MapPin,
  DollarSign,
  Activity,
  Loader2,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface ReportData {
  totalEarnings: number;
  totalTrips: number;
  totalBookings: number;
  averageRating: number;
  monthlyEarnings: { month: string; amount: number }[];
  weeklyTrips: { day: string; count: number }[];
  vehiclePerformance: { name: string; trips: number; earnings: number }[];
  routePopularity: { route: string; bookings: number }[];
}

// Demo data for fallback
const DEMO_DATA: ReportData = {
  totalEarnings: 125000,
  totalTrips: 150,
  totalBookings: 450,
  averageRating: 4.5,
  monthlyEarnings: [
    { month: "Jan", amount: 25000 },
    { month: "Feb", amount: 30000 },
    { month: "Mar", amount: 28000 },
    { month: "Apr", amount: 35000 },
    { month: "May", amount: 42000 },
    { month: "Jun", amount: 38000 },
  ],
  weeklyTrips: [
    { day: "Mon", count: 5 },
    { day: "Tue", count: 8 },
    { day: "Wed", count: 6 },
    { day: "Thu", count: 10 },
    { day: "Fri", count: 12 },
    { day: "Sat", count: 7 },
    { day: "Sun", count: 3 },
  ],
  vehiclePerformance: [
    { name: "Sajha Bus (BA 1 KA 1234)", trips: 50, earnings: 40000 },
    { name: "Sajha Hiace (BA 1 KA 5678)", trips: 35, earnings: 28000 },
    { name: "Express Bus (BA 2 KA 9012)", trips: 65, earnings: 57000 },
  ],
  routePopularity: [
    { route: "Kathmandu → Pokhara", bookings: 120 },
    { route: "Kathmandu → Butwal", bookings: 85 },
    { route: "Pokhara → Kathmandu", bookings: 75 },
    { route: "Butwal → Kathmandu", bookings: 60 },
    { route: "Kathmandu → Rampur", bookings: 45 },
  ],
};

// Color palette for charts
const COLORS = ["#4f46e5", "#059669", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6"];

// Stat Card Component
const StatCard = ({
  icon: Icon,
  value,
  label,
  color,
  trend,
  trendValue,
}: {
  icon: any;
  value: string;
  label: string;
  color: string;
  trend?: string;
  trendValue?: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 flex-1 min-w-[calc(50%-6px)]"
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
      style={{ backgroundColor: color + "15" }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <p className="text-xl font-extrabold text-gray-900">{value}</p>
    <p className="text-xs text-slate-400 font-medium">{label}</p>
    {trend && (
      <div className="flex items-center gap-1 mt-2" style={{ backgroundColor: color + "15" }}>
        {trend === "up" ? (
          <TrendingUp className="w-3 h-3 text-emerald-500" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-500" />
        )}
        <span className={cn(
          "text-xs font-semibold",
          trend === "up" ? "text-emerald-500" : "text-red-500"
        )}>
          {trendValue}
        </span>
      </div>
    )}
  </motion.div>
);

export default function DriverReportsPage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const periods = [
    { id: "weekly", label: "This Week" },
    { id: "monthly", label: "This Month" },
    { id: "yearly", label: "This Year" },
  ];

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.log("No token found, using demo data");
        setReportData(DEMO_DATA);
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/v1/driver/reports/?period=${selectedPeriod}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      console.log("Reports Response:", response.data);

      if (response.data && Object.keys(response.data).length > 0) {
        setReportData(response.data);
      } else {
        console.log("Empty response, using demo data");
        setReportData(DEMO_DATA);
      }
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      setReportData(DEMO_DATA);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  // Period Modal
  const PeriodModal = () => (
    <AnimatePresence>
      {showPeriodModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPeriodModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Select Period</h3>
              <button
                onClick={() => setShowPeriodModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-900" />
              </button>
            </div>
            <div className="space-y-1">
              {periods.map((period) => (
                <button
                  key={period.id}
                  onClick={() => {
                    setSelectedPeriod(period.id);
                    setShowPeriodModal(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between py-3.5 px-4 rounded-xl transition-all",
                    selectedPeriod === period.id && "bg-indigo-50/50 border border-indigo-100/50"
                  )}
                >
                  <span className={cn(
                    "font-medium",
                    selectedPeriod === period.id ? "text-indigo-600" : "text-slate-700"
                  )}>
                    {period.label}
                  </span>
                  {selectedPeriod === period.id && (
                    <Check className="w-5 h-5 text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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
              <BarChart className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Loading reports...</p>
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
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/(operator)")}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </motion.button>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Reports</h1>
                <p className="text-sm text-slate-400 font-medium">
                  {periods.find((p) => p.id === selectedPeriod)?.label} Overview
                </p>
              </div>
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
                onClick={() => setShowPeriodModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
              >
                <Calendar className="w-4 h-4" />
                {periods.find((p) => p.id === selectedPeriod)?.label}
                <ChevronDown className="w-4 h-4" />
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
            icon={Wallet}
            value={formatCurrency(reportData?.totalEarnings || 0)}
            label="Total Earnings"
            color="#4f46e5"
            trend="up"
            trendValue="12%"
          />
          <StatCard
            icon={Bus}
            value={(reportData?.totalTrips || 0).toString()}
            label="Total Trips"
            color="#059669"
            trend="up"
            trendValue="8%"
          />
          <StatCard
            icon={Ticket}
            value={(reportData?.totalBookings || 0).toString()}
            label="Total Bookings"
            color="#8b5cf6"
          />
          <StatCard
            icon={Star}
            value={reportData?.averageRating?.toFixed(1) || "0.0"}
            label="Average Rating"
            color="#f59e0b"
          />
        </motion.div>

        {/* Earnings Chart */}
        {reportData?.monthlyEarnings && reportData.monthlyEarnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
          >
            <h3 className="font-bold text-gray-900 mb-4">Earnings Overview</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart
                  data={reportData.monthlyEarnings}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => `Rs.${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      borderRadius: "12px",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                    formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, "Earnings"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ fill: "#4f46e5", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Weekly Trips */}
        {reportData?.weeklyTrips && reportData.weeklyTrips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
          >
            <h3 className="font-bold text-gray-900 mb-4">Weekly Trips</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  data={reportData.weeklyTrips}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      borderRadius: "12px",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Vehicle Performance */}
        {reportData?.vehiclePerformance && reportData.vehiclePerformance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
          >
            <h3 className="font-bold text-gray-900 mb-4">Vehicle Performance</h3>
            <div className="space-y-4">
              {reportData.vehiclePerformance.map((vehicle, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">{vehicle.name}</span>
                    <span className="text-sm font-bold text-indigo-600">
                      {formatCurrency(vehicle.earnings)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(vehicle.trips / Math.max(...reportData.vehiclePerformance.map((v) => v.trips), 1)) * 100}%`,
                        backgroundColor: index % 3 === 0 ? "#4f46e5" : index % 3 === 1 ? "#059669" : "#8b5cf6",
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{vehicle.trips} trips</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Route Popularity */}
        {reportData?.routePopularity && reportData.routePopularity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
          >
            <h3 className="font-bold text-gray-900 mb-4">Popular Routes</h3>
            <div className="space-y-4">
              {reportData.routePopularity.map((route, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{route.route}</p>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{
                          width: `${(route.bookings / Math.max(...reportData.routePopularity.map((r) => r.bookings), 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{route.bookings} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Export Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl py-4 flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
        >
          <Download className="w-5 h-5 text-white" />
          <span className="font-bold text-white text-base">Export Report</span>
        </motion.button>
      </main>

      {/* Period Modal */}
      <PeriodModal />
    </div>
  );
}