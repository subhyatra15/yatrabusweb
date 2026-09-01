// components/HiaceDetailsMap.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Navigation,
  Clock,
  Wifi,
  AlertCircle,
  CheckCircle,
  Loader2,
  MapPin,
  Locate,
  Map as MapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamically import map components
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

import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapLoading = () => (
  <div className="flex items-center justify-center h-full bg-slate-50 rounded-xl">
    <div className="text-center">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
      <p className="mt-2 text-sm text-slate-400 font-medium">Loading map...</p>
    </div>
  </div>
);

interface HiaceDetailsMapProps {
  hiaceData: any;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  destinationLocation: {
    latitude: number;
    longitude: number;
  };
  className?: string;
}

const HiaceDetailsMap: React.FC<HiaceDetailsMapProps> = ({
  hiaceData,
  currentLocation,
  destinationLocation,
  className,
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getCenter = () => {
    if (currentLocation.latitude && currentLocation.longitude) {
      return { lat: currentLocation.latitude, lng: currentLocation.longitude };
    }
    const lat = (currentLocation.latitude + destinationLocation.latitude) / 2;
    const lng = (currentLocation.longitude + destinationLocation.longitude) / 2;
    return { lat, lng };
  };

  const getZoom = () => {
    const latDiff = Math.abs(currentLocation.latitude - destinationLocation.latitude);
    const lngDiff = Math.abs(currentLocation.longitude - destinationLocation.longitude);
    const maxDiff = Math.max(latDiff, lngDiff);
    if (maxDiff > 1) return 7;
    if (maxDiff > 0.5) return 8;
    if (maxDiff > 0.1) return 9;
    if (maxDiff > 0.05) return 10;
    if (maxDiff > 0.01) return 12;
    return 14;
  };

  const getRouteCoordinates = () => {
    if (!currentLocation.latitude || !currentLocation.longitude) return [];
    if (!destinationLocation.latitude || !destinationLocation.longitude) return [];
    return [
      [currentLocation.latitude, currentLocation.longitude],
      [destinationLocation.latitude, destinationLocation.longitude],
    ] as [number, number][];
  };

  const animateToCurrent = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([currentLocation.latitude, currentLocation.longitude], 15, { duration: 1 });
    }
  };

  const animateToRoute = () => {
    if (mapRef.current) {
      const center = getCenter();
      mapRef.current.flyTo([center.lat, center.lng], getZoom(), { duration: 1 });
    }
  };

  if (!isClient) return <MapLoading />;

  const center = getCenter();
  const zoom = getZoom();
  const routeCoords = getRouteCoordinates();

  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-600" />
          Live Location
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600">LIVE</span>
          </div>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-slate-200/50 shadow-sm h-[280px] md:h-[320px]">
        {currentLocation.latitude && currentLocation.longitude && (
          <MapContainer
            key={`map-${currentLocation.latitude}-${currentLocation.longitude}`}
            center={[center.lat, center.lng]}
            zoom={zoom}
            className="w-full h-full"
            scrollWheelZoom={true}
            ref={mapRef}
            whenReady={() => setMapReady(true)}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {routeCoords.length > 0 && (
              <Polyline
                positions={routeCoords}
                pathOptions={{
                  color: "#059669",
                  weight: 3,
                  dashArray: "5, 5",
                  opacity: 0.8,
                }}
              />
            )}

            {currentLocation.latitude && currentLocation.longitude && (
              <Marker position={[currentLocation.latitude, currentLocation.longitude]}>
                <Popup>
                  <div className="p-1 min-w-[150px]">
                    <p className="font-bold text-gray-900">{hiaceData?.name || "Hiace"}</p>
                    <p className="text-sm text-slate-500">{hiaceData?.hiaceNumber || ""}</p>
                    <p className="text-sm text-emerald-600 font-medium">
                      {hiaceData?.from || ""} → {hiaceData?.to || ""}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {destinationLocation.latitude && destinationLocation.longitude && (
              <Marker position={[destinationLocation.latitude, destinationLocation.longitude]}>
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-gray-900">Destination</p>
                    <p className="text-sm text-slate-500">{hiaceData?.to || "Destination"}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        )}

        <div className="absolute right-3 bottom-3 flex flex-col gap-2 z-10">
          <button
            onClick={animateToCurrent}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105"
          >
            <Locate className="w-5 h-5" />
          </button>
          <button
            onClick={animateToRoute}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105"
          >
            <MapIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-slate-100/50 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-slate-500">Hiace Location</span>
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600">Live Tracking</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-slate-100/50 z-10">
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500" />
              <span className="text-slate-600 font-medium">Hiace</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-600 to-red-500" />
              <span className="text-slate-600 font-medium">Destination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-emerald-600 border-t-2 border-dashed border-emerald-600" />
              <span className="text-slate-600 font-medium">Route</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
        <Wifi className="w-4 h-4 text-emerald-500" />
        <span className="text-sm text-emerald-600 font-medium">
          Live tracking active • Hiace location updates in real-time
        </span>
      </div>
    </div>
  );
};

export default HiaceDetailsMap;