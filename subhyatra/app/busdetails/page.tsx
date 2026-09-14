// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bus,
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
  ArrowRight,
  X,
  Loader2,
  TrendingUp,
  AlertCircle,
  LifeBuoy,
  Info,
  Check,
  Sofa,
  Bed,
  Star as StarIcon,
  Grid2x2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

// Import components
import BusDetailsCard from "@/components/BusDetailsCard";
import dynamic from "next/dynamic";

const BusDetailsMap = dynamic(() => import("@/components/BudgetDetailsMap"), {
  ssr: false,
});
import BusDetailsDriverInfo from "@/components/BusDetailsDriverInfo";

// Types
interface Seat {
  id: number;
  seat_number: string;
  status: "AVAILABLE" | "BOOKED" | "SELECTED";
  price: number;
  bus?: number;
  seat_type?: string;
  row?: number;
  col?: number;
  is_window?: boolean;
  selected_by?: number;
  selected_by_name?: string;
  is_mine?: boolean;
  ttl?: number;
  available: boolean;
  selected: boolean;
  extra_price?: string;
}

interface WebSocketSeatEvent {
  type: "initial_seats" | "seat_selected" | "seat_available" | "error" | "pong";
  seat_id?: string;
  user_id?: number;
  username?: string;
  seats?: any[];
  message?: string;
}

interface City {
  id: number;
  name: string;
  province: string;
  latitude: string;
  longitude: string;
}

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://192.168.101.18:8000";

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

