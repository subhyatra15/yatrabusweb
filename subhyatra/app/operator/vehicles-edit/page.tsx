// app/(operator)/vehicles-edit/page.tsx
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bus,
  Car,
  Edit,
  Save,
  X,
  Camera,
  Trash2,
  Plus,
  Wifi,
  Battery,
  Snowflake,
  Tv,
  Droplets,
  Utensils,
  Bed,
  Usb,
  Gamepad2,
  CheckCircle,
  AlertCircle,
  Info,
  MapPin,
  DollarSign,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  Star,
  Users,
  Shield,
  Award,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface VehicleData {
  id: number;
  name: string;
  number: string;
  type: string;
  vehicleType: "bus" | "hiace";
  vehicleImage?: string;
  totalSeats: number;
  seatLayout: { left: number; right: number };
  amenities: string[];
  wifi: boolean;
  charging: boolean;
  ac: boolean;
  status: "active" | "inactive" | "maintenance";
  image?: string;
  description?: string;
  farePerKm?: number;
  operator_name?: string;
  routes?: any[];
}

// Demo Vehicle Data
const DEMO_BUS: VehicleData = {
  id: 1,
  name: "Sajha Bus",
  number: "BA 1 KA 1234",
  type: "AC",
  vehicleType: "bus",
  totalSeats: 40,
  seatLayout: { left: 2, right: 2 },
  amenities: ["WiFi", "Charging Ports", "AC", "TV", "Water Bottle"],
  wifi: true,
  charging: true,
  ac: true,
  status: "active",
  description: "Premium AC bus with comfortable seating",
  farePerKm: 15,
};

const DEMO_HIACE: VehicleData = {
  id: 2,
  name: "Sajha Hiace",
  number: "BA 1 KA 5678",
  type: "AC",
  vehicleType: "hiace",
  totalSeats: 12,
  seatLayout: { left: 2, right: 2 },
  amenities: ["WiFi", "Charging Ports", "AC"],
  wifi: true,
  charging: true,
  ac: true,
  status: "active",
  description: "Comfortable AC hiace for group travel",
  farePerKm: 20,
};

function EditVehiclesPageComp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const type = (searchParams.get("type") as "bus" | "hiace") || "bus";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAmenityModal, setShowAmenityModal] = useState(false);
  const [tempAmenity, setTempAmenity] = useState("");
  const [usingDemoData, setUsingDemoData] = useState(false);

  const vehicleTypes = [
    { label: "AC", value: "AC" },
    { label: "Non-AC", value: "NON_AC" },
    { label: "Deluxe", value: "DELUXE" },
    { label: "VIP", value: "VIP" },
    { label: "Sleeper", value: "SLEEPER" },
  ];

  const hiaceTypes = [
    { label: "AC", value: "AC" },
    { label: "Non-AC", value: "NON_AC" },
  ];

  const amenityOptions = [
    "WiFi",
    "Charging Ports",
    "AC",
    "TV",
    "Water Bottle",
    "Snacks",
    "Blanket",
    "Pillow",
    "USB Ports",
    "Entertainment System",
  ];

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "WiFi":
        return Wifi;
      case "Charging Ports":
        return Battery;
      case "AC":
        return Snowflake;
      case "TV":
        return Tv;
      case "Water Bottle":
        return Droplets;
      case "Snacks":
        return Utensils;
      case "Blanket":
        return Bed;
      case "Pillow":
        return Bed;
      case "USB Ports":
        return Usb;
      case "Entertainment System":
        return Gamepad2;
      default:
        return CheckCircle;
    }
  };

  const getAmenitiesFromApi = (data: any): string[] => {
    const amenities = [];
    if (data.wifi) amenities.push("WiFi");
    if (data.charging) amenities.push("Charging Ports");
    if (data.ac) amenities.push("AC");
    if (data.tv) amenities.push("TV");
    if (data.water) amenities.push("Water Bottle");
    if (data.snacks) amenities.push("Snacks");
    return amenities.length > 0 ? amenities : ["Standard"];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#22c55e";
      case "inactive":
        return "#f59e0b";
      case "maintenance":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const getVehicleTypeColor = (type: string) => {
    switch (type) {
      case "bus":
        return "#4f46e5";
      case "hiace":
        return "#059669";
      default:
        return "#94a3b8";
    }
  };

  const getVehicleTypeIcon = (type: string) => {
    return type === "bus" ? Bus : Car;
  };

  // Fetch vehicle details
  const fetchVehicleDetails = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.log("No token found, using demo data");
        useDemoData();
        return;
      }

      const endpoint = type === "bus"
        ? `${API_URL}/api/v1/buses/${id}/`
        : `${API_URL}/api/v1/hiaces/${id}/`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.id) {
        const mappedData: VehicleData = {
          id: response.data.id,
          name: response.data.bus_name || response.data.hiace_name || "Vehicle",
          number: response.data.bus_number || response.data.hiace_number || "N/A",
          type: response.data.bus_type || response.data.hiace_type || "AC",
          vehicleType: type as "bus" | "hiace",
          vehicleImage: type === "bus" ? response.data.busimage : response.data.hiaceimage,
          totalSeats: response.data.total_seats || 0,
          seatLayout: response.data.seat_layout || { left: 2, right: 2 },
          amenities: getAmenitiesFromApi(response.data),
          wifi: response.data.wifi || false,
          charging: response.data.charging || false,
          ac: response.data.ac || false,
          status: response.data.status?.toLowerCase() || "active",
          image: response.data.image || undefined,
          description: response.data.description || undefined,
          farePerKm: response.data.fare_per_km || undefined,
          operator_name: response.data.operator_name || undefined,
          routes: response.data.routes || [],
        };

        setVehicleData(mappedData);
        setUsingDemoData(false);
      } else {
        console.log("Empty response, using demo data");
        useDemoData();
      }
    } catch (error: any) {
      console.error("Error fetching vehicle:", error);
      useDemoData();

      if (error.response?.status === 401) {
        alert("Session Expired. Please login again.");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [id, type, router]);

  const useDemoData = () => {
    if (type === "hiace") {
      setVehicleData(DEMO_HIACE);
    } else {
      setVehicleData(DEMO_BUS);
    }
    setUsingDemoData(true);
  };

  const handleUpdate = async () => {
    if (!vehicleData) return;

    if (usingDemoData) {
      alert("Demo Mode. Changes cannot be saved.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("Please login to update vehicle");
        return;
      }

      const endpoint = type === "bus"
        ? `${API_URL}/api/v1/buses/${id}/`
        : `${API_URL}/api/v1/hiaces/${id}/`;

      const updateData = {
        bus_name: vehicleData.name,
        bus_number: vehicleData.number,
        bus_type: vehicleData.type,
        total_seats: vehicleData.totalSeats,
        seat_layout: vehicleData.seatLayout,
        wifi: vehicleData.wifi,
        charging: vehicleData.charging,
        ac: vehicleData.ac,
        status: vehicleData.status.toUpperCase(),
      };

      await axios.put(endpoint, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Vehicle updated successfully!");
      setIsEditing(false);
      fetchVehicleDetails();
    } catch (error: any) {
      console.error("Error updating vehicle:", error);
      alert(error.response?.data?.message || "Failed to update vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (usingDemoData) {
      alert("Demo Mode. Cannot delete.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("Please login to delete vehicle");
        return;
      }

      const endpoint = type === "bus"
        ? `${API_URL}/api/v1/buses/${id}/`
        : `${API_URL}/api/v1/driver/hiace/${id}/`;

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Vehicle deleted successfully!");
      setShowDeleteModal(false);
      router.back();
    } catch (error: any) {
      console.error("Error deleting vehicle:", error);
      alert(error.response?.data?.message || "Failed to delete vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (!vehicleData) return;
    const currentAmenities = vehicleData.amenities || [];
    const updated = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];
    setVehicleData({ ...vehicleData, amenities: updated });
  };

  const addCustomAmenity = () => {
    if (!tempAmenity.trim() || !vehicleData) return;
    const currentAmenities = vehicleData.amenities || [];
    if (!currentAmenities.includes(tempAmenity.trim())) {
      setVehicleData({
        ...vehicleData,
        amenities: [...currentAmenities, tempAmenity.trim()],
      });
    }
    setTempAmenity("");
    setShowAmenityModal(false);
  };

  // Load data
  useEffect(() => {
    if (id) {
      fetchVehicleDetails();
    } else {
      useDemoData();
    }
  }, [id, type, fetchVehicleDetails]);

  const VehicleIcon = getVehicleTypeIcon(type);
  const vehicleColor = getVehicleTypeColor(type);

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
          <p className="mt-6 text-indigo-600 font-medium">Loading vehicle details...</p>
        </motion.div>
      </div>
    );
  }

  if (!vehicleData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mt-4">Vehicle not found</h3>
        <button
          onClick={() => router.back()}
          className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
        >
          Go Back
        </button>
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
                {isEditing ? "Edit Vehicle" : "Vehicle Details"}
              </h1>
            </div>
            {!isEditing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
              >
                <Edit className="w-4 h-4" />
                Edit
              </motion.button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 font-semibold text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </motion.button>
              </div>
            )}
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

        {/* Vehicle Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-4 h-48 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg"
        >
          {vehicleData.vehicleImage ? (
            <Image
              src={vehicleData.vehicleImage}
              alt={vehicleData.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <VehicleIcon className="w-16 h-16 text-white/50" />
              <p className="text-white/60 text-sm mt-2">Tap to add photo</p>
            </div>
          )}
          {isEditing && (
            <button
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors"
              onClick={() => alert("Image picker would open here")}
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          )}
        </motion.div>

        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <h3 className="font-bold text-gray-900 mb-4">Basic Information</h3>

          <div className="space-y-4">
            {/* Vehicle Type */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 font-medium">Vehicle Type</span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ backgroundColor: vehicleColor + "15" }}>
                <VehicleIcon className="w-4 h-4" style={{ color: vehicleColor }} />
                <span className="text-sm font-semibold" style={{ color: vehicleColor }}>
                  {vehicleData.vehicleType.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Name */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 font-medium">Name</span>
              {isEditing ? (
                <input
                  type="text"
                  className="text-right text-sm font-semibold text-gray-900 bg-transparent border-b-2 border-indigo-500 outline-none px-2 py-1 min-w-[120px]"
                  value={vehicleData.name}
                  onChange={(e) => setVehicleData({ ...vehicleData, name: e.target.value })}
                  placeholder="Vehicle name"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-900">{vehicleData.name}</span>
              )}
            </div>

            {/* Number */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 font-medium">Number</span>
              {isEditing ? (
                <input
                  type="text"
                  className="text-right text-sm font-semibold text-gray-900 bg-transparent border-b-2 border-indigo-500 outline-none px-2 py-1 min-w-[120px]"
                  value={vehicleData.number}
                  onChange={(e) => setVehicleData({ ...vehicleData, number: e.target.value })}
                  placeholder="Vehicle number"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-900">{vehicleData.number}</span>
              )}
            </div>

            {/* Type */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 font-medium">Type</span>
              {isEditing ? (
                <div className="flex gap-1.5">
                  {(vehicleData.vehicleType === "bus" ? vehicleTypes : hiaceTypes).map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setVehicleData({ ...vehicleData, type: t.value })}
                      className={cn(
                        "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                        vehicleData.type === t.value
                          ? "bg-indigo-50 text-indigo-600 border-2 border-indigo-500"
                          : "bg-slate-50 text-slate-400 border-2 border-transparent hover:border-indigo-200"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-sm font-semibold text-gray-900">{vehicleData.type}</span>
              )}
            </div>

            {/* Total Seats */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 font-medium">Total Seats</span>
              {isEditing ? (
                <input
                  type="number"
                  className="text-right text-sm font-semibold text-gray-900 bg-transparent border-b-2 border-indigo-500 outline-none px-2 py-1 min-w-[80px]"
                  value={vehicleData.totalSeats}
                  onChange={(e) => setVehicleData({ ...vehicleData, totalSeats: parseInt(e.target.value) || 0 })}
                  placeholder="Total seats"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-900">{vehicleData.totalSeats}</span>
              )}
            </div>

            {vehicleData.operator_name && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400 font-medium">Operator</span>
                <span className="text-sm font-semibold text-gray-900">{vehicleData.operator_name}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Routes */}
        {vehicleData.routes && vehicleData.routes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
          >
            <h3 className="font-bold text-gray-900 mb-3">Routes</h3>
            <div className="space-y-2">
              {vehicleData.routes.map((route, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-50/80 rounded-xl p-3 border border-slate-200/50">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-gray-900">
                      {route.source_city_name} → {route.destination_city_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-indigo-600">Rs. {route.fare}</span>
                    <span className="text-sm text-slate-400">{route.distance} km</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <h3 className="font-bold text-gray-900 mb-3">Status</h3>
          <div className="grid grid-cols-3 gap-2">
            {["active", "inactive", "maintenance"].map((status) => (
              <button
                key={status}
                onClick={() => isEditing && setVehicleData({ ...vehicleData, status: status as any })}
                disabled={!isEditing}
                className={cn(
                  "py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                  vehicleData.status === status
                    ? "border-2"
                    : "border-2 border-transparent bg-slate-50 text-slate-400"
                )}
                style={{
                  borderColor: vehicleData.status === status ? getStatusColor(status) : "transparent",
                  backgroundColor: vehicleData.status === status ? "transparent" : "",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getStatusColor(status) }}
                />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Amenities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Amenities</h3>
            {isEditing && (
              <button
                onClick={() => setShowAmenityModal(true)}
                className="text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {vehicleData.amenities && vehicleData.amenities.length > 0 ? (
              vehicleData.amenities.map((amenity, index) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100/50"
                  >
                    <Icon className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-slate-700">{amenity}</span>
                    {isEditing && (
                      <button
                        onClick={() => toggleAmenity(amenity)}
                        className="ml-1 text-red-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400">No amenities added</p>
            )}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <h3 className="font-bold text-gray-900 mb-3">Features</h3>
          <div className="space-y-3">
            {[
              { key: "wifi", icon: Wifi, label: "WiFi", color: "#4f46e5" },
              { key: "charging", icon: Battery, label: "Charging Ports", color: "#059669" },
              { key: "ac", icon: Snowflake, label: "AC", color: "#3b82f6" },
            ].map((feature) => {
              const value = vehicleData[feature.key as keyof VehicleData] as boolean;
              const Icon = feature.icon;
              return (
                <div key={feature.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" style={{ color: feature.color }} />
                    <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                  </div>
                  <button
                    onClick={() => isEditing && setVehicleData({ ...vehicleData, [feature.key]: !value })}
                    disabled={!isEditing}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      value ? "bg-indigo-600" : "bg-slate-300",
                      !isEditing && "cursor-default"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5",
                        value ? "translate-x-6" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Delete Button */}
        {!isEditing && !usingDemoData && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => setShowDeleteModal(true)}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 rounded-2xl py-4 flex items-center justify-center gap-3 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all"
          >
            <Trash2 className="w-5 h-5 text-white" />
            <span className="font-bold text-white text-base">Delete Vehicle</span>
          </motion.button>
        )}

        {/* Demo Note */}
        {usingDemoData && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
            <p className="text-sm text-amber-600 font-medium text-center">
              ⚡ This is demo data. Changes will not be saved to the server.
            </p>
          </div>
        )}
      </main>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mx-auto shadow-lg shadow-red-500/25 mb-4">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Delete Vehicle</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Are you sure you want to delete "{vehicleData.name}"? This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Amenity Modal */}
      <AnimatePresence>
        {showAmenityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowAmenityModal(false)}
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
                  <h3 className="text-xl font-bold text-gray-900">Add Amenity</h3>
                  <button
                    onClick={() => setShowAmenityModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto max-h-[70vh]">
                <input
                  type="text"
                  placeholder="Enter amenity name"
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all mb-4"
                  value={tempAmenity}
                  onChange={(e) => setTempAmenity(e.target.value)}
                  autoFocus
                />

                <div className="space-y-1">
                  {amenityOptions.map((amenity) => (
                    <button
                      key={amenity}
                      onClick={() => {
                        setTempAmenity(amenity);
                        toggleAmenity(amenity);
                        setShowAmenityModal(false);
                      }}
                      className="w-full flex items-center justify-between py-3 px-2 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-sm text-gray-900">{amenity}</span>
                      <Plus className="w-5 h-5 text-indigo-600" />
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowAmenityModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCustomAmenity}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default function EditVehiclesPage() {
return (
    <>
    <Suspense fallback={<h1>Loading....</h1>}>
      <EditVehiclesPageComp/>
    </Suspense>
    </>
)
}