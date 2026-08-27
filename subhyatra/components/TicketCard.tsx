"use client";

import { motion } from "framer-motion";
import {
  Star,
  Wifi,
  BatteryCharging,
  Droplets,
  Layers,
  Users,
  ArrowRight,
} from "lucide-react";
import { Bus } from "@/lib/types";

const AMENITY_ICON: Record<string, React.ElementType> = {
  WiFi: Wifi,
  "Charging Port": BatteryCharging,
  "Water Bottle": Droplets,
};

export default function TicketCard({
  bus,
  onSelect,
  index,
}: {
  bus: Bus;
  onSelect: () => void;
  index: number;
}) {
  const urgent = bus.seatsLeft <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
      className="grid grid-cols-1 sm:grid-cols-[1fr_auto] bg-paper rounded-2xl border border-paper-2 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Left: trip info */}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="font-display text-lg text-ink">{bus.operator}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-night bg-marigold/30 rounded-full px-2.5 py-1">
              <Layers className="w-3 h-3" />
              {bus.busType}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-ink">
            <Star className="w-4 h-4 fill-marigold text-marigold" />
            <span className="font-semibold">{bus.rating}</span>
          </div>
        </div>

        {/* Route line */}
        <div className="flex items-center gap-3 mt-5">
          <div className="text-right shrink-0">
            <p className="font-mono text-xl sm:text-2xl text-ink leading-none">
              {bus.departTime}
            </p>
            <p className="text-xs text-mist-2 mt-1">{bus.from}</p>
          </div>

          <div className="flex-1 flex flex-col items-center px-1">
            <span className="text-[11px] text-mist-2">{bus.durationLabel}</span>
            <div className="w-full flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson shrink-0" />
              <span className="flex-1 route-dash text-mist-2" />
              <ArrowRight className="w-3.5 h-3.5 text-mist-2 shrink-0" />
            </div>
          </div>

          <div className="shrink-0">
            <p className="font-mono text-xl sm:text-2xl text-ink leading-none">
              {bus.arriveTime}
            </p>
            <p className="text-xs text-mist-2 mt-1">{bus.to}</p>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex items-center gap-3 mt-5 flex-wrap">
          {bus.amenities.map((a) => {
            const Icon = AMENITY_ICON[a] ?? Layers;
            return (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 text-xs text-mist-2"
              >
                <Icon className="w-3.5 h-3.5" />
                {a}
              </span>
            );
          })}
        </div>
      </div>

      {/* Tear line */}
      <div className="hidden sm:flex items-stretch">
        <div className="tear-line ticket-notch my-3" />
      </div>
      <div className="sm:hidden h-px mx-5 tear-line-h bg-[repeating-linear-gradient(to_right,var(--color-mist-2)_0_6px,transparent_6px_12px)]" />

      {/* Right: price + CTA */}
      <div className="p-5 sm:p-6 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:w-48 bg-paper-2/40">
        <div className="text-left sm:text-right">
          <p className="text-[11px] uppercase tracking-wide text-mist-2">
            Fare from
          </p>
          <p className="font-display text-2xl text-ink">
            NPR {bus.price.toLocaleString()}
          </p>
          <p
            className={[
              "inline-flex items-center gap-1 text-xs mt-1",
              urgent ? "text-crimson font-semibold" : "text-mist-2",
            ].join(" ")}
          >
            <Users className="w-3.5 h-3.5" />
            {bus.seatsLeft} seats left
          </p>
        </div>
        <button
          onClick={onSelect}
          className="rounded-full bg-night text-paper font-semibold px-6 py-2.5 text-sm hover:bg-night-3 transition-colors whitespace-nowrap"
        >
          Select Seats
        </button>
      </div>
    </motion.div>
  );
}
