"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  ArrowLeftRight,
  CalendarDays,
  Users,
  Search,
  Minus,
  Plus,
} from "lucide-react";
import { CITIES } from "@/lib/mockData";
import { SearchQuery } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function SearchHero({
  onSearch,
}: {
  onSearch: (q: SearchQuery) => void;
}) {
  const [from, setFrom] = useState("Kathmandu");
  const [to, setTo] = useState("Pokhara");
  const [date, setDate] = useState(todayISO());
  const [passengers, setPassengers] = useState(1);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ from, to, date, passengers });
  };

  return (
    <section className="relative bg-night overflow-hidden">
      {/* ambient highway glow */}
      <div
        className="pointer-events-none absolute -top-24 right-[-10%] w-[520px] h-[520px] rounded-full bg-marigold/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-30%] left-[-10%] w-[400px] h-[400px] rounded-full bg-night-3/50 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-28 sm:pt-20 sm:pb-36">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-marigold font-semibold">
            <span className="w-6 route-dash text-marigold" />
            नेपालभर बस बुकिङ
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-paper mt-4 leading-[1.05]">
            Every route across Nepal,
            <br />
            <span className="text-marigold-2 italic">one ticket</span> away.
          </h1>
          <p className="text-mist mt-4 text-base sm:text-lg max-w-md">
            Compare AC deluxe, sofa seater and local buses. Pick your own
            seat, pay online, board with confidence.
          </p>
        </motion.div>

        {/* Ticket-kiosk search card */}
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          onSubmit={submit}
          className="mt-10 sm:mt-12 bg-paper rounded-2xl shadow-2xl shadow-black/40 border border-black/5"
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_auto] gap-0 md:divide-x divide-paper-2">
            {/* From */}
            <div className="relative px-5 py-4 md:py-5">
              <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-mist-2 font-semibold">
                <MapPin className="w-3.5 h-3.5" /> From
              </label>
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                onFocus={() => setFromOpen(true)}
                onBlur={() => setTimeout(() => setFromOpen(false), 120)}
                className="w-full mt-1 font-display text-lg sm:text-xl bg-transparent outline-none text-ink"
                placeholder="Departure city"
              />
              {fromOpen && (
                <ul className="absolute z-20 left-2 right-2 top-full mt-1 bg-white rounded-xl shadow-xl border border-paper-2 overflow-hidden max-h-56 overflow-y-auto thin-scroll">
                  {CITIES.filter((c) =>
                    c.toLowerCase().includes(from.toLowerCase())
                  ).map((c) => (
                    <li
                      key={c}
                      className="px-4 py-2.5 text-sm hover:bg-paper cursor-pointer"
                      onMouseDown={() => setFrom(c)}
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Swap */}
            <div className="hidden md:flex items-center justify-center px-2">
              <button
                type="button"
                onClick={swap}
                aria-label="Swap origin and destination"
                className="grid place-items-center w-9 h-9 rounded-full bg-night text-marigold hover:rotate-180 transition-transform duration-300"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* To */}
            <div className="relative px-5 py-4 md:py-5">
              <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-mist-2 font-semibold">
                <MapPin className="w-3.5 h-3.5" /> To
              </label>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onFocus={() => setToOpen(true)}
                onBlur={() => setTimeout(() => setToOpen(false), 120)}
                className="w-full mt-1 font-display text-lg sm:text-xl bg-transparent outline-none text-ink"
                placeholder="Destination city"
              />
              {toOpen && (
                <ul className="absolute z-20 left-2 right-2 top-full mt-1 bg-white rounded-xl shadow-xl border border-paper-2 overflow-hidden max-h-56 overflow-y-auto thin-scroll">
                  {CITIES.filter((c) =>
                    c.toLowerCase().includes(to.toLowerCase())
                  ).map((c) => (
                    <li
                      key={c}
                      className="px-4 py-2.5 text-sm hover:bg-paper cursor-pointer"
                      onMouseDown={() => setTo(c)}
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Date */}
            <div className="px-5 py-4 md:py-5">
              <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-mist-2 font-semibold">
                <CalendarDays className="w-3.5 h-3.5" /> Date
              </label>
              <input
                type="date"
                value={date}
                min={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full mt-1 font-display text-lg sm:text-xl bg-transparent outline-none text-ink"
              />
            </div>

            {/* Passengers */}
            <div className="px-5 py-4 md:py-5">
              <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-mist-2 font-semibold">
                <Users className="w-3.5 h-3.5" /> Seats
              </label>
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                  className="grid place-items-center w-6 h-6 rounded-full bg-paper-2 text-ink hover:bg-marigold/40"
                  aria-label="Decrease passengers"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-display text-lg w-4 text-center">
                  {passengers}
                </span>
                <button
                  type="button"
                  onClick={() => setPassengers((p) => Math.min(6, p + 1))}
                  className="grid place-items-center w-6 h-6 rounded-full bg-paper-2 text-ink hover:bg-marigold/40"
                  aria-label="Increase passengers"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 md:px-6 md:pb-6">
            <button
              type="submit"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-crimson text-white font-semibold px-8 py-3.5 hover:bg-crimson/90 active:scale-[0.99] transition"
            >
              <Search className="w-4.5 h-4.5" />
              Search Buses
            </button>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
