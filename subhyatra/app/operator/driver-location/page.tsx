// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  Bus,
  ChevronDown,
  Wifi,
  WifiOff,
  Play,
  OctagonX,
  MapPin,
  Navigation,
  Clock,
  Gauge,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  TrendingUp,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet map components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <MapLoading /> }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);



// Fix for default icons
const getLeaflet = async () => {
  const L = await import("leaflet");

  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });

  return L;
};

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://192.168.101.18:8000";

// Types
interface Bus {
  id: number;
  bus_name: string;
  bus_number: string;
  bus_type: string;
  total_seats: number;
  status: string;
  operator: number;
  operator_name?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: string;
}

const MapLoading = () => (
  <div className="flex items-center justify-center h-full bg-slate-50 rounded-xl">
    <div className="text-center">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
      <p className="mt-2 text-sm text-slate-400 font-medium">Loading map...</p>
    </div>
  </div>
);

export default function DriverLocationPage() {
  const router = useRouter();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBusModal, setShowBusModal] = useState(false);

  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  const [lastSentLocation, setLastSentLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [updateInterval, setUpdateInterval] = useState(5000);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [locationPermission, setLocationPermission] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 27.7172, lng: 85.324 });

  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Create custom bus icon
  const createBusIcon = async () => {
  const L = await getLeaflet();

  return L.divIcon({
    html: `
      <div style="
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        font-size: 20px;
        color: white;
      ">
        🚌
      </div>
    `,
    className: "bus-marker",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

  // Fetch buses
  const fetchBuses = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("Please login again");
        return;
      }

      const response = await axios.get(`${API_URL}/api/v1/buses/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      });

      if (response.data && response.data.results) {
        setBuses(response.data.results);
        if (response.data.results.length > 0) {
          setSelectedBus(response.data.results[0]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching buses:", error);
      if (error.response?.status === 401) {
        alert("Session Expired. Please login again.");
        router.push("/login");
      } else {
        alert("Failed to fetch buses. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  // Request location permission
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          setLocationPermission(true);
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setErrorMsg(null);
        },
        (error) => {
          console.error("Location error:", error);
          setErrorMsg("Permission to access location was denied");
          setLocationPermission(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setErrorMsg("Geolocation is not supported by your browser");
    }
  }, []);

  // Fetch buses on mount
  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  // Connect WebSocket when bus is selected and tracking
  useEffect(() => {
    if (selectedBus && isTracking) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedBus, isTracking]);

  // Connect WebSocket
  const connectWebSocket = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setConnectionStatus("No token");
        return;
      }

      if (!selectedBus) {
        setConnectionStatus("No bus selected");
        return;
      }

      const wsUrl = `${WS_URL}/ws/buses/${selectedBus.id}/location/?token=${token}`;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return;
      }

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("Location WebSocket connected");
        setIsWebSocketConnected(true);
        setConnectionStatus("Connected");
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message:", data);
        } catch (error) {
          console.error("WebSocket parse error:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("Location WebSocket disconnected");
        setIsWebSocketConnected(false);
        setConnectionStatus("Disconnected");
        setTimeout(() => {
          if (isTracking && selectedBus) {
            connectWebSocket();
          }
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error("Location WebSocket error:", error);
        setConnectionStatus("Error");
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setConnectionStatus("Error");
    }
  };

  // Send location via WebSocket
  const sendLocationViaWebSocket = (locationData: LocationData) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "location_update",
          ...locationData,
        })
      );
      return true;
    }
    return false;
  };

  // Send location via REST API
  const sendLocationViaAPI = async (locationData: LocationData) => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!selectedBus) {
        throw new Error("No bus selected");
      }

      const response = await axios.post(
        `${API_URL}/api/v1/buses/${selectedBus.id}/location/`,
        locationData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error sending location:", error);
      throw error;
    }
  };

  // Start tracking
  const startTracking = async () => {
    if (!selectedBus) {
      alert("Please select a bus first");
      return;
    }

    if (!locationPermission) {
      alert("Location permission not granted");
      return;
    }

    setIsTracking(true);
    setConnectionStatus("Connecting...");

    await connectWebSocket();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start watching position
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          setLocation(position);

          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || 0,
            accuracy: position.coords.accuracy || 0,
            timestamp: new Date().toISOString(),
          };

          try {
            let sent = sendLocationViaWebSocket(locationData);

            if (!sent) {
              await sendLocationViaAPI(locationData);
            }

            setLastSentLocation(locationData);

            setLocationHistory((prev) => {
              const newHistory = [...prev, locationData];
              if (newHistory.length > 50) {
                return newHistory.slice(-50);
              }
              return newHistory;
            });

            setMapCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });

            setConnectionStatus(isWebSocketConnected ? "Live (WS)" : "Live (API)");
          } catch (error) {
            console.error("Error sending location:", error);
            setConnectionStatus("Error sending");
          }
        },
        (error) => {
          console.error("Watch position error:", error);
          setConnectionStatus("Location error");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }

    alert(`Tracking started for ${selectedBus.bus_name}`);
  };

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    setConnectionStatus("Disconnected");

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    alert("Tracking stopped");
  };

  // Toggle tracking
  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  // Change interval
  const changeInterval = (newInterval: number) => {
    setUpdateInterval(newInterval);
    if (isTracking) {
      stopTracking();
      setTimeout(() => startTracking(), 1000);
    }
  };

  // Format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Select bus
  const selectBus = (bus: Bus) => {
    setSelectedBus(bus);
    setShowBusModal(false);
    if (isTracking) {
      stopTracking();
      setTimeout(() => startTracking(), 1000);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
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
              <Navigation className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Loading buses...</p>
        </motion.div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mt-4">Location Error</h3>
        <p className="text-sm text-slate-400 text-center mt-2 max-w-sm">{errorMsg}</p>
        <button
          onClick={() => {
            setErrorMsg(null);
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setLocation(position);
                  setLocationPermission(true);
                  setMapCenter({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  });
                  setErrorMsg(null);
                },
                (error) => {
                  setErrorMsg("Permission to access location was denied");
                },
                { enableHighAccuracy: true, timeout: 10000 }
              );
            }
          }}
          className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const busIcon = createBusIcon();

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
              <h1 className="text-lg font-bold text-gray-900">Live Location</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setRefreshing(true);
                fetchBuses();
              }}
              className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 transition-colors"
            >
              <RefreshCw className={cn(
                "w-5 h-5 text-indigo-600",
                refreshing && "animate-spin"
              )} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-24">
        {/* Bus Selection */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowBusModal(true)}
          className="w-full flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-400 font-medium">Selected Bus</p>
              <p className="font-semibold text-gray-900">
                {selectedBus ? selectedBus.bus_name : "Select a bus"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              {selectedBus ? selectedBus.bus_number : ""}
            </span>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </div>
        </motion.button>

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-xl shadow-md border border-slate-100/50 p-3 mb-3 flex-wrap"
        >
          <div className="flex items-center gap-2">
            {isWebSocketConnected ? (
              <Wifi className="w-5 h-5 text-emerald-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-slate-400" />
            )}
            <span className="text-sm font-medium text-slate-600">
              WebSocket: {connectionStatus}
            </span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-slate-400 font-medium">Interval:</span>
            {[2000, 5000, 10000].map((interval) => (
              <button
                key={interval}
                onClick={() => changeInterval(interval)}
                className={cn(
                  "px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all",
                  updateInterval === interval
                    ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                )}
              >
                {interval / 1000}s
              </button>
            ))}
          </div>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/10 mb-3 h-[300px] md:h-[400px] bg-slate-100"
        >
          {location && (
            <MapContainer
              key={`map-${mapCenter.lat}-${mapCenter.lng}`}
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={15}
              className="w-full h-full"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {locationHistory.length > 1 && (
                <Polyline
                  positions={locationHistory.map((loc) => [
                    loc.latitude,
                    loc.longitude,
                  ])}
                  pathOptions={{
                    color: "#4f46e5",
                    weight: 3,
                    opacity: 0.8,
                  }}
                />
              )}

              {location && (
                <Marker
                  position={[location.coords.latitude, location.coords.longitude]}
                  icon={busIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[150px]">
                      <p className="font-bold text-gray-900">
                        {selectedBus?.bus_name || "Bus"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selectedBus?.bus_number || ""}
                      </p>
                      <p className="text-sm text-indigo-600 font-medium">
                        Speed: {location.coords.speed ? `${(location.coords.speed * 3.6).toFixed(1)} km/h` : "0 km/h"}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          )}

          {/* Map Overlay Info */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-medium text-gray-700">
                {location?.coords.latitude.toFixed(6)}, {location?.coords.longitude.toFixed(6)}
              </span>
            </div>
            {isTracking && (
              <div className="bg-emerald-500/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-semibold text-white">LIVE</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Location Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 overflow-hidden mb-3"
        >
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            <div className="p-3 text-center">
              <p className="text-xs text-slate-400 font-medium">Latitude</p>
              <p className="text-sm font-semibold text-gray-900">
                {location?.coords.latitude.toFixed(6) || "N/A"}
              </p>
            </div>
            <div className="p-3 text-center">
              <p className="text-xs text-slate-400 font-medium">Longitude</p>
              <p className="text-sm font-semibold text-gray-900">
                {location?.coords.longitude.toFixed(6) || "N/A"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-200 border-t border-slate-200">
            <div className="p-3 text-center">
              <p className="text-xs text-slate-400 font-medium">Speed</p>
              <p className="text-sm font-semibold text-gray-900">
                {location?.coords.speed ? `${(location.coords.speed * 3.6).toFixed(1)} km/h` : "0 km/h"}
              </p>
            </div>
            <div className="p-3 text-center">
              <p className="text-xs text-slate-400 font-medium">Accuracy</p>
              <p className="text-sm font-semibold text-gray-900">
                {location?.coords.accuracy ? `${location.coords.accuracy.toFixed(0)}m` : "N/A"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Last Sent */}
        {lastSentLocation && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-slate-400">
              Last sent: {formatTime(lastSentLocation.timestamp)}
            </span>
          </div>
        )}

        {/* Control Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleTracking}
          disabled={!selectedBus}
          className={cn(
            "w-full rounded-2xl py-4 font-bold text-white text-lg flex items-center justify-center gap-3 shadow-lg transition-all",
            !selectedBus
              ? "bg-slate-300 cursor-not-allowed"
              : isTracking
                ? "bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/25 hover:shadow-red-500/40"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/25 hover:shadow-indigo-500/40"
          )}
        >
          {isTracking ? (
            <>
              <OctagonX  className="w-6 h-6" />
              Stop Tracking
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              {!selectedBus ? "Select a Bus" : "Start Tracking"}
            </>
          )}
        </motion.button>
      </main>

      {/* Bus Selection Modal */}
      <AnimatePresence>
        {showBusModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowBusModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Select Bus</h3>
                  <button
                    onClick={() => setShowBusModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto max-h-[60vh]">
                {buses.length > 0 ? (
                  <div className="space-y-1">
                    {buses.map((bus) => (
                      <button
                        key={bus.id}
                        onClick={() => selectBus(bus)}
                        className={cn(
                          "w-full flex items-center justify-between py-3.5 px-3 rounded-xl transition-all",
                          selectedBus?.id === bus.id && "bg-indigo-50/50 border border-indigo-100/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
                            <Bus className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900">{bus.bus_name}</p>
                            <p className="text-xs text-slate-400">{bus.bus_number}</p>
                          </div>
                        </div>
                        {selectedBus?.id === bus.id && (
                          <CheckCircle className="w-5 h-5 text-indigo-600" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                      <Bus className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-400 mt-4">No buses assigned</p>
                    <p className="text-xs text-slate-400">You don't have any buses assigned to you.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}