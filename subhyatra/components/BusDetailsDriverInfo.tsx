// @ts-nocheck
"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Phone,
  Star,
  Award,
  ChevronDown,
  Shield,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BusDetailsDriverInfoProps {
  busData: {
    driver: {
      name: string;
      phone: string;
      experience: string;
      rating: number;
    };
  };
  showDriverInfo: boolean;
  setShowDriverInfo: (show: boolean) => void;
}

const BusDetailsDriverInfo = ({
  busData,
  showDriverInfo,
  setShowDriverInfo,
}: BusDetailsDriverInfoProps) => {
  if (!busData?.driver) return null;

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-slate-100/50 p-5 mb-4">
      <button
        onClick={() => setShowDriverInfo(!showDriverInfo)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <User className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">Driver Information</p>
            <p className="text-sm text-slate-400">{busData.driver.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold">
              {busData.driver.rating}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-slate-400 transition-transform",
              showDriverInfo && "rotate-180"
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {showDriverInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {busData.driver.name}
                  </p>
                  <p className="text-sm text-slate-400">
                    {busData.driver.experience} experience
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{busData.driver.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Certified Professional Driver</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Verified & Trusted</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusDetailsDriverInfo;