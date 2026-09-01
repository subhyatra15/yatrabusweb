// @ts-nocheck
// app/routelist/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bus,
  Search,
  X,
  MapPin,
  Clock,
  Map,
  ChevronRight,
  RefreshCw,
  Calendar,
  IdCard,
  Filter,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  TrendingUp,
  Award,
  Shield,
  Star,
  Navigation,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface Route {
  id: number;
  operator: string;
  bus: string;
  from: string;
  to: string;
  distance: string;
  duration: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  icon: string;
}

// Helper functions
const formatDuration = (duration: string) => {
  if (!duration) return "N/A";
  const parts = duration.split(":");
  if (parts.length === 3) {
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
  return duration;
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "#22c55e";
    case "inactive":
      return "#ef4444";
    case "suspended":
      return "#f59e0b";
    default:
      return "#94a3b8";
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "inactive":
      return "bg-red-50 text-red-600 border-red-100";
    case "suspended":
      return "bg-amber-50 text-amber-600 border-amber-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
};

function RoutesPageComp() {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch routes from API
  const fetchRoutes = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(`${API_URL}/api/v1/routes/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 15000,
      });

      if (response.data && response.data.results) {
        const transformedRoutes = response.data.results.map((route: any) => ({
          id: route.id,
          operator: route.operator_name,
          bus: route.bus_name,
          from: route.source_city_name,
          to: route.destination_city_name,
          distance: route.distance,
          duration: route.duration,
          status: route.status,
          createdAt: route.created_at,
          updatedAt: route.updated_at,
          icon: "bus-outline",
        }));
        setRoutes(transformedRoutes);
        setFilteredRoutes(transformedRoutes);
      }
    } catch (error: any) {
      console.error("Error fetching routes:", error);
      if (error.response?.status === 401) {
        // Handle unauthorized
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = routes.filter((route) => {
      const searchTerm = query.toLowerCase();
      return (
        route.from.toLowerCase().includes(searchTerm) ||
        route.to.toLowerCase().includes(searchTerm) ||
        route.bus.toLowerCase().includes(searchTerm) ||
        route.operator.toLowerCase().includes(searchTerm)
      );
    });
    setFilteredRoutes(filtered);
  };

  // Handle filter
  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    if (filter === "all") {
      setFilteredRoutes(routes);
    } else {
      const filtered = routes.filter((route) =>
        route.status?.toLowerCase() === filter.toLowerCase()
      );
      setFilteredRoutes(filtered);
    }
  };

  // Handle route press
  const handleRoutePress = (route: Route) => {
    setSelectedRoute(route);
    setShowDetailModal(true);
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutes();
  };

  // Load data on mount
  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  // Filter tabs
  const filterTabs = ["all", "active", "inactive", "suspended"];

  // Loading state
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
              <Route className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Loading routes...</p>
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
              <h1 className="text-2xl font-extrabold text-gray-900">Routes</h1>
              <p className="text-sm text-slate-400 font-medium">Browse all available routes</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/search")}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <Search className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-24">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200/50 shadow-sm">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search routes, cities, buses..."
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-slate-400 font-medium"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery.length > 0 && (
              <button onClick={() => handleSearch("")}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-between mb-4 overflow-x-auto pb-1 scrollbar-hide"
        >
          <div className="flex gap-1">
            {filterTabs.map((filter) => (
              <motion.button
                key={filter}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFilter(filter)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all relative",
                  activeFilter === filter
                    ? "text-indigo-600"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {activeFilter === filter && (
                  <motion.div
                    layoutId="filterIndicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
          <span className="text-sm font-medium text-slate-400 whitespace-nowrap ml-2">
            {filteredRoutes.length} routes
          </span>
        </motion.div>

        {/* Routes List */}
        <AnimatePresence mode="wait">
          {filteredRoutes.length > 0 ? (
            <div className="space-y-4">
              {filteredRoutes.map((route, index) => (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ y: -2 }}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleRoutePress(route)}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
                          <Bus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{route.bus}</h4>
                          <p className="text-sm text-slate-400">{route.operator}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold",
                        getStatusBadgeColor(route.status)
                      )}>
                        <span 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: getStatusColor(route.status) }}
                        />
                        {route.status || "N/A"}
                      </div>
                    </div>

                    {/* Route Path */}
                    <div className="flex gap-4 py-3 border-y border-slate-100">
                      <div className="flex flex-col items-center gap-1 pt-0.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <div className="w-0.5 flex-1 bg-slate-200 min-h-[20px]" />
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900">{route.from}</p>
                          <p className="text-xs text-slate-400 font-medium">Departure</p>
                        </div>
                        <div className="flex-1 mx-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-600">
                              {formatDuration(route.duration)}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-2 mt-0.5">
                            <Map className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-400">
                              {route.distance} km
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{route.to}</p>
                          <p className="text-xs text-slate-400 font-medium">Destination</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end mt-3">
                      <button className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white/50 rounded-3xl"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
                <Bus className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mt-4">No Routes Found</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                {searchQuery
                  ? `No routes match "${searchQuery}"`
                  : "No routes available at the moment"}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSearchQuery("");
                  handleFilter("all");
                }}
                className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Route Details Modal */}
      <AnimatePresence>
        {showDetailModal && selectedRoute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl max-h-[92vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Route Details</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto max-h-[70vh]">
                {/* Bus Info */}
                <div className="flex items-center gap-4 bg-slate-50/80 rounded-xl p-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
                    <Bus className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">{selectedRoute.bus}</p>
                    <p className="text-sm text-slate-400">{selectedRoute.operator}</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold",
                    getStatusBadgeColor(selectedRoute.status)
                  )}>
                    <span 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getStatusColor(selectedRoute.status) }}
                    />
                    {selectedRoute.status || "N/A"}
                  </div>
                </div>

                {/* Route Path */}
                <div className="bg-slate-50/80 rounded-xl p-4 mb-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <div className="w-0.5 flex-1 bg-slate-200 min-h-[20px]" />
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selectedRoute.from}</p>
                        <p className="text-xs text-slate-400 font-medium">Departure</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-600" />
                          <div>
                            <p className="font-bold text-gray-900">
                              {formatDuration(selectedRoute.duration)}
                            </p>
                            <p className="text-xs text-slate-400">Duration</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Map className="w-4 h-4 text-indigo-600" />
                          <div>
                            <p className="font-bold text-gray-900">
                              {selectedRoute.distance} km
                            </p>
                            <p className="text-xs text-slate-400">Distance</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selectedRoute.to}</p>
                        <p className="text-xs text-slate-400 font-medium">Destination</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50/80 rounded-xl p-3 text-center">
                      <Calendar className="w-4 h-4 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-400 mt-1">Created</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedRoute.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-3 text-center">
                      <RefreshCw className="w-4 h-4 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-400 mt-1">Updated</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedRoute.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="bg-slate-50/80 rounded-xl p-3 text-center col-span-2">
                      <IdCard className="w-4 h-4 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-400 mt-1">Route ID</p>
                      <p className="text-sm font-semibold text-gray-900">#{selectedRoute.id}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowDetailModal(false);
                    router.push(`/search?from=${selectedRoute.from}&to=${selectedRoute.to}`);
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                >
                  <Search className="w-5 h-5" />
                  View Schedule
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RoutesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoutesPageComp />
    </Suspense>
  );
}