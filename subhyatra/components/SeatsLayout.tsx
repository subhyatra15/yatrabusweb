// @ts-nocheck
"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Car,
  X,
  Loader2,
  AlertCircle,
  Check,
  Sofa,
  Bed,
  Star as StarIcon,
  Grid2x2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SeatsLayoutProps {
  seats: any[];
  busData: any;
  userId: number | null;
  selectedSeats: number[];
  selectedSeatNumbers: string[];
  totalPrice: number;
  isBooking: boolean;
  isWebSocketConnected: boolean;
  showSeatModal: boolean;
  setShowSeatModal: (show: boolean) => void;
  toggleSeat: (rowIndex: number, colIndex: number) => Promise<void>;
  getSeatColor: (seat: any) => string;
  getSeatBorderColor: (seat: any) => string;
  getSeatTextColor: (seat: any) => string;
  getSeatPrice: (seat: any) => number;
  getMaxSeatsInRow: () => number;
  handleConfirmBooking: () => Promise<void>;
}

const SeatsLayout = ({
  seats,
  busData,
  userId,
  selectedSeats,
  selectedSeatNumbers,
  totalPrice,
  isBooking,
  isWebSocketConnected,
  showSeatModal,
  setShowSeatModal,
  toggleSeat,
  getSeatColor,
  getSeatBorderColor,
  getSeatTextColor,
  getSeatPrice,
  getMaxSeatsInRow,
  handleConfirmBooking,
}: SeatsLayoutProps) => {
  return (
    <AnimatePresence>
      {showSeatModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowSeatModal(false)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-md rounded-t-3xl max-h-[92vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Select Seats</h3>
                <button
                  onClick={() => setShowSeatModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-900" />
                </button>
              </div>

              {!isWebSocketConnected && (
                <div className="flex items-center gap-2 mt-3 bg-amber-50 px-3 py-2 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-600 font-medium">
                    Connecting to real-time updates...
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {/* Legend */}
              <div className="flex flex-wrap gap-3 justify-center mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-blue-100 border border-blue-200" />
                  <span className="text-xs text-slate-600">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-indigo-600" />
                  <span className="text-xs text-slate-600">Your Seat</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-amber-400" />
                  <span className="text-xs text-slate-600">Being Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-red-100 border border-red-200" />
                  <span className="text-xs text-slate-600">Booked</span>
                </div>
              </div>

              {/* Seats Layout */}
              <div className="relative">
                {/* Driver indicator */}
                <div className="flex justify-end mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-200">
                      <Car className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-xs text-slate-400 mt-1 font-medium">
                      Driver
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {seats.map((row, rowIndex) => {
                    const maxSeats = getMaxSeatsInRow();
                    const isCentered = row.length < maxSeats;
                    const paddingLeft = isCentered
                      ? (maxSeats - row.length) * 28
                      : 0;
                    const halfIndex = Math.floor(row.length / 2);
                    const leftSeats = row.slice(0, halfIndex);
                    const rightSeats = row.slice(halfIndex);

                    return (
                      <div
                        key={rowIndex}
                        className="flex items-center gap-2"
                        style={{ paddingLeft }}
                      >
                        <div className="flex gap-1.5">
                          {leftSeats.map((seat: any, colIndex: number) => {
                            const hasExtra = parseFloat(seat.extra_price) > 0;

                            return (
                              <button
                                key={`left-${colIndex}`}
                                onClick={() => toggleSeat(rowIndex, colIndex)}
                                disabled={!seat.available && !seat.is_mine}
                                className={cn(
                                  "relative w-11 h-11 rounded-xl border-2 transition-all flex flex-col items-center justify-center",
                                  !seat.available &&
                                    !seat.is_mine &&
                                    !seat.selected_by &&
                                    "opacity-60",
                                  seat.is_mine &&
                                    "scale-105 border-indigo-600",
                                  seat.seat_type === "SLEEPER" &&
                                    "w-12 h-12 rounded-2xl",
                                  seat.seat_type === "VIP" &&
                                    "border-amber-400",
                                  hasExtra &&
                                    "border-dashed border-2 border-green-400"
                                )}
                                style={{
                                  backgroundColor: getSeatColor(seat),
                                  borderColor: hasExtra
                                    ? "#4ade80"
                                    : getSeatBorderColor(seat),
                                }}
                              >
                                {seat.seat_type === "SLEEPER" ? (
                                  <Bed
                                    className="w-5 h-5"
                                    style={{ color: getSeatTextColor(seat) }}
                                  />
                                ) : seat.seat_type === "VIP" ? (
                                  <StarIcon
                                    className="w-5 h-5"
                                    style={{ color: getSeatTextColor(seat) }}
                                  />
                                ) : (
                                  <Sofa
                                    className="w-5 h-5"
                                    style={{ color: getSeatTextColor(seat) }}
                                  />
                                )}
                                <span
                                  className="text-[8px] font-semibold absolute bottom-0.5 right-1 opacity-70"
                                  style={{ color: getSeatTextColor(seat) }}
                                >
                                  {seat.seat_number}
                                </span>
                                {seat.is_mine && (
                                  <Check className="w-3 h-3 text-white absolute -top-1 -right-1" />
                                )}
                                {seat.is_window && (
                                  <Grid2x2 className="w-3 h-3 text-blue-400 absolute -top-1 -left-1" />
                                )}
                                {hasExtra &&
                                  !seat.is_mine &&
                                  !seat.selected_by &&
                                  !seat.selected && (
                                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-700 text-[8px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap">
                                      +Rs.{seat.extra_price}
                                    </div>
                                  )}
                                {hasExtra &&
                                  (seat.is_mine || seat.selected) && (
                                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-indigo-100 text-indigo-700 text-[8px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap">
                                      +Rs.{seat.extra_price}
                                    </div>
                                  )}
                              </button>
                            );
                          })}
                        </div>

                        <div className="w-5" />

                        <div className="flex gap-1.5">
                          {rightSeats.map((seat: any, colIndex: number) => {
                            const hasExtra = parseFloat(seat.extra_price) > 0;

                            return (
                              <button
                                key={`right-${colIndex}`}
                                onClick={() =>
                                  toggleSeat(rowIndex, colIndex + halfIndex)
                                }
                                disabled={!seat.available && !seat.is_mine}
                                className={cn(
                                  "relative w-11 h-11 rounded-xl border-2 transition-all flex flex-col items-center justify-center",
                                  !seat.available &&
                                    !seat.is_mine &&
                                    !seat.selected_by &&
                                    "opacity-60",
                                  seat.is_mine &&
                                    "scale-105 border-indigo-600",
                                  seat.seat_type === "SLEEPER" &&
                                    "w-12 h-12 rounded-2xl",
                                  seat.seat_type === "VIP" &&
                                    "border-amber-400",
                                  hasExtra &&
                                    "border-dashed border-2 border-green-400"
                                )}
                                style={{
                                  backgroundColor: getSeatColor(seat),
                                  borderColor: hasExtra
                                    ? "#4ade80"
                                    : getSeatBorderColor(seat),
                                }}
                              >
                                {seat.seat_type === "SLEEPER" ? (
                                  <Bed
                                    className="w-5 h-5"
                                    style={{ color: getSeatTextColor(seat) }}
                                  />
                                ) : seat.seat_type === "VIP" ? (
                                  <StarIcon
                                    className="w-5 h-5"
                                    style={{ color: getSeatTextColor(seat) }}
                                  />
                                ) : (
                                  <Sofa
                                    className="w-5 h-5"
                                    style={{ color: getSeatTextColor(seat) }}
                                  />
                                )}
                                <span
                                  className="text-[8px] font-semibold absolute bottom-0.5 right-1 opacity-70"
                                  style={{ color: getSeatTextColor(seat) }}
                                >
                                  {seat.seat_number}
                                </span>
                                {seat.is_mine && (
                                  <Check className="w-3 h-3 text-white absolute -top-1 -right-1" />
                                )}
                                {seat.is_window && (
                                  <Grid2x2 className="w-3 h-3 text-blue-400 absolute -top-1 -left-1" />
                                )}
                                {hasExtra &&
                                  !seat.is_mine &&
                                  !seat.selected_by &&
                                  !seat.selected && (
                                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-700 text-[8px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap">
                                      +Rs.{seat.extra_price}
                                    </div>
                                  )}
                                {hasExtra &&
                                  (seat.is_mine || seat.selected) && (
                                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-indigo-100 text-indigo-700 text-[8px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap">
                                      +Rs.{seat.extra_price}
                                    </div>
                                  )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedSeats.length} seats selected
                  </p>
                  {selectedSeatNumbers.length > 0 && (
                    <p className="text-sm text-indigo-600 font-medium">
                      {selectedSeatNumbers.join(", ")}
                    </p>
                  )}
                  <p className="text-sm text-slate-400">
                    Total: Rs. {totalPrice}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmBooking}
                  disabled={selectedSeats.length === 0 || isBooking}
                  className={cn(
                    "bg-linear-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25",
                    (selectedSeats.length === 0 || isBooking) &&
                      "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isBooking ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Confirm Seats"
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SeatsLayout;