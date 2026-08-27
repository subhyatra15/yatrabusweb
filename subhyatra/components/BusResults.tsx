"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Bus, BusType, SearchQuery } from "@/lib/types";
import TicketCard from "./TicketCard";

const TYPE_FILTERS: BusType[] = ["AC Deluxe", "Sofa Seater", "Non-AC", "Micro"];
type SortKey = "departure" | "price" | "rating";

export default function BusResults({
  query,
  buses,
  onBack,
  onSelectBus,
}: {
  query: SearchQuery;
  buses: Bus[];
  onBack: () => void;
  onSelectBus: (bus: Bus) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<BusType | "All">("All");
  const [sort, setSort] = useState<SortKey>("departure");

  const filtered = useMemo(() => {
    let list = buses;
    if (typeFilter !== "All") {
      list = list.filter((b) => b.busType === typeFilter);
    }
    const sorted = [...list].sort((a, b) => {
      if (sort === "price") return a.price - b.price;
      if (sort === "rating") return b.rating - a.rating;
      return a.departTime.localeCompare(b.departTime);
    });
    return sorted;
  }, [buses, typeFilter, sort]);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="grid place-items-center w-9 h-9 rounded-full bg-white border border-paper-2 hover:bg-paper-2 transition-colors shrink-0"
          aria-label="Back to search"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-ink">
            {query.from} <span className="text-mist-2">→</span> {query.to}
          </h2>
          <p className="text-sm text-mist-2 mt-0.5">
            {new Date(query.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}{" "}
            · {query.passengers} passenger{query.passengers > 1 ? "s" : ""} ·{" "}
            {filtered.length} buses found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-mist-2 font-semibold mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
        </span>
        {(["All", ...TYPE_FILTERS] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={[
              "rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors",
              typeFilter === t
                ? "bg-night text-paper border-night"
                : "bg-white text-ink border-paper-2 hover:border-mist-2",
            ].join(" ")}
          >
            {t}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-mist-2 hidden sm:inline">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-xs sm:text-sm bg-white border border-paper-2 rounded-full px-3 py-1.5 outline-none"
          >
            <option value="departure">Earliest departure</option>
            <option value="price">Lowest price</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 flex flex-col gap-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-mist-2">
            <p className="font-display text-xl text-ink">No buses match that filter</p>
            <p className="text-sm mt-1">Try a different bus type.</p>
          </div>
        )}
        {filtered.map((bus, i) => (
          <TicketCard
            key={bus.id}
            bus={bus}
            index={i}
            onSelect={() => onSelectBus(bus)}
          />
        ))}
      </div>

      {filtered.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-mist-2 mt-8"
        >
          Prices include seat reservation. Boarding point confirmed at checkout.
        </motion.p>
      )}
    </section>
  );
}
