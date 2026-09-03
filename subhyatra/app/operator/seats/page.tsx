// @ts-nocheck

"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  X,
  Square,
  Star,
  Bed,
  Grid2x2,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Check,
  Edit,
  Trash2,
  ChevronDown,
  Car,
  Bus,
  AlertCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Types
interface Seat {
  id?: number;
  seat_number: string;
  seat_type: string;
  row: number;
  col: number;
  extra_price: string;
  is_window: boolean;
}
function SeatManagementPageComp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId") ? parseInt(searchParams.get("vehicleId")!) : null;
  const vehicleType = (searchParams.get("vehicleType") as "bus" | "hiace") || "bus";

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [filteredSeats, setFilteredSeats] = useState<Seat[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // New seat form state
  const [newSeat, setNewSeat] = useState<Seat>({
    seat_number: "",
    seat_type: "NORMAL",
    row: 1,
    col: 1,
    extra_price: "0",
    is_window: false,
  });

  const seatTypes = vehicleType === "bus"
    ? ["NORMAL", "VIP", "SLEEPER"]
    : ["NORMAL", "VIP"];

  const filters = [
    { id: "all", label: "All", icon: Grid2x2 },
    { id: "NORMAL", label: "Normal", icon: Square },
    { id: "VIP", label: "VIP", icon: Star },
    { id: "SLEEPER", label: "Sleeper", icon: Bed },
  ];

  // Fetch seats
  const fetchSeats = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("Please login again");
        return;
      }

      const isHiace = vehicleType === "hiace";
      const endpoint = isHiace
        ? `${API_URL}/api/v1/hiace-seats/?hiace=${vehicleId}`
        : `${API_URL}/api/v1/seats/?bus=${vehicleId}`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.results) {
        setSeats(response.data.results);
        filterSeats(response.data.results);
      } else {
        setSeats([]);
        filterSeats([]);
      }
    } catch (error: any) {
      console.error("Error fetching seats:", error);
      if (error.response?.status === 404) {
        setSeats([]);
        filterSeats([]);
      } else {
        alert("Failed to fetch seats");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vehicleId, vehicleType]);

  const filterSeats = useCallback((seatData = seats) => {
    if (selectedFilter === "all") {
      setFilteredSeats(seatData);
    } else {
      const filtered = seatData.filter(
        (s: Seat) => s.seat_type === selectedFilter
      );
      setFilteredSeats(filtered);
    }
  }, [selectedFilter, seats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSeats();
  };

  const resetForm = () => {
    setNewSeat({
      seat_number: "",
      seat_type: "NORMAL",
      row: 1,
      col: 1,
      extra_price: "0",
      is_window: false,
    });
    setEditingSeat(null);
  };

  const handleAddSeat = async () => {
    if (!newSeat.seat_number) {
      alert("Please enter seat number");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const isHiace = vehicleType === "hiace";

      const payload = {
        seat_number: newSeat.seat_number,
        seat_type: newSeat.seat_type,
        row: newSeat.row,
        col: newSeat.col,
        extra_price: parseFloat(newSeat.extra_price) || 0,
        is_window: newSeat.is_window,
      };

      let endpoint;
      if (isHiace) {
        endpoint = `${API_URL}/api/v1/hiace-seats/`;
        (payload as any).hiace = vehicleId;
      } else {
        endpoint = `${API_URL}/api/v1/seats/`;
        (payload as any).bus = vehicleId;
      }

      await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Seat added successfully");
      setShowAddModal(false);
      resetForm();
      fetchSeats();
    } catch (error: any) {
      console.error("Error adding seat:", error);
      alert(error.response?.data?.message || "Failed to add seat");
    }
  };

  const handleEditSeat = async () => {
    if (!editingSeat || !editingSeat.seat_number) {
      alert("Please enter seat number");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const isHiace = vehicleType === "hiace";

      const payload = {
        seat_number: editingSeat.seat_number,
        seat_type: editingSeat.seat_type,
        row: editingSeat.row,
        col: editingSeat.col,
        extra_price: parseFloat(editingSeat.extra_price) || 0,
        is_window: editingSeat.is_window,
      };

      const endpoint = isHiace
        ? `${API_URL}/api/v1/hiace-seats/${editingSeat.id}/`
        : `${API_URL}/api/v1/seats/${editingSeat.id}/`;

      await axios.put(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Seat updated successfully");
      setShowAddModal(false);
      resetForm();
      fetchSeats();
    } catch (error: any) {
      console.error("Error updating seat:", error);
      alert(error.response?.data?.message || "Failed to update seat");
    }
  };

  const handleDeleteSeat = (seat: Seat) => {
    if (confirm(`Are you sure you want to delete seat ${seat.seat_number}?`)) {
      (async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const isHiace = vehicleType === "hiace";
          const endpoint = isHiace
            ? `${API_URL}/api/v1/hiace-seats/${seat.id}/`
            : `${API_URL}/api/v1/seats/${seat.id}/`;

          await axios.delete(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });

          alert("Seat deleted successfully");
          fetchSeats();
        } catch (error) {
          console.error("Error deleting seat:", error);
          alert("Failed to delete seat");
        }
      })();
    }
  };

  const getSeatTypeColor = (type: string) => {
    switch (type) {
      case "VIP":
        return "#f59e0b";
      case "SLEEPER":
        return "#8b5cf6";
      default:
        return "#4f46e5";
    }
  };

  const getSeatTypeIcon = (type: string) => {
    switch (type) {
      case "VIP":
        return Star;
      case "SLEEPER":
        return Bed;
      default:
        return Square;
    }
  };

  // Load data
  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  // Apply filters
  useEffect(() => {
    filterSeats();
  }, [selectedFilter, seats]);

  const VehicleIcon = vehicleType === "bus" ? Bus : Car;

  // Seat Card Component
  const SeatCard = ({ seat }: { seat: Seat }) => {
    const Icon = getSeatTypeIcon(seat.seat_type);
    const color = getSeatTypeColor(seat.seat_type);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 flex items-center justify-between hover:shadow-lg transition-all"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: color + "15" }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div>
            <p className="font-bold text-gray-900">{seat.seat_number}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: color + "15", color }}
              >
                {seat.seat_type}
              </span>
              {seat.is_window && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  <Grid2x2 className="w-3 h-3" />
                  Window
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Row {seat.row}</span>
              <span>Col {seat.col}</span>
            </div>
            {seat.extra_price && parseFloat(seat.extra_price) > 0 && (
              <span className="text-sm font-semibold text-emerald-600">
                +Rs. {seat.extra_price}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setEditingSeat(seat);
                setNewSeat(seat);
                setShowAddModal(true);
              }}
              className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <Edit className="w-4 h-4 text-indigo-600" />
            </button>
            <button
              onClick={() => handleDeleteSeat(seat)}
              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
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
              <Grid2x2 className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Loading seats...</p>
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
              <h1 className="text-lg font-bold text-gray-900">Manage Seats</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Seat
            </motion.button>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-24">
        {/* Vehicle Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-xl shadow-md border border-slate-100/50 p-3 mb-4"
        >
          <VehicleIcon className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-medium text-gray-900">
            {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} • ID: {vehicleId}
          </span>
          <div className="ml-auto bg-indigo-50 px-3 py-1 rounded-full">
            <span className="text-sm font-semibold text-indigo-600">{seats.length} Seats</span>
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
            const count = seats.filter((s) =>
              filter.id === "all" ? true : s.seat_type === filter.id
            ).length;
            const isActive = selectedFilter === filter.id;
            const Icon = filter.icon;

            return (
              <button
                key={filter.id}
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
              </button>
            );
          })}
        </motion.div>

        {/* Seat List */}
        <AnimatePresence mode="wait">
          {filteredSeats.length > 0 ? (
            <motion.div
              key={selectedFilter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {filteredSeats.map((seat) => (
                <SeatCard key={seat.id} seat={seat} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white/50 rounded-3xl"
            >
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                <Grid2x2 className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mt-4">No seats found</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
                {selectedFilter === "all"
                  ? "Tap the + button to add seats"
                  : `No ${selectedFilter.toLowerCase()} seats available`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add/Edit Seat Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => {
              setShowAddModal(false);
              resetForm();
            }}
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
                    {editingSeat ? "Edit Seat" : "Add Seat"}
                  </h3>
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
                {/* Seat Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Seat Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., A1, 1A, 01"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
                    value={newSeat.seat_number}
                    onChange={(e) => setNewSeat({ ...newSeat, seat_number: e.target.value.toUpperCase() })}
                    autoFocus
                  />
                </div>

                {/* Seat Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Seat Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {seatTypes.map((type) => {
                      const Icon = type === "VIP" ? Star : type === "SLEEPER" ? Bed : Square;
                      const color = getSeatTypeColor(type);
                      return (
                        <button
                          key={type}
                          onClick={() => setNewSeat({ ...newSeat, seat_type: type })}
                          className={cn(
                            "py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                            newSeat.seat_type === type
                              ? "border-indigo-500 bg-indigo-50/50"
                              : "border-slate-200 bg-white/50 hover:border-indigo-200"
                          )}
                        >
                          <Icon className="w-4 h-4" style={{ color: newSeat.seat_type === type ? color : "#94a3b8" }} />
                          <span className={cn(
                            "text-sm font-semibold",
                            newSeat.seat_type === type ? "text-gray-900" : "text-slate-400"
                          )}>
                            {type}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row & Column */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Row
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={newSeat.row}
                      onChange={(e) => setNewSeat({ ...newSeat, row: parseInt(e.target.value) || 1 })}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Column
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={newSeat.col}
                      onChange={(e) => setNewSeat({ ...newSeat, col: parseInt(e.target.value) || 1 })}
                      min={1}
                    />
                  </div>
                </div>

                {/* Extra Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Extra Price (NPR)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 text-gray-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={newSeat.extra_price}
                    onChange={(e) => setNewSeat({ ...newSeat, extra_price: e.target.value || "0" })}
                    min={0}
                  />
                </div>

                {/* Window Seat Switch */}
                <div className="flex items-center justify-between bg-slate-50/80 rounded-xl px-4 py-3 border border-slate-200/50">
                  <div className="flex items-center gap-3">
                    <Window className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Window Seat</span>
                  </div>
                  <button
                    onClick={() => setNewSeat({ ...newSeat, is_window: !newSeat.is_window })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      newSeat.is_window ? "bg-indigo-600" : "bg-slate-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5",
                        newSeat.is_window ? "translate-x-6" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>

                <button
                  onClick={editingSeat ? handleEditSeat : handleAddSeat}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-4 font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                >
                  {editingSeat ? "Update Seat" : "Add Seat"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default function SeatManagementPage() {
return (
    <>
    <Suspense fallback={<h1>Loading....</h1>}>
      <SeatManagementPageComp/>
    </Suspense>
    </>
)
}