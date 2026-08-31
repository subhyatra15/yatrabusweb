
// @ts-nocheck
// components/LeafletMap.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LeafletMapProps {
  userLocation: {
    latitude: number;
    longitude: number;
  };
  nearbyStops: any[];
  nearbyBuses: any[];
}

const LeafletMap = ({ userLocation, nearbyStops, nearbyBuses }: LeafletMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Create map instance
    map.current = L.map(mapContainer.current, {
      center: [userLocation.latitude, userLocation.longitude],
      zoom: 13,
      zoomControl: true,
    });

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Create layer group for markers
    markersRef.current = L.layerGroup().addTo(map.current);

    setMapLoaded(true);

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !markersRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Skip if no valid location
    if (!userLocation.latitude || !userLocation.longitude) return;

    try {
      // Create custom icons
      const userIcon = L.divIcon({
        html: `
          <div style="
            width: 16px;
            height: 16px;
            background: #4f46e5;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 0 12px rgba(79, 70, 229, 0.15);
            animation: pulse 2s infinite;
          "></div>
          <style>
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
              70% { box-shadow: 0 0 0 20px rgba(79, 70, 229, 0); }
              100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
            }
          </style>
        `,
        className: "user-marker",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const stopIcon = L.divIcon({
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
            font-size: 14px;
            color: white;
          ">
            🚌
          </div>
        `,
        className: "stop-marker",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const busIcon = L.divIcon({
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #2563eb, #4f46e5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
            font-size: 16px;
            color: white;
            animation: busPulse 2s infinite;
          ">
            🚍
          </div>
          <style>
            @keyframes busPulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
          </style>
        `,
        className: "bus-marker",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Add user location marker
      if (userLocation.latitude && userLocation.longitude) {
        const userMarker = L.marker(
          [userLocation.latitude, userLocation.longitude],
          { icon: userIcon }
        );
        userMarker.bindPopup("You are here");
        markersRef.current.addLayer(userMarker);
      }

      // Add stop markers
      nearbyStops.forEach((stop) => {
        if (stop.latitude && stop.longitude) {
          const stopMarker = L.marker(
            [stop.latitude, stop.longitude],
            { icon: stopIcon }
          );
          stopMarker.bindPopup(`
            <div style="padding: 8px;">
              <strong>${stop.name}</strong><br/>
              ${stop.routes} routes available
            </div>
          `);
          markersRef.current.addLayer(stopMarker);
        }
      });

      // Add bus markers
      nearbyBuses.forEach((bus) => {
        if (bus.latitude && bus.longitude) {
          const busMarker = L.marker(
            [bus.latitude, bus.longitude],
            { icon: busIcon }
          );
          busMarker.bindPopup(`
            <div style="padding: 8px;">
              <strong>${bus.name}</strong><br/>
              ${bus.route}<br/>
              <span style="color: #4f46e5;">ETA: ${bus.eta}</span>
            </div>
          `);
          markersRef.current.addLayer(busMarker);
        }
      });

      // Fit bounds to show all markers
      const allPoints: [number, number][] = [];
      
      if (userLocation.latitude && userLocation.longitude) {
        allPoints.push([userLocation.latitude, userLocation.longitude]);
      }
      
      nearbyStops.forEach(stop => {
        if (stop.latitude && stop.longitude) {
          allPoints.push([stop.latitude, stop.longitude]);
        }
      });
      
      nearbyBuses.forEach(bus => {
        if (bus.latitude && bus.longitude) {
          allPoints.push([bus.latitude, bus.longitude]);
        }
      });

      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 14,
        });
      }
    } catch (error) {
      console.error("Error updating map markers:", error);
    }
  }, [userLocation, nearbyStops, nearbyBuses, mapLoaded]);

  // Handle window resize
  useEffect(() => {
    if (!map.current) return;

    const handleResize = () => {
      map.current?.invalidateSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full"
      style={{ minHeight: "320px", width: "100%" }}
    />
  );
};

export default LeafletMap;