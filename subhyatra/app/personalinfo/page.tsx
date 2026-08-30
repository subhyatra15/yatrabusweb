// app/profile/personalinfo/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Flag,
  AlertTriangle,
  Camera,
  Pencil,
  Save,
  X,
  ArrowLeft,
  CheckCircle,
  Star,
  Ticket,
  LogOut,
  Loader2,
  Shield,
  Award,
  TrendingUp,
  Clock,
  UserCheck,
  PhoneCall,
  MailOpen,
  Home,
  CalendarDays,
  Globe,
  PhoneForwarded,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import logo from "@/public/eticketlogo.jpeg";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface UserData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  gender: string;
  nationality: string;
  emergencyContact: string;
  emergencyName: string;
  profileImage: any;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  yearsActive: number;
  totalTrips: number;
  rating: number;
}

// Demo data for fallback
const DEMO_USER_DATA: UserData = {
  id: 1,
  fullName: "Rahul Sharma",
  email: "rahul.sharma@example.com",
  phone: "+977 984-1234567",
  address: "Butwal-11, Rupandehi",
  dob: "1995-05-15",
  gender: "Male",
  nationality: "Nepali",
  emergencyContact: "+977 984-7654321",
  emergencyName: "Sita Sharma",
  profileImage: logo,
  role: "user",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-06-20T14:45:00Z",
};

export default function PersonalInfoPage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<UserData>(DEMO_USER_DATA);
  const [tempData, setTempData] = useState<UserData>(DEMO_USER_DATA);
  const [stats, setStats] = useState<Stats>({
    yearsActive: 0,
    totalTrips: 0,
    rating: 0,
  });

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.log("No token found, using demo data");
        setUserData(DEMO_USER_DATA);
        setTempData(DEMO_USER_DATA);
        setStats({
          yearsActive: 2,
          totalTrips: 24,
          rating: 4.8,
        });
        return;
      }

      const response = await axios.get(`${API_URL}/api/v1/auth/me/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      });

      console.log("User Profile Response:", response.data);

      if (response.data && response.data.user) {
        const user = response.data.user;
        
        const mappedData: UserData = {
          id: user.id || DEMO_USER_DATA.id,
          fullName: user.fullName || user.full_name || DEMO_USER_DATA.fullName,
          email: user.email || DEMO_USER_DATA.email,
          phone: user.phone || user.phone_number || DEMO_USER_DATA.phone,
          address: user.address || DEMO_USER_DATA.address,
          dob: user.dob || user.date_of_birth || DEMO_USER_DATA.dob,
          gender: user.gender || DEMO_USER_DATA.gender,
          nationality: user.nationality || DEMO_USER_DATA.nationality,
          emergencyContact: user.emergency_contact || user.emergencyContact || DEMO_USER_DATA.emergencyContact,
          emergencyName: user.emergency_name || user.emergencyName || DEMO_USER_DATA.emergencyName,
          profileImage: logo,
          role: user.role || DEMO_USER_DATA.role,
          createdAt: user.created_at || user.createdAt || DEMO_USER_DATA.createdAt,
          updatedAt: user.updated_at || user.updatedAt || DEMO_USER_DATA.updatedAt,
        };

        setUserData(mappedData);
        setTempData(mappedData);

        // Fetch user stats
        await fetchUserStats(token);
      } else {
        console.log("Empty response, using demo data");
        setUserData(DEMO_USER_DATA);
        setTempData(DEMO_USER_DATA);
        setStats({
          yearsActive: 2,
          totalTrips: 24,
          rating: 4.8,
        });
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      
      setUserData(DEMO_USER_DATA);
      setTempData(DEMO_USER_DATA);
      setStats({
        yearsActive: 2,
        totalTrips: 24,
        rating: 4.8,
      });

      if (error.response?.status === 401) {
        alert("Session Expired. Please login again.");
        router.push("/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  // Fetch user stats
  const fetchUserStats = async (token: string) => {
    try {
      const statsResponse = await axios.get(`${API_URL}/api/v1/user/stats/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      console.log("User Stats Response:", statsResponse.data);

      if (statsResponse.data) {
        setStats({
          yearsActive: statsResponse.data.years_active || 2,
          totalTrips: statsResponse.data.total_trips || 24,
          rating: statsResponse.data.rating || 4.8,
        });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  // Handle save
  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("Please login to update profile");
        return;
      }

      const updateData = {
        fullName: tempData.fullName,
        phone: tempData.phone,
        address: tempData.address,
        dob: tempData.dob,
        gender: tempData.gender,
        nationality: tempData.nationality,
        emergencyContact: tempData.emergencyContact,
        emergencyName: tempData.emergencyName,
      };

      const response = await axios.put(
        `${API_URL}/api/v1/auth/update-profile/`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        }
      );

      console.log("Update Response:", response.data);

      if (response.data) {
        setUserData(tempData);
        setIsEditing(false);
        alert("Profile information updated successfully!");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Failed to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setTempData(userData);
    setIsEditing(false);
  };

  // Handle logout
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRole");
      router.push("/login");
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Info Field Component
  const InfoField = ({ 
    label, 
    value, 
    icon: Icon, 
    editable = true,
    type = "text"
  }: { 
    label: string;
    value: keyof UserData;
    icon: any;
    editable?: boolean;
    type?: string;
  }) => {
    const displayValue = userData[value] || "N/A";
    const tempValue = tempData[value] || "";

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50/50 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm text-slate-400 font-medium">{label}</span>
        </div>
        {isEditing && editable ? (
          <input
            type={type === "date" ? "date" : "text"}
            className="text-right text-sm font-semibold text-gray-900 bg-transparent border-b-2 border-indigo-500 outline-none focus:ring-0 px-2 py-1 min-w-[120px]"
            value={tempValue}
            onChange={(e) => setTempData({ ...tempData, [value]: e.target.value })}
            placeholder="Enter value"
          />
        ) : (
          <span className="text-sm font-semibold text-gray-900 text-right max-w-[50%] truncate">
            {displayValue}
          </span>
        )}
      </motion.div>
    );
  };

  // Loading state
  if (loading && !refreshing) {
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
              <h1 className="text-lg font-bold text-gray-900">Personal Information</h1>
            </div>
            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="bg-linear-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
              >
                <Pencil className="w-4 h-4" />
                <span className="font-semibold text-sm">Edit</span>
              </motion.button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 font-semibold text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-linear-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span className="font-semibold text-sm">Save</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-12">
        {/* Profile Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 p-1 shadow-xl shadow-indigo-500/20">
              <div className="w-full h-full rounded-full bg-white overflow-hidden">
                <Image
                  src={logo}
                  alt={userData.fullName}
                  width={112}
                  height={112}
                  className="object-cover"
                />
              </div>
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mt-4">{userData.fullName}</h2>
          <div className="flex items-center gap-2 mt-1.5 bg-emerald-50/50 px-4 py-1.5 rounded-full border border-emerald-100/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-600">Active</span>
          </div>
        </motion.div>

        {/* Personal Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden mb-4"
        >
          <div className="px-5 py-4 border-b border-slate-100/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Personal Details</h3>
            </div>
            <div className="bg-emerald-50/50 px-3 py-1 rounded-full border border-emerald-100/50">
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            </div>
          </div>
          <div className="p-5">
            <InfoField
              label="Full Name"
              value="fullName"
              icon={User}
            />
            <InfoField
              label="Email Address"
              value="email"
              icon={Mail}
              editable={false}
            />
            <InfoField
              label="Phone Number"
              value="phone"
              icon={Phone}
            />
            <InfoField
              label="Address"
              value="address"
              icon={MapPin}
            />
            <InfoField
              label="Date of Birth"
              value="dob"
              icon={Calendar}
              type="date"
            />
            <InfoField
              label="Gender"
              value="gender"
              icon={Users}
            />
            <InfoField
              label="Nationality"
              value="nationality"
              icon={Flag}
            />
          </div>
        </motion.div>

        {/* Emergency Contact Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden mb-4"
        >
          <div className="px-5 py-4 border-b border-slate-100/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-900">Emergency Contact</h3>
            </div>
          </div>
          <div className="p-5">
            <InfoField
              label="Contact Name"
              value="emergencyName"
              icon={UserPlus}
            />
            <InfoField
              label="Phone Number"
              value="emergencyContact"
              icon={PhoneForwarded}
            />
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3 mb-4"
        >
          {[
            { icon: Calendar, value: stats.yearsActive, label: "Years Active", color: "indigo" },
            { icon: Ticket, value: stats.totalTrips, label: "Total Trips", color: "purple" },
            { icon: Star, value: stats.rating.toFixed(1), label: "Rating", color: "amber" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 text-center"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2",
                stat.color === "indigo" && "bg-indigo-50",
                stat.color === "purple" && "bg-purple-50",
                stat.color === "amber" && "bg-amber-50"
              )}>
                <stat.icon className={cn(
                  "w-5 h-5",
                  stat.color === "indigo" && "text-indigo-600",
                  stat.color === "purple" && "text-purple-600",
                  stat.color === "amber" && "text-amber-500"
                )} />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full bg-linear-to-r from-red-600 to-red-500 rounded-2xl py-4 flex items-center justify-center gap-3 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all"
        >
          <LogOut className="w-5 h-5 text-white" />
          <span className="font-bold text-white text-base">Logout</span>
        </motion.button>

        {/* Version */}
        <p className="text-center text-slate-400 text-xs font-medium mt-6">
          Version 2.4.1
        </p>
      </main>

      {/* Refresh indicator */}
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