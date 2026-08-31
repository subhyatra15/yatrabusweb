// @ts-nocheck
"use client";

import React from "react";
import {
  Bus,
  Star,
  Users,
  Clock,
  LogIn,
  LogOut,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BusDetailsCardProps {
  busData: {
    name: string;
    type: string;
    busNumber: string;
    rating: number;
    departure: string;
    arrival: string;
    duration: string;
    availableSeats: number;
    totalSeats?: number;
    amenities?: any[];
    from?: string;
    to?: string;
  };
  boardingCity: string;
  droppingCity: string;
  className?: string;
}

const formatDate = (datetime: string) => {
  if (!datetime) return "N/A";
  try {
    const date = new Date(datetime);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const BusDetailsCard: React.FC<BusDetailsCardProps> = ({
  busData,
  boardingCity,
  droppingCity,
  className,
}) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Validate busData
  if (!busData) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 shadow-xl shadow-indigo-500/20",
        "bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-600",
        className
      )}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
          <Bus className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {busData.name || "Bus"}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-semibold text-white/90 bg-white/20 px-2.5 py-0.5 rounded-full">
              {busData.type || "Standard"}
            </span>
            <span className="text-xs text-white/70">• {busData.busNumber || "N/A"}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-white font-bold text-sm">{busData.rating || 4.5}</span>
        </div>
      </div>

      {/* Route */}
      <div className="flex gap-4 py-4 border-y border-white/15 relative z-10">
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <div className="w-3 h-3 rounded-full bg-white shadow-lg" />
          <div className="w-0.5 flex-1 bg-white/30 min-h-[32px]" />
          <div className="w-3 h-3 rounded-full bg-white/50 border-2 border-white/30" />
        </div>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <p className="text-lg font-bold text-white">{busData.departure || "N/A"}</p>
            <p className="text-sm text-white/80 font-medium">{boardingCity || busData.from || "N/A"}</p>
            <p className="text-xs text-white/60 mt-0.5">
              {formatDate(today.toISOString())}
            </p>
          </div>
          <div className="flex-1 mx-4 text-center">
            <div className="h-px bg-white/20 w-full relative">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/40" />
            </div>
            <p className="text-xs text-white/70 font-semibold mt-1.5">
              {busData.duration || "N/A"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">{busData.arrival || "N/A"}</p>
            <p className="text-sm text-white/80 font-medium">{droppingCity || busData.to || "N/A"}</p>
            <p className="text-xs text-white/60 mt-0.5">
              {formatDate(tomorrow.toISOString())}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/80">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">
              {busData.availableSeats || 0} seats left
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{busData.duration || "N/A"}</span>
          </div>
        </div>
        {busData.availableSeats > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-400/20 text-emerald-100 px-3 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Available</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusDetailsCard;