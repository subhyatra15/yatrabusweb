// components/HiaceDetailsCard.tsx
"use client";

import React from "react";
import { Car, Star, Users, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HiaceDetailsCardProps {
  hiaceData: {
    name: string;
    type: string;
    hiaceNumber: string;
    rating: number;
    departure: string;
    arrival: string;
    duration: string;
    availableSeats: number;
    totalSeats?: number;
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

const HiaceDetailsCard: React.FC<HiaceDetailsCardProps> = ({
  hiaceData,
  boardingCity,
  droppingCity,
  className,
}) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (!hiaceData) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 shadow-xl shadow-emerald-500/20",
        "bg-linear-to-br from-emerald-600 via-emerald-700 to-emerald-500",
        className
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
          <Car className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {hiaceData.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-semibold text-white/90 bg-white/20 px-2.5 py-0.5 rounded-full">
              {hiaceData.type}
            </span>
            <span className="text-xs text-white/70">• {hiaceData.hiaceNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-white font-bold text-sm">{hiaceData.rating}</span>
        </div>
      </div>

      <div className="flex gap-4 py-4 border-y border-white/15 relative z-10">
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <div className="w-3 h-3 rounded-full bg-white shadow-lg" />
          <div className="w-0.5 flex-1 bg-white/30 min-h-[32px]" />
          <div className="w-3 h-3 rounded-full bg-white/50 border-2 border-white/30" />
        </div>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <p className="text-lg font-bold text-white">{hiaceData.departure}</p>
            <p className="text-sm text-white/80 font-medium">{boardingCity || hiaceData.from}</p>
            <p className="text-xs text-white/60 mt-0.5">{formatDate(today.toISOString())}</p>
          </div>
          <div className="flex-1 mx-4 text-center">
            <div className="h-px bg-white/20 w-full relative">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/40" />
            </div>
            <p className="text-xs text-white/70 font-semibold mt-1.5">{hiaceData.duration}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">{hiaceData.arrival}</p>
            <p className="text-sm text-white/80 font-medium">{droppingCity || hiaceData.to}</p>
            <p className="text-xs text-white/60 mt-0.5">{formatDate(tomorrow.toISOString())}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/80">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{hiaceData.availableSeats} seats left</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{hiaceData.duration}</span>
          </div>
        </div>
        {hiaceData.availableSeats > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-400/20 text-emerald-100 px-3 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Available</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HiaceDetailsCard;