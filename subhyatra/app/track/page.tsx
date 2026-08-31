// @ts-nocheck
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bus,
  MapPin,
  Search,
  X,
  Navigation,
  Clock,
  ArrowRight,
  TrendingUp,
  Star,
  Users,
  Locate,
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Map,
  Route,
  ChevronRight,
  Gauge,
  Calendar,
  Award,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import dynamic from "next/dynamic";

// Dynamically import Leaflet map with no SSR
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => <MapLoading />,
});

const MapLoading = () => (
  <div className="flex items-center justify-center h-full bg-slate-50 rounded-2xl">
    <div className="text-center">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
      <p className="mt-2 text-sm text-slate-400 font-medium">Loading map...</p>
    </div>
  </div>
);

// Types
interface City {
  id: number;
  name: string;
  province: string;
  latitude: number;
  longitude: number;
}

interface Route {
  id: string;
  from: string;
  to: string;
  distance: string;
  duration: string;
  price: string;
  buses: number;
  stops: number;
  popularity: number;
}

interface Stop {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  routes: number;
  distance: string;
}

interface Bus {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  route: string;
  eta: string;
  status: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.101.18:8000";

// Demo data for fallback
const DEMO_CITIES: City[] = [
  { id: 1, name: "Kathmandu", province: "BAGMATI", latitude: 27.7172, longitude: 85.3240 },
  { id: 2, name: "Pokhara", province: "GANDAKI", latitude: 28.2096, longitude: 83.9856 },
  { id: 3, name: "Butwal", province: "LUMBINI", latitude: 27.7000, longitude: 83.4500 },
  { id: 4, name: "Chitwan", province: "BAGMATI", latitude: 27.6000, longitude: 84.5000 },
  { id: 5, name: "Rampur", province: "LUMBINI", latitude: 27.6500, longitude: 83.4000 },
];

const DEMO_ROUTES: Route[] = [
  {
    id: "1",
    from: "Kathmandu",
    to: "Pokhara",
    distance: "200 km",
    duration: "5h 30m",
    price: "Rs. 1500",
    buses: 18,
    stops: 6,
    popularity: 92,
  },
  {
    id: "2",
    from: "Butwal",
    to: "Kathmandu",
    distance: "325 km",
    duration: "6h 30m",
    price: "Rs. 1200",
    buses: 12,
    stops: 8,
    popularity: 95,
  },
  {
    id: "3",
    from: "Pokhara",
    to: "Kathmandu",
    distance: "200 km",
    duration: "5h 45m",
    price: "Rs. 1500",
    buses: 15,
    stops: 5,
    popularity: 90,
  },
];

function LocationPageComp() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState({
    latitude: 27.7172,
    longitude: 85.3240,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cities, setCities] = useState<City[]>(DEMO_CITIES);
  const [popularRoutes, setPopularRoutes] = useState<Route[]>(DEMO_ROUTES);
  const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);
  const [nearbyBuses, setNearbyBuses] = useState<Bus[]>([]);
  const [locationPermission, setLocationPermission] = useState(false);
  const [mapView, setMapView] = useState<"map" | "list">("map");
  const [mapKey, setMapKey] = useState(0);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");

      // Fetch cities
      const citiesResponse = await axios.get(`${API_URL}/api/v1/cities/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        timeout: 10000,
      });

      if (citiesResponse.data && citiesResponse.data.results) {
        const cityData = citiesResponse.data.results.map((city: any) => ({
          ...city,
          latitude: Number(city.latitude) || getDefaultLatitude(city.name),
          longitude: Number(city.longitude) || getDefaultLongitude(city.name),
        }));
        setCities(cityData);

        const stops = cityData.map((city: any) => ({
          id: `stop-${city.id}`,
          latitude: Number(city.latitude),
          longitude: Number(city.longitude),
          name: city.name,
          routes: Math.floor(Math.random() * 15) + 5,
          distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`,
        }));
        setNearbyStops(stops);
      }

      // Fetch popular routes
      try {
        const routesResponse = await axios.get(`${API_URL}/api/v1/routes/popular/`, {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          timeout: 10000,
        });

        if (routesResponse.data && routesResponse.data.results) {
          const routes = routesResponse.data.results.slice(0, 5).map((route: any) => ({
            id: route.id,
            from: route.source_city_name || route.from || "N/A",
            to: route.destination_city_name || route.to || "N/A",
            distance: route.distance || `${Math.floor(Math.random() * 300 + 50)} km`,
            duration: route.duration || `${Math.floor(Math.random() * 5 + 2)}h ${Math.floor(Math.random() * 30)}m`,
            price: `Rs. ${route.fare || Math.floor(Math.random() * 2000 + 500)}`,
            buses: Math.floor(Math.random() * 20 + 5),
            stops: Math.floor(Math.random() * 10 + 3),
            popularity: Math.floor(Math.random() * 30 + 60),
          }));
          setPopularRoutes(routes);
        }
      } catch (e) {
        console.log("Error fetching routes, using demo");
      }

      // Get location
      getCurrentLocation();

    } catch (error) {
      console.error("Error fetching data:", error);
      setCities(DEMO_CITIES);
      setNearbyStops(DEMO_CITIES.map((city) => ({
        id: `stop-${city.id}`,
        latitude: city.latitude,
        longitude: city.longitude,
        name: city.name,
        routes: Math.floor(Math.random() * 15) + 5,
        distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`,
      })));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getDefaultLatitude = (cityName: string) => {
    const defaults: { [key: string]: number } = {
      "Kathmandu": 27.7172,
      "Pokhara": 28.2096,
      "Butwal": 27.7000,
      "Chitwan": 27.6000,
      "Rampur": 27.6500,
    };
    return defaults[cityName] || 27.7172;
  };

  const getDefaultLongitude = (cityName: string) => {
    const defaults: { [key: string]: number } = {
      "Kathmandu": 85.3240,
      "Pokhara": 83.9856,
      "Butwal": 83.4500,
      "Chitwan": 84.5000,
      "Rampur": 83.4000,
    };
    return defaults[cityName] || 85.3240;
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setLocationPermission(true);
          generateNearbyBuses(latitude, longitude);
          setMapKey(prev => prev + 1);
        },
        (error) => {
          console.error("Error getting location:", error);
          generateNearbyBuses(userLocation.latitude, userLocation.longitude);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      generateNearbyBuses(userLocation.latitude, userLocation.longitude);
    }
  };

  const generateNearbyBuses = (lat: number, lng: number) => {
    const busNames = ["Sajha Bus", "Express Travels", "Lumbini Deluxe", "Sagarmatha Tours", "Gandaki Yatra", "Nepal Bus Service"];
    const routes = ["Kathmandu → Pokhara", "Butwal → Kathmandu", "Pokhara → Kathmandu", "Chitwan → Butwal", "Kathmandu → Butwal"];
    const statuses = ["On Time", "Delayed", "Early", "On Time"];

    const buses: Bus[] = [];
    for (let i = 0; i < 6; i++) {
      buses.push({
        id: `bus${i + 1}`,
        latitude: lat + (Math.random() - 0.5) * 0.01,
        longitude: lng + (Math.random() - 0.5) * 0.01,
        name: busNames[i % busNames.length],
        route: routes[i % routes.length],
        eta: `${Math.floor(Math.random() * 20 + 3)} min`,
        status: statuses[i % statuses.length],
      });
    }
    setNearbyBuses(buses);
    setMapKey(prev => prev + 1);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const getPopularityColor = (score: number) => {
    if (score >= 90) return "#22c55e";
    if (score >= 80) return "#f59e0b";
    return "#ef4444";
  };

  const getPopularityLabel = (score: number) => {
    if (score >= 90) return "🔥 Very Popular";
    if (score >= 80) return "⭐ Popular";
    return "📈 Growing";
  };

  const getPopularityIcon = (score: number) => {
    if (score >= 90) return Flame;
    if (score >= 80) return Star;
    return TrendingUp;
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
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
          </div>
          <p className="mt-6 text-indigo-600 font-medium">Finding your location...</p>
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
              <h1 className="text-2xl font-extrabold text-gray-900">Find Your Route</h1>
              <p className="text-sm text-slate-400 font-medium">Discover popular bus routes</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => getCurrentLocation()}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <Locate className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <main className="max-w-6xl mx-auto px-4 py-4 pb-12">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200/50 shadow-sm">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search routes or locations..."
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

        {/* View Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMapView("map")}
            className={cn(
              "flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all",
              mapView === "map"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                : "bg-white/50 text-slate-500 hover:bg-white/80 border border-slate-200/50"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Map className="w-4 h-4" />
              Map View
            </div>
          </button>
          <button
            onClick={() => setMapView("list")}
            className={cn(
              "flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all",
              mapView === "list"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                : "bg-white/50 text-slate-500 hover:bg-white/80 border border-slate-200/50"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Route className="w-4 h-4" />
              List View
            </div>
          </button>
        </div>

        {/* Map Container */}
        {mapView === "map" && (
          <motion.div
            key={mapKey}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/10 mb-6 h-[320px] md:h-[400px]"
          >
            <LeafletMap
              userLocation={userLocation}
              nearbyStops={nearbyStops}
              nearbyBuses={nearbyBuses}
            />
            {/* Map Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 pointer-events-auto">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-medium text-gray-700">
                  {nearbyStops.length} stops nearby
                </span>
              </div>
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 pointer-events-auto">
                <Bus className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold text-white">
                  {nearbyBuses.length} buses active
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Popular Routes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Popular Routes</h3>
              <p className="text-sm text-slate-400">Most booked routes</p>
            </div>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              View All →
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {popularRoutes.map((route) => {
              const PopularityIcon = getPopularityIcon(route.popularity);
              return (
                <motion.button
                  key={route.id}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedRoute(route.id)}
                  className={cn(
                    "min-w-[220px] bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-md border transition-all flex-shrink-0 text-left relative",
                    selectedRoute === route.id
                      ? "border-indigo-500 shadow-lg shadow-indigo-500/10"
                      : "border-slate-100/50 hover:border-indigo-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      route.popularity >= 90 ? "bg-emerald-100 text-emerald-700" :
                      route.popularity >= 80 ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {getPopularityLabel(route.popularity)}
                    </span>
                    <PopularityIcon className={cn(
                      "w-4 h-4",
                      route.popularity >= 90 ? "text-emerald-500" :
                      route.popularity >= 80 ? "text-amber-500" :
                      "text-blue-500"
                    )} />
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-gray-900">{route.from}</span>
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-gray-900">{route.to}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{route.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5" />
                      <span>{route.buses} buses</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-indigo-600">{route.price}</span>
                    <span className="text-xs text-slate-400">{route.distance}</span>
                  </div>

                  {selectedRoute === route.id && (
                    <CheckCircle className="w-5 h-5 text-indigo-600 absolute top-3 right-3" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Nearby Stops */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Nearby Stops</h3>
              <p className="text-sm text-slate-400">Closest bus stops</p>
            </div>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              See All →
            </button>
          </div>

          <div className="space-y-3">
            {nearbyStops.slice(0, 4).map((stop) => (
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.01 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
                  <Bus className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{stop.name}</p>
                  <p className="text-sm text-slate-400">{stop.routes} routes available</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">{stop.distance}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5"
        >
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-2">
                <Bus className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{nearbyBuses.length}+</p>
              <p className="text-xs text-slate-400 font-medium">Active Buses</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{nearbyStops.length}</p>
              <p className="text-xs text-slate-400 font-medium">Stops</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{popularRoutes.reduce((acc, r) => acc + r.buses, 0)}+</p>
              <p className="text-xs text-slate-400 font-medium">Total Buses</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function LocationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LocationPageComp />
    </Suspense>
  );
}