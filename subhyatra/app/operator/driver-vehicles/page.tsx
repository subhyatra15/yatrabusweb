// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bus,
  Car,
  Plus,
  Filter,
  Search,
  X,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Wrench,
  Wifi,
  Battery,
  Snowflake,
  Tv,
  Droplets,
  Grid2x2,
  MapPin,
  Calendar,
  Star,
  Users,
  Edit,
  Trash2,
  AlertCircle,
  Info,
  ChevronRight,
  Clock,
  Gauge,
  Award,
  Shield,
  BarChart,
  Route,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface Vehicle {
  id: number;
  name: string;
  number: string;
  type: string;
  vehicleType: "bus" | "hiace";
  vehicleImage?: string;
  totalSeats: number;
  availableSeats: number;
  status: "active" | "inactive" | "maintenance";
  amenities: string[];
  image?: string;
  rating: number;
  tripsCompleted: number;
  nextTrip?: string;
  operator_name?: string;
  routes?: any[];
}

const DEMO_VEHICLES: Vehicle[] = [];

export default function DriverVehiclesPage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filters = [
    { id: "all", label: "All", icon: Grid2x2 },
    { id: "active", label: "Active", icon: CheckCircle },
    { id: "inactive", label: "Inactive", icon: XCircle },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
  ];

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.log("No token found, using demo data");
        useDemoData();
        return;
      }

      let allVehicles: Vehicle[] = [];

      // Fetch buses
      try {
        const busResponse = await axios.get(`${API_URL}/api/v1/buses/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (busResponse.data && busResponse.data.results) {
          const mappedBuses = busResponse.data.results.map((item: any) => ({
            id: item.id,
            name: item.bus_name || "Bus",
            number: item.bus_number || "N/A",
            type: item.bus_type || "AC",
            vehicleType: "bus" as const,
            vehicleImage: item.busimage,
            totalSeats: item.total_seats || 0,
            availableSeats: item.total_seats || 0,
            status: (item.status?.toLowerCase() || "inactive") as "active" | "inactive" | "maintenance",
            amenities: getAmenitiesFromApi(item),
            rating: 4.5,
            tripsCompleted: 0,
            nextTrip: null,
            operator_name: item.operator_name,
            routes: item.routes || [],
          }));
          allVehicles = [...allVehicles, ...mappedBuses];
        }
      } catch (error) {
        console.log("Error fetching buses:", error);
      }

      // Fetch hiaces
      try {
        const hiaceResponse = await axios.get(`${API_URL}/api/v1/hiaces/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (hiaceResponse.data && hiaceResponse.data.data) {
          const mappedHiaces = hiaceResponse.data.data.map((item: any) => ({
            id: item.id,
            name: item.hiace_name || "Hiace",
            number: item.hiace_number || "N/A",
            type: item.hiace_type || "AC",
            vehicleType: "hiace" as const,
            vehicleImage: item.hiaceimage,
            totalSeats: item.total_seats || 0,
            availableSeats: item.total_seats || 0,
            status: (item.status?.toLowerCase() || "inactive") as "active" | "inactive" | "maintenance",
            amenities: getAmenitiesFromApi(item),
            rating: 4.3,
            tripsCompleted: 0,
            nextTrip: null,
            operator_name: item.operator_name,
          }));
          allVehicles = [...allVehicles, ...mappedHiaces];
        }
      } catch (error) {
        console.log("Error fetching hiaces:", error);
      }

      if (allVehicles.length > 0) {
        setVehicles(allVehicles);
        filterVehicles(allVehicles);
        setUsingDemoData(false);
      } else {
        console.log("No vehicles found, using demo data");
        useDemoData();
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      useDemoData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const getAmenitiesFromApi = (data: any): string[] => {
    const amenities = [];
    if (data.wifi) amenities.push("WiFi");
    if (data.charging) amenities.push("Charging");
    if (data.ac) amenities.push("AC");
    if (data.tv) amenities.push("TV");
    if (data.water) amenities.push("Water");
    if (data.snacks) amenities.push("Snacks");
    return amenities.length > 0 ? amenities : ["Standard"];
  };

  const useDemoData = () => {
    setVehicles(DEMO_VEHICLES);
    filterVehicles(DEMO_VEHICLES);
    setUsingDemoData(true);
  };

  const filterVehicles = (vehicleData = vehicles) => {
    let filtered = vehicleData;

    if (selectedFilter !== "all") {
      filtered = filtered.filter((v) => v.status === selectedFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.number.toLowerCase().includes(query) ||
          v.type.toLowerCase().includes(query)
      );
    }

    setFilteredVehicles(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#22c55e";
      case "inactive":
        return "#ef4444";
      case "maintenance":
        return "#f59e0b";
      default:
        return "#94a3b8";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "inactive":
        return "bg-red-50 text-red-600 border-red-100";
      case "maintenance":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return CheckCircle;
      case "inactive":
        return XCircle;
      case "maintenance":
        return Wrench;
      default:
        return AlertCircle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "AC":
        return "#3b82f6";
      case "NON_AC":
        return "#f59e0b";
      case "DELUXE":
        return "#8b5cf6";
      case "VIP":
        return "#ef4444";
      case "SLEEPER":
        return "#059669";
      default:
        return "#94a3b8";
    }
  };

  const getVehicleTypeIcon = (type: string) => {
    return type === "bus" ? Bus : Car;
  };

  const getVehicleTypeColor = (type: string) => {
    return type === "bus" ? "#4f46e5" : "#059669";
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "WiFi":
        return Wifi;
      case "Charging":
        return Battery;
      case "AC":
        return Snowflake;
      case "TV":
        return Tv;
      case "Water":
        return Droplets;
      default:
        return Grid2x2;
    }
  };

  // Vehicle Card Component
  const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => {
    const StatusIcon = getStatusIcon(vehicle.status);
    const VehicleIcon = getVehicleTypeIcon(vehicle.vehicleType);
    const statusColor = getStatusColor(vehicle.status);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
        onClick={() => {
          setSelectedVehicle(vehicle);
          setShowDetailsModal(true);
        }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0",
                vehicle.vehicleType === "bus" 
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/20"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-500/20"
              )}>
                <VehicleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{vehicle.name}</p>
                <p className="text-sm text-slate-400">{vehicle.number}</p>
              </div>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold",
              getStatusBgColor(vehicle.status)
            )}>
              <StatusIcon className="w-3.5 h-3.5" style={{ color: statusColor }} />
              {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
            </div>
          </div>

          {/* Details */}
          <div className="flex items-center justify-around py-3 border-y border-slate-100 mb-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              <span>{vehicle.totalSeats} seats</span>
            </div>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>{vehicle.availableSeats} available</span>
            </div>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Star className="w-4 h-4 text-amber-400" />
              <span>{vehicle.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 mb-3">
            {vehicle.amenities.slice(0, 3).map((amenity, index) => {
              const Icon = getAmenityIcon(amenity);
              return (
                <span key={index} className="flex items-center gap-1.5 bg-indigo-50/50 px-2.5 py-1 rounded-lg text-xs text-indigo-600 font-medium">
                  <Icon className="w-3.5 h-3.5" />
                  {amenity}
                </span>
              );
            })}
            {vehicle.amenities.length > 3 && (
              <span className="text-xs text-slate-400 font-medium">
                +{vehicle.amenities.length - 3}
              </span>
            )}
            {vehicle.nextTrip && (
              <span className="flex items-center gap-1.5 bg-blue-50/50 px-2.5 py-1 rounded-lg text-xs text-blue-600 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {vehicle.nextTrip}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ 
              backgroundColor: getTypeColor(vehicle.type) + "15",
              color: getTypeColor(vehicle.type)
            }}>
              {vehicle.type}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push({
                    pathname: "/add-route",
                    query: {
                      vehicleId: vehicle.id,
                      vehicleType: vehicle.vehicleType,
                    },
                  });
                }}
                className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <Route className="w-4 h-4 text-purple-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push({
                    pathname: "/seats",
                    query: {
                      vehicleId: vehicle.id,
                      vehicleType: vehicle.vehicleType,
                    },
                  });
                }}
                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <Grid2x2 className="w-4 h-4 text-emerald-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push({
                    pathname: "/vehicles-edit",
                    query: {
                      id: vehicle.id,
                      type: vehicle.vehicleType,
                    },
                  });
                }}
                className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <Edit className="w-4 h-4 text-indigo-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push({
                    pathname: "/schedule",
                    query: {
                      vehicleId: vehicle.id,
                      vehicleType: vehicle.vehicleType,
                    },
                  });
                }}
                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <Calendar className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Vehicle Details Modal
  const VehicleDetailsModal = () => {
    if (!selectedVehicle) return null;
    const VehicleIcon = getVehicleTypeIcon(selectedVehicle.vehicleType);

    return (
      <AnimatePresence>
        {showDetailsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowDetailsModal(false)}
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
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Vehicle Details</h3>
                    <p className="text-sm text-slate-400">
                      {selectedVehicle.name} • {selectedVehicle.number}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto max-h-[70vh]">
                {/* Vehicle Image Placeholder */}
                <div className={cn(
                  "rounded-xl h-40 flex items-center justify-center mb-4",
                  selectedVehicle.vehicleType === "bus"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-500"
                )}>
                  <VehicleIcon className="w-16 h-16 text-white/50" />
                </div>

                {/* Vehicle Type Badge */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold",
                    selectedVehicle.vehicleType === "bus"
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-emerald-50 text-emerald-600"
                  )}>
                    <VehicleIcon className="w-4 h-4" />
                    {selectedVehicle.vehicleType.toUpperCase()}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50/80 rounded-xl p-4 mb-4">
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-gray-900">
                      {selectedVehicle.tripsCompleted || 0}
                    </p>
                    <p className="text-xs text-slate-400">Trips</p>
                  </div>
                  <div className="text-center border-l border-r border-slate-200">
                    <p className="text-xl font-extrabold text-gray-900">
                      {selectedVehicle.availableSeats}
                    </p>
                    <p className="text-xs text-slate-400">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-gray-900">
                      {selectedVehicle.rating.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-400">Rating</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Type</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedVehicle.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Total Seats</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedVehicle.totalSeats}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Status</span>
                    <span className={cn(
                      "text-sm font-semibold px-3 py-1 rounded-full",
                      getStatusBgColor(selectedVehicle.status)
                    )}>
                      {selectedVehicle.status.charAt(0).toUpperCase() + selectedVehicle.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Routes */}
                {selectedVehicle.routes && selectedVehicle.routes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Routes</h4>
                    <div className="space-y-2">
                      {selectedVehicle.routes.slice(0, 3).map((route, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-50/80 rounded-xl px-3 py-2">
                          <span className="text-sm font-medium text-gray-900">
                            {route.source_city_name} → {route.destination_city_name}
                          </span>
                          <span className="text-sm font-semibold text-indigo-600">Rs. {route.fare}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVehicle.amenities.map((amenity, index) => {
                      const Icon = getAmenityIcon(amenity);
                      return (
                        <span key={index} className="flex items-center gap-1.5 bg-indigo-50/50 px-3 py-1.5 rounded-lg text-sm text-indigo-600 font-medium">
                          <Icon className="w-4 h-4" />
                          {amenity}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      router.push({
                        pathname: "/add-route",
                        query: {
                          vehicleId: selectedVehicle.id,
                          vehicleType: selectedVehicle.vehicleType,
                        },
                      });
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                  >
                    <Route className="w-5 h-5" />
                    Add Route
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      router.push({
                        pathname: "/seats",
                        query: {
                          vehicleId: selectedVehicle.id,
                          vehicleType: selectedVehicle.vehicleType,
                        },
                      });
                    }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                  >
                    <Grid2x2 className="w-5 h-5" />
                    Manage Seats
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      router.push({
                        pathname: "/vehicles-edit",
                        query: {
                          id: selectedVehicle.id,
                          type: selectedVehicle.vehicleType,
                        },
                      });
                    }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Vehicle
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      router.push({
                        pathname: "/schedule",
                        query: {
                          vehicleId: selectedVehicle.id,
                          vehicleType: selectedVehicle.vehicleType,
                        },
                      });
                    }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                  >
                    <Calendar className="w-5 h-5" />
                    Schedule Trip
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Add Vehicle Modal
  const AddVehicleModal = () => {
    const [newVehicle, setNewVehicle] = useState({
      name: "",
      number: "",
      type: "AC",
      vehicleType: "bus" as "bus" | "hiace",
      totalSeats: "",
      amenities: [] as string[],
    });

    const vehicleTypes = ["AC", "NON_AC", "DELUXE", "VIP", "SLEEPER"];
    const hiaceTypes = ["AC", "NON_AC"];
    const amenityOptions = ["WiFi", "Charging", "AC", "TV", "Water", "Snacks"];

    const toggleAmenity = (amenity: string) => {
      setNewVehicle((prev) => ({
        ...prev,
        amenities: prev.amenities.includes(amenity)
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      }));
    };

    const handleAddVehicle = async () => {
      if (!newVehicle.name || !newVehicle.number || !newVehicle.totalSeats) {
        alert("Please fill in all required fields");
        return;
      }

      if (usingDemoData) {
        alert("Demo Mode. Cannot add vehicle in demo mode.");
        return;
      }

      try {
        const token = localStorage.getItem("accessToken");

        const endpoint =
          newVehicle.vehicleType === "bus"
            ? `${API_URL}/api/v1/buses/`
            : `${API_URL}/api/v1/hiace/`;

        const payload =
          newVehicle.vehicleType === "bus"
            ? {
                bus_name: newVehicle.name,
                bus_number: newVehicle.number,
                bus_type: newVehicle.type,
                total_seats: parseInt(newVehicle.totalSeats),
                wifi: newVehicle.amenities.includes("WiFi"),
                charging: newVehicle.amenities.includes("Charging"),
                ac: newVehicle.amenities.includes("AC"),
              }
            : {
                hiace_name: newVehicle.name,
                hiace_number: newVehicle.number,
                hiace_type: newVehicle.type,
                total_seats: parseInt(newVehicle.totalSeats),
                wifi: newVehicle.amenities.includes("WiFi"),
                charging: newVehicle.amenities.includes("Charging"),
                ac: newVehicle.amenities.includes("AC"),
              };

        await axios.post(endpoint, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        alert("Vehicle added successfully");
        setShowAddModal(false);
        setNewVehicle({
          name: "",
          number: "",
          type: "AC",
          vehicleType: "bus",
          totalSeats: "",
          amenities: [],
        });
        fetchVehicles();
      } catch (error) {
        console.error("Error adding vehicle:", error);
        alert("Failed to add vehicle");
      }
    };

    return (
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
                  <h3 className="text-xl font-bold text-gray-900">Add New Vehicle</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
                {/* Vehicle Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Vehicle Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setNewVehicle({ ...newVehicle, vehicleType: "bus" })}
                      className={cn(
                        "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all",
                        newVehicle.vehicleType === "bus"
                          ? "border-indigo-500 bg-indigo-50/50 text-indigo-600"
                          : "border-slate-200 text-slate-400 hover:border-indigo-200"
                      )}
                    >
                      <Bus className="w-5 h-5" />
                      <span className="font-semibold">Bus</span>
                    </button>
                    <button
                      onClick={() => setNewVehicle({ ...newVehicle, vehicleType: "hiace" })}
                      className={cn(
                        "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all",
                        newVehicle.vehicleType === "hiace"
                          ? "border-emerald-500 bg-emerald-50/50 text-emerald-600"
                          : "border-slate-200 text-slate-400 hover:border-emerald-200"
                      )}
                    >
                      <Car className="w-5 h-5" />
                      <span className="font-semibold">Hiace</span>
                    </button>
                  </div>
                </div>

                {/* Vehicle Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Vehicle Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Sajha Bus"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={newVehicle.name}
                    onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                  />
                </div>

                {/* Vehicle Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., BA 1 KA 1234"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={newVehicle.number}
                    onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })}
                  />
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Vehicle Type *
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {(newVehicle.vehicleType === "bus" ? vehicleTypes : hiaceTypes).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewVehicle({ ...newVehicle, type })}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                          newVehicle.type === type
                            ? "bg-indigo-50 text-indigo-600 border-2 border-indigo-500"
                            : "bg-slate-50 text-slate-400 border-2 border-transparent hover:border-indigo-200"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Seats */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Total Seats *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 40"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={newVehicle.totalSeats}
                    onChange={(e) => setNewVehicle({ ...newVehicle, totalSeats: e.target.value })}
                  />
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Amenities
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {amenityOptions.map((amenity) => (
                      <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                          newVehicle.amenities.includes(amenity)
                            ? "bg-indigo-50 text-indigo-600 border-2 border-indigo-500"
                            : "bg-slate-50 text-slate-400 border-2 border-transparent hover:border-indigo-200"
                        )}
                      >
                        {newVehicle.amenities.includes(amenity) ? "✓" : "+"} {amenity}
                      </button>
                    ))}
                  </div>
                </div>

                {usingDemoData && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-sm text-amber-600 font-medium">
                      ⚡ Demo mode. Vehicle will not be saved to the server.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleAddVehicle}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  {usingDemoData ? "Demo Mode" : "Add Vehicle"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Filter search and apply
  useEffect(() => {
    filterVehicles();
  }, [selectedFilter, searchQuery, vehicles]);

  // Load data on mount
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

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
          <p className="mt-6 text-indigo-600 font-medium">Loading vehicles...</p>
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
              <h1 className="text-2xl font-extrabold text-gray-900">My Vehicles</h1>
              <p className="text-sm text-slate-400 font-medium">
                {filteredVehicles.length} vehicles • {vehicles.filter((v) => v.status === "active").length} active
              </p>
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
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Vehicle
              </motion.button>
            </div>
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

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200/50 shadow-sm">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-slate-400 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.length > 0 && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide"
        >
          {filters.map((filter) => {
            const count = vehicles.filter((v) =>
              filter.id === "all" ? true : v.status === filter.id
            ).length;
            const isActive = selectedFilter === filter.id;
            const Icon = filter.icon;

            return (
              <motion.button
                key={filter.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFilter(filter.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap",
                  isActive
                    ? "bg-indigo-50/80 border-indigo-200 text-indigo-600"
                    : "bg-slate-50/80 border-transparent text-slate-400 hover:bg-slate-100/80"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{filter.label}</span>
                {count > 0 && (
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    isActive
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-200 text-slate-400"
                  )}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Vehicle List */}
        <AnimatePresence mode="wait">
          {filteredVehicles.length > 0 ? (
            <motion.div
              key={selectedFilter + searchQuery}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {filteredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white/50 rounded-3xl"
            >
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                {selectedFilter === "all" && <Bus className="w-10 h-10 text-slate-300" />}
                {selectedFilter === "active" && <CheckCircle className="w-10 h-10 text-slate-300" />}
                {selectedFilter === "inactive" && <XCircle className="w-10 h-10 text-slate-300" />}
                {selectedFilter === "maintenance" && <Wrench className="w-10 h-10 text-slate-300" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mt-4">No vehicles found</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                {selectedFilter === "all"
                  ? "You haven't added any vehicles yet"
                  : `You don't have any ${selectedFilter} vehicles`}
              </p>
              {selectedFilter === "all" && !usingDemoData && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Add Vehicle
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <VehicleDetailsModal />
      <AddVehicleModal />
    </div>
  );
}