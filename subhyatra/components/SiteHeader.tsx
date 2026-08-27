"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  BusFront,
  Home,
  TicketPercent,
  MapPinned,
  CircleUserRound,
  Menu,
  X,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tickets", label: "Tickets", icon: TicketPercent },
  { href: "/track", label: "Track", icon: MapPinned },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router= useRouter();

  return (
    <header className="sticky top-0 z-40 bg-night/95 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-marigold text-night">
            <BusFront className="w-5 h-5" strokeWidth={2.25} />
          </span>
          <div className="leading-none">
            <p className="font-display text-xl text-paper tracking-tight">
              Subh<span className="text-marigold">Yatra</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-mist mt-0.5">
              शुभ यात्रा · safe travels
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "text-night bg-marigold"
                    : "text-mist hover:text-paper hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2.25} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop sign in */}
        <div className="hidden md:block shrink-0">
          <button className="rounded-full bg-marigold text-night font-semibold px-4 py-2 text-sm hover:bg-marigold-2 transition-colors">
            Sign in
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="md:hidden grid place-items-center w-10 h-10 rounded-full text-paper hover:bg-white/5 transition-colors"
        >
          {open ? (
            <X className="w-5 h-5" strokeWidth={2.25} />
          ) : (
            <Menu className="w-5 h-5" strokeWidth={2.25} />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out border-t border-white/10 ${
          open ? "max-h-80 opacity-100" : "max-h-0 opacity-0 border-t-0"
        }`}
      >
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`inline-flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "text-night bg-marigold"
                    : "text-mist hover:text-paper hover:bg-white/5"
                }`}
              >
                <Icon className="w-4.5 h-4.5" strokeWidth={2.25} />
                {label}
              </Link>
            );
          })}
          <button onClick={()=> {
            router.push("/signin")
            setOpen(false)
          }} className="mt-2 rounded-full bg-marigold text-night font-semibold px-4 py-2.5 text-sm hover:bg-marigold-2 transition-colors">
            Sign in
          </button>
        </nav>
      </div>
    </header>
  );
}