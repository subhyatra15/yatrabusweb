// @ts-nocheck
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
  MapPin,
  Star,
  Shield,
  Camera,
  Edit,
  X,
  ChevronRight,
  RefreshCw,
  Loader2,
  LogOut,
  Wallet,
  Car,
  Briefcase,
  IdCard,
  Heart,
  MessageCircle,
  Bell,
  Lock,
  FileText,
  HelpCircle,
  Settings,
  Award,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Bus,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface DriverProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  profileImage?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  experience: number;
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  joinDate: string;
  vehicleType: string[];
  languages: string[];
  bio?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// Demo Profile Data
const DEMO_PROFILE: DriverProfile = {
  id: 1,
  fullName: "Ramesh Thapa",
  email: "ramesh.thapa@example.com",
  phone: "+977 980-1234567",
  role: "D",
  profileImage: "https://i.pravatar.cc/150?img=12",
  licenseNumber: "DL-2024-12345",
  licenseExpiry: "2026-12-31",
  experience: 8,
  rating: 4.8,
  totalTrips: 156,
  totalEarnings: 45600,
  joinDate: "2020-03-15T00:00:00.000Z",
  vehicleType: ["AC", "Non-AC", "Deluxe"],
  languages: ["Nepali", "English", "Hindi"],
  bio: "Experienced driver with 8 years of professional driving experience. Specialized in long-distance and group travel. Committed to safety and passenger comfort.",
  address: "Butwal-11, Rupandehi",
  emergencyContact: {
    name: "Sita Thapa",
    phone: "+977 984-7654321",
    relationship: "Spouse",
  },
};

// Stat Card Component
const StatCard = ({ icon: Icon, value, label, color }: any) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 text-center flex-1 min-w-[calc(50%-6px)]"
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
      style={{ backgroundColor: color + "15" }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <p className="text-xl font-extrabold text-gray-900">{value}</p>
    <p className="text-xs text-slate-400 font-medium">{label}</p>
  </motion.div>
);

// Menu Item Component
const MenuItem = ({
  icon: Icon,
  title,
  subtitle,
  onPress,
  color = "#4f46e5",
  danger = false,
  showArrow = true,
}: any) => (
  <motion.button
    whileHover={{ x: 4 }}
    onClick={onPress}
    className={cn(
      "flex items-center gap-4 px-4 py-3.5 w-full border-b border-slate-100 last:border-0 transition-colors",
      danger ? "hover:bg-red-50/50" : "hover:bg-slate-50/50"
    )}
  >
    <div
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        danger ? "bg-red-50" : "bg-indigo-50"
      )}
    >
      <Icon className={cn(
        "w-5 h-5",
        danger ? "text-red-500" : "text-indigo-600"
      )} />
    </div>
    <div className="flex-1 text-left">
      <p className={cn(
        "font-semibold",
        danger ? "text-red-500" : "text-gray-900"
      )}>
        {title}
      </p>
      {subtitle && (
        <p className="text-sm text-slate-400">{subtitle}</p>
      )}
    </div>
    {showArrow && (
      <ChevronRight className="w-5 h-5 text-slate-300" />
    )}
  </motion.button>
);

export default function DriverProfilePage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DriverProfile>>({});
  const [usingDemoData, setUsingDemoData] = useState(false);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.log("No token found, using demo data");
        useDemoData();
        return;
      }

      const response = await axios.get(`${API_URL}/api/v1/driver/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      if (response.data && response.data.id) {
        setProfile(response.data);
        setEditForm(response.data);
        setUsingDemoData(false);
      } else {
        console.log("Empty response, using demo data");
        useDemoData();
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      useDemoData();

      if (error.response?.status === 401) {
        alert("Session Expired. Please login again.");
        router.push("/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  const useDemoData = () => {
    setProfile(DEMO_PROFILE);
    setEditForm(DEMO_PROFILE);
    setUsingDemoData(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleUpdateProfile = async () => {
    if (usingDemoData) {
      alert("Demo Mode. Changes cannot be saved.");
      setShowEditModal(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `${API_URL}/api/v1/driver/profile/`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Profile updated successfully");
      setShowEditModal(false);
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRole");
      router.push("/login");
    }
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
              <User className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mt-4">Profile not found</h3>
        <button
          onClick={fetchProfile}
          className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      {/* Demo Banner */}
      {usingDemoData && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <Info className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-600 font-medium">Showing demo data</span>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 pt-8 pb-10 px-6 rounded-b-[2.5rem] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-4">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-3 border-white/30 shadow-xl overflow-hidden">
                {profile.profileImage ? (
                  <Image
                    src={profile.profileImage}
                    alt={profile.fullName}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <User className="w-10 h-10 text-white/50" />
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  // Image picker functionality would go here
                  alert("Image picker would open here");
                }}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold text-white">{profile.fullName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4 text-white/80" />
                <span className="text-sm text-white/80 font-medium">Driver</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-white font-bold">{profile.rating.toFixed(1)}</span>
                </div>
                <span className="text-white/60 text-sm">({profile.totalTrips} trips)</span>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => {
                setEditForm(profile);
                setShowEditModal(true);
              }}
              className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Edit className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 -mt-4 pb-12 relative z-20">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <StatCard
            icon={Calendar}
            value={profile.totalTrips}
            label="Total Trips"
            color="#4f46e5"
          />
          <StatCard
            icon={Wallet}
            value={`Rs. ${profile.totalEarnings.toLocaleString()}`}
            label="Total Earnings"
            color="#059669"
          />
          <StatCard
            icon={Star}
            value={profile.rating.toFixed(1)}
            label="Rating"
            color="#f59e0b"
          />
          <StatCard
            icon={Car}
            value={profile.totalVehicle || 0}
            label="Vehicles"
            color="#8b5cf6"
          />
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">Personal Information</h3>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium">Email</p>
                <p className="font-semibold text-gray-900">{profile.email || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium">Phone</p>
                <p className="font-semibold text-gray-900">{profile.phone || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium">Joined</p>
                <p className="font-semibold text-gray-900">
                  {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  }) : "N/A"}
                </p>
              </div>
            </div>
            {profile.address && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-medium">Address</p>
                  <p className="font-semibold text-gray-900">{profile.address}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* License & Experience */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">License & Experience</h3>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <IdCard className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium">License Number</p>
                <p className="font-semibold text-gray-900">{profile.licenseNumber || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium">License Expiry</p>
                <p className="font-semibold text-gray-900">
                  {profile.licenseExpiry ? new Date(profile.licenseExpiry).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }) : "Not provided"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium">Experience</p>
                <p className="font-semibold text-gray-900">{profile.experience || 0} years</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vehicle Types */}
        {profile.vehicleType && profile.vehicleType.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-3">Vehicle Types</h3>
            <div className="flex flex-wrap gap-2">
              {profile.vehicleType.map((type, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1.5 bg-indigo-50/50 px-3 py-1.5 rounded-lg text-sm text-indigo-600 font-medium"
                >
                  <Bus className="w-4 h-4" />
                  {type}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Languages */}
        {profile.languages && profile.languages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-4"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-3">Languages</h3>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((lang, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1.5 bg-emerald-50/50 px-3 py-1.5 rounded-lg text-sm text-emerald-600 font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  {lang}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bio */}
        {profile.bio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-4"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4">
              <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
            </div>
          </motion.div>
        )}

        {/* Emergency Contact */}
        {profile.emergencyContact && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-4"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-3">Emergency Contact</h3>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-medium">Name</p>
                  <p className="font-semibold text-gray-900">{profile.emergencyContact.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-medium">Phone</p>
                  <p className="font-semibold text-gray-900">{profile.emergencyContact.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-medium">Relationship</p>
                  <p className="font-semibold text-gray-900">{profile.emergencyContact.relationship}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Settings Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-4"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-3">Settings</h3>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden">
            <MenuItem
              icon={Bell}
              title="Notifications"
              subtitle="Manage your notification preferences"
              onPress={() => router.push("/driver/settings/notifications")}
            />
            <MenuItem
              icon={Lock}
              title="Privacy & Security"
              subtitle="Manage your privacy and security settings"
              onPress={() => router.push("/driver/settings/privacy")}
            />
            <MenuItem
              icon={FileText}
              title="Terms & Conditions"
              onPress={() => router.push("/driver/settings/terms")}
            />
            <MenuItem
              icon={HelpCircle}
              title="Help & Support"
              subtitle="Get help with your account"
              onPress={() => router.push("/driver/settings/support")}
            />
            <MenuItem
              icon={LogOut}
              title="Logout"
              danger
              showArrow={false}
              onPress={handleLogout}
            />
          </div>
        </motion.div>

        {/* Version */}
        <p className="text-center text-slate-400 text-xs font-medium mt-6">
          Version 1.0.0
        </p>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={editForm.fullName || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={editForm.phone || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Address
                  </label>
                  <textarea
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    rows={3}
                    value={editForm.address || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Bio
                  </label>
                  <textarea
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    rows={4}
                    placeholder="Tell us about yourself"
                    value={editForm.bio || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                    }
                  />
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={editForm.experience || 0}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, experience: parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>

                {usingDemoData && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-sm text-amber-600 font-medium">
                      ⚡ Demo mode. Changes will not be saved to the server.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleUpdateProfile}
                  className="w-full bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                >
                  {usingDemoData ? "Demo Mode" : "Update Profile"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}