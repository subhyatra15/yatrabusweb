"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Gauge,
  GaugeIcon,
  CalendarDays,
  ScanLine,
  BusFront,
  CircleUserRound,
} from "lucide-react";

const NAV_LINKS = [
  {
    href: "/operator",
    label: "Dashboard",
    icon: Gauge,
  },
  {
    href: "/operator/driver-trips",
    label: "Trips",
    icon: CalendarDays,
  },
  {
    href: "/operator/QRScannerScreen",
    label: "Scan",
    icon: ScanLine,
  },
  {
    href: "/operator/driver-vehicles",
    label: "Vehicles",
    icon: BusFront,
  },
  {
    href: "/operator/driver-profile",
    label: "Profile",
    icon: CircleUserRound,
  },
];

export default function OperatorHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/operator") {
      return pathname === "/operator" || pathname === "/operator/";
    }

    return pathname === href;
  };

  return (
    <>
      {/* =========================================
          FLOATING BOTTOM NAVIGATION
      ========================================== */}
      <nav
        className="
          fixed
          bottom-4
          left-4
          right-4
          z-50
          mx-auto
          max-w-xl
          h-[78px]

          rounded-[28px]

          border
          border-white/30

          bg-white/95
          backdrop-blur-xl

          shadow-[0_8px_30px_rgba(79,70,229,0.15)]
        "
      >
        <div
          className="
            flex
            h-full
            items-center
            justify-around
            px-2
          "
        >
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="
                  group
                  flex
                  h-full
                  min-w-16
                  flex-1
                  flex-col
                  items-center
                  justify-center
                  rounded-2xl
                "
              >
       
                <div
                  className={`
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-[14px]

                    transition-all
                    duration-200

                    ${
                      active
                        ? `
                          bg-indigo-600
                          shadow-[0_4px_12px_rgba(79,70,229,0.30)]
                        `
                        : `
                          bg-transparent
                          group-hover:bg-slate-100
                        `
                    }
                  `}
                >
                  <Icon
                    className={`
                      transition-all
                      duration-200

                      ${
                        active
                          ? "h-7 w-7 text-white"
                          : "h-6 w-6 text-slate-400 group-hover:text-indigo-600"
                      }
                    `}
                    strokeWidth={2.25}
                  />
                </div>

      
                {!active && (
                  <span
                    className="
                      mt-0.5

                      text-[11px]
                      font-semibold
                      tracking-[0.2px]

                      text-slate-500

                      transition-colors
                      duration-200

                      group-hover:text-indigo-600
                    "
                  >
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="h-24" />
    </>
  );
}