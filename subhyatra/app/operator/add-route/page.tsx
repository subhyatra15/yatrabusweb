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
  Search,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Bus,
  Car,
  Edit,
  Trash2,
  Check,
  Loader2,
  RefreshCw,
  AlertCircle,
  Info,
  ArrowRight,
  Route,
  Map,
  Tag,
  List,
  Grid2x2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface Stop {
  id?: number;
  city: string;
  cityId: number;
  stopOrder: number;
  arrivalOffset: string;
  departureOffset: string;
  isBoarding: boolean;
  isDropping: boolean;
}

interface Fare {
  fromStopId: number;
  toStopId: number;
  fare: string;
}

interface Route {
  id: number;
  source_city: number;
  destination_city: number;
  source_city_name?: string;
  destination_city_name?: string;
  vehicle: number;
  distance: number;
  duration: string;
  base_fare: number;
  stops: any[];
  fares: any[];
  created_at: string;
}

 function AddRoutePageComp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleIdFromParams = searchParams.get("vehicleId") ? parseInt(searchParams.get("vehicleId")!) : null;
  const vehicleTypeFromParams = (searchParams.get("vehicleType") as "bus" | "hiace") || "bus";

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Form state
  const [selectedSourceCity, setSelectedSourceCity] = useState<number | null>(null);
  const [selectedDestCity, setSelectedDestCity] = useState<number | null>(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [baseFare, setBaseFare] = useState("");

  // Stops
  const [stops, setStops] = useState<Stop[]>([]);
  const [showStopModal, setShowStopModal] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [tempStop, setTempStop] = useState<Stop>({
    city: "",
    cityId: 0,
    stopOrder: 0,
    arrivalOffset: "00:00:00",
    departureOffset: "00:00:00",
    isBoarding: true,
    isDropping: true,
  });

  // Fares
  const [fares, setFares] = useState<Fare[]>([]);
  const [showFareModal, setShowFareModal] = useState(false);
  const [editingFare, setEditingFare] = useState<Fare | null>(null);
  const [tempFare, setTempFare] = useState<Fare>({
    fromStopId: 0,
    toStopId: 0,
    fare: "",
  });

  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "basic" | "stops" | "fares">("list");
  const [isEditing, setIsEditing] = useState(false);

  // Fetch cities
  const fetchCities = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/api/v1/cities/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.results) {
        setCities(response.data.results);
        setFilteredCities(response.data.results);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  }, []);

  // Fetch routes
  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const isHiace = vehicleTypeFromParams === "hiace";
      const endpoint = isHiace
        ? `${API_URL}/api/v1/hiace-routes/?vehicle=${vehicleIdFromParams}`
        : `${API_URL}/api/v1/routes/?bus=${vehicleIdFromParams}`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.results) {
        const routesWithCityNames = response.data.results.map((route: any) => ({
          ...route,
          source_city_name: getCityName(route.source_city),
          destination_city_name: getCityName(route.destination_city),
        }));
        setRoutes(routesWithCityNames);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
      alert("Failed to fetch routes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vehicleIdFromParams, vehicleTypeFromParams]);

  const getCityName = (cityId: number) => {
    const city = cities.find((c) => c.id === cityId);
    return city ? city.name : "Unknown";
  };

  const getStopName = (stopId: number) => {
    const stop = stops.find((s) => s.id === stopId || s.stopOrder === stopId);
    return stop ? stop.city : "Unknown";
  };

  const searchCities = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredCities(cities);
    } else {
      const filtered = cities.filter((city) =>
        city.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  };

  // Stop functions
  const addStop = () => {
    if (!tempStop.cityId || !tempStop.city) {
      alert("Please select a city");
      return;
    }
    if (editingStop) {
      const index = stops.findIndex((s) => s.stopOrder === editingStop.stopOrder);
      if (index !== -1) {
        const newStops = [...stops];
        newStops[index] = tempStop;
        setStops(newStops);
      }
    } else {
      setStops([...stops, { ...tempStop, stopOrder: stops.length + 1 }]);
    }
    setShowStopModal(false);
    resetTempStop();
  };

  const resetTempStop = () => {
    setTempStop({
      city: "",
      cityId: 0,
      stopOrder: 0,
      arrivalOffset: "00:00:00",
      departureOffset: "00:00:00",
      isBoarding: true,
      isDropping: true,
    });
    setEditingStop(null);
  };

  const editStop = (stop: Stop) => {
    setEditingStop(stop);
    setTempStop(stop);
    setShowStopModal(true);
  };

  const removeStop = (stopOrder: number) => {
    if (confirm("Are you sure you want to remove this stop?")) {
      const newStops = stops.filter((s) => s.stopOrder !== stopOrder);
      const reorderedStops = newStops.map((s, index) => ({
        ...s,
        stopOrder: index + 1,
      }));
      setStops(reorderedStops);
    }
  };

  // Fare functions
  const addFare = () => {
    if (!tempFare.fromStopId || !tempFare.toStopId || !tempFare.fare) {
      alert("Please fill in all fields");
      return;
    }
    if (tempFare.fromStopId === tempFare.toStopId) {
      alert("From and To stops cannot be the same");
      return;
    }
    if (editingFare) {
      const index = fares.findIndex(
        (f) => f.fromStopId === editingFare.fromStopId && f.toStopId === editingFare.toStopId
      );
      if (index !== -1) {
        const newFares = [...fares];
        newFares[index] = tempFare;
        setFares(newFares);
      }
    } else {
      setFares([...fares, tempFare]);
    }
    setShowFareModal(false);
    resetTempFare();
  };

  const resetTempFare = () => {
    setTempFare({
      fromStopId: 0,
      toStopId: 0,
      fare: "",
    });
    setEditingFare(null);
  };

  const removeFare = (index: number) => {
    if (confirm("Are you sure you want to remove this fare?")) {
      const newFares = fares.filter((_, i) => i !== index);
      setFares(newFares);
    }
  };

  // Route edit
  const handleEditRoute = (route: Route) => {
    setSelectedRoute(route);
    setSelectedSourceCity(route.source_city);
    setSelectedDestCity(route.destination_city);
    setDistance(route.distance.toString());
    setDuration(route.duration);
    setBaseFare(route.base_fare.toString());

    if (route.stops) {
      const mappedStops = route.stops.map((stop: any, index: number) => ({
        id: stop.id,
        city: getCityName(stop.city),
        cityId: stop.city,
        stopOrder: stop.stop_order || index + 1,
        arrivalOffset: stop.arrival_offset || "00:00:00",
        departureOffset: stop.departure_offset || "00:00:00",
        isBoarding: stop.is_boarding !== undefined ? stop.is_boarding : true,
        isDropping: stop.is_dropping !== undefined ? stop.is_dropping : true,
      }));
      setStops(mappedStops);
    }

    if (route.fares) {
      const mappedFares = route.fares.map((fare: any) => ({
        fromStopId: fare.from_stop || fare.fromStopId,
        toStopId: fare.to_stop || fare.toStopId,
        fare: fare.fare.toString(),
      }));
      setFares(mappedFares);
    }

    setIsEditing(true);
    setActiveTab("basic");
  };

  const resetForm = () => {
    setSelectedSourceCity(null);
    setSelectedDestCity(null);
    setDistance("");
    setDuration("");
    setBaseFare("");
    setStops([]);
    setFares([]);
    setIsEditing(false);
    setSelectedRoute(null);
  };

  const handleSubmit = async () => {
    if (!selectedSourceCity || !selectedDestCity) {
      alert("Please select source and destination cities");
      return;
    }
    if (selectedSourceCity === selectedDestCity) {
      alert("Source and destination cannot be the same");
      return;
    }
    if (stops.length < 2) {
      alert("Please add at least 2 stops");
      return;
    }
    if (fares.length === 0) {
      alert("Please add at least one fare");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("accessToken");

      const isHiace = vehicleTypeFromParams === "hiace";
      const endpoint = isHiace
        ? `${API_URL}/api/v1/hiace-routes/create/`
        : `${API_URL}/api/v1/routes/create/`;

      const routeData = {
        source_city: selectedSourceCity,
        destination_city: selectedDestCity,
        vehicle: vehicleIdFromParams,
        distance: parseFloat(distance) || 0,
        duration: duration || "00:00:00",
        base_fare: parseFloat(baseFare) || 0,
        stops: stops.map((stop) => ({
          city: stop.cityId,
          stop_order: stop.stopOrder,
          arrival_offset: stop.arrivalOffset,
          departure_offset: stop.departureOffset,
          is_boarding: stop.isBoarding,
          is_dropping: stop.isDropping,
        })),
        fares: fares.map((fare) => ({
          from_stop: fare.fromStopId,
          to_stop: fare.toStopId,
          fare: parseFloat(fare.fare),
        })),
      };

      if (isEditing && selectedRoute) {
        await axios.put(`${endpoint}${selectedRoute.id}/`, routeData, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        alert("Route updated successfully!");
      } else {
        await axios.post(endpoint, routeData, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        alert("Route created successfully!");
      }

      resetForm();
      setActiveTab("list");
      fetchRoutes();
    } catch (error: any) {
      console.error("Error saving route:", error);
      alert(error.response?.data?.message || "Failed to save route");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoute = (routeId: number) => {
    if (confirm("Are you sure you want to delete this route?")) {
      (async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const isHiace = vehicleTypeFromParams === "hiace";
          const endpoint = isHiace
            ? `${API_URL}/api/v1/hiace-routes/${routeId}/`
            : `${API_URL}/api/v1/routes/${routeId}/`;

          await axios.delete(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });

          alert("Route deleted successfully");
          fetchRoutes();
        } catch (error) {
          console.error("Error deleting route:", error);
          alert("Failed to delete route");
        }
      })();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutes();
  };

  // Load data
  useEffect(() => {
    fetchCities();
    fetchRoutes();
  }, [fetchCities, fetchRoutes]);

  const VehicleIcon = vehicleTypeFromParams === "hiace" ? Car : Bus;

  // Stop Modal
  const StopModal = () => (
    <AnimatePresence>
      {showStopModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowStopModal(false)}
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
                <h3 className="text-xl font-bold text-gray-900">
                  {editingStop ? "Edit Stop" : "Add Stop"}
                </h3>
                <button
                  onClick={() => {
                    setShowStopModal(false);
                    resetTempStop();
                  }}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-900" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
              {/* City Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  City *
                </label>
                <div className="relative">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200/50">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search city..."
                      className="flex-1 bg-transparent outline-none text-gray-900 placeholder-slate-400 font-medium"
                      value={searchQuery}
                      onChange={(e) => searchCities(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mt-3 max-h-20 overflow-y-auto">
                  {filteredCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        setTempStop({ ...tempStop, city: city.name, cityId: city.id });
                        setSearchQuery("");
                        setFilteredCities(cities);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        tempStop.cityId === city.id
                          ? "bg-indigo-50 text-indigo-600 border-2 border-indigo-500"
                          : "bg-slate-50 text-slate-400 border-2 border-transparent hover:border-indigo-200"
                      )}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
                {tempStop.cityId > 0 && (
                  <p className="text-sm font-semibold text-gray-900 mt-2">
                    Selected: {tempStop.city}
                  </p>
                )}
              </div>

              {/* Stop Order */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Stop Order
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-not-allowed bg-slate-100"
                  value={tempStop.stopOrder}
                  disabled
                />
              </div>

              {/* Arrival Offset */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Arrival Offset (HH:MM:SS)
                </label>
                <input
                  type="text"
                  placeholder="00:00:00"
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={tempStop.arrivalOffset}
                  onChange={(e) =>
                    setTempStop({ ...tempStop, arrivalOffset: e.target.value })
                  }
                />
              </div>

              {/* Departure Offset */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Departure Offset (HH:MM:SS)
                </label>
                <input
                  type="text"
                  placeholder="00:00:00"
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={tempStop.departureOffset}
                  onChange={(e) =>
                    setTempStop({ ...tempStop, departureOffset: e.target.value })
                  }
                />
              </div>

              {/* Switches */}
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">Boarding</span>
                  <div
                    onClick={() => setTempStop({ ...tempStop, isBoarding: !tempStop.isBoarding })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors cursor-pointer relative",
                      tempStop.isBoarding ? "bg-indigo-600" : "bg-slate-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5",
                        tempStop.isBoarding ? "translate-x-6" : "translate-x-0.5"
                      )}
                    />
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">Dropping</span>
                  <div
                    onClick={() => setTempStop({ ...tempStop, isDropping: !tempStop.isDropping })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors cursor-pointer relative",
                      tempStop.isDropping ? "bg-purple-600" : "bg-slate-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5",
                        tempStop.isDropping ? "translate-x-6" : "translate-x-0.5"
                      )}
                    />
                  </div>
                </label>
              </div>

              <button
                onClick={addStop}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
              >
                {editingStop ? "Update Stop" : "Add Stop"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Fare Modal
  const FareModal = () => (
    <AnimatePresence>
      {showFareModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowFareModal(false)}
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
                <h3 className="text-xl font-bold text-gray-900">
                  {editingFare ? "Edit Fare" : "Add Fare"}
                </h3>
                <button
                  onClick={() => {
                    setShowFareModal(false);
                    resetTempFare();
                  }}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-900" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
              {/* From Stop */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  From Stop *
                </label>
                <select
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  value={tempFare.fromStopId}
                  onChange={(e) =>
                    setTempFare({ ...tempFare, fromStopId: parseInt(e.target.value) })
                  }
                >
                  <option value="0">Select From Stop</option>
                  {stops.map((stop) => (
                    <option key={stop.stopOrder} value={stop.id || stop.stopOrder}>
                      {stop.city} (Stop {stop.stopOrder})
                    </option>
                  ))}
                </select>
              </div>

              {/* To Stop */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  To Stop *
                </label>
                <select
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                  value={tempFare.toStopId}
                  onChange={(e) =>
                    setTempFare({ ...tempFare, toStopId: parseInt(e.target.value) })
                  }
                >
                  <option value="0">Select To Stop</option>
                  {stops
                    .filter((stop) => {
                      const stopId = stop.id || stop.stopOrder;
                      return stopId !== tempFare.fromStopId;
                    })
                    .map((stop) => (
                      <option key={stop.stopOrder} value={stop.id || stop.stopOrder}>
                        {stop.city} (Stop {stop.stopOrder})
                      </option>
                    ))}
                </select>
              </div>

              {/* Fare */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Fare (NPR) *
                </label>
                <input
                  type="number"
                  placeholder="Enter fare amount"
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={tempFare.fare}
                  onChange={(e) =>
                    setTempFare({ ...tempFare, fare: e.target.value })
                  }
                />
              </div>

              <button
                onClick={addFare}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
              >
                {editingFare ? "Update Fare" : "Add Fare"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading && routes.length === 0) {
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
                {activeTab === "list" ? "Routes" : isEditing ? "Edit Route" : "Add Route"}
              </h1>
            </div>
            {activeTab !== "list" && (
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab("list");
                }}
                className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                Cancel
              </button>
            )}
            {activeTab === "list" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  resetForm();
                  setActiveTab("basic");
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Route
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-24">
        {/* Vehicle Info */}
        <div className="flex items-center gap-3 bg-indigo-50/50 rounded-xl px-4 py-3 border border-indigo-100/50 mb-4">
          <VehicleIcon className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-600">
            Vehicle: {vehicleIdFromParams || "Not selected"} ({vehicleTypeFromParams})
          </span>
        </div>

        {activeTab === "list" ? (
          // Route List
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Routes ({routes.length})</h3>
              <button
                onClick={onRefresh}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className={cn(
                  "w-4 h-4 text-slate-600",
                  refreshing && "animate-spin"
                )} />
              </button>
            </div>

            {routes.length > 0 ? (
              <div className="space-y-3">
                {routes.map((route) => (
                  <motion.div
                    key={route.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {route.source_city_name}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-gray-900">
                          {route.destination_city_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditRoute(route)}
                          className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                          <Edit className="w-4 h-4 text-indigo-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(route.id)}
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-400 py-2 border-y border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{route.stops?.length || 0} stops</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        <span>Rs. {route.base_fare}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{route.duration || "N/A"}</span>
                      </div>
                    </div>

                    {route.stops && route.stops.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-slate-400 font-medium">Stops:</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {route.stops.slice(0, 3).map((stop: any, index: number) => (
                            <span
                              key={index}
                              className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-medium"
                            >
                              {getCityName(stop.city)}
                            </span>
                          ))}
                          {route.stops.length > 3 && (
                            <span className="text-xs bg-slate-100 text-slate-400 px-2.5 py-0.5 rounded-full font-medium">
                              +{route.stops.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/50 rounded-3xl">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                  <Route className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-4">No routes found</h3>
                <p className="text-sm text-slate-400 mt-2">Tap the + button to create a new route</p>
              </div>
            )}
          </motion.div>
        ) : (
          // Form
          <>
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-white/70 backdrop-blur-sm rounded-xl p-1 border border-slate-200/50 mb-4">
              {["basic", "stops", "fares"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "py-2.5 rounded-lg font-medium text-sm transition-all",
                    activeTab === tab
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === "stops" && stops.length > 0 && (
                    <span className="ml-1 text-xs">({stops.length})</span>
                  )}
                  {tab === "fares" && fares.length > 0 && (
                    <span className="ml-1 text-xs">({fares.length})</span>
                  )}
                </button>
              ))}
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5"
            >
              {/* Basic Tab */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Source City *
                    </label>
                    <select
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                      value={selectedSourceCity || 0}
                      onChange={(e) => setSelectedSourceCity(parseInt(e.target.value))}
                    >
                      <option value="0">Select Source City</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Destination City *
                    </label>
                    <select
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                      value={selectedDestCity || 0}
                      onChange={(e) => setSelectedDestCity(parseInt(e.target.value))}
                    >
                      <option value="0">Select Destination City</option>
                      {cities
                        .filter((city) => city.id !== selectedSourceCity)
                        .map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Distance (KM)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter distance"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Duration (HH:MM:SS)
                    </label>
                    <input
                      type="text"
                      placeholder="04:00:00"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Base Fare (NPR)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter base fare"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={baseFare}
                      onChange={(e) => setBaseFare(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Stops Tab */}
              {activeTab === "stops" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Stops</h4>
                    <button
                      onClick={() => setShowStopModal(true)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md shadow-indigo-500/25"
                    >
                      <Plus className="w-4 h-4" />
                      Add Stop
                    </button>
                  </div>

                  {stops.length > 0 ? (
                    <div className="space-y-2">
                      {stops.map((stop) => (
                        <div
                          key={stop.stopOrder}
                          className="flex items-center justify-between bg-slate-50/80 rounded-xl p-3 border border-slate-200/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                              <span className="text-sm font-bold text-indigo-600">
                                {stop.stopOrder}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{stop.city}</p>
                              <div className="flex gap-1.5 mt-0.5">
                                {stop.isBoarding && (
                                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    Boarding
                                  </span>
                                )}
                                {stop.isDropping && (
                                  <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                    Dropping
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right text-xs text-slate-400">
                              <p>Arr: {stop.arrivalOffset}</p>
                              <p>Dep: {stop.departureOffset}</p>
                            </div>
                            <button
                              onClick={() => editStop(stop)}
                              className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                            >
                              <Edit className="w-4 h-4 text-indigo-600" />
                            </button>
                            <button
                              onClick={() => removeStop(stop.stopOrder)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50/50 rounded-xl">
                      <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-sm font-medium text-slate-400 mt-2">No stops added</p>
                      <p className="text-xs text-slate-400">Tap Add Stop to create one</p>
                    </div>
                  )}
                </div>
              )}

              {/* Fares Tab */}
              {activeTab === "fares" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Fares</h4>
                    <button
                      onClick={() => setShowFareModal(true)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md shadow-indigo-500/25"
                    >
                      <Plus className="w-4 h-4" />
                      Add Fare
                    </button>
                  </div>

                  {fares.length > 0 ? (
                    <div className="space-y-2">
                      {fares.map((fare, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-slate-50/80 rounded-xl p-3 border border-slate-200/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {getStopName(fare.fromStopId)}
                              </span>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                              <span className="font-semibold text-gray-900">
                                {getStopName(fare.toStopId)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-extrabold text-indigo-600">
                              Rs. {fare.fare}
                            </span>
                            <button
                              onClick={() => {
                                setEditingFare(fare);
                                setTempFare(fare);
                                setShowFareModal(true);
                              }}
                              className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                            >
                              <Edit className="w-4 h-4 text-indigo-600" />
                            </button>
                            <button
                              onClick={() => removeFare(index)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50/50 rounded-xl">
                      <DollarSign className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-sm font-medium text-slate-400 mt-2">No fares added</p>
                      <p className="text-xs text-slate-400">Tap Add Fare to create one</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {isEditing ? "Update Route" : "Create Route"}
                </>
              )}
            </motion.button>
          </>
        )}
      </main>

      {/* Modals */}
      <StopModal />
      <FareModal />
    </div>
  );
}


export default function AddRoutePage() {
return (
    <>
    <Suspense fallback={<h1>Loading....</h1>}>
      <AddRoutePageComp/>
    </Suspense>
    </>
)
}