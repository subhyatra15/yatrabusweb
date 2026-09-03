// @ts-nocheck
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  X,
  ChevronDown,
  Calendar,
  Clock,
  Bus,
  Car,
  Repeat,
  Check,
  Loader2,
  RefreshCw,
  AlertCircle,
  Info,
  ArrowRight,
  CalendarDays,
  Timer,
  MapPin,
  DollarSign,
  TrendingUp,
  Award,
  Shield,
  ChevronRight,
  Edit,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface Route {
  id: number;
  source_city_name: string;
  destination_city_name: string;
  distance: string;
  duration: string;
  fare: number;
}

interface Schedule {
  id: number;
  from: string;
  to: string;
  departure: string;
  date: string;
  fare: number;
  vehicle: string;
  vehicle_type: "bus" | "hiace";
  status: "active" | "inactive" | "cancelled" | "upcoming";
  repeat_type: string;
  bus?: number;
  hiace?: number;
  bus_name?: string;
  hiace_name?: string;
  bus_number?: string;
  hiace_number?: string;
  total_seats?: number;
  available_seats?: number;
  departure_datetime?: string;
  arrival_datetime?: string;
  route?: number;
  operator_name?: string;
}

// Demo Data - Only used as fallback
const DEMO_ROUTES: Route[] = [];

const DEMO_BUS_SCHEDULES: Schedule[] = [];

const DEMO_HIACE_SCHEDULES: Schedule[] = [];