function BusDetailsPageComp() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const routeId = searchParams.get("routeId");
  const boardingCity = searchParams.get("boardingCity") || "";
  const droppingCity = searchParams.get("droppingCity") || "";
  const scheduleId = searchParams.get("scheduleId");
  const boardingStopId = searchParams.get("boardingStopId");
  const droppingStopId = searchParams.get("droppingStopId");

  // State
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [busData, setBusData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [seats, setSeats] = useState<any[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 27.7172,
    longitude: 85.324,
  });
  const [destinationLocation, setDestinationLocation] = useState({
    latitude: 28.2096,
    longitude: 83.9856,
  });
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(
    new Set(),
  );
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const locationWsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // ✅ Live ref to userId — used everywhere inside WS callbacks
  const userIdRef = useRef<number | null>(null);

  // ✅ Derive selected seats (no extra state)
  const { selectedSeats, selectedSeatNumbers } = useMemo(() => {
    const ids: number[] = [];
    const nums: string[] = [];
    seats.forEach((row) => {
      row.forEach((s: any) => {
        if (s.selected && s.is_mine) {
          ids.push(s.id);
          nums.push(s.seat_number);
        }
      });
    });
    return { selectedSeats: ids, selectedSeatNumbers: nums };
  }, [seats]);

  // Get current user ID
  useEffect(() => {
    const getUserId = () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const id = payload.user_id || payload.sub;
          setUserId(id);
          userIdRef.current = id;
          console.log("Current User ID:", id);
        }
      } catch (error) {
        console.error("Error getting user ID:", error);
      }
    };
    getUserId();
  }, []);

  // Fetch cities
  const fetchCities = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_URL}/api/v1/cities/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 10000,
      });

      if (response.data && response.data.results) {
        setCities(response.data.results);
        console.log("✅ Cities loaded:", response.data.results.length);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  // Get city coordinates
  const getCityCoordinates = (cityName: string) => {
    const city = cities.find(
      (c) => c.name.toLowerCase() === cityName?.toLowerCase(),
    );
    if (city) {
      return {
        latitude: parseFloat(city.latitude),
        longitude: parseFloat(city.longitude),
      };
    }
    return null;
  };

  // WebSocket for seats
  const connectWebSocket = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const wsUrl = `${WS_URL}/ws/trips/${scheduleId}/seats/?token=${token}`;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return;
      }

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("✅ Seats WebSocket connected");
        setIsWebSocketConnected(true);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketSeatEvent = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("WebSocket parse error:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("❌ Seats WebSocket disconnected");
        setIsWebSocketConnected(false);
        handleReconnect();
      };

      wsRef.current.onerror = (error) => {
        console.error("❌ Seats WebSocket error:", error);
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  };

  // WebSocket for location tracking
  const connectLocationWebSocket = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const busId = busData?.bus || id;
      const wsUrl = `${WS_URL}/ws/buses/${busId}/location/?token=${token}`;

      if (
        locationWsRef.current &&
        locationWsRef.current.readyState === WebSocket.OPEN
      ) {
        return;
      }

      locationWsRef.current = new WebSocket(wsUrl);

      locationWsRef.current.onopen = () => {
        console.log("✅ Location WebSocket connected");
        setIsLocationTracking(true);
      };

      locationWsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "location_update" || data.type === "location") {
            handleLocationUpdate(data);
          } else if (data.type === "pong") {
            console.log("Heartbeat received");
          } else if (data.type === "initial_location") {
            handleLocationUpdate(data);
          }
        } catch (error) {
          console.error("Location WebSocket parse error:", error);
        }
      };

      locationWsRef.current.onclose = (event) => {
        console.log(`❌ Location WebSocket disconnected. Code: ${event.code}`);
        setIsLocationTracking(false);
        setTimeout(() => {
          if (busData) {
            connectLocationWebSocket();
          }
        }, 5000);
      };

      locationWsRef.current.onerror = (error) => {
        console.error("❌ Location WebSocket error:", error);
        setIsLocationTracking(false);
      };

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      heartbeatIntervalRef.current = setInterval(() => {
        if (
          locationWsRef.current &&
          locationWsRef.current.readyState === WebSocket.OPEN
        ) {
          locationWsRef.current.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    } catch (error) {
      console.error("❌ Location WebSocket connection error:", error);
      setIsLocationTracking(false);
    }
  };

  const handleLocationUpdate = (data: any) => {
    let lat, lng;

    if (data.data) {
      lat = data.data.latitude || data.data.lat;
      lng = data.data.longitude || data.data.lng || data.data.lon;
    } else {
      lat = data.latitude || data.lat;
      lng = data.longitude || data.lng || data.lon;
    }

    if (lat && lng) {
      setCurrentLocation({
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      });
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const token = localStorage.getItem("accessToken");
      const busId = busData?.bus || id;

      const response = await axios.get(
        `${API_URL}/api/v1/buses/${busId}/location/current/`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 10000,
        },
      );

      if (response.data && response.data.success && response.data.data) {
        const { latitude, longitude } = response.data.data;
        if (latitude && longitude) {
          setCurrentLocation({
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          });
          return true;
        }
      } else if (
        response.data &&
        response.data.latitude &&
        response.data.longitude
      ) {
        setCurrentLocation({
          latitude: parseFloat(response.data.latitude),
          longitude: parseFloat(response.data.longitude),
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("❌ Error fetching current location:", error);
      return false;
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleReconnect = () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      setTimeout(() => {
        console.log(`Reconnecting attempt ${reconnectAttempts.current}`);
        connectWebSocket();
      }, reconnectDelay * reconnectAttempts.current);
    }
  };

  // ---------------------------------------------------------------
  // WebSocket message handler
  // ---------------------------------------------------------------
  const handleWebSocketMessage = (data: WebSocketSeatEvent) => {
    console.log("WebSocket message:", data);

    switch (data.type) {
      case "initial_seats":
        if (data.seats) {
          const selectedIds = new Set<string>();
          data.seats.forEach((seat: any) => {
            if (seat.user_id) selectedIds.add(seat.seat_id);
          });
          setSelectedSeatIds(selectedIds);
          updateSeatsFromWebSocket(data.seats);
        }
        break;

      case "seat_selected":
        if (data.seat_id) {
          setSelectedSeatIds((prev) => new Set(prev).add(data.seat_id!));
          markSeatAsSelected(data.seat_id, data.user_id, data.username);
        }
        break;

      case "seat_available":
        if (data.seat_id) {
          setSelectedSeatIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.seat_id!);
            return newSet;
          });
          markSeatAsAvailable(data.seat_id);
        }
        break;

      case "error":
        alert(data.message || "Something went wrong");
        break;

      default:
        break;
    }
  };

  // ---------------------------------------------------------------
  // ✅ FIXED: markSeatAsSelected — numeric compare, keep selected_by
  // ---------------------------------------------------------------
  const markSeatAsSelected = (
    seatId: string,
    selectedByUserId?: number,
    username?: string,
  ) => {
    const uid = userIdRef.current;
    const isMine =
      uid != null &&
      selectedByUserId != null &&
      Number(selectedByUserId) === Number(uid);

    console.log(
      `[markSeatAsSelected] seat=${seatId} by=${selectedByUserId} me=${uid} is_mine=${isMine}`,
    );

    setSeats((prevSeats) =>
      prevSeats.map((row) =>
        row.map((seat: any) => {
          if (seat.id.toString() === seatId) {
            return {
              ...seat,
              available: false,
              selected_by: selectedByUserId, // ✅ always store, even for me
              selected_by_name: username,
              is_mine: isMine,
              selected: isMine,
            };
          }
          return seat;
        }),
      ),
    );
  };

  const markSeatAsAvailable = (seatId: string) => {
    setSeats((prevSeats) =>
      prevSeats.map((row) =>
        row.map((seat: any) => {
          if (seat.id.toString() === seatId) {
            return {
              ...seat,
              available: true,
              selected_by: undefined,
              selected_by_name: undefined,
              is_mine: false,
              selected: false,
            };
          }
          return seat;
        }),
      ),
    );
  };

  // ---------------------------------------------------------------
  // ✅ FIXED: updateSeatsFromWebSocket — numeric compare
  // ---------------------------------------------------------------
  const updateSeatsFromWebSocket = (wsSeats: any[]) => {
    const uid = userIdRef.current;
    setSeats((prevSeats) =>
      prevSeats.map((row) =>
        row.map((seat: any) => {
          const wsSeat = wsSeats.find(
            (s: any) => s.seat_id === seat.id.toString(),
          );
          if (wsSeat) {
            const isMine =
              uid != null && Number(wsSeat.user_id) === Number(uid);
            return {
              ...seat,
              available: false,
              selected_by: wsSeat.user_id,
              selected_by_name: wsSeat.name,
              is_mine: isMine,
              selected: isMine,
            };
          }
          // Not in WS list → free (unless the seat is permanently booked)
          return {
            ...seat,
            available: true,
            selected_by: undefined,
            selected_by_name: undefined,
            is_mine: false,
            selected: false,
          };
        }),
      ),
    );
  };

  // ---------------------------------------------------------------
  // ✅ FIXED: selectSeat — checks is_mine on 409
  // ---------------------------------------------------------------
  const selectSeat = async (seatId: string) => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await axios.post(
        `${API_URL}/api/v1/trips/${scheduleId}/seats/${seatId}/select/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        const uid = userIdRef.current;
        // Optimistically mark as mine
        setSeats((prevSeats) =>
          prevSeats.map((row) =>
            row.map((seat: any) => {
              if (seat.id.toString() === seatId) {
                return {
                  ...seat,
                  available: false,
                  selected_by: uid,
                  selected_by_name: response.data.username || "You",
                  is_mine: true,
                  selected: true,
                };
              }
              return seat;
            }),
          ),
        );
        setSelectedSeatIds((prev) => new Set(prev).add(seatId));
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error selecting seat:", error);

      // 409 could be YOUR own earlier lock
      if (error.response?.status === 409) {
        const selectedBy = error.response?.data?.selected_by;
        const selectedById = selectedBy?.user_id ?? selectedBy?.id ?? null;
        const myId = userIdRef.current;

        const isMine =
          selectedById != null &&
          myId != null &&
          Number(selectedById) === Number(myId);

        if (isMine) {
          console.log("Seat is already yours — syncing state.");
          setSeats((prevSeats) =>
            prevSeats.map((row) =>
              row.map((seat: any) => {
                if (seat.id.toString() === seatId) {
                  return {
                    ...seat,
                    available: false,
                    selected_by: myId,
                    selected_by_name: selectedBy?.name || "You",
                    is_mine: true,
                    selected: true,
                  };
                }
                return seat;
              }),
            ),
          );
          setSelectedSeatIds((prev) => new Set(prev).add(seatId));
          return true;
        }

        alert(
          `Seat Already Selected\nThis seat is already selected by ${
            selectedBy?.name || "another user"
          }`,
        );
        return false;
      }

      alert("Failed to select seat. Please try again.");
      return false;
    }
  };

  const releaseSeat = async (seatId: string) => {
    try {
      const token = localStorage.getItem("accessToken");

      await axios.delete(
        `${API_URL}/api/v1/trips/${scheduleId}/seats/${seatId}/release/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setSelectedSeatIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(seatId);
        return newSet;
      });
      markSeatAsAvailable(seatId);
      return true;
    } catch (error: any) {
      console.error("Error releasing seat:", error);
      alert("Failed to release seat. Please try again.");
      return false;
    }
  };

  // Fetch bus seats
  const fetchBusSeats = async (bus_id: number) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/seats/?bus=${bus_id}`,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        },
      );
      if (response.data && response.data.results) {
        return response.data.results;
      }
      return [];
    } catch (error: any) {
      console.error("Error fetching bus seats:", error);
      return [];
    }
  };

  const processSeatsData = (scheduleSeats: Seat[], busSeats: any[]) => {
    const bookedSeats = new Set<string>();
    scheduleSeats.forEach((seat) => {
      if (seat.status === "BOOKED") {
        bookedSeats.add(seat.seat_number.toString());
      }
    });

    const sortedSeats = [...busSeats].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    const seatsByRow: { [key: number]: any[] } = {};
    sortedSeats.forEach((seat) => {
      if (!seatsByRow[seat.row]) seatsByRow[seat.row] = [];
      seatsByRow[seat.row].push(seat);
    });

    const rows: any[] = [];
    Object.keys(seatsByRow)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((rowNumber) => {
        const rowSeats = seatsByRow[rowNumber]
          .sort((a, b) => a.col - b.col)
          .map((seat) => ({
            ...seat,
            id: seat.id,
            seat_number: seat.seat_number,
            available: !bookedSeats.has(seat.seat_number.toString()),
            selected: false,
            seat_type: seat.seat_type || "NORMAL",
            is_window: seat.is_window || false,
            is_mine: false,
            selected_by: undefined,
            selected_by_name: undefined,
            extra_price: seat.extra_price || "0.00",
          }));
        rows.push(rowSeats);
      });

    return rows;
  };

  const fetchBusDetails = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${API_URL}/api/v1/schedules/withroutestop/${scheduleId}/?routeid=${routeId}&boardingcity=${boardingCity}&droppingcity=${droppingCity}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 15000,
        },
      );

      if (response.data) {
        const data = response.data.data;

        const busSeats = await fetchBusSeats(data.bus);
        const processedSeats = processSeatsData(data.seats || [], busSeats);
        setSeats(processedSeats);

        let sourceCoords = getCityCoordinates(data.source_city);
        let destCoords = getCityCoordinates(data.destination_city);

        const initialLat = sourceCoords?.latitude || 27.7172;
        const initialLng = sourceCoords?.longitude || 85.324;
        const destLat = destCoords?.latitude || 28.2096;
        const destLng = destCoords?.longitude || 83.9856;

        try {
          const locationResponse = await axios.get(
            `${API_URL}/api/v1/buses/${data.bus}/location/current/`,
            {
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              timeout: 5000,
            },
          );

          if (locationResponse.data) {
            let lat, lng;
            if (locationResponse.data.success && locationResponse.data.data) {
              lat = locationResponse.data.data.latitude;
              lng = locationResponse.data.data.longitude;
            } else if (
              locationResponse.data.latitude &&
              locationResponse.data.longitude
            ) {
              lat = locationResponse.data.latitude;
              lng = locationResponse.data.longitude;
            }
            if (lat && lng) {
              setCurrentLocation({
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
              });
            }
          }
        } catch {
          setCurrentLocation({ latitude: initialLat, longitude: initialLng });
        }

        setDestinationLocation({ latitude: destLat, longitude: destLng });

        const transformedData = {
          id: data.id.toString(),
          name: data.bus_name || "Bus",
          type: data.bus_type || (data.ac ? "AC" : "Non-AC"),
          from: data.source_city || "N/A",
          to: data.destination_city || "N/A",
          departure: formatTime(data.departure_datetime),
          arrival: formatTime(data.arrival_datetime),
          duration: calculateDuration(
            data.departure_datetime,
            data.arrival_datetime,
          ),
          price: parseFloat(data.fare) || 0,
          totalSeats: data.total_seats || 0,
          availableSeats: data.available_seats || 0,
          rating: data.rating || 4.5,
          busNumber: data.bus_number || "N/A",
          amenities: getAmenities(data),
          description: `Premium ${data.bus_type} bus with comfortable seating, entertainment system, and refreshments included.`,
          driver: {
            name: data.operator_name || "Not Available",
            phone: data.operator_phone || "N/A",
            experience: "12 years",
            rating: 4.9,
          },
          location: {
            latitude: initialLat,
            longitude: initialLng,
            address: `${data.source_city} Bus Park`,
          },
          destination: {
            latitude: destLat,
            longitude: destLng,
            address: `${data.destination_city} Bus Park`,
          },
          seatLayout: data.seat_layout || { left: 2, right: 2 },
          status: data.status,
          operator: data.operator,
          bus: data.bus,
        };

        setBusData(transformedData);
      }
    } catch (error: any) {
      console.error("Error fetching bus details:", error);
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          alert("Session Expired. Please login again.");
          router.push("/");
        } else if (status === 404) {
          alert("Bus schedule not found.");
        } else {
          alert(error.response.data?.message || "Failed to fetch bus details.");
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

  // ✅ FIXED toggleSeat
  const toggleSeat = async (rowIndex: number, colIndex: number) => {
    const seat = seats[rowIndex][colIndex];
    if (!seat) return;
    const myId = userIdRef.current;

    // Booked permanently
    if (!seat.available && !seat.selected_by) {
      alert("This seat is already booked.");
      return;
    }

    // Selected by someone else
    if (
      seat.selected_by != null &&
      myId != null &&
      Number(seat.selected_by) !== Number(myId)
    ) {
      alert(
        `This seat is currently being selected by ${
          seat.selected_by_name || "another user"
        }`,
      );
      return;
    }

    // Selected by ME → release
    const isSelectedByMe =
      (seat.is_mine && seat.selected) ||
      (seat.selected_by != null &&
        myId != null &&
        Number(seat.selected_by) === Number(myId));

    if (isSelectedByMe) {
      await releaseSeat(seat.id.toString());
      return;
    }

    // Available → select
    if (seat.available) {
      await selectSeat(seat.id.toString());
    }
  };

  const getMaxSeatsInRow = () => {
    let max = 0;
    seats.forEach((row) => {
      if (row.length > max) max = row.length;
    });
    return max;
  };

  const refreshLocation = async () => {
    if (
      locationWsRef.current &&
      locationWsRef.current.readyState === WebSocket.OPEN
    ) {
      locationWsRef.current.send(JSON.stringify({ type: "get_location" }));
      alert("Requesting latest location from bus...");
      return;
    }

    const success = await fetchCurrentLocation();
    if (success) {
      alert("Bus location has been updated.");
    } else {
      alert("Could not fetch bus location. Please try again.");
    }
  };

  // ---------------------------------------------------------------
  // ✅ FIXED: Seat color helpers — explicitly check selected_by
  // ---------------------------------------------------------------
  const getSeatColor = (seat: any) => {
    // Booked permanently
    if (!seat.available && !seat.selected_by && !seat.is_mine) {
      return "#fee2e2"; // red-ish for booked
    }
    // Selected by someone
    if (seat.selected_by != null) {
      if (seat.is_mine) return "#4f46e5"; // indigo = mine
      return "#fbbf24"; // ✅ amber = other user selecting
    }
    // Available
    if (seat.selected) return "#4f46e5";
    if (seat.seat_type === "SLEEPER") return "#dbeafe";
    if (seat.seat_type === "VIP") return "#fef3c7";
    return "#dbeafe";
  };

  const getSeatBorderColor = (seat: any) => {
    if (!seat.available && !seat.selected_by && !seat.is_mine) {
      return "#fca5a5";
    }
    if (seat.selected_by != null) {
      if (seat.is_mine) return "#4f46e5";
      return "#fbbf24"; // amber border for other user
    }
    if (seat.selected) return "#4f46e5";
    if (seat.seat_type === "SLEEPER") return "#60a5fa";
    if (seat.seat_type === "VIP") return "#fbbf24";
    return "#93c5fd";
  };

  const getSeatTextColor = (seat: any) => {
    if (!seat.available && !seat.selected_by && !seat.is_mine) {
      return "#ef4444";
    }
    if (seat.selected_by != null) {
      if (seat.is_mine) return "#ffffff";
      return "#d97706"; // amber text for other user
    }
    if (seat.selected) return "#ffffff";
    if (seat.seat_type === "SLEEPER") return "#2563eb";
    if (seat.seat_type === "VIP") return "#d97706";
    return "#4f46e5";
  };

  const getSeatIcon = (seat: any) => {
    if (seat.selected_by != null && !seat.is_mine) return Clock; // ⏱ for other user
    if (seat.is_mine) return Check;
    if (seat.seat_type === "SLEEPER") return Bed;
    if (seat.seat_type === "VIP") return StarIcon;
    return Sofa;
  };

  const getSeatPrice = (seat: any) => {
    const basePrice = busData?.price || 0;
    const extraPrice = parseFloat(seat.extra_price) || 0;
    return basePrice + extraPrice;
  };

  // Total
  const totalPrice = selectedSeats.reduce((total, seatId) => {
    let seatPrice = busData?.price || 0;
    seats.forEach((row) => {
      row.forEach((s: any) => {
        if (s.id === seatId) {
          const extra = parseFloat(s.extra_price) || 0;
          seatPrice += extra;
        }
      });
    });
    return total + seatPrice;
  }, 0);

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
        booking_seats: selectedSeats.map((seatId) => ({ seat: seatId })),
        discount: 0,
      };

      const response = await axios.post(
        `${API_URL}/api/v1/bookings/`,
        bookingData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000,
        },
      );

      if (response.data) {
        setShowSeatModal(false);
        router.push(
          `/payment?id=${response.data.data.id}&routeId=${routeId}&boardingCity=${boardingCity}&droppingCity=${droppingCity}&scheduleId=${scheduleId}&boardingStopId=${boardingStopId}&droppingStopId=${droppingStopId}`,
        );
        fetchBusDetails();
      }
    } catch (error: any) {
      console.error("Error creating booking:", error);
      const message = error.response?.data?.message || "Failed to book seats.";
      if (error.response?.status === 401) {
        alert("Session Expired. Please login again.");
        router.push("/login");
      } else {
        alert(message);
      }
    } finally {
      setIsBooking(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchCities();
    fetchBusDetails();
  }, [id]);

  useEffect(() => {
    if (scheduleId && userId !== null) {
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [scheduleId, userId]);

  useEffect(() => {
    if (busData) {
      connectLocationWebSocket();
      fetchCurrentLocation();
    }
    return () => {
      if (locationWsRef.current) locationWsRef.current.close();
      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current);
    };
  }, [busData]);

  useEffect(() => {
    if (!isLocationTracking && !isLoadingLocation && busData && !isLoading) {
      const sourceCoords = getCityCoordinates(busData.from);
      if (sourceCoords) {
        setCurrentLocation({
          latitude: sourceCoords.latitude,
          longitude: sourceCoords.longitude,
        });
      }
    }
  }, [isLocationTracking, isLoadingLocation, busData, isLoading]);

  // Loading
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
              <Bus className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">
            Loading bus details...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!busData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-slate-50 to-indigo-50/30">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <Bus className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mt-4">No bus found</h3>
        <button
          onClick={fetchBusDetails}
          className="mt-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
        >
          Retry
        </button>
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
              <h1 className="text-lg font-bold text-gray-900">Bus Details</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshLocation}
              className="w-10 h-10 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-32">
        <BusDetailsCard
          busData={busData}
          boardingCity={boardingCity}
          droppingCity={droppingCity}
        />

        <BusDetailsMap
          busData={busData}
          currentLocation={currentLocation}
          destinationLocation={destinationLocation}
          isLiveTracking={isLocationTracking}
          isLoading={isLoadingLocation}
        />

        <BusDetailsDriverInfo
          busData={busData}
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
            {busData.amenities.map((amenity: any, index: number) => {
              const Icon = amenity.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-indigo-50/50 px-3 py-2 rounded-xl border border-indigo-100/50"
                >
                  <Icon className="w-4 h-4 text-indigo-600" />
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
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4 z-50"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Select Seats</h3>
            <button
              onClick={() => setShowSeatModal(true)}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View All →
            </button>
          </div>
          <button
            onClick={() => setShowSeatModal(true)}
            className="w-full bg-slate-50/80 rounded-xl p-4 border border-slate-200/50 hover:bg-slate-100/80 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {seats.slice(0, 2).map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1">
                    {row.slice(0, 4).map((seat: any, colIndex: number) => (
                      <div
                        key={colIndex}
                        className="w-6 h-6 rounded"
                        style={{
                          backgroundColor: getSeatColor(seat),
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-indigo-600">
                  {busData.availableSeats} seats available
                </span>
                <ArrowRight className="w-5 h-5 text-indigo-600" />
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
            {busData.description}
          </p>
        </motion.div>
      </main>

      {/* Bottom Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 px-4 py-4 z-[1000]"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Price per seat</p>
            <p className="text-2xl font-extrabold text-indigo-600">
              Rs. {busData.price}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSeatModal(true)}
            className="bg-linear-to-r from-indigo-600 to-purple-600 text-white px-6 py-3.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
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
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center mb-20"
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
                  <h3 className="text-xl font-bold text-gray-900">
                    Select Seats
                  </h3>
                  <button
                    onClick={() => setShowSeatModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>

                {!isWebSocketConnected && (
                  <div className="flex items-center gap-2 mt-3 bg-amber-50 px-3 py-2 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-600 font-medium">
                      Connecting to real-time updates...
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5 overflow-y-auto max-h-[60vh]">
                {/* Legend */}
                <div className="flex flex-wrap gap-3 justify-center mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-blue-100 border border-blue-200" />
                    <span className="text-xs text-slate-600">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-indigo-600" />
                    <span className="text-xs text-slate-600">Your Seat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-amber-400" />
                    <span className="text-xs text-slate-600">
                      Being Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-red-100 border border-red-200" />
                    <span className="text-xs text-slate-600">Booked</span>
                  </div>
                </div>

                {/* Seats Layout */}
                <div className="relative">
                  <div className="flex justify-end mb-4"></div>

                  <div className="relative bg-slate-50/50 rounded-2xl p-4 border border-slate-200/50">
                    <div className="flex items-end justify-end mb-4 px-1">
                      {/* ✅ Right side: steering wheel + Driver */}
                      <div className="flex flex-col items-center px-18">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-indigo-300 flex items-center justify-center shadow-sm ">
                          {/* Steering wheel icon (SVG inline) */}
                          <svg
                            viewBox="0 0 24 24"
                            className="w-6 h-6 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="9" />
                            <circle cx="12" cy="12" r="3" />
                            <line x1="12" y1="15" x2="12" y2="21" />
                            <line x1="3.5" y1="9" x2="9.5" y2="10.5" />
                            <line x1="20.5" y1="9" x2="14.5" y2="10.5" />
                          </svg>
                        </div>
                        <span className="text-[9px] text-indigo-500 mt-1 font-medium">
                          Driver
                        </span>
                      </div>
                    </div>

                    {/* Seats */}
                    <div className="flex flex-col items-center gap-2.5">
                      {seats.map((row, rowIndex) => {
                        const totalSeats = row.length;
                        const gridSeats = [];
                        const cols = 6;

                        if (totalSeats === 4) {
                          for (let i = 0; i < cols; i++) {
                            if (i < 2) gridSeats.push(row[i]);
                            else if (i < 4) gridSeats.push(null);
                            else gridSeats.push(row[i - 2]);
                          }
                        } else if (totalSeats === 5) {
                          for (let i = 0; i < cols; i++) {
                            if (i < 3) gridSeats.push(row[i]);
                            else if (i === 3) gridSeats.push(null);
                            else gridSeats.push(row[i - 1]);
                          }
                        } else {
                          for (let i = 0; i < cols; i++) {
                            gridSeats.push(row[i]);
                          }
                        }

                        return (
                          <div
                            key={rowIndex}
                            className="flex items-center gap-0 w-full justify-center"
                          >
                            {gridSeats.map((seat, colIndex) => {
                              if (seat === null) {
                                return (
                                  <div
                                    key={`empty-${colIndex}`}
                                    className="w-11 h-11 shrink-0 mx-0.5"
                                  />
                                );
                              }

                              const hasExtra = parseFloat(seat.extra_price) > 0;
                              const isAisleSeat =
                                colIndex === 2 || colIndex === 3;

                              // ✅ Explicit flags
                              const isLockedByOther =
                                seat.selected_by != null && !seat.is_mine;
                              const isMineSeat =
                                seat.selected_by != null && seat.is_mine;
                              const isBooked =
                                !seat.available &&
                                !seat.selected_by &&
                                !seat.is_mine;

                              const SeatIcon = getSeatIcon(seat);

                              return (
                                <button
                                  key={`seat-${colIndex}`}
                                  onClick={() => toggleSeat(rowIndex, colIndex)}
                                  disabled={isBooked || isLockedByOther}
                                  title={
                                    isLockedByOther
                                      ? `Selected by ${
                                          seat.selected_by_name ||
                                          "another user"
                                        }`
                                      : undefined
                                  }
                                  className={cn(
                                    "relative w-11 h-11 rounded-xl border-2 transition-all flex flex-col items-center justify-center flex-shrink-0 mx-0.5",
                                    isBooked && "opacity-60 cursor-not-allowed",
                                    isLockedByOther &&
                                      "opacity-90 cursor-not-allowed ring-2 ring-amber-300",
                                    isMineSeat &&
                                      "scale-105 border-indigo-600 shadow-lg shadow-indigo-500/30",
                                    seat.seat_type === "SLEEPER" &&
                                      "w-12 h-12 rounded-2xl",
                                    seat.seat_type === "VIP" &&
                                      "border-amber-400",
                                    hasExtra &&
                                      "border-dashed border-2 border-green-400",
                                    seat.available &&
                                      !seat.selected &&
                                      !isLockedByOther &&
                                      "hover:scale-105 hover:shadow-md",
                                  )}
                                  style={{
                                    backgroundColor: getSeatColor(seat),
                                    borderColor: hasExtra
                                      ? "#4ade80"
                                      : getSeatBorderColor(seat),
                                  }}
                                >
                                  <SeatIcon
                                    className="w-5 h-5"
                                    style={{ color: getSeatTextColor(seat) }}
                                  />
                                  <span
                                    className="text-[8px] font-semibold absolute bottom-0.5 right-1 opacity-70"
                                    style={{ color: getSeatTextColor(seat) }}
                                  >
                                    {seat.seat_number}
                                  </span>
                                  {isMineSeat && (
                                    <Check className="w-3 h-3 text-white absolute -top-1 -right-1" />
                                  )}
                                  {isLockedByOther && (
                                    <Clock className="w-3 h-3 text-amber-700 absolute -top-1 -right-1" />
                                  )}
                                  {seat.is_window && (
                                    <Grid2x2 className="w-3 h-3 text-blue-400 absolute -top-1 -left-1" />
                                  )}
                                  {isAisleSeat && (
                                    <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[8px] text-slate-400 font-medium whitespace-nowrap">
                                      Aisle
                                    </div>
                                  )}
                                  {hasExtra &&
                                    !seat.is_mine &&
                                    !seat.selected_by &&
                                    !seat.selected && (
                                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-700 text-[8px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap">
                                        +Rs.{seat.extra_price}
                                      </div>
                                    )}
                                  {hasExtra &&
                                    (seat.is_mine || seat.selected) && (
                                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-indigo-100 text-indigo-700 text-[8px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap">
                                        +Rs.{seat.extra_price}
                                      </div>
                                    )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
                      <p className="text-sm text-indigo-600 font-medium">
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
                      "bg-linear-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25",
                      (selectedSeats.length === 0 || isBooking) &&
                        "opacity-50 cursor-not-allowed",
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

export default function BusDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BusDetailsPageComponent />
    </Suspense>
  );
}

// Wrapper
function BusDetailsPageComponent() {
  return <BusDetailsPageComp />;
}
