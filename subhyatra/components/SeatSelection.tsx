"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Armchair, MapPin, Star } from "lucide-react";
import { Bus, Seat } from "@/lib/types";
import { buildSeatMap } from "@/lib/mockData";

export default function SeatSelection({
  bus,
  passengerCount,
  onBack,
  onContinue,
}: {
  bus: Bus;
  passengerCount: number;
  onBack: () => void;
  onContinue: (seats: Seat[], boardingPoint: string) => void;
}) {
  const [seats] = useState<Seat[]>(() => buildSeatMap());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [boardingPoint, setBoardingPoint] = useState(bus.boardingPoints[0]);

  const toggleSeat = (seat: Seat) => {
    if (seat.status === "booked") return;
    setSelectedIds((prev) => {
      if (prev.includes(seat.id)) return prev.filter((id) => id !== seat.id);
      if (prev.length >= passengerCount) {
        return [...prev.slice(1), seat.id];
      }
      return [...prev, seat.id];
    });
  };

  const rows = useMemo(() => {
    const map = new Map<number, Seat[]>();
    seats.forEach((s) => {
      if (!map.has(s.row)) map.set(s.row, []);
      map.get(s.row)!.push(s);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [seats]);

  const total = bus.price * selectedIds.length;
  const canContinue = selectedIds.length === passengerCount;

  const seatVisual = (seat: Seat) => {
    const isSelected = selectedIds.includes(seat.id);
    const status: Seat["status"] = isSelected ? "selected" : seat.status;

    const styles: Record<Seat["status"], string> = {
      available:
        "bg-white border-mist-2/50 text-ink hover:border-marigold hover:bg-marigold/10 cursor-pointer",
      selected: "bg-crimson border-crimson text-white cursor-pointer",
      booked: "bg-paper-2 border-paper-2 text-mist-2 cursor-not-allowed",
      "female-only":
        "bg-white border-marigold text-marigold cursor-pointer hover:bg-marigold/10",
    };

    return (
      <button
        key={seat.id}
        type="button"
        disabled={seat.status === "booked"}
        onClick={() => toggleSeat(seat)}
        title={seat.id}
        className={[
          "relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center text-[10px] font-mono font-semibold transition-colors",
          styles[status],
        ].join(" ")}
      >
        <Armchair className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={1.75} />
        <span className="absolute -bottom-4 text-[9px] text-mist-2 font-mono">
          {seat.id}
        </span>
      </button>
    );
  };

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8 pb-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="grid place-items-center w-9 h-9 rounded-full bg-white border border-paper-2 hover:bg-paper-2 transition-colors shrink-0"
          aria-label="Back to results"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-ink">
            Choose your seats
          </h2>
          <p className="text-sm text-mist-2 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>{bus.operator}</span>
            <span className="text-mist-2/50">·</span>
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-marigold text-marigold" />
              {bus.rating}
            </span>
            <span className="text-mist-2/50">·</span>
            <span>
              {bus.departTime} → {bus.arriveTime}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-10">
        {/* Bus seat map */}
        <div className="flex justify-center">
          <div className="bg-white rounded-3xl border border-paper-2 p-5 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs uppercase tracking-wide text-mist-2 font-semibold">
                Driver
              </span>
              <span className="w-8 h-8 rounded-full border-2 border-mist-2/40 grid place-items-center text-mist-2">
                <Armchair className="w-4 h-4" />
              </span>
            </div>

            <div className="flex flex-col gap-6 mt-4">
              {rows.map(([rowNum, rowSeats]) => (
                <div key={rowNum} className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {seatVisual(rowSeats[0])}
                    {seatVisual(rowSeats[1])}
                  </div>
                  <div className="w-6 sm:w-8" aria-hidden />
                  <div className="flex gap-2">
                    {seatVisual(rowSeats[2])}
                    {seatVisual(rowSeats[3])}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-9 pt-5 border-t border-paper-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-mist-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-mist-2/50 bg-white inline-block" />
                Available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-crimson inline-block" />
                Selected
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-paper-2 inline-block" />
                Booked
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-marigold bg-white inline-block" />
                Female only
              </span>
            </div>
          </div>
        </div>

        {/* Boarding point + summary */}
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="font-display text-lg text-ink mb-3">
              Boarding point
            </h3>
            <div className="flex flex-col gap-2">
              {bus.boardingPoints.map((bp) => (
                <button
                  key={bp}
                  onClick={() => setBoardingPoint(bp)}
                  className={[
                    "flex items-center gap-2.5 text-left rounded-xl border px-4 py-3 text-sm transition-colors",
                    boardingPoint === bp
                      ? "border-crimson bg-crimson/5 text-ink"
                      : "border-paper-2 bg-white hover:border-mist-2",
                  ].join(" ")}
                >
                  <MapPin
                    className={[
                      "w-4 h-4 shrink-0",
                      boardingPoint === bp ? "text-crimson" : "text-mist-2",
                    ].join(" ")}
                  />
                  {bp}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-night text-paper p-5">
            <p className="text-xs uppercase tracking-wide text-mist font-semibold">
              Your selection
            </p>
            <p className="font-display text-2xl mt-1">
              {selectedIds.length > 0
                ? selectedIds.sort().join(", ")
                : "No seats selected yet"}
            </p>
            <p className="text-sm text-mist mt-2">
              {selectedIds.length} of {passengerCount} seat
              {passengerCount > 1 ? "s" : ""} chosen
            </p>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-paper-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-mist-2">
              {selectedIds.length} seat{selectedIds.length !== 1 ? "s" : ""} ·
              NPR {bus.price.toLocaleString()} each
            </p>
            <p className="font-display text-xl text-ink">
              NPR {total.toLocaleString()}
            </p>
          </div>
          <button
            disabled={!canContinue}
            onClick={() => {
              const chosen = seats
                .filter((s) => selectedIds.includes(s.id))
                .map((s) => ({ ...s, status: "selected" as const }));
              onContinue(chosen, boardingPoint);
            }}
            className={[
              "rounded-full font-semibold px-6 sm:px-8 py-3 text-sm transition-colors whitespace-nowrap",
              canContinue
                ? "bg-crimson text-white hover:bg-crimson/90"
                : "bg-paper-2 text-mist-2 cursor-not-allowed",
            ].join(" ")}
          >
            Continue to details
          </button>
        </div>
      </motion.div>
    </section>
  );
}