function ScheduleTripPageComp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleIdFromParams = searchParams.get("vehicleId") ? parseInt(searchParams.get("vehicleId")!) : null;
  const vehicleTypeFromParams = (searchParams.get("vehicleType") as "bus" | "hiace") || "bus";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(vehicleIdFromParams);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "drafts">("upcoming");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [selectedVehicleType] = useState<"bus" | "hiace">(vehicleTypeFromParams);

  // Form state
  const [formData, setFormData] = useState({
    routeId: 0,
    vehicleId: vehicleIdFromParams || 0,
    departureDate: new Date(),
    departureTime: new Date(),
    arrivalDate: new Date(new Date().setHours(new Date().getHours() + 4)),
    arrivalTime: new Date(new Date().setHours(new Date().getHours() + 4)),
    status: "active",
    repeatType: "none",
    repeatDays: [] as string[],
    repeatEndDate: null as Date | null,
  });

  // Helper functions
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeFromAPI = (datetime: string) => {
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

  const formatDateFromAPI = (datetime: string) => {
    if (!datetime) return "N/A";
    try {
      const date = new Date(datetime);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#22c55e";
      case "inactive":
        return "#f59e0b";
      case "cancelled":
        return "#ef4444";
      case "upcoming":
        return "#3b82f6";
      default:
        return "#94a3b8";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "inactive":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "cancelled":
        return "bg-red-50 text-red-600 border-red-100";
      case "upcoming":
        return "bg-blue-50 text-blue-600 border-blue-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getVehicleIcon = (vehicleType?: string) => {
    return vehicleType === "hiace" ? Car : Bus;
  };

  const getVehicleIconColor = (vehicleType?: string) => {
    return vehicleType === "hiace" ? "text-emerald-600" : "text-indigo-600";
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.log("No token found, using demo data");
        useDemoData();
        return;
      }

      const isHiace = selectedVehicleType === "hiace";
      let hasRealData = false;

      // Fetch routes
      try {
        let allRoutes: Route[] = [];

        if (isHiace) {
          try {
            const hiaceRoutesRes = await axios.get(`${API_URL}/api/v1/hiace-routes/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (hiaceRoutesRes.data && hiaceRoutesRes.data.results && hiaceRoutesRes.data.results.length > 0) {
              allRoutes = hiaceRoutesRes.data.results;
            }
          } catch (error) {
            console.log("Error fetching hiace routes:", error);
          }
        } else {
          try {
            const routesRes = await axios.get(`${API_URL}/api/v1/routes/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (routesRes.data && routesRes.data.results && routesRes.data.results.length > 0) {
              allRoutes = routesRes.data.results;
            }
          } catch (error) {
            console.log("Error fetching bus routes:", error);
          }
        }

        if (allRoutes.length > 0) {
          setRoutes(allRoutes);
          hasRealData = true;
        } else {
          setRoutes(DEMO_ROUTES);
        }
      } catch (error) {
        console.log("Error fetching routes, using demo");
        setRoutes(DEMO_ROUTES);
      }

      // Fetch schedules
      try {
        let allSchedules: Schedule[] = [];

        if (isHiace) {
          try {
            const hiaceSchedulesRes = await axios.get(
              `${API_URL}/api/v1/hiace-schedules/?hiace=${vehicleIdFromParams}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (hiaceSchedulesRes.data && hiaceSchedulesRes.data.results && hiaceSchedulesRes.data.results.length > 0) {
              allSchedules = hiaceSchedulesRes.data.results.map((item: any) => {
                const routeDetails = item.route_details || {};

                let fare = item.fare || 0;
                if (routeDetails.fares && routeDetails.fares.length > 0) {
                  const fareObj = routeDetails.fares.find((f: any) =>
                    f.from_stop_city === item.source_city &&
                    f.to_stop_city === item.destination_city
                  );
                  if (fareObj) {
                    fare = parseFloat(fareObj.fare) || 0;
                  }
                }

                return {
                  id: item.id,
                  from: item.source_city || routeDetails.source_city_name || "N/A",
                  to: item.destination_city || routeDetails.destination_city_name || "N/A",
                  departure: formatTimeFromAPI(item.departure_datetime),
                  date: formatDateFromAPI(item.departure_datetime),
                  fare: fare,
                  vehicle: item.hiace_name || "Hiace",
                  vehicle_type: "hiace" as const,
                  status: item.status?.toLowerCase() || "active",
                  repeat_type: item.repeat_type || "none",
                  bus: item.bus || item.hiace,
                  hiace_name: item.hiace_name,
                  hiace_number: item.hiace_number,
                  hiace_type: item.hiace_type,
                  total_seats: item.total_seats,
                  available_seats: item.available_seats,
                  departure_datetime: item.departure_datetime,
                  arrival_datetime: item.arrival_datetime,
                  route: item.route,
                  operator_name: item.operator_name,
                };
              });
            }
          } catch (error) {
            console.log("Error fetching hiace schedules:", error);
          }
        } else {
          try {
            const schedulesRes = await axios.get(
              `${API_URL}/api/v1/schedules/?bus=${vehicleIdFromParams}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (schedulesRes.data && schedulesRes.data.length > 0) {
              allSchedules = schedulesRes.data.map((item: any) => ({
                id: item.id,
                from: item.source_city || "N/A",
                to: item.destination_city || "N/A",
                departure: formatTimeFromAPI(item.departure_datetime),
                date: formatDateFromAPI(item.departure_datetime),
                fare: item.fare || 0,
                vehicle: item.bus_name || "Bus",
                vehicle_type: "bus" as const,
                status: item.status?.toLowerCase() || "active",
                repeat_type: item.repeat_type || "none",
                bus: item.bus,
                bus_name: item.bus_name,
                bus_number: item.bus_number,
                bus_type: item.bus_type,
                total_seats: item.total_seats,
                available_seats: item.available_seats,
                departure_datetime: item.departure_datetime,
                arrival_datetime: item.arrival_datetime,
                route: item.route,
                operator_name: item.operator_name,
              }));
            }
          } catch (error) {
            console.log("Error fetching bus schedules:", error);
          }
        }

        if (allSchedules.length > 0) {
          setSchedules(allSchedules);
          hasRealData = true;
        } else {
          setSchedules(isHiace ? DEMO_HIACE_SCHEDULES : DEMO_BUS_SCHEDULES);
        }
      } catch (error) {
        console.log("Error fetching schedules, using demo");
        setSchedules(isHiace ? DEMO_HIACE_SCHEDULES : DEMO_BUS_SCHEDULES);
      }

      setUsingDemoData(!hasRealData);
    } catch (error) {
      console.error("Error fetching data:", error);
      useDemoData();
    } finally {
      setLoading(false);
    }
  }, [selectedVehicleType, vehicleIdFromParams]);

  const useDemoData = () => {
    const isHiace = selectedVehicleType === "hiace";
    setRoutes(DEMO_ROUTES);
    setSchedules(isHiace ? DEMO_HIACE_SCHEDULES : DEMO_BUS_SCHEDULES);
    setUsingDemoData(true);
  };

  const resetForm = () => {
    setSelectedRoute(null);
    setSelectedVehicle(vehicleIdFromParams || null);
    setFormData({
      routeId: 0,
      vehicleId: vehicleIdFromParams || 0,
      departureDate: new Date(),
      departureTime: new Date(),
      arrivalDate: new Date(new Date().setHours(new Date().getHours() + 4)),
      arrivalTime: new Date(new Date().setHours(new Date().getHours() + 4)),
      status: "active",
      repeatType: "none",
      repeatDays: [],
      repeatEndDate: null,
    });
  };

  const handleAddSchedule = async () => {
    if (!selectedRoute || !selectedVehicle) {
      alert("Please select both route and vehicle");
      return;
    }

    if (usingDemoData) {
      alert("Demo Mode. Schedule will not be saved.");
      setShowAddModal(false);
      resetForm();
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("accessToken");

      const departureDateTime = new Date(formData.departureDate);
      departureDateTime.setHours(formData.departureTime.getHours());
      departureDateTime.setMinutes(formData.departureTime.getMinutes());

      const arrivalDateTime = new Date(formData.arrivalDate);
      arrivalDateTime.setHours(formData.arrivalTime.getHours());
      arrivalDateTime.setMinutes(formData.arrivalTime.getMinutes());

      const isHiace = selectedVehicleType === "hiace";

      const endpoint = isHiace
        ? `${API_URL}/api/v1/hiace-schedule/`
        : `${API_URL}/api/v1/bus-schedules/`;

      const scheduleData = {
        route: selectedRoute,
        vehicle: selectedVehicle,
        departure_datetime: departureDateTime.toISOString(),
        arrival_datetime: arrivalDateTime.toISOString(),
        status: formData.status.toUpperCase(),
        repeat_type: formData.repeatType,
        repeat_days: formData.repeatDays,
        repeat_end_date: formData.repeatEndDate?.toISOString(),
      };

      await axios.post(endpoint, scheduleData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Schedule added successfully!");
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error adding schedule:", error);

      let errorMessage = "Failed to add schedule";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).flat().join("\n");
      }

      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepeatDaysToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      repeatDays: prev.repeatDays?.includes(day)
        ? prev.repeatDays.filter((d) => d !== day)
        : [...(prev.repeatDays || []), day],
    }));
  };

  // Load data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const VehicleIcon = getVehicleIcon(selectedVehicleType);
  const vehicleColor = getVehicleIconColor(selectedVehicleType);

  // Stats
  const stats = {
    total: schedules.length,
    active: schedules.filter((s) => s.status === "active").length,
    upcoming: schedules.filter((s) => s.status === "upcoming").length,
    cancelled: schedules.filter((s) => s.status === "cancelled").length,
  };

  // Schedule Card Component
  const ScheduleCard = ({ schedule }: { schedule: Schedule }) => {
    const Icon = getVehicleIcon(schedule.vehicle_type);
    const statusColor = getStatusColor(schedule.status);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
        onClick={() => {
          setSelectedSchedule(schedule);
          setShowScheduleModal(true);
        }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Icon className={cn("w-4 h-4", getVehicleIconColor(schedule.vehicle_type))} />
                <span className="font-semibold text-gray-900">{schedule.from}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-gray-900">{schedule.to}</span>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold",
              getStatusBgColor(schedule.status)
            )}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
              {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
            </div>
          </div>

          {/* Details */}
          <div className="flex items-center gap-4 text-sm text-slate-500 py-2 border-y border-slate-100 mb-2">
            <div className="flex items-center gap-1.5">
              <Bus className="w-4 h-4" />
              <span>{schedule.vehicle}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{schedule.departure}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{schedule.date}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-extrabold text-indigo-600">Rs. {schedule.fare}</span>
            {schedule.repeat_type && schedule.repeat_type !== "none" && (
              <span className="flex items-center gap-1.5 bg-indigo-50/50 px-2.5 py-1 rounded-lg text-xs text-indigo-600 font-medium">
                <Repeat className="w-3.5 h-3.5" />
                {schedule.repeat_type.charAt(0).toUpperCase() + schedule.repeat_type.slice(1)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
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
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Loading schedules...</p>
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
                onClick={() => router.back()}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </motion.button>
              <h1 className="text-lg font-bold text-gray-900">
                {selectedVehicleType === "bus" ? "Bus" : "Hiace"} Schedules
              </h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Schedule
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

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-3 bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 mb-4"
        >
          <div className="text-center">
            <p className="text-2xl font-extrabold text-gray-900">{stats.total}</p>
            <p className="text-xs text-slate-400 font-medium">Total Trips</p>
          </div>
          <div className="text-center border-l border-slate-200">
            <p className="text-2xl font-extrabold text-emerald-600">{stats.active}</p>
            <p className="text-xs text-slate-400 font-medium">Active</p>
          </div>
          <div className="text-center border-l border-slate-200">
            <p className="text-2xl font-extrabold text-blue-600">{stats.upcoming}</p>
            <p className="text-xs text-slate-400 font-medium">Upcoming</p>
          </div>
          <div className="text-center border-l border-slate-200">
            <p className="text-2xl font-extrabold text-red-500">{stats.cancelled}</p>
            <p className="text-xs text-slate-400 font-medium">Cancelled</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide"
        >
          {["upcoming", "past", "drafts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-5 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap",
                activeTab === tab
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                  : "bg-white/60 text-slate-400 hover:bg-white/80 border border-slate-200/50"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Schedule List */}
        <AnimatePresence mode="wait">
          {schedules.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {schedules.map((schedule) => (
                <ScheduleCard key={schedule.id} schedule={schedule} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white/50 rounded-3xl"
            >
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                <Calendar className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mt-4">No Schedules Found</h3>
              <p className="text-sm text-slate-400 mt-2">Add your first trip schedule by tapping the + button</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                <Plus className="w-4 h-4" />
                Add Schedule
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Schedule Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowAddModal(false)}
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
                  <h3 className="text-xl font-bold text-gray-900">Add Schedule</h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
                {/* Demo Banner */}
                {usingDemoData && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                    <Info className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-600 font-medium">Showing demo data</span>
                  </div>
                )}

                {/* Vehicle Info */}
                <div className="flex items-center gap-3 bg-indigo-50/50 rounded-xl px-4 py-3 border border-indigo-100/50">
                  <VehicleIcon className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-600">
                    Vehicle ID: {selectedVehicle || "Not selected"} ({selectedVehicleType})
                  </span>
                </div>

                {/* Route Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Select Route *
                  </label>
                  <select
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    value={selectedRoute || 0}
                    onChange={(e) => setSelectedRoute(parseInt(e.target.value))}
                  >
                    <option value="0">Select Route</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.source_city_name} → {r.destination_city_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Departure Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Departure Date *
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.departureDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setFormData({ ...formData, departureDate: date });
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Departure Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Departure Time *
                  </label>
                  <input
                    type="time"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.departureTime.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const date = new Date(formData.departureTime);
                      date.setHours(hours, minutes);
                      setFormData({ ...formData, departureTime: date });
                    }}
                  />
                </div>

                {/* Arrival Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Arrival Date *
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.arrivalDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setFormData({ ...formData, arrivalDate: date });
                    }}
                    min={formData.departureDate.toISOString().split('T')[0]}
                  />
                </div>

                {/* Arrival Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Arrival Time *
                  </label>
                  <input
                    type="time"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.arrivalTime.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const date = new Date(formData.arrivalTime);
                      date.setHours(hours, minutes);
                      setFormData({ ...formData, arrivalTime: date });
                    }}
                  />
                </div>

                {/* Fare Note */}
                <div className="flex items-center gap-3 bg-indigo-50/50 rounded-xl px-4 py-3 border border-indigo-100/50">
                  <Info className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm text-indigo-600 font-medium">
                    Fare will be automatically calculated based on the selected route stops
                  </span>
                </div>

                {/* Repeat Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Repeat Schedule
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["none", "daily", "weekly", "monthly"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, repeatType: type as any })}
                        className={cn(
                          "py-2 rounded-lg text-sm font-medium transition-all",
                          formData.repeatType === type
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                            : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Repeat Days */}
                {formData.repeatType === "weekly" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Repeat Days
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                        <button
                          key={day}
                          onClick={() => handleRepeatDaysToggle(day)}
                          className={cn(
                            "py-2 rounded-lg text-sm font-medium transition-all",
                            formData.repeatDays?.includes(day)
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                              : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["active", "inactive"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFormData({ ...formData, status: status as any })}
                        className={cn(
                          "py-2 rounded-lg text-sm font-medium transition-all",
                          formData.status === status
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                            : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {usingDemoData && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-sm text-amber-600 font-medium">
                      ⚡ Demo mode. Schedule will not be saved to the server.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleAddSchedule}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      {usingDemoData ? "Demo Mode" : "Add Schedule"}
                    </>
                  )}
                </button>

                {!usingDemoData && (
                  <button
                    onClick={() => {
                      if (confirm("This will create schedules for the next 7 days with the same settings.")) {
                        handleAddSchedule();
                      }
                    }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
                  >
                    <Repeat className="w-5 h-5" />
                    Add for Next 7 Days
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

}



export default function ScheduleTripPage() {
return (
    <>
    <Suspense fallback={<h1>Loading....</h1>}>
      <ScheduleTripPageComp/>
    </Suspense>
    </>
)
}
