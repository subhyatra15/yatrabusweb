// @ts-nocheck
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Car,
  ArrowLeft,
  RefreshCw,
  Wifi,
  Battery,
  Snowflake,
  Tv,
  Droplets,
  CheckCircle,
  Clock,
  Star,
  User,
  Phone,
  MapPin,
  Navigation,
  Calendar,
  ArrowRight,
  X,
  Loader2,
  Shield,
  Award,
  TrendingUp,
  AlertCircle,
  Info,
  Check,
  Sofa,
  Bed,
  Star as StarIcon,
  Grid2x2,
  LogIn,
  LogOut,
  ChevronDown,
  Share2,
  Users,
  Gauge,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import dynamic from "next/dynamic";


// Import components
import HiaceDetailsCard from "@/components/HiaceDetailsCard";

const HiaceDetailsMap = dynamic(
  () => import("@/components/HiaceDetailsMap"),
  {
    ssr: false,
  }
);
import HiaceDetailsDriverInfo from "@/components/HiaceDetailsDriverInfo";

// Types
interface LayoutCell {
  type: "SEAT" | "STEERING" | "EMPTY";
  data?: {
    id: number;
    seat_number: string;
    seat_type: string;
    row: number;
    col: number;
    extra_price: string;
    is_window: boolean;
    available: boolean;
    selected: boolean;
    booked: boolean;
  };
}

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Custom Hiace seat layout with steering wheel on right
const HIACE_LAYOUT = [
  ["SEAT", "SEAT", null, "STEERING"],
  [null, "SEAT", "SEAT", "SEAT"],
  ["SEAT", null, "SEAT", "SEAT"],
  ["SEAT", null, "SEAT", "SEAT"],
  ["SEAT", "SEAT", "SEAT", "SEAT"],
];

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

