// app/buslist/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bus,
  Car,
  Search,
  MapPin,
  Calendar,
  ArrowRight,
  ChevronDown,
  ArrowDownUp,
  Ticket,
  Navigation,
  Ambulance,
  Clock,
  X,
  Check,
  Loader2,
  User,
  Menu,
  Heart,
  TrendingUp,
  Shield,
  Star,
  Award,
  ArrowLeft,
  RefreshCw,
  Filter,
  SortAsc,
  Wifi,
  Battery,
  Snowflake,
  Tv,
  Droplets,
  CheckCircle,
  LogIn,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { cn } from "@/lib/utils";

// Types
interface Bus {
  id: string;
  scheduleId: number;
  routeId: number;
  name: string;
  type: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  totalSeats: number;
  available: number;
  rating: number;
  amenities: string[];
  busNumber: string;
  busId: number;
  status: string;
  seatLayout: { left: number; right: number };
}

interface Stop {
  id: number;
  city_name: string;
  stop_order: number;
  is_boarding: boolean;
  is_dropping: boolean;
  route: number;
}

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

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

const calculateDuration = (departure: string, arrival: string) => {
  if (!departure || !arrival) return "N/A";
  const start = new Date(departure);
  const end = new Date(arrival);
  const diffMs = end.getTime() - start.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHrs > 0) {
    return `${diffHrs}h ${diffMins > 0 ? diffMins + "m" : ""}`;
  }
  return `${diffMins}m`;
};

const getAmenities = (bus: any) => {
  const amenities = [];
  if (bus.wifi) amenities.push("wifi");
  if (bus.charging) amenities.push("charging");
  if (bus.ac) amenities.push("ac");
  if (bus.tv) amenities.push("tv");
  if (bus.water) amenities.push("water");
  return amenities.length > 0 ? amenities : ["standard"];
};

const getAmenityIcon = (amenity: string) => {
  switch (amenity.toLowerCase()) {
    case "wifi":
      return Wifi;
    case "charging":
      return Battery;
    case "water":
      return Droplets;
    case "tv":
      return Tv;
    case "ac":
      return Snowflake;
    case "standard":
      return CheckCircle;
    default:
      return CheckCircle;
  }
};

const getAmenityLabel = (amenity: string) => {
  switch (amenity.toLowerCase()) {
    case "ac":
      return "AC";
    default:
      return amenity;
  }
};

export default function BusListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const from = searchParams.get("from") || "Butwal";
  const to = searchParams.get("to") || "Kathmandu";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const [buses, setBuses] = useState<Bus[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Sort
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [sortBy, setSortBy] = useState("price");
  const [showSortModal, setShowSortModal] = useState(false);

  // Boarding Modal
  const [showBoardingModal, setShowBoardingModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [routeStops, setRouteStops] = useState<Stop[]>([]);
  const [boardingStops, setBoardingStops] = useState<Stop[]>([]);
  const [droppingStops, setDroppingStops] = useState<Stop[]>([]);
  const [selectedBoardingStop, setSelectedBoardingStop] = useState<Stop | null>(null);
  const [selectedDroppingStop, setSelectedDroppingStop] = useState<Stop | null>(null);
  const [isLoadingStops, setIsLoadingStops] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [pricePerSeat, setPricePerSeat] = useState<number | null>(null);

  const filterOptions = ["All", "AC", "Non-AC"];
  const sortOptions = [
    { label: "Price: Low to High", value: "price" },
    { label: "Price: High to Low", value: "price-desc" },
    { label: "Departure: Early", value: "departure" },
    { label: "Rating: High to Low", value: "rating" },
  ];

  // Fetch buses
  const fetchBuses = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(`${API_URL}/api/v1/schedules/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        params: {
          source: from,
          destination: to,
          date: date,
        },
        timeout: 15000,
      });

      if (response.data) {
        const transformedBuses = response.data.map((bus: any) => ({
          id: bus.id.toString(),
          scheduleId: bus.id,
          routeId: bus.route,
          name: bus.bus_name || "Bus",
          type: bus.bus_type || (bus.ac ? "AC" : "Non-AC"),
          from: bus.source_city || from,
          to: bus.destination_city || to,
          departure: formatTime(bus.departure_datetime),
          arrival: formatTime(bus.arrival_datetime),
          duration: calculateDuration(
            bus.departure_datetime,
            bus.arrival_datetime,
          ),
          price: parseFloat(bus.fare) || 0,
          totalSeats: bus.total_seats || 0,
          available: bus.available_seats || 0,
          rating: bus.rating || 4.5,
          amenities: getAmenities(bus),
          busNumber: bus.bus_number || "N/A",
          busId: bus.bus,
          status: bus.status,
          seatLayout: bus.seat_layout || { left: 2, right: 2 },
        }));

        setBuses(transformedBuses);
        setFilteredBuses(transformedBuses);
      } else {
        setBuses([]);
        setFilteredBuses([]);
      }
    } catch (error: any) {
      console.error("Error fetching buses:", error);
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          alert("Session Expired. Please login again.");
          router.push("/login");
        } else if (status === 404) {
          alert("No buses available for this route on the selected date.");
        } else {
          alert(error.response.data?.message || "Failed to fetch buses.");
        }
      } else if (error.request) {
        alert("Unable to connect to the server. Please check your internet connection.");
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch route stops
  const fetchRouteStops = async (routeId: number) => {
    try {
      setIsLoadingStops(true);
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(
        `${API_URL}/api/v1/routes/routestop/?routeid=${routeId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.data) {
        const stops = response.data.data;
        setRouteStops(stops);

        const boarding = stops.filter((stop: any) => stop.is_boarding);
        const dropping = stops.filter((stop: any) => stop.is_dropping);

        setBoardingStops(boarding);
        setDroppingStops(dropping);
        setSelectedBoardingStop(null);
        setSelectedDroppingStop(null);
        setPricePerSeat(null);
        setShowBoardingModal(true);
      }
    } catch (error) {
      console.error("Error fetching route stops:", error);
    } finally {
      setIsLoadingStops(false);
    }
  };

  // Fetch price per seat
  const fetchPricePerSeat = async (
    routeId: number,
    boardingStopId: number,
    droppingStopId: number
  ) => {
    try {
      setIsLoadingPrice(true);
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(
        `${API_URL}/api/v1/routes/priceperseat/`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          params: {
            route: routeId,
            boardingstop: boardingStopId,
            droppingstop: droppingStopId,
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.priceperseat) {
        const price = response.data.priceperseat;
        setPricePerSeat(price);
        return price;
      }
      return null;
    } catch (error) {
      console.error("Error fetching price per seat:", error);
      alert("Failed to fetch price. Please try again.");
      return null;
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Handle book now click
  const handleBookNow = (bus: Bus) => {
    setSelectedBus(bus);
    setPricePerSeat(null);

    if (routeStops.length > 0) {
      const boarding = routeStops.filter((stop: any) => stop.is_boarding);
      const dropping = routeStops.filter((stop: any) => stop.is_dropping);

      if (boarding.length <= 2 && dropping.length <= 2) {
        const boardingStop =
          boarding.find((s: any) => s.stop_order === 1) || boarding[0];
        const droppingStop =
          dropping.find((s: any) => s.stop_order === boarding.length) ||
          dropping[dropping.length - 1];

        fetchPricePerSeat(bus.routeId, boardingStop.id, droppingStop.id).then(
          (price) => {
            navigateToBusDetails(bus, boardingStop, droppingStop, price);
          }
        );
      } else {
        setBoardingStops(boarding);
        setDroppingStops(dropping);
        setSelectedBoardingStop(null);
        setSelectedDroppingStop(null);
        setShowBoardingModal(true);
      }
    } else {
      fetchRouteStops(bus.routeId);
    }
  };

  // Navigate to bus details
  const navigateToBusDetails = (
    bus: Bus,
    boardingStop: Stop,
    droppingStop: Stop,
    price?: number
  ) => {
    const finalPrice = price || pricePerSeat || bus.price;

    router.push(
      `/busdetails?id=${bus.id}&scheduleId=${bus.scheduleId}&routeId=${bus.routeId}&boardingStopId=${boardingStop.id}&droppingStopId=${droppingStop.id}&boardingCity=${boardingStop.city_name}&droppingCity=${droppingStop.city_name}&price=${finalPrice}`
    );
  };

  // Handle stop selection
  const handleStopSelect = async (stop: Stop, type: "boarding" | "dropping") => {
    if (type === "boarding") {
      setSelectedBoardingStop(stop);
      if (selectedDroppingStop?.id === stop.id) {
        setSelectedDroppingStop(null);
        setPricePerSeat(null);
      }
    } else {
      setSelectedDroppingStop(stop);
    }

    const boarding = type === "boarding" ? stop : selectedBoardingStop;
    const dropping = type === "dropping" ? stop : selectedDroppingStop;

    if (boarding && dropping && boarding.id !== dropping.id) {
      if (boarding.stop_order >= dropping.stop_order) {
        alert("Boarding stop must be before dropping stop.");
        setSelectedDroppingStop(null);
        setPricePerSeat(null);
        return;
      }

      const price = await fetchPricePerSeat(
        selectedBus!.routeId,
        boarding.id,
        dropping.id
      );
      if (price) {
        setPricePerSeat(price);
      }
    }
  };

  // Handle confirm stops
  const handleConfirmStops = () => {
    if (!selectedBoardingStop || !selectedDroppingStop) {
      alert("Please select both boarding and dropping stops.");
      return;
    }

    if (selectedBoardingStop.id === selectedDroppingStop.id) {
      alert("Boarding and dropping stops cannot be the same.");
      return;
    }

    if (selectedBoardingStop.stop_order >= selectedDroppingStop.stop_order) {
      alert("Boarding stop must be before dropping stop.");
      return;
    }

    if (pricePerSeat) {
      navigateToBusDetails(
        selectedBus!,
        selectedBoardingStop,
        selectedDroppingStop,
        pricePerSeat
      );
      setShowBoardingModal(false);
    } else {
      alert("Unable to fetch price. Please try again.");
    }
  };

  // Render stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      );
    }
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      );
    }
    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-3.5 h-3.5 text-amber-400" />
      );
    }
    return stars;
  };

  // Apply filters and sorting
  useEffect(() => {
    let result = [...buses];

    if (selectedFilter !== "All") {
      result = result.filter((bus) => bus.type === selectedFilter);
    }

    switch (sortBy) {
      case "price":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "departure":
        result.sort((a, b) => a.departure.localeCompare(b.departure));
        break;
      default:
        break;
    }

    setFilteredBuses(result);
  }, [buses, selectedFilter, sortBy]);

  // Load buses on mount
  useEffect(() => {
    fetchBuses();
  }, []);

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
              <Bus className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Searching for buses...</p>
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
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </motion.button>

            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Available Buses</h1>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold text-indigo-600">
                  {from} → {to}
                </span>
                <span className="text-slate-400">•</span>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {format(new Date(date), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchBuses}
              className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-indigo-600" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-24">
        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <div className="flex gap-2 overflow-x-auto flex-1 pb-1 scrollbar-hide">
            {filterOptions.map((filter) => (
              <motion.button
                key={filter}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFilter(filter)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                  selectedFilter === filter
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-white/60 text-slate-500 hover:bg-white/80 border border-slate-200/50"
                )}
              >
                {filter}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSortModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-semibold text-sm whitespace-nowrap hover:bg-indigo-100 transition-colors"
          >
            <SortAsc className="w-4 h-4" />
            Sort
          </motion.button>
        </motion.div>

        {/* Bus Count */}
        <div className="mb-4">
          <p className="text-sm text-slate-400 font-medium">
            {filteredBuses.length} buses found
          </p>
        </div>

        {/* Bus List */}
        <AnimatePresence mode="wait">
          {filteredBuses.length > 0 ? (
            <div className="space-y-4">
              {filteredBuses.map((bus, index) => (
                <motion.div
                  key={bus.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="p-5">
                    {/* Bus Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
                          <Bus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{bus.name}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "text-xs font-semibold px-2 py-0.5 rounded-full",
                              bus.type === "AC" 
                                ? "bg-blue-100 text-blue-600" 
                                : "bg-amber-100 text-amber-600"
                            )}>
                              {bus.type}
                            </span>
                            <span className="text-xs text-slate-400">• {bus.busNumber}</span>
                            <span className="text-xs text-slate-400">• {bus.totalSeats} seats</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-0.5">
                          {renderStars(bus.rating)}
                        </div>
                        <span className="text-xs text-slate-400">{bus.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-4 py-3 border-y border-slate-100 mb-3">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-indigo-600" />
                        <div className="w-0.5 h-8 bg-slate-200" />
                        <div className="w-3 h-3 rounded-full bg-purple-600 border-2 border-purple-200" />
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900">{bus.departure}</p>
                          <p className="text-sm text-slate-400">{bus.from}</p>
                        </div>
                        <div className="flex-1 mx-4 text-center">
                          <div className="h-px bg-slate-200 w-full" />
                          <p className="text-xs text-slate-400 mt-1">{bus.duration}</p>
                          <div className="h-px bg-slate-200 w-full" />
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{bus.arrival}</p>
                          <p className="text-sm text-slate-400">{bus.to}</p>
                        </div>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {bus.amenities.slice(0, 4).map((amenity, idx) => {
                        const Icon = getAmenityIcon(amenity);
                        return (
                          <span key={idx} className="flex items-center gap-1.5 bg-indigo-50/50 px-2.5 py-1 rounded-lg text-xs text-indigo-600 font-medium">
                            <Icon className="w-3.5 h-3.5" />
                            {getAmenityLabel(amenity)}
                          </span>
                        );
                      })}
                      {bus.amenities.length > 4 && (
                        <span className="text-xs text-slate-400 font-medium">
                          +{bus.amenities.length - 4} more
                        </span>
                      )}
                      <span className={cn(
                        "text-xs font-semibold ml-auto",
                        bus.available > 5 ? "text-emerald-600" : "text-red-500"
                      )}>
                        {bus.available} seats left
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Price per seat</p>
                        <p className="text-2xl font-extrabold text-indigo-600">Rs. {bus.price}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleBookNow(bus)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                      >
                        Book Now
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
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
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                <Bus className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mt-4">No buses found</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                Try adjusting your filters or search for a different route
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchBuses}
                className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sort Modal */}
      <AnimatePresence>
        {showSortModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowSortModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sort by</h3>
                <div className="space-y-1">
                  {sortOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortModal(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between py-3.5 px-4 rounded-xl transition-all",
                        sortBy === option.value && "bg-indigo-50/50 border border-indigo-100/50"
                      )}
                    >
                      <span className={cn(
                        "font-medium",
                        sortBy === option.value ? "text-indigo-600" : "text-slate-700"
                      )}>
                        {option.label}
                      </span>
                      {sortBy === option.value && (
                        <Check className="w-5 h-5 text-indigo-600" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boarding Stop Selection Modal */}
      <AnimatePresence>
        {showBoardingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowBoardingModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 overflow-y-auto max-h-[90vh]">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Select Stops</h3>
                  <p className="text-sm text-slate-400">Choose your boarding and dropping points</p>
                </div>

                {isLoadingStops ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-sm text-slate-400 mt-4">Loading stops...</p>
                  </div>
                ) : (
                  <>
                    {/* Boarding Stops */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                          <LogIn className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Boarding Point</h4>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {boardingStops.map((stop) => (
                          <motion.button
                            key={stop.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStopSelect(stop, "boarding")}
                            className={cn(
                              "min-w-[120px] px-4 py-3 rounded-xl border-2 transition-all text-center flex-shrink-0",
                              selectedBoardingStop?.id === stop.id
                                ? "border-emerald-500 bg-emerald-50/50"
                                : "border-slate-200 bg-white/50 hover:border-emerald-200"
                            )}
                          >
                            <div className={cn(
                              "w-2 h-2 rounded-full mx-auto mb-1.5",
                              selectedBoardingStop?.id === stop.id ? "bg-emerald-500" : "bg-slate-300"
                            )} />
                            <p className={cn(
                              "font-semibold text-sm",
                              selectedBoardingStop?.id === stop.id ? "text-emerald-700" : "text-gray-900"
                            )}>
                              {stop.city_name}
                            </p>
                            <p className="text-xs text-slate-400">Stop {stop.stop_order}</p>
                            {selectedBoardingStop?.id === stop.id && (
                              <Check className="w-4 h-4 text-emerald-500 mx-auto mt-1" />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Dropping Stops */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                          <LogOut className="w-4 h-4 text-red-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Dropping Point</h4>
                        {selectedBoardingStop && (
                          <span className="text-xs text-slate-400">
                            (Excluding {selectedBoardingStop.city_name})
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {droppingStops
                          .filter((stop) => stop.id !== selectedBoardingStop?.id)
                          .map((stop) => (
                            <motion.button
                              key={stop.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleStopSelect(stop, "dropping")}
                              className={cn(
                                "min-w-[120px] px-4 py-3 rounded-xl border-2 transition-all text-center flex-shrink-0",
                                selectedDroppingStop?.id === stop.id
                                  ? "border-red-500 bg-red-50/50"
                                  : "border-slate-200 bg-white/50 hover:border-red-200"
                              )}
                            >
                              <div className={cn(
                                "w-2 h-2 rounded-full mx-auto mb-1.5",
                                selectedDroppingStop?.id === stop.id ? "bg-red-500" : "bg-slate-300"
                              )} />
                              <p className={cn(
                                "font-semibold text-sm",
                                selectedDroppingStop?.id === stop.id ? "text-red-700" : "text-gray-900"
                              )}>
                                {stop.city_name}
                              </p>
                              <p className="text-xs text-slate-400">Stop {stop.stop_order}</p>
                              {selectedDroppingStop?.id === stop.id && (
                                <Check className="w-4 h-4 text-red-500 mx-auto mt-1" />
                              )}
                            </motion.button>
                          ))}
                        {droppingStops.filter((stop) => stop.id !== selectedBoardingStop?.id).length === 0 && (
                          <div className="py-4 px-6 text-sm text-slate-400">
                            Please select a boarding point first
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    {selectedBoardingStop && selectedDroppingStop && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 mb-4"
                      >
                        <div className="flex items-center justify-around">
                          <div className="text-center">
                            <p className="text-xs text-white/70 font-medium">Boarding</p>
                            <p className="text-white font-bold">{selectedBoardingStop.city_name}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-white/50" />
                          <div className="text-center">
                            <p className="text-xs text-white/70 font-medium">Dropping</p>
                            <p className="text-white font-bold">{selectedDroppingStop.city_name}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/20">
                          <div>
                            <p className="text-xs text-white/70">Price per seat</p>
                            {isLoadingPrice ? (
                              <Loader2 className="w-5 h-5 text-white animate-spin mt-1" />
                            ) : (
                              <p className="text-xl font-extrabold text-white">
                                Rs. {pricePerSeat || selectedBus?.price || 0}
                              </p>
                            )}
                          </div>
                          {pricePerSeat && (
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs text-white font-semibold">
                              Updated
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Confirm Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirmStops}
                      disabled={
                        !selectedBoardingStop ||
                        !selectedDroppingStop ||
                        !pricePerSeat ||
                        isLoadingPrice
                      }
                      className={cn(
                        "w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25",
                        (!selectedBoardingStop || !selectedDroppingStop || !pricePerSeat || isLoadingPrice) &&
                          "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isLoadingPrice ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Confirm & Continue
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}