// @ts-nocheck
"use client";

import React, { useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import {
  Bus,
  Flag,
  Locate,
  Map as MapIcon,
  Navigation,
  Clock,
  Wifi,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------
// Leaflet default marker fix
// ---------------------------------------------------------

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ---------------------------------------------------------
// Loading component
// ---------------------------------------------------------

const MapLoading = () => {
  return (
    <div className="flex items-center justify-center h-full bg-slate-50 rounded-xl">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />

        <p className="mt-2 text-sm text-slate-400 font-medium">
          Loading map...
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// Custom Bus Icon
// ---------------------------------------------------------

const createBusIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        position: relative;
      ">

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4 6c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/>
          <path d="M4 10h16"/>
          <path d="M8 16h.01"/>
          <path d="M16 16h.01"/>
        </svg>

        <div style="
          position: absolute;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(79, 70, 229, 0.15);
          border: 2px solid rgba(79, 70, 229, 0.2);
          animation: busPulse 2s ease-in-out infinite;
          pointer-events: none;
        "></div>

      </div>

      <style>
        @keyframes busPulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }

          50% {
            transform: scale(1.2);
            opacity: 0.5;
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      </style>
    `,

    className: "bus-marker",

    iconSize: [48, 48],

    iconAnchor: [24, 24],

    popupAnchor: [0, -24],
  });
};

// ---------------------------------------------------------
// Custom Destination Icon
// ---------------------------------------------------------

const createDestinationIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      ">

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>

      </div>
    `,

    className: "destination-marker",

    iconSize: [36, 36],

    iconAnchor: [18, 18],

    popupAnchor: [0, -18],
  });
};

// ---------------------------------------------------------
// Props
// ---------------------------------------------------------

interface BusDetailsMapProps {
  busData: any;

  currentLocation: {
    latitude: number;
    longitude: number;
  };

  destinationLocation: {
    latitude: number;
    longitude: number;
  };

  isLiveTracking?: boolean;

  isLoading?: boolean;

  className?: string;
}

// ---------------------------------------------------------
// Component
// ---------------------------------------------------------

const BusDetailsMap = ({
  busData,

  currentLocation,

  destinationLocation,

  isLiveTracking = false,

  isLoading = false,

  className,
}: BusDetailsMapProps) => {
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef<L.Map | null>(null);

  // -------------------------------------------------------
  // Validate coordinates
  // -------------------------------------------------------

  const hasCurrentLocation =
    Number.isFinite(currentLocation?.latitude) &&
    Number.isFinite(currentLocation?.longitude);

  const hasDestinationLocation =
    Number.isFinite(destinationLocation?.latitude) &&
    Number.isFinite(destinationLocation?.longitude);

  // -------------------------------------------------------
  // Get center
  // -------------------------------------------------------

  const getCenter = () => {
    if (hasCurrentLocation) {
      return {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      };
    }

    if (hasDestinationLocation) {
      return {
        lat: destinationLocation.latitude,
        lng: destinationLocation.longitude,
      };
    }

    return {
      lat: 27.7172,
      lng: 85.324,
    };
  };

  // -------------------------------------------------------
  // Get zoom
  // -------------------------------------------------------

  const getZoom = () => {
    if (!hasCurrentLocation || !hasDestinationLocation) {
      return 12;
    }

    const latDiff = Math.abs(
      currentLocation.latitude - destinationLocation.latitude
    );

    const lngDiff = Math.abs(
      currentLocation.longitude - destinationLocation.longitude
    );

    const maxDiff = Math.max(latDiff, lngDiff);

    if (maxDiff > 1) return 7;

    if (maxDiff > 0.5) return 8;

    if (maxDiff > 0.1) return 9;

    if (maxDiff > 0.05) return 10;

    if (maxDiff > 0.01) return 12;

    return 14;
  };

  // -------------------------------------------------------
  // Route coordinates
  // -------------------------------------------------------

  const getRouteCoordinates = (): [number, number][] => {
    if (!hasCurrentLocation || !hasDestinationLocation) {
      return [];
    }

    return [
      [
        currentLocation.latitude,
        currentLocation.longitude,
      ],

      [
        destinationLocation.latitude,
        destinationLocation.longitude,
      ],
    ];
  };

  // -------------------------------------------------------
  // Center on current bus
  // -------------------------------------------------------

  const animateToCurrent = () => {
    if (!mapRef.current || !hasCurrentLocation) {
      return;
    }

    mapRef.current.flyTo(
      [
        currentLocation.latitude,
        currentLocation.longitude,
      ],

      15,

      {
        duration: 1,
      }
    );
  };

  // -------------------------------------------------------
  // Show complete route
  // -------------------------------------------------------

  const animateToRoute = () => {
    if (!mapRef.current) {
      return;
    }

    if (!hasCurrentLocation || !hasDestinationLocation) {
      return;
    }

    const bounds = L.latLngBounds([
      [
        currentLocation.latitude,
        currentLocation.longitude,
      ],

      [
        destinationLocation.latitude,
        destinationLocation.longitude,
      ],
    ]);

    mapRef.current.flyToBounds(bounds, {
      padding: [50, 50],
      duration: 1,
    });
  };

  // -------------------------------------------------------
  // Data
  // -------------------------------------------------------

  const center = getCenter();

  const zoom = getZoom();

  const routeCoords = getRouteCoordinates();

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  return (
    <div className={cn("mb-4", className)}>

      {/* Header */}

      <div className="flex items-center justify-between mb-2.5">

        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">

          <Navigation className="w-5 h-5 text-indigo-600" />

          Live Location

        </h3>

        <div className="flex items-center gap-3">

          {isLoading && (
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          )}

          {isLiveTracking && (
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">

              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

              <span className="text-xs font-bold text-emerald-600">
                LIVE
              </span>

            </div>
          )}

        </div>

      </div>

      {/* Map */}

      <div className="relative rounded-xl overflow-hidden border border-slate-200/50 shadow-sm h-[280px] md:h-[320px]">

        {hasCurrentLocation ? (
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={zoom}
            className="w-full h-full"
            scrollWheelZoom={true}
            ref={mapRef}
            whenReady={() => {
              setMapReady(true);
            }}
          >

            {/* OpenStreetMap */}

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Route */}

            {routeCoords.length > 0 && (
              <Polyline
                positions={routeCoords}
                pathOptions={{
                  color: "#4f46e5",
                  weight: 3,
                  dashArray: "5, 5",
                  opacity: 0.8,
                }}
              />
            )}

            {/* Bus Marker */}

            <Marker
              position={[
                currentLocation.latitude,
                currentLocation.longitude,
              ]}
              icon={createBusIcon()}
            >

              <Popup>

                <div className="p-1 min-w-[150px]">

                  <p className="font-bold text-gray-900">
                    {busData?.name || "Bus"}
                  </p>

                  <p className="text-sm text-slate-500">
                    {busData?.busNumber || ""}
                  </p>

                  <p className="text-sm text-indigo-600 font-medium">
                    {busData?.from || ""} → {busData?.to || ""}
                  </p>

                </div>

              </Popup>

            </Marker>

            {/* Destination Marker */}

            {hasDestinationLocation && (
              <Marker
                position={[
                  destinationLocation.latitude,
                  destinationLocation.longitude,
                ]}
                icon={createDestinationIcon()}
              >

                <Popup>

                  <div className="p-1">

                    <p className="font-bold text-gray-900">
                      Destination
                    </p>

                    <p className="text-sm text-slate-500">
                      {busData?.to || "Destination"}
                    </p>

                  </div>

                </Popup>

              </Marker>
            )}

          </MapContainer>
        ) : (
          <MapLoading />
        )}

        {/* Map Controls */}

        <div className="absolute right-3 bottom-3 flex flex-col gap-2 ">

          <button
            onClick={animateToCurrent}
            disabled={!hasCurrentLocation}
            className="w-10 h-10 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Center on bus"
          >

            <Locate className="w-5 h-5" />

          </button>

          <button
            onClick={animateToRoute}
            disabled={!hasDestinationLocation}
            className="w-10 h-10 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Show full route"
          >

            <MapIcon className="w-5 h-5" />

          </button>

        </div>

        {/* Location Info */}

        {hasCurrentLocation && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-slate-100/50 z-[1000]">

            <div className="flex items-center gap-3">

              <div className="flex items-center gap-1.5">

                <Navigation className="w-3.5 h-3.5 text-indigo-600" />

                <span className="text-xs font-medium text-slate-500">
                  Bus Location
                </span>

              </div>

              <span className="text-xs font-semibold text-gray-700">
                {currentLocation.latitude.toFixed(4)},{" "}
                {currentLocation.longitude.toFixed(4)}
              </span>

            </div>

            <div className="flex items-center gap-1.5 mt-0.5">

              {isLiveTracking ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />

                  <span className="text-xs font-semibold text-emerald-600">
                    Live Tracking
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-500" />

                  <span className="text-xs font-semibold text-amber-600">
                    Estimated Location
                  </span>
                </>
              )}

            </div>

          </div>
        )}

        {/* Map Legend */}

        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-slate-100/50 z-[1000]">

          <div className="flex flex-col gap-1 text-xs">

            <div className="flex items-center gap-2">

              <div className="w-3 h-3 rounded-full bg-linear-to-r from-indigo-600 to-purple-600" />

              <span className="text-slate-600 font-medium">
                Bus
              </span>

            </div>

            <div className="flex items-center gap-2">

              <div className="w-3 h-3 rounded-full bg-linear-to-r from-red-600 to-red-500" />

              <span className="text-slate-600 font-medium">
                Destination
              </span>

            </div>

            <div className="flex items-center gap-2">

              <div className="w-3 h-0.5 bg-indigo-600 border-t-2 border-dashed border-indigo-600" />

              <span className="text-slate-600 font-medium">
                Route
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* Connection Status */}

      {!isLiveTracking && !isLoading && (
        <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">

          <AlertCircle className="w-4 h-4 text-amber-500" />

          <span className="text-sm text-amber-600 font-medium">
            Real-time tracking unavailable. Showing estimated location.
          </span>

        </div>
      )}

      {isLiveTracking && (
        <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">

          <Wifi className="w-4 h-4 text-emerald-500" />

          <span className="text-sm text-emerald-600 font-medium">
            Live tracking active • Bus location updates in real-time
          </span>

        </div>
      )}

    </div>
  );
};

export default BusDetailsMap;