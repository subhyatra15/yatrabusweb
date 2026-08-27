"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  Download,
  Share2,
  MapPin,
  BusFront,
  QrCode,
  PlusCircle,
} from "lucide-react";
import { Bus, Passenger, Seat, SearchQuery } from "@/lib/types";

function randomPNR() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function BookingConfirmation({
  query,
  bus,
  seats,
  passengers,
  boardingPoint,
  onNewSearch,
}: {
  query: SearchQuery;
  bus: Bus;
  seats: Seat[];
  passengers: Passenger[];
  boardingPoint: string;
  onNewSearch: () => void;
}) {
  const pnr = randomPNR();
  const total = bus.price * seats.length;

  return (
    <section className="mx-auto max-w-2xl px-4 sm:px-6 py-10 pb-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center"
      >
        <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-good/15 text-good mb-4">
          <BadgeCheck className="w-8 h-8" />
        </span>
        <h2 className="font-display text-3xl text-ink">Booking confirmed</h2>
        <p className="text-sm text-mist-2 mt-1">
          Your e-ticket has been sent to your phone. यात्रा शुभ होस्!
        </p>
      </motion.div>

      {/* Ticket stub */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-8 rounded-2xl overflow-hidden shadow-xl shadow-black/10 border border-paper-2"
      >
        {/* Top: dark header */}
        <div className="bg-night text-paper p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-8 h-8 rounded-full bg-marigold text-night">
              <BusFront className="w-4 h-4" />
            </span>
            <span className="font-display text-lg">
              Subh<span className="text-marigold">Yatra</span>
            </span>
          </div>
          <span className="font-mono text-xs bg-white/10 rounded-full px-3 py-1">
            PNR {pnr}
          </span>
        </div>

        {/* Middle: journey info on paper */}
        <div className="bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-2xl text-ink">{bus.departTime}</p>
              <p className="text-sm text-mist-2 mt-0.5">{query.from}</p>
            </div>
            <div className="flex-1 flex flex-col items-center px-2">
              <span className="text-[11px] text-mist-2">{bus.durationLabel}</span>
              <span className="w-full route-dash text-mist-2 mt-1" />
              <span className="text-[11px] text-mist-2 mt-1">
                {new Date(query.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="text-right">
              <p className="font-mono text-2xl text-ink">{bus.arriveTime}</p>
              <p className="text-sm text-mist-2 mt-0.5">{query.to}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-dashed border-paper-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-mist-2">
                Operator
              </p>
              <p className="text-sm text-ink mt-0.5 font-medium">
                {bus.operator}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-mist-2">
                Bus type
              </p>
              <p className="text-sm text-ink mt-0.5 font-medium">
                {bus.busType}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-mist-2">
                Seats
              </p>
              <p className="text-sm text-ink mt-0.5 font-mono font-medium">
                {seats.map((s) => s.id).join(", ")}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-mist-2">
                Passengers
              </p>
              <p className="text-sm text-ink mt-0.5 font-medium">
                {passengers.length}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 mt-5 text-sm text-ink">
            <MapPin className="w-4 h-4 text-crimson shrink-0 mt-0.5" />
            <span>
              <span className="text-mist-2">Boarding: </span>
              {boardingPoint}
            </span>
          </div>
        </div>

        {/* Perforated tear line */}
        <div className="relative h-0 border-t border-dashed border-mist-2/50 ticket-notch bg-white" />

        {/* Bottom: stub with QR + price */}
        <div className="bg-white p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-16 h-16 rounded-xl bg-paper-2 text-night">
              <QrCode className="w-9 h-9" strokeWidth={1.25} />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-mist-2">
                Total paid
              </p>
              <p className="font-display text-2xl text-ink">
                NPR {total.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-full bg-night text-paper text-xs font-semibold px-4 py-2 hover:bg-night-3 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-paper-2 text-ink text-xs font-semibold px-4 py-2 hover:bg-paper transition-colors">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={onNewSearch}
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-crimson transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Book another journey
        </button>
      </div>
    </section>
  );
}