const formatDate = (datetime: string) => {
  if (!datetime) return "N/A";
  const date = new Date(datetime);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
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

const getAmenities = (data: any) => {
  const amenities = [];
  if (data.wifi) amenities.push({ name: "WiFi", icon: Wifi });
  if (data.charging) amenities.push({ name: "Charging Point", icon: Battery });
  if (data.ac) amenities.push({ name: "AC", icon: Snowflake });
  if (data.tv) amenities.push({ name: "TV", icon: Tv });
  if (data.water) amenities.push({ name: "Water Bottle", icon: Droplets });
  return amenities.length > 0
    ? amenities
    : [{ name: "Standard", icon: CheckCircle }];
};

function HiaceDetailsPageComp() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const routeId = searchParams.get("routeId");
  const boardingCity = searchParams.get("boardingCity") || "";
  const droppingCity = searchParams.get("droppingCity") || "";
  const scheduleId = searchParams.get("scheduleId");
  const boardingStopId = searchParams.get("boardingStopId");
  const droppingStopId = searchParams.get("droppingStopId");

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>([]);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [hiaceData, setHiaceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [seats, setSeats] = useState<LayoutCell[][]>([]);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 27.7172,
    longitude: 85.324,
  });
  const [destinationLocation, setDestinationLocation] = useState({
    latitude: 28.2096,
    longitude: 83.9856,
  });

  // Fetch hiace details
  useEffect(() => {
    fetchHiaceDetails();
  }, [id]);

  // Process seats data with custom layout
  const processSeatsData = (scheduleSeats: any[], hiaceSeats: any[]) => {
    const bookedSeats = new Set<string>();
    if (scheduleSeats && scheduleSeats.length > 0) {
      scheduleSeats.forEach((seat) => {
        if (seat.status === "BOOKED") {
          bookedSeats.add(seat.seat_number.toString());
        }
      });
    }

    const seatMap: { [key: string]: any } = {};
    hiaceSeats.forEach((seat) => {
      const key = `${seat.row}-${seat.col}`;
      seatMap[key] = {
        ...seat,
        available: !bookedSeats.has(seat.seat_number.toString()),
        selected: false,
        booked: bookedSeats.has(seat.seat_number.toString()),
      };
    });

    const usedSeats = new Set<string>();

    const layoutWithSeats = HIACE_LAYOUT.map((row, rowIndex) => {
      return row.map((cell, colIndex) => {
        if (cell === "STEERING") {
          return { type: "STEERING" as const };
        }
        if (cell === null) {
          return { type: "EMPTY" as const };
        }

        let serverRow = -1;
        let serverCol = -1;

        if (rowIndex === 0) {
          if (colIndex === 0) { serverRow = 1; serverCol = 1; }
          else if (colIndex === 1) { serverRow = 1; serverCol = 2; }
        } else if (rowIndex === 1) {
          if (colIndex === 1) { serverRow = 1; serverCol = 3; }
          else if (colIndex === 2) { serverRow = 1; serverCol = 4; }
          else if (colIndex === 3) { serverRow = 2; serverCol = 1; }
        } else if (rowIndex === 2) {
          if (colIndex === 0) { serverRow = 2; serverCol = 2; }
          else if (colIndex === 2) { serverRow = 2; serverCol = 3; }
          else if (colIndex === 3) { serverRow = 2; serverCol = 4; }
        } else if (rowIndex === 3) {
          if (colIndex === 0) { serverRow = 3; serverCol = 1; }
          else if (colIndex === 2) { serverRow = 3; serverCol = 2; }
          else if (colIndex === 3) { serverRow = 3; serverCol = 3; }
        } else if (rowIndex === 4) {
          if (colIndex === 0) { serverRow = 3; serverCol = 4; }
          else if (colIndex === 1) { serverRow = 3; serverCol = 5; }
          else if (colIndex === 2) { serverRow = 3; serverCol = 6; }
          else if (colIndex === 3) { serverRow = 3; serverCol = 7; }
        }

        let seatData = null;
        if (serverRow > 0 && serverCol > 0) {
          const key = `${serverRow}-${serverCol}`;
          if (seatMap[key]) {
            seatData = seatMap[key];
            usedSeats.add(key);
          }
        }

        if (!seatData) {
          const availableSeats = Object.keys(seatMap).filter(
            (key) => !usedSeats.has(key)
          );
          if (availableSeats.length > 0) {
            const key = availableSeats[0];
            seatData = seatMap[key];
            usedSeats.add(key);
          }
        }

        if (seatData) {
          return {
            type: "SEAT" as const,
            data: seatData,
          };
        }

        return {
          type: "SEAT" as const,
          data: {
            id: Math.floor(Math.random() * 1000),
            seat_number: `R${rowIndex + 1}C${colIndex + 1}`,
            seat_type: "NORMAL",
            row: rowIndex + 1,
            col: colIndex + 1,
            extra_price: "0.00",
            is_window: colIndex === 0 || colIndex === 3,
            available: true,
            selected: false,
            booked: false,
          },
        };
      });
    });

    return layoutWithSeats;
  };

  const fetchHiaceDetails = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem("accessToken");

      const url = `${API_URL}/api/v1/hiace-schedules/withroutestop/?schedule_id=${scheduleId}&routeid=${routeId}&boardingcity=${boardingCity}&droppingcity=${droppingCity}`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 15000,
      });

      if (response.data) {
        const data = response.data.data;

        const hiaceSeatsResponse = await axios.get(
          `${API_URL}/api/v1/hiace-seats/?hiace=${data.bus}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            timeout: 15000,
          }
        );

        const hiaceSeats = hiaceSeatsResponse.data.results || [];

        const processedSeats = processSeatsData(data.seats || [], hiaceSeats);
        setSeats(processedSeats);

        const transformedData = {
          id: data.id.toString(),
          name: data.bus_name || "Hiace",
          type: data.bus_type || (data.ac ? "AC" : "Non-AC"),
          from: data.source_city || "N/A",
          to: data.destination_city || "N/A",
          departure: formatTime(data.departure_datetime),
          arrival: formatTime(data.arrival_datetime),
          duration: calculateDuration(data.departure_datetime, data.arrival_datetime),
          price: parseFloat(data.fare) || 0,
          totalSeats: data.total_seats || 0,
          availableSeats: data.available_seats || 0,
          rating: data.rating || 4.3,
          hiaceNumber: data.bus_number || "N/A",
          amenities: getAmenities(data),
          description: `Premium ${data.bus_type} hiace with comfortable seating and refreshments included. Perfect for group travel.`,
          driver: {
            name: data.operator_name || "Not Available",
            phone: data.operator_phone || "N/A",
            experience: "8 years",
            rating: 4.8,
          },
          location: {
            latitude: data.source_latitude || 27.7172,
            longitude: data.source_longitude || 85.324,
            address: `${data.source_city} Bus Park`,
          },
          destination: {
            latitude: data.destination_latitude || 28.2096,
            longitude: data.destination_longitude || 83.9856,
            address: `${data.destination_city} Bus Park`,
          },
          seatLayout: data.seat_layout || { left: 2, right: 2 },
          status: data.status,
          operator: data.operator,
          route: data.route,
          hiace: data.bus,
        };

        setHiaceData(transformedData);

        if (data.source_latitude && data.source_longitude) {
          setCurrentLocation({
            latitude: data.source_latitude,
            longitude: data.source_longitude,
          });
        }
        if (data.destination_latitude && data.destination_longitude) {
          setDestinationLocation({
            latitude: data.destination_latitude,
            longitude: data.destination_longitude,
          });
        }
      }
    } catch (error: any) {
      console.error("Error fetching hiace details:", error);

      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          alert("Session Expired. Please login again.");
          router.push("/login");
        } else if (status === 404) {
          alert("Hiace schedule not found.");
        } else {
          alert(error.response.data?.message || "Failed to fetch hiace details.");
        }
      } else if (error.request) {
        alert("Unable to connect to the server.");
      } else {
        alert("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSeat = (rowIndex: number, colIndex: number) => {
    const newSeats = [...seats];
    const cell = newSeats[rowIndex][colIndex];

    if (cell.type !== "SEAT" || !cell.data) return;
    if (!cell.data.available || cell.data.booked) return;

    cell.data.selected = !cell.data.selected;
    setSeats(newSeats);

    const selectedIds: number[] = [];
    const selectedNumbers: string[] = [];
    newSeats.forEach((row) => {
      row.forEach((cell: LayoutCell) => {
        if (cell.type === "SEAT" && cell.data && cell.data.selected) {
          selectedIds.push(cell.data.id);
          selectedNumbers.push(cell.data.seat_number);
        }
      });
    });
    setSelectedSeats(selectedIds);
    setSelectedSeatNumbers(selectedNumbers);
  };

  const getSeatColor = (cell: LayoutCell) => {
    if (cell.type !== "SEAT" || !cell.data) return "transparent";
    if (cell.data.booked) return "#fee2e2";
    if (!cell.data.available) return "#fee2e2";
    if (cell.data.selected) return "#059669";
    return "#d1fae5";
  };

  const getSeatBorderColor = (cell: LayoutCell) => {
    if (cell.type !== "SEAT" || !cell.data) return "transparent";
    if (cell.data.booked) return "#fca5a5";
    if (!cell.data.available) return "#fca5a5";
    if (cell.data.selected) return "#059669";
    return "#6ee7b7";
  };

  const getSeatTextColor = (cell: LayoutCell) => {
    if (cell.type !== "SEAT" || !cell.data) return "transparent";
    if (cell.data.booked) return "#ef4444";
    if (!cell.data.available) return "#ef4444";
    if (cell.data.selected) return "#ffffff";
    return "#059669";
  };

  const totalPrice = selectedSeats.length * (hiaceData?.price || 0);

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    try {
      setIsBooking(true);

      const token = localStorage.getItem("accessToken");

      const bookingData = {
        schedule: parseInt(id as string),
        boardingstop: boardingStopId,
        droppingstop: droppingStopId,
        booking_seats: selectedSeats.map((seatId) => ({
          seat: seatId,
        })),
        discount: 0,
      };

      const response = await axios.post(
        `${API_URL}/api/v1/hiace-bookings/`,
        bookingData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000,
        }
      );

      if (response.data) {
        setShowSeatModal(false);
        router.push(
          `/hiace-payment?id=${response.data.data.id}&routeId=${routeId}&boardingCity=${boardingCity}&droppingCity=${droppingCity}&scheduleId=${scheduleId}&boardingStopId=${boardingStopId}&droppingStopId=${droppingStopId}`
        );

        setSelectedSeats([]);
        setSelectedSeatNumbers([]);
        fetchHiaceDetails();
      }
    } catch (error: any) {
      console.error("Error creating booking:", error);

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || "Failed to book seats.";

        if (status === 401) {
          alert("Session Expired. Please login again.");
          router.push("/login");
        } else if (status === 400) {
          alert(message);
        } else {
          alert(message);
        }
      } else if (error.request) {
        alert("Unable to connect to the server.");
      } else {
        alert("An unexpected error occurred.");
      }
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
              <Car className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-emerald-600 font-medium">Loading hiace details...</p>
        </motion.div>
      </div>
    );
  }

  if (!hiaceData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <Car className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mt-4">No hiace found</h3>
        <button
          onClick={fetchHiaceDetails}
          className="mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
        >
          Retry
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
              <h1 className="text-lg font-bold text-gray-900">Hiace Details</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-colors"
            >
              <Share2 className="w-5 h-5 text-emerald-600" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-32">
        {/* Hiace Details Card */}
        <HiaceDetailsCard
          hiaceData={hiaceData}
          boardingCity={boardingCity}
          droppingCity={droppingCity}
        />

        {/* Map Section */}
        <HiaceDetailsMap
          hiaceData={hiaceData}
          currentLocation={currentLocation}
          destinationLocation={destinationLocation}
        />

        {/* Driver Info */}
        <HiaceDetailsDriverInfo
          hiaceData={hiaceData}
          showDriverInfo={showDriverInfo}
          setShowDriverInfo={setShowDriverInfo}
        />

        {/* Amenities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {hiaceData.amenities.map((amenity: any, index: number) => {
              const Icon = amenity.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-emerald-50/50 px-3 py-2 rounded-xl border border-emerald-100/50"
                >
                  <Icon className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {amenity.name}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Seats Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Select Seats</h3>
            <button
              onClick={() => setShowSeatModal(true)}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              View All →
            </button>
          </div>
          <button
            onClick={() => setShowSeatModal(true)}
            className="w-full bg-slate-50/80 rounded-xl p-4 border border-slate-200/50 hover:bg-slate-100/80 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                {seats.slice(0, 3).map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1">
                    {row.map((cell: LayoutCell, colIndex: number) => {
                      if (cell.type === "STEERING") {
                        return (
                          <div key={colIndex} className="w-6 h-6 flex items-center justify-center">
                            <span className="text-xs text-slate-400">🚗</span>
                          </div>
                        );
                      }
                      if (cell.type === "EMPTY") {
                        return <div key={colIndex} className="w-6 h-6" />;
                      }
                      if (cell.type === "SEAT" && cell.data) {
                        return (
                          <div
                            key={colIndex}
                            className="w-6 h-6 rounded"
                            style={{
                              backgroundColor: cell.data.booked
                                ? "#fee2e2"
                                : cell.data.selected
                                  ? "#059669"
                                  : "#d1fae5",
                            }}
                          />
                        );
                      }
                      return <div key={colIndex} className="w-6 h-6" />;
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-emerald-600">
                  {hiaceData.availableSeats} seats available
                </span>
                <ArrowRight className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </button>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {hiaceData.description}
          </p>
        </motion.div>
      </main>

      {/* Bottom Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 px-4 py-4 z-40"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Price per seat</p>
            <p className="text-2xl font-extrabold text-emerald-600">
              Rs. {hiaceData.price}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSeatModal(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-3.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
          >
            Select Seats
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Seat Selection Modal */}
      <AnimatePresence>
        {showSeatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowSeatModal(false)}
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
                  <h3 className="text-xl font-bold text-gray-900">Select Seats</h3>
                  <button
                    onClick={() => setShowSeatModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto max-h-[60vh]">
                {/* Legend */}
                <div className="flex flex-wrap gap-3 justify-center mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-emerald-100 border border-emerald-200" />
                    <span className="text-xs text-slate-600">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-emerald-600" />
                    <span className="text-xs text-slate-600">Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-red-100 border border-red-200" />
                    <span className="text-xs text-slate-600">Booked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">🚗</span>
                    <span className="text-xs text-slate-600">Driver</span>
                  </div>
                </div>

                {/* Seats Layout */}
                <div className="flex flex-col items-center gap-2">
                  {seats.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold w-5">
                        {String.fromCharCode(65 + rowIndex)}
                      </span>
                      {row.map((cell: LayoutCell, colIndex: number) => {
                        if (cell.type === "STEERING") {
                          return (
                            <div
                              key={colIndex}
                              className="w-12 h-12 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center"
                            >
                              <span className="text-xl">🚗</span>
                              <span className="text-[8px] text-slate-400 font-medium">Driver</span>
                            </div>
                          );
                        }
                        if (cell.type === "EMPTY") {
                          return <div key={colIndex} className="w-12 h-12" />;
                        }
                        if (cell.type === "SEAT" && cell.data) {
                          const isBooked = cell.data.booked || !cell.data.available;
                          const isSelected = cell.data.selected;

                          return (
                            <motion.button
                              key={colIndex}
                              whileHover={!isBooked ? { scale: 1.05 } : {}}
                              whileTap={!isBooked ? { scale: 0.95 } : {}}
                              onClick={() => toggleSeat(rowIndex, colIndex)}
                              disabled={isBooked}
                              className={cn(
                                "relative w-12 h-12 rounded-xl border-2 transition-all flex flex-col items-center justify-center",
                                isBooked && "opacity-60 cursor-not-allowed",
                                isSelected && "scale-105 border-emerald-600 shadow-lg shadow-emerald-500/25"
                              )}
                              style={{
                                backgroundColor: getSeatColor(cell),
                                borderColor: getSeatBorderColor(cell),
                              }}
                            >
                              <Sofa
                                className="w-5 h-5"
                                style={{ color: getSeatTextColor(cell) }}
                              />
                              <span
                                className="text-[8px] font-semibold absolute bottom-0.5 right-1 opacity-70"
                                style={{ color: getSeatTextColor(cell) }}
                              >
                                {cell.data.seat_number}
                              </span>
                              {isSelected && (
                                <Check className="w-3 h-3 text-white absolute -top-1 -right-1" />
                              )}
                              {cell.data.is_window && (
                                <Grid2x2 className="w-3 h-3 text-blue-400 absolute -top-1 -left-1" />
                              )}
                            </motion.button>
                          );
                        }
                        return <div key={colIndex} className="w-12 h-12" />;
                      })}
                    </div>
                  ))}
                </div>

                <div className="text-center mt-4">
                  <span className="text-xs text-slate-400">↑ Front of Vehicle</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedSeats.length} seats selected
                    </p>
                    {selectedSeatNumbers.length > 0 && (
                      <p className="text-sm text-emerald-600 font-medium">
                        {selectedSeatNumbers.join(", ")}
                      </p>
                    )}
                    <p className="text-sm text-slate-400">
                      Total: Rs. {totalPrice}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmBooking}
                    disabled={selectedSeats.length === 0 || isBooking}
                    className={cn(
                      "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/25",
                      (selectedSeats.length === 0 || isBooking) &&
                        "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isBooking ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Confirm Seats"
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HiaceDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HiaceDetailsPageComp />
    </Suspense>
  );
}