"use client";

import { useState } from "react";
import { ArrowLeft, User } from "lucide-react";
import { Bus, Passenger, Seat } from "@/lib/types";

export default function PassengerDetails({
  bus,
  seats,
  boardingPoint,
  onBack,
  onConfirm,
}: {
  bus: Bus;
  seats: Seat[];
  boardingPoint: string;
  onBack: () => void;
  onConfirm: (passengers: Passenger[], contact: { phone: string; email: string }) => void;
}) {
  const [passengers, setPassengers] = useState<Passenger[]>(
    seats.map((s) => ({ seatId: s.id, name: "", age: "", gender: "Male" }))
  );
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const update = (idx: number, field: keyof Passenger, value: string) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const allFilled =
    passengers.every((p) => p.name.trim() && p.age.trim()) &&
    /^\d{9,10}$/.test(phone.trim());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allFilled) return;
    onConfirm(passengers, { phone, email });
  };

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-8 pb-32">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="grid place-items-center w-9 h-9 rounded-full bg-white border border-paper-2 hover:bg-paper-2 transition-colors shrink-0"
          aria-label="Back to seat selection"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-ink">
            Passenger details
          </h2>
          <p className="text-sm text-mist-2 mt-0.5">
            {bus.operator} · Seats {seats.map((s) => s.id).join(", ")} ·
            Boarding at {boardingPoint}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        {passengers.map((p, idx) => (
          <div
            key={p.seatId}
            className="bg-white rounded-2xl border border-paper-2 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="grid place-items-center w-7 h-7 rounded-full bg-marigold/30 text-night">
                <User className="w-3.5 h-3.5" />
              </span>
              <p className="font-display text-lg text-ink">
                Passenger {idx + 1}
              </p>
              <span className="ml-auto font-mono text-xs bg-paper-2 rounded-full px-2.5 py-1 text-mist-2">
                Seat {p.seatId}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-3">
              <div>
                <label className="text-xs text-mist-2">Full name</label>
                <input
                  required
                  value={p.name}
                  onChange={(e) => update(idx, "name", e.target.value)}
                  placeholder="As on ID card"
                  className="w-full mt-1 rounded-lg border border-paper-2 px-3 py-2 text-sm outline-none focus:border-crimson"
                />
              </div>
              <div>
                <label className="text-xs text-mist-2">Age</label>
                <input
                  required
                  value={p.age}
                  onChange={(e) => update(idx, "age", e.target.value)}
                  placeholder="Age"
                  inputMode="numeric"
                  className="w-full mt-1 rounded-lg border border-paper-2 px-3 py-2 text-sm outline-none focus:border-crimson"
                />
              </div>
              <div>
                <label className="text-xs text-mist-2">Gender</label>
                <select
                  value={p.gender}
                  onChange={(e) => update(idx, "gender", e.target.value)}
                  className="w-full mt-1 rounded-lg border border-paper-2 px-3 py-2 text-sm outline-none focus:border-crimson"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-paper-2 p-5">
          <p className="font-display text-lg text-ink mb-4">Contact details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-mist-2">Mobile number</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                inputMode="numeric"
                className="w-full mt-1 rounded-lg border border-paper-2 px-3 py-2 text-sm outline-none focus:border-crimson"
              />
              <p className="text-[11px] text-mist-2 mt-1">
                Your e-ticket and boarding OTP go here.
              </p>
            </div>
            <div>
              <label className="text-xs text-mist-2">Email (optional)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                className="w-full mt-1 rounded-lg border border-paper-2 px-3 py-2 text-sm outline-none focus:border-crimson"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!allFilled}
          className={[
            "self-end rounded-full font-semibold px-8 py-3 text-sm transition-colors",
            allFilled
              ? "bg-crimson text-white hover:bg-crimson/90"
              : "bg-paper-2 text-mist-2 cursor-not-allowed",
          ].join(" ")}
        >
          Confirm &amp; Pay NPR {(bus.price * seats.length).toLocaleString()}
        </button>
      </form>
    </section>
  );
}
