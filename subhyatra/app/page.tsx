// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
} from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { cn } from "@/lib/utils";
import logo from "@/public/eticketlogo.jpeg";
import banner1 from "@/public/banner1.jpeg";
import scripiobanner from "@/public/scripiobanner.jpeg";

// Types
interface City {
  id: number;
  name: string;
  province: string;
}

interface Route {
  id: number;
  source_city_name: string;
  destination_city_name: string;
  fare: number;
  duration?: string;
}

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Helper function to format duration
const formatDuration = (duration?: string): string => {
  if (!duration) return "7:00 AM";
  const parts = duration.split(":");
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  }
  return "7:00 AM";
};

// Format date for display
const formatDate = (date: Date): string => {
  return format(date, "dd MMMM yyyy");
};

// Format date for API
const formatDateForAPI = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  
  // Search state
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [cities, setCities] = useState<City[]>([]);
  const [busCount, setBusCount] = useState(0);
  const [hiaceCount, setHiaceCount] = useState(0);
  const [activeVehicleTab, setActiveVehicleTab] = useState<"bus" | "hiace">("bus");
  const [popularRoutes, setPopularRoutes] = useState<any[]>([]);
  const [recommendedBuses, setRecommendedBuses] = useState<any[]>([]);
  const [recommendedHiace, setRecommendedHiace] = useState<any[]>([]);

  // Modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchType, setSearchType] = useState<"from" | "to">("from");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<City[]>([]);

  // Greeting
  const [greeting, setGreeting] = useState("Good Morning");
  const [userName, setUserName] = useState("Guest");

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Update greeting based on time
  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setGreeting("Good Morning");
    } else if (currentHour < 17) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }

    // Get user name from localStorage
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.fullName || user.name || "Guest");
      } catch {
        setUserName("Guest");
      }
    }
  }, []);

  // Fetch cities on mount
  useEffect(() => {
    fetchCities();
    fetchPopularRoutes();
    fetchRecommendedBuses();
    fetchRecommendedHiace();
  }, []);

  // Fetch vehicle count when from, to, or date changes
  useEffect(() => {
    if (from && to) {
      fetchBusCount();
      fetchHiaceCount();
    }
  }, [from, to, date]);

  // Fetch cities from API
  const fetchCities = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(`${API_URL}/api/v1/cities/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 10000,
      });

      if (response.data && response.data.results) {
        const cityList = response.data.results;
        setCities(cityList);
        setSearchResults(cityList);

        if (cityList.length > 0) {
          setFrom(cityList[0].name);
          if (cityList.length > 1) {
            setTo(cityList[1].name);
          } else {
            setTo(cityList[0].name);
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching cities:", error);
      const fallbackCities = [
        { id: 1, name: "Kathmandu", province: "BAGMATI" },
        { id: 2, name: "Pokhara", province: "GANDAKI" },
        { id: 3, name: "Butwal", province: "LUMBINI" },
        { id: 4, name: "Chitwan", province: "BAGMATI" },
        { id: 5, name: "Rampur", province: "LUMBINI" },
      ];
      setCities(fallbackCities);
      setSearchResults(fallbackCities);
      setFrom("Kathmandu");
      setTo("Pokhara");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch bus count
  const fetchBusCount = async () => {
    if (!from || !to) return;

    try {
      setIsLoadingCities(true);
      const token = localStorage.getItem("accessToken");
      const formattedDate = formatDateForAPI(date);

      const response = await axios.get(`${API_URL}/api/v1/schedules/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        params: {
          source: from,
          destination: to,
          date: formattedDate,
        },
        timeout: 10000,
      });

      setBusCount(response.data?.length || 0);
    } catch (error) {
      console.error("Error fetching bus count:", error);
      setBusCount(0);
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Fetch hiace count
  const fetchHiaceCount = async () => {
    if (!from || !to) return;

    try {
      setIsLoadingCities(true);
      const token = localStorage.getItem("accessToken");
      const formattedDate = formatDateForAPI(date);

      const response = await axios.get(`${API_URL}/api/v1/hiace-schedules/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        params: {
          source: from,
          destination: to,
          date: formattedDate,
        },
        timeout: 10000,
      });

      setHiaceCount(response.data?.results?.length || 0);
    } catch (error) {
      console.error("Error fetching hiace count:", error);
      setHiaceCount(0);
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Fetch popular routes
  const fetchPopularRoutes = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(`${API_URL}/api/v1/routes/popular/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 10000,
      });

      if (response.data && response.data.results) {
        setPopularRoutes(response.data.results);
      } else if (Array.isArray(response.data)) {
        setPopularRoutes(response.data);
      } else {
        setPopularRoutes([]);
      }
    } catch (error) {
      console.error("Error fetching popular routes:", error);
      setPopularRoutes([]);
    }
  };

  // Fetch recommended buses
  const fetchRecommendedBuses = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(`${API_URL}/api/v1/buses/recommended/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 10000,
      });

      if (response.data && response.data.results) {
        setRecommendedBuses(response.data.results);
      } else if (Array.isArray(response.data)) {
        setRecommendedBuses(response.data);
      } else {
        setRecommendedBuses([]);
      }
    } catch (error) {
      console.error("Error fetching recommended buses:", error);
      setRecommendedBuses([]);
    }
  };

  // Fetch recommended hiace
  const fetchRecommendedHiace = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(`${API_URL}/api/v1/hiace/recommended/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 10000,
      });

      if (response.data && response.data.results) {
        setRecommendedHiace(response.data.results);
      } else if (Array.isArray(response.data)) {
        setRecommendedHiace(response.data);
      } else {
        setRecommendedHiace([]);
      }
    } catch (error) {
      console.error("Error fetching recommended hiace:", error);
      setRecommendedHiace([]);
    }
  };

  // Search cities
  const searchCities = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchResults(cities);
      return;
    }
    const filtered = cities.filter((city) =>
      city.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  // Select city from search
  const selectCity = (city: City) => {
    if (searchType === "from") {
      setFrom(city.name);
      if (to === city.name) {
        setTo("");
      }
    } else {
      setTo(city.name);
      if (from === city.name) {
        setFrom("");
      }
    }
    setShowSearchModal(false);
    setSearchQuery("");
  };

  // Open search modal
  const openSearchModal = (type: "from" | "to") => {
    setSearchType(type);
    setSearchQuery("");
    setSearchResults(cities);
    setShowSearchModal(true);
  };

  // Handle search
  const handleSearch = () => {
    if (!from || !to) {
      alert("Please select both departure and destination cities.");
      return;
    }

    if (from === to) {
      alert("Departure and destination cities cannot be the same.");
      return;
    }

    const route = activeVehicleTab === "bus" ? "/buslist" : "/hiacelist";
    router.push(
      `${route}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${formatDateForAPI(date)}`
    );
  };

  // Navigate to ambulance booking
  const handleAmbulanceBooking = () => {
    router.push("/ambulancebooking");
  };

  // Navigate to scripio reserved
  const handleScripioReserved = () => {
    router.push("/scripio-reserved");
  };

  // Navigate to profile
  const handleProfile = () => {
    router.push("/profile");
  };

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
              <Bus className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Loading cities...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      {/* Modern Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 pt-8 pb-12 px-6 rounded-b-[2.5rem] relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex justify-between items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-white/90 font-medium text-sm flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                {greeting}
              </p>
              <h1 className="text-3xl font-extrabold text-white mt-1">
                {userName !== "Guest" ? `${userName} 👋` : "Where to today?"}
              </h1>
              {userName !== "Guest" && (
                <p className="text-white/80 text-sm mt-0.5">Ready for your next journey?</p>
              )}
            </motion.div>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={handleProfile}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm p-0.5 hover:bg-white/30 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                <Image
                  src={logo}
                  alt="Profile"
                  width={44}
                  height={44}
                  className="object-cover"
                />
              </div>
            </motion.button>
          </div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 mt-6"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
              <Bus className="w-4 h-4 text-white/80" />
              <span className="text-white font-medium text-sm">
                {busCount + hiaceCount} Vehicles
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white/80" />
              <span className="text-white font-medium text-sm">
                {popularRoutes.length} Routes
              </span>
            </div>
          </motion.div>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-4 -mt-6 pb-12 relative z-20">
        {/* Search Card - Modern Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/50"
        >
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Plan your trip</h2>
              <p className="text-sm text-gray-500">Find the best vehicles for your journey</p>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-1.5 rounded-full border border-indigo-100/50">
              {isLoadingCities ? (
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              ) : (
                <span className="text-sm font-semibold text-indigo-600 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {activeVehicleTab === "bus" ? busCount : hiaceCount}{" "}
                  {activeVehicleTab === "bus" ? "buses" : "hiaces"} available
                </span>
              )}
            </div>
          </div>

          {/* Vehicle Tabs - Modern Pill */}
          <div className="flex gap-2 mb-5 p-1 bg-slate-100/80 rounded-2xl">
            <button
              onClick={() => setActiveVehicleTab("bus")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
                activeVehicleTab === "bus"
                  ? "bg-white shadow-md text-indigo-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              )}
            >
              <Bus className={cn(
                "w-4 h-4 transition-colors",
                activeVehicleTab === "bus" ? "text-indigo-600" : "text-slate-400"
              )} />
              <span className="font-semibold text-sm">Buses</span>
              {activeVehicleTab === "bus" && (
                <span className="ml-1 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveVehicleTab("hiace")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
                activeVehicleTab === "hiace"
                  ? "bg-white shadow-md text-purple-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              )}
            >
              <Car className={cn(
                "w-4 h-4 transition-colors",
                activeVehicleTab === "hiace" ? "text-purple-600" : "text-slate-400"
              )} />
              <span className="font-semibold text-sm">Hiace</span>
              {activeVehicleTab === "hiace" && (
                <span className="ml-1 w-1.5 h-1.5 bg-purple-600 rounded-full" />
              )}
            </button>
          </div>

          {/* Location Inputs */}
          <div className="space-y-3">
            {/* From */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => openSearchModal("from")}
              className="w-full flex items-center gap-3 bg-slate-50/80 hover:bg-slate-100/80 px-4 py-3.5 rounded-2xl border border-slate-200/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">From</p>
                <p className="font-semibold text-gray-900">{from || "Select departure"}</p>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </motion.button>

            {/* Swap - Centered elegantly */}
            <div className="relative flex justify-center -my-1.5">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  const temp = from;
                  setFrom(to);
                  setTo(temp);
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2.5 rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all z-10"
              >
                <ArrowDownUp className="w-4 h-4 text-white" />
              </motion.button>
            </div>

            {/* To */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => openSearchModal("to")}
              className="w-full flex items-center gap-3 bg-slate-50/80 hover:bg-slate-100/80 px-4 py-3.5 rounded-2xl border border-slate-200/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">To</p>
                <p className="font-semibold text-gray-900">{to || "Select destination"}</p>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </motion.button>

            {/* Date */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "date";
                input.min = formatDateForAPI(new Date());
                input.value = formatDateForAPI(date);
                input.className = "hidden";
                input.onchange = (e) => {
                  const val = (e.target as HTMLInputElement).value;
                  if (val) {
                    setDate(new Date(val));
                  }
                };
                document.body.appendChild(input);
                input.click();
                document.body.removeChild(input);
              }}
              className="w-full flex items-center gap-3 bg-slate-50/80 hover:bg-slate-100/80 px-4 py-3.5 rounded-2xl border border-slate-200/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Journey Date</p>
                <p className="font-semibold text-gray-900">{formatDate(date)}</p>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </motion.button>
          </div>

          {/* Search Button - Modern gradient with glow */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            className="w-full mt-6 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Search className="w-5 h-5" />
            Search {activeVehicleTab === "bus" ? "Buses" : "Hiaces"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>

        {/* Quick Actions - Modern Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-500">Your most used features</p>
            </div>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              View All →
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Ticket, label: "My Tickets", color: "indigo", href: "/(tabs)/bookings" },
              { icon: Bus, label: "Routes", color: "purple", href: "/routelist" },
              { icon: Navigation, label: "Track", color: "blue", href: "/location" },
              { icon: Car, label: "Scripio", color: "emerald", href: "/scripio-reserved" },
            ].map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                whileHover={{ y: -4, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-100/50 shadow-sm hover:shadow-md transition-all"
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  item.color === "indigo" && "bg-indigo-50",
                  item.color === "purple" && "bg-purple-50",
                  item.color === "blue" && "bg-blue-50",
                  item.color === "emerald" && "bg-emerald-50"
                )}>
                  <item.icon className={cn(
                    "w-6 h-6",
                    item.color === "indigo" && "text-indigo-600",
                    item.color === "purple" && "text-purple-600",
                    item.color === "blue" && "text-blue-600",
                    item.color === "emerald" && "text-emerald-600"
                  )} />
                </div>
                <span className="text-xs font-semibold text-slate-600">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Ambulance Booking - Prominent Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAmbulanceBooking}
          className="w-full mt-6 bg-gradient-to-r from-red-600 to-rose-500 rounded-2xl py-4 flex items-center justify-center gap-3 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Ambulance className="w-6 h-6 text-white" />
          <span className="font-bold text-white text-base">Emergency Ambulance Service</span>
          <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Scripio Banner */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileHover={{ scale: 1.01 }}
          onClick={handleScripioReserved}
          className="w-full mt-4 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
        >
          <div className="relative w-full h-44">
            <Image
              src={scripiobanner}
              alt="Scripio Reserved"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center px-6">
              <div className="text-left">
                <p className="text-white font-bold text-xl">Scripio Reserved</p>
                <p className="text-white/80 text-sm">Premium vehicle booking</p>
              </div>
            </div>
          </div>
        </motion.button>

        {/* Popular Routes - Modern Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Popular Routes</h3>
              <p className="text-sm text-gray-500">Most booked routes</p>
            </div>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              View All →
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {popularRoutes.map((item: any, index: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="min-w-[180px] bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-slate-100/50 flex-shrink-0 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="font-semibold text-gray-900 mt-3 text-sm">
                  {item.source_city_name} → {item.destination_city_name}
                </p>
                <p className="font-bold text-indigo-600 mt-1">
                  Rs. {item.fare}
                </p>
                <span className="inline-flex items-center gap-1 mt-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full">
                  <Star className="w-3 h-3 fill-indigo-600" />
                  Popular
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="w-full mt-4 rounded-2xl overflow-hidden shadow-lg"
        >
          <div className="relative w-full h-40">
            <Image
              src={banner1}
              alt="Special Offer"
              fill
              className="object-cover"
            />
          </div>
        </motion.div>

        {/* Recommended Vehicles - Modern Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Recommended {activeVehicleTab === "bus" ? "Buses" : "Hiaces"}
              </h3>
              <p className="text-sm text-gray-500">Best rated vehicles for you</p>
            </div>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              View All →
            </button>
          </div>

          {activeVehicleTab === "bus" ? (
            recommendedBuses.length > 0 ? (
              <div className="space-y-3">
                {recommendedBuses.map((item: any, index: number) => {
                  const firstRoute = item.routes?.[0] || {};
                  const fromCity = firstRoute.source_city_name || item.source_city_name || "N/A";
                  const toCity = firstRoute.destination_city_name || item.destination_city_name || "N/A";
                  const fare = item.fare || firstRoute.fare || 0;
                  const duration = firstRoute.duration ? formatDuration(firstRoute.duration) : "7:00 AM";

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-slate-100/50 flex items-center gap-4 hover:shadow-lg transition-all"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20">
                        <Bus className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{item.bus_name}</p>
                          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Award className="w-3 h-3" />
                            Top Rated
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {fromCity} <ArrowRight className="w-3 h-3 inline" /> {toCity}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-400">{duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs text-slate-400">4.8</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-indigo-600 text-lg">Rs. {fare}</p>
                        <span className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-shadow">
                          Book Now
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8 bg-white/50 rounded-2xl">
                No recommended buses found
              </p>
            )
          ) : (
            recommendedHiace.length > 0 ? (
              <div className="space-y-3">
                {recommendedHiace.map((item: any, index: number) => {
                  const firstRoute = item.routes?.[0] || {};
                  const fromCity = firstRoute.source_city_name || item.source_city_name || "N/A";
                  const toCity = firstRoute.destination_city_name || item.destination_city_name || "N/A";
                  const fare = item.fare || firstRoute.fare || 0;
                  const duration = firstRoute.duration ? formatDuration(firstRoute.duration) : "7:00 AM";

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-slate-100/50 flex items-center gap-4 hover:shadow-lg transition-all"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
                        <Car className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{item.hiace_name}</p>
                          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Award className="w-3 h-3" />
                            Top Rated
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {fromCity} <ArrowRight className="w-3 h-3 inline" /> {toCity}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-400">{duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs text-slate-400">4.9</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-emerald-600 text-lg">Rs. {fare}</p>
                        <span className="inline-block bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow">
                          Book Now
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8 bg-white/50 rounded-2xl">
                No recommended hiaces found
              </p>
            )
          )}
        </motion.div>
      </main>

      {/* Search Modal - Modern Bottom Sheet */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowSearchModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl max-h-[85%] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    {searchType === "from" ? "Select Departure" : "Select Destination"}
                  </h3>
                  <button
                    onClick={() => setShowSearchModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5 mt-4 border border-slate-100/50 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    className="flex-1 bg-transparent outline-none text-gray-900 placeholder-slate-400 font-medium"
                    placeholder={`Search ${searchType === "from" ? "departure" : "destination"} city...`}
                    value={searchQuery}
                    onChange={(e) => searchCities(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button onClick={() => searchCities("")} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-y-auto max-h-[60vh] p-4">
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((city) => (
                      <motion.button
                        key={city.id}
                        whileHover={{ x: 4 }}
                        onClick={() => selectCity(city)}
                        className={cn(
                          "w-full flex items-center justify-between py-3.5 px-3 rounded-xl transition-all",
                          ((searchType === "from" && from === city.name) ||
                            (searchType === "to" && to === city.name)) &&
                            "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900">{city.name}</p>
                            <p className="text-xs text-slate-400">{city.province}</p>
                          </div>
                        </div>
                        {((searchType === "from" && from === city.name) ||
                          (searchType === "to" && to === city.name)) && (
                          <Check className="w-5 h-5 text-indigo-600" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                      <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="font-semibold text-gray-900 mt-4">No cities found</p>
                    <p className="text-sm text-slate-400">
                      Try searching with a different term
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}