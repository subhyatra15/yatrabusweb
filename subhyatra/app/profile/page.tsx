// @ts-nocheck
// app/profile/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Star,
  Bus,
  Ticket,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Bell,
  Camera,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  Shield,
  CreditCard,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import logo from "@/public/eticketlogo.jpeg";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface User {
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  totalTrips: number;
  totalSpent: string;
  rating: number;
  profileImage: string;
}

interface BookingStats {
  total: number;
  upcoming: number;
  completed: number;
}

interface Trip {
  from: string;
  to: string;
  date: string;
  price: string;
  status: string;
}

// Demo data for fallback
const DEMO_USER: User = {
  name: "Rahul Sharma",
  email: "rahul.sharma@example.com",
  phone: "+977 984-1234567",
  memberSince: "Jan 2024",
  totalTrips: 24,
  totalSpent: "Rs. 45,280",
  rating: 4.8,
  profileImage: "https://i.pravatar.cc/150?img=11",
};

const DEMO_BOOKINGS: Trip[] = [
  {
    from: "Kathmandu",
    to: "Pokhara",
    date: "Dec 15, 2024",
    price: "Rs. 1,200",
    status: "COMPLETED",
  },
  {
    from: "Butwal",
    to: "Kathmandu",
    date: "Dec 20, 2024",
    price: "Rs. 800",
    status: "COMPLETED",
  },
  {
    from: "Pokhara",
    to: "Kathmandu",
    date: "Jan 5, 2025",
    price: "Rs. 1,200",
    status: "UPCOMING",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User>(DEMO_USER);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTrips, setRecentTrips] = useState<Trip[]>(DEMO_BOOKINGS);
  const [bookingStats, setBookingStats] = useState<BookingStats>({
    total: 0,
    upcoming: 0,
    completed: 0,
  });

  // Menu items
  const menuItems = [
    {
      icon: User,
      title: "Personal Information",
      href: "/profile/personalinfo",
      color: "#4f46e5",
    },
    {
      icon: Ticket,
      title: "My Tickets",
      href: "/bookings",
      color: "#2563eb",
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      href: "/profile/help",
      color: "#8b5cf6",
    },
  ];

  // Format date helper
  const formatDate = (datetime: string): string => {
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

  const formatMemberSince = (datetime: string): string => {
    if (!datetime) return "Jan 2024";
    try {
      const date = new Date(datetime);
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Jan 2024";
    }
  };

  // Transform booking data
  const transformBooking = (booking: any): Trip => {
    const schedule = booking.schedule || booking.schedule_details || {};
    const route = schedule.route || {};
    
    return {
      from: route.source_city_name || schedule.source_city || booking.from_city || "N/A",
      to: route.destination_city_name || schedule.destination_city || booking.to_city || "N/A",
      date: formatDate(schedule.departure_datetime || booking.created_at),
      price: `Rs. ${booking.total_amount || 0}`,
      status: booking.booking_status || "PENDING",
    };
  };

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        console.log("No token found, using demo data");
        setUser(DEMO_USER);
        return;
      }

      const response = await axios.get(`${API_URL}/api/v1/auth/me/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      });

      console.log("Profile Response:", response.data);

      if (response.data && response.data.user) {
        const data = response.data.user;
        setUser({
          name: data.fullName || data.full_name || data.name || DEMO_USER.name,
          email: data.email || DEMO_USER.email,
          phone: data.phone || data.phone_number || DEMO_USER.phone,
          memberSince: formatMemberSince(data.created_at || data.date_joined),
          totalTrips: data.total_trips || 0,
          totalSpent: `Rs. ${data.total_spent || 0}`,
          rating: data.rating || 4.5,
          profileImage: data.profile_image || data.profileImage || DEMO_USER.profileImage,
        });
      } else {
        console.log("Empty response, using demo data");
        setUser(DEMO_USER);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      
      setUser(DEMO_USER);
      
      if (error.response?.status === 401) {
        alert("Session Expired. Please login again.");
        router.push("/");
      }
    }
  }, [router]);

  // Fetch booking statistics
  const fetchBookingStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        console.log("No token, using demo bookings");
        setRecentTrips(DEMO_BOOKINGS);
        setBookingStats({
          total: DEMO_BOOKINGS.length,
          upcoming: DEMO_BOOKINGS.filter(b => b.status === "UPCOMING").length,
          completed: DEMO_BOOKINGS.filter(b => b.status === "COMPLETED").length,
        });
        return;
      }

      let allBookings = [];
      
      try {
        const busResponse = await axios.get(`${API_URL}/api/v1/bookings/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        });
        
        if (busResponse.data && busResponse.data.results) {
          allBookings = [...allBookings, ...busResponse.data.results];
        }
      } catch (e) {
        console.log("Bus bookings error:", e);
      }

      try {
        const hiaceResponse = await axios.get(`${API_URL}/api/v1/hiace-bookings/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        });
        
        if (hiaceResponse.data && hiaceResponse.data.results) {
          allBookings = [...allBookings, ...hiaceResponse.data.results];
        }
      } catch (e) {
        console.log("Hiace bookings error:", e);
      }

      console.log("All Bookings:", allBookings);

      if (allBookings.length > 0) {
        const now = new Date();
        
        const total = allBookings.length;
        const upcoming = allBookings.filter(b => {
          const departure = new Date(b.schedule?.departure_datetime || b.schedule_details?.departure_datetime);
          const status = b.booking_status?.toUpperCase() || "";
          return departure > now && (status === "PAID" || status === "CONFIRMED" || status === "PENDING");
        }).length;
        const completed = allBookings.filter(b => {
          const departure = new Date(b.schedule?.departure_datetime || b.schedule_details?.departure_datetime);
          const status = b.booking_status?.toUpperCase() || "";
          return departure < now || status === "COMPLETED";
        }).length;

        setBookingStats({ total, upcoming, completed });

        const sortedBookings = [...allBookings]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3)
          .map(transformBooking);
        
        if (sortedBookings.length > 0) {
          setRecentTrips(sortedBookings);
        } else {
          setRecentTrips(DEMO_BOOKINGS);
        }
      } else {
        console.log("No bookings found, using demo data");
        setRecentTrips(DEMO_BOOKINGS);
        setBookingStats({
          total: DEMO_BOOKINGS.length,
          upcoming: DEMO_BOOKINGS.filter(b => b.status === "UPCOMING").length,
          completed: DEMO_BOOKINGS.filter(b => b.status === "COMPLETED").length,
        });
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setRecentTrips(DEMO_BOOKINGS);
      setBookingStats({
        total: DEMO_BOOKINGS.length,
        upcoming: DEMO_BOOKINGS.filter(b => b.status === "UPCOMING").length,
        completed: DEMO_BOOKINGS.filter(b => b.status === "COMPLETED").length,
      });
    }
  }, []);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchBookingStats()]);
    setRefreshing(false);
  };

  // Handle logout
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userData");
        localStorage.removeItem("userRole");
        router.push("/");
      } catch (error) {
        console.error("Logout error:", error);
        alert("Failed to logout. Please try again.");
      }
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUserProfile(), fetchBookingStats()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchUserProfile, fetchBookingStats]);

  // Loading state
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
              <User className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/20">
      {/* Header with linear */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-600 pt-8 pb-12 px-6 rounded-b-[2.5rem] relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header Top */}
          <div className="flex items-center justify-between mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            {/* <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            </motion.button> */}
          </div>

          {/* Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden">
                <Image
                  src={logo}
                  alt={user.name}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <h2 className="text-2xl font-extrabold text-white">{user.name}</h2>
            <p className="text-white/80 text-sm mt-0.5">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-white font-medium text-sm">
                {user.rating.toFixed(1)} Rating
              </span>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-px mt-6 bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden"
          >
            {[
              { value: bookingStats.total, label: "Total Trips" },
              { value: bookingStats.upcoming, label: "Upcoming" },
              { value: bookingStats.completed, label: "Completed" },
            ].map((stat, index) => (
              <div
                key={index}
                className={cn(
                  "text-center py-4 px-2",
                  index < 2 && "border-r border-white/10"
                )}
              >
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="text-xs text-white/70 font-medium mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 -mt-4 pb-12 relative z-20">
        {/* Menu Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100/50">
            <h3 className="text-lg font-bold text-gray-900">Account Settings</h3>
          </div>
          {menuItems.map((item, index) => (
            <motion.button
              key={index}
              whileHover={{ x: 4 }}
              onClick={() => router.push(item.href)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/50",
                index < menuItems.length - 1 && "border-b border-slate-100/50"
              )}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.color + "15" }}
              >
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <span className="flex-1 text-left font-medium text-slate-700">
                {item.title}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </motion.button>
          ))}
        </motion.div>

        {/* Recent Trips */}
        {recentTrips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recent Trips</h3>
              <button
                onClick={() => router.push("/bookings")}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                See All →
              </button>
            </div>
            <div className="space-y-3">
              {recentTrips.map((trip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
                    <Bus className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {trip.from} → {trip.to}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400">{trip.date}</span>
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        trip.status === "COMPLETED" 
                          ? "bg-emerald-50 text-emerald-600"
                          : trip.status === "UPCOMING"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-amber-50 text-amber-600"
                      )}>
                        {trip.status}
                      </span>
                    </div>
                  </div>
                  <p className="font-extrabold text-indigo-600">{trip.price}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full mt-8 bg-linear-to-r from-red-600 to-red-500 rounded-2xl py-4 flex items-center justify-center gap-3 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all"
        >
          <LogOut className="w-5 h-5 text-white" />
          <span className="font-bold text-white text-base">Logout</span>
        </motion.button>

        {/* Version */}
        <p className="text-center text-slate-400 text-xs font-medium mt-6">
          Version 2.4.1
        </p>
      </main>

      {/* Pull to refresh indicator */}
      {refreshing && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            <span className="text-sm text-slate-600 font-medium">Refreshing...</span>
          </div>
        </div>
      )}
    </div>
  );
}