"use client";

import { motion } from "framer-motion";
import { Search, ListChecks, Armchair, UserRound, BadgeCheck } from "lucide-react";
import { Step } from "@/lib/types";

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: "search", label: "Search", icon: Search },
  { key: "results", label: "Choose Bus", icon: ListChecks },
  { key: "seats", label: "Seats", icon: Armchair },
  { key: "passengers", label: "Details", icon: UserRound },
  { key: "confirm", label: "E-Ticket", icon: BadgeCheck },
];

export default function StepProgress({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <nav
      aria-label="Booking progress"
      className="w-full overflow-x-auto thin-scroll"
    >
      <ol className="flex items-center gap-1.5 sm:gap-2 min-w-max px-1">
        {STEPS.map((s, i) => {
          const active = i === currentIndex;
          const done = i < currentIndex;
          const Icon = s.icon;
          return (
            <li key={s.key} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={[
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors",
                  active
                    ? "bg-night text-paper"
                    : done
                    ? "bg-night-3/20 text-night"
                    : "bg-white/60 text-mist-2",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid place-items-center w-5 h-5 rounded-full",
                    active
                      ? "bg-marigold text-night"
                      : done
                      ? "bg-good text-white"
                      : "bg-paper-2 text-mist-2",
                  ].join(" ")}
                >
                  <Icon className="w-3 h-3" strokeWidth={2.5} />
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className="w-4 sm:w-8 h-px bg-mist-2/40 relative overflow-hidden"
                  aria-hidden
                >
                  {done && (
                    <motion.span
                      layoutId="progress-fill"
                      className="absolute inset-0 bg-good"
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
