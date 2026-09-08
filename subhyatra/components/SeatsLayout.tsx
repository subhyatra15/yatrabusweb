// components/SeatSelectionModal.tsx
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bus,
  Car,
  Sofa,
  Bed,
  Star as StarIcon,
  Grid2x2,
  Check,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Seat {
  id: number;
  seat_number: string;
  status: "AVAILABLE" | "BOOKED" | "SELECTED";
  price: number;
  bus?: number;
  seat_type?: string;
  row?: number;
  col?: number;
  is_window?: boolean;
  selected_by?: number;
  selected_by_name?: string;
  is_mine?: boolean;
  ttl?: number;
  available: boolean;
  selected: boolean;
  extra_price?: string;
}

interface SeatSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  seats: Seat[][];
  selectedSeats: number[];
  selectedSeatNumbers: string[];
  totalPrice: number;
  isBooking: boolean;
  isWebSocketConnected: boolean;
  busData: any;
  userId: number | null;
  onToggleSeat: (rowIndex: number, colIndex: number) => void;
  onConfirmBooking: () => void;
}

export function SeatSelectionModal({
  isOpen,
  onClose,
  seats,
  selectedSeats,
  selectedSeatNumbers,
  totalPrice,
  isBooking,
  isWebSocketConnected,
  busData,
  userId,
  onToggleSeat,
  onConfirmBooking,
}: SeatSelectionModalProps) {
  const [activeTab, setActiveTab] = useState<"layout" | "summary">("layout");

  // Reset tab when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("layout");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getSeatColor = (seat: Seat) => {
    if (!seat.available) {
      if (seat.is_mine) return "#4f46e5";
      if (seat.selected_by) return "#f59e0b";
      return "#fee2e2";
    }
    if (seat.selected) return "#4f46e5";
    if (seat.seat_type === "SLEEPER") return "#dbeafe";
    if (seat.seat_type === "VIP") return "#fef3c7";
    return "#dbeafe";
  };

  const getSeatBorderColor = (seat: Seat) => {
    if (!seat.available) {
      if (seat.is_mine) return "#4f46e5";
      if (seat.selected_by) return "#d97706";
      return "#fca5a5";
    }
    if (seat.selected) return "#4f46e5";
    if (seat.seat_type === "SLEEPER") return "#60a5fa";
    if (seat.seat_type === "VIP") return "#fbbf24";
    return "#93c5fd";
  };

  const getSeatTextColor = (seat: Seat) => {
    if (!seat.available) {
      if (seat.is_mine) return "#ffffff";
      if (seat.selected_by) return "#92400e";
      return "#ef4444";
    }
    if (seat.selected) return "#ffffff";
    if (seat.seat_type === "SLEEPER") return "#2563eb";
    if (seat.seat_type === "VIP") return "#b45309";
    return "#4f46e5";
  };

  const getSeatIcon = (seat: Seat) => {
    if (!seat.available) {
      if (seat.is_mine) return Check;
      if (seat.selected_by) return Clock;
      return Sofa;
    }
    if (seat.seat_type === "SLEEPER") return Bed;
    if (seat.seat_type === "VIP") return StarIcon;
    return Sofa;
  };

  const getSeatPrice = (seat: Seat) => {
    const basePrice = busData?.price || 0;
    const extraPrice = parseFloat(seat.extra_price) || 0;
    return basePrice + extraPrice;
  };

  const getMaxSeatsInRow = () => {
    let max = 0;
    seats.forEach((row) => {
      if (row.length > max) max = row.length;
    });
    return max;
  };

  const isSeatSelectable = (seat: Seat) => {
    if (!seat.available && !seat.is_mine) return false;
    if (seat.selected_by && !seat.is_mine) return false;
    return true;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="bg-white w-full max-w-lg rounded-t-3xl max-h-[95vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Select Your Seats
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {busData?.from} → {busData?.to}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Connection status */}
              {!isWebSocketConnected && (
                <div className="flex items-center gap-2 mt-3 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200/50">
                  <div className="animate-pulse">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-sm text-amber-600 font-medium">
                    Connecting to real-time updates...
                  </span>
                </div>
              )}

              {/* Selected seats preview */}
              {selectedSeats.length > 0 && (
                <div className="mt-3 flex items-center gap-3 bg-indigo-50/80 px-4 py-2 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {selectedSeatNumbers.map((num, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setActiveTab("layout")}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-all relative",
                  activeTab === "layout"
                    ? "text-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Seat Layout
                {activeTab === "layout" && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab("summary")}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-all relative",
                  activeTab === "summary"
                    ? "text-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Summary
                {selectedSeats.length > 0 && (
                  <span className="ml-1.5 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedSeats.length}
                  </span>
                )}
                {activeTab === "summary" && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                  />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[55vh] p-5 bg-slate-50/30">
              {activeTab === "layout" ? (
                <SeatLayoutView
                  seats={seats}
                  getMaxSeatsInRow={getMaxSeatsInRow}
                  getSeatColor={getSeatColor}
                  getSeatBorderColor={getSeatBorderColor}
                  getSeatTextColor={getSeatTextColor}
                  getSeatIcon={getSeatIcon}
                  getSeatPrice={getSeatPrice}
                  isSeatSelectable={isSeatSelectable}
                  onToggleSeat={onToggleSeat}
                  busData={busData}
                />
              ) : (
                <SummaryView
                  seats={seats}
                  selectedSeats={selectedSeats}
                  selectedSeatNumbers={selectedSeatNumbers}
                  totalPrice={totalPrice}
                  busData={busData}
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-white shadow-lg shadow-slate-200/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-extrabold text-indigo-600">
                      Rs. {totalPrice.toFixed(2)}
                    </p>
                    {selectedSeats.length > 1 && (
                      <p className="text-xs text-slate-400">
                        ({selectedSeats.length} seats)
                      </p>
                    )}
                  </div>
                  {selectedSeatNumbers.length > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedSeatNumbers.join(", ")}
                    </p>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirmBooking}
                  disabled={selectedSeats.length === 0 || isBooking}
                  className={cn(
                    "bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center gap-2 min-w-[140px] justify-center",
                    (selectedSeats.length === 0 || isBooking) &&
                      "opacity-50 cursor-not-allowed hover:shadow-indigo-500/25"
                  )}
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm Seats
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Sub-component: Seat Layout View
function SeatLayoutView({
  seats,
  getMaxSeatsInRow,
  getSeatColor,
  getSeatBorderColor,
  getSeatTextColor,
  getSeatIcon,
  getSeatPrice,
  isSeatSelectable,
  onToggleSeat,
  busData,
}: any) {
  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center mb-6 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-blue-100 border-2 border-blue-200" />
          <span className="text-xs text-slate-600">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-indigo-600 border-2 border-indigo-600" />
          <span className="text-xs text-slate-600">Your Seat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-amber-400 border-2 border-amber-500" />
          <span className="text-xs text-slate-600">Being Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-red-100 border-2 border-red-200" />
          <span className="text-xs text-slate-600">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-green-50 border-2 border-green-400 border-dashed" />
          <span className="text-xs text-slate-600">Extra Price</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="relative">
        <div className="flex justify-end mb-4">
          <div className="flex flex-col items-center bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-200">
              <Car className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Driver</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="flex flex-col items-center gap-2.5">
            {seats.map((row: Seat[], rowIndex: number) => {
              const maxSeats = getMaxSeatsInRow();
              const isCentered = row.length < maxSeats;
              const paddingLeft = isCentered ? (maxSeats - row.length) * 28 : 0;
              const halfIndex = Math.floor(row.length / 2);
              const leftSeats = row.slice(0, halfIndex);
              const rightSeats = row.slice(halfIndex);

              return (
                <div
                  key={rowIndex}
                  className="flex items-center gap-3 w-full justify-center"
                  style={{ paddingLeft: paddingLeft > 0 ? paddingLeft : 0 }}
                >
                  <div className="flex gap-1.5">
                    {leftSeats.map((seat: Seat, colIndex: number) => {
                      const hasExtra = parseFloat(seat.extra_price) > 0;
                      const Icon = getSeatIcon(seat);
                      const isSelectable = isSeatSelectable(seat);

                      return (
                        <button
                          key={`left-${colIndex}`}
                          onClick={() => onToggleSeat(rowIndex, colIndex)}
                          disabled={!isSelectable}
                          className={cn(
                            "relative w-11 h-11 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center hover:shadow-md",
                            !isSelectable && "opacity-60 cursor-not-allowed",
                            seat.is_mine && "scale-105 shadow-lg shadow-indigo-500/25",
                            seat.seat_type === "SLEEPER" && "w-12 h-12 rounded-2xl",
                            seat.seat_type === "VIP" && "border-amber-400",
                            hasExtra && !seat.is_mine && !seat.selected_by && "border-dashed border-2 border-green-400",
                            hasExtra && (seat.is_mine || seat.selected) && "border-dashed border-2 border-indigo-400",
                            isSelectable && !seat.is_mine && !seat.selected_by && !seat.selected && "hover:scale-105"
                          )}
                          style={{
                            backgroundColor: getSeatColor(seat),
                            borderColor: hasExtra 
                              ? seat.is_mine || seat.selected 
                                ? "#818cf8" 
                                : "#4ade80"
                              : getSeatBorderColor(seat),
                          }}
                        >
                          <Icon
                            className={cn(
                              "w-5 h-5 transition-colors",
                              seat.seat_type === "SLEEPER" && "w-5 h-5",
                              seat.seat_type === "VIP" && "w-5 h-5"
                            )}
                            style={{ color: getSeatTextColor(seat) }}
                          />
                          <span
                            className="text-[8px] font-semibold absolute bottom-0.5 right-1 opacity-80"
                            style={{ color: getSeatTextColor(seat) }}
                          >
                            {seat.seat_number}
                          </span>
                          {seat.is_mine && (
                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white shadow-sm">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                          {seat.is_window && (
                            <Grid2x2 className="w-3 h-3 text-blue-400 absolute -top-1 -left-1" />
                          )}
                          {hasExtra && !seat.is_mine && !seat.selected_by && !seat.selected && (
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-700 text-[8px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
                              +Rs.{seat.extra_price}
                            </div>
                          )}
                          {hasExtra && (seat.is_mine || seat.selected) && (
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-indigo-100 text-indigo-700 text-[8px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
                              +Rs.{seat.extra_price}
                            </div>
                          )}
                          {seat.selected_by && !seat.is_mine && (
                            <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[8px] font-medium text-amber-600 whitespace-nowrap">
                              {seat.selected_by_name || "Selecting..."}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="w-4 flex-shrink-0" />

                  <div className="flex gap-1.5">
                    {rightSeats.map((seat: Seat, colIndex: number) => {
                      const hasExtra = parseFloat(seat.extra_price) > 0;
                      const Icon = getSeatIcon(seat);
                      const isSelectable = isSeatSelectable(seat);
                      const actualColIndex = colIndex + halfIndex;

                      return (
                        <button
                          key={`right-${colIndex}`}
                          onClick={() => onToggleSeat(rowIndex, actualColIndex)}
                          disabled={!isSelectable}
                          className={cn(
                            "relative w-11 h-11 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center hover:shadow-md",
                            !isSelectable && "opacity-60 cursor-not-allowed",
                            seat.is_mine && "scale-105 shadow-lg shadow-indigo-500/25",
                            seat.seat_type === "SLEEPER" && "w-12 h-12 rounded-2xl",
                            seat.seat_type === "VIP" && "border-amber-400",
                            hasExtra && !seat.is_mine && !seat.selected_by && "border-dashed border-2 border-green-400",
                            hasExtra && (seat.is_mine || seat.selected) && "border-dashed border-2 border-indigo-400",
                            isSelectable && !seat.is_mine && !seat.selected_by && !seat.selected && "hover:scale-105"
                          )}
                          style={{
                            backgroundColor: getSeatColor(seat),
                            borderColor: hasExtra 
                              ? seat.is_mine || seat.selected 
                                ? "#818cf8" 
                                : "#4ade80"
                              : getSeatBorderColor(seat),
                          }}
                        >
                          <Icon
                            className="w-5 h-5 transition-colors"
                            style={{ color: getSeatTextColor(seat) }}
                          />
                          <span
                            className="text-[8px] font-semibold absolute bottom-0.5 right-1 opacity-80"
                            style={{ color: getSeatTextColor(seat) }}
                          >
                            {seat.seat_number}
                          </span>
                          {seat.is_mine && (
                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white shadow-sm">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                          {seat.is_window && (
                            <Grid2x2 className="w-3 h-3 text-blue-400 absolute -top-1 -left-1" />
                          )}
                          {hasExtra && !seat.is_mine && !seat.selected_by && !seat.selected && (
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-700 text-[8px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
                              +Rs.{seat.extra_price}
                            </div>
                          )}
                          {hasExtra && (seat.is_mine || seat.selected) && (
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-indigo-100 text-indigo-700 text-[8px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
                              +Rs.{seat.extra_price}
                            </div>
                          )}
                          {seat.selected_by && !seat.is_mine && (
                            <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[8px] font-medium text-amber-600 whitespace-nowrap">
                              {seat.selected_by_name || "Selecting..."}
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
    </div>
  );
}

// Sub-component: Summary View
function SummaryView({
  seats,
  selectedSeats,
  selectedSeatNumbers,
  totalPrice,
  busData,
}: any) {
  const selectedSeatDetails = selectedSeats.map((id: number) => {
    for (const row of seats) {
      for (const seat of row) {
        if (seat.id === id) {
          return seat;
        }
      }
    }
    return null;
  }).filter(Boolean);

  const basePrice = busData?.price || 0;

  return (
    <div className="space-y-4">
      {selectedSeatDetails.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sofa className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No seats selected yet</p>
          <p className="text-sm text-slate-400 mt-1">Please select seats from the layout tab</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3 shadow-sm">
            {selectedSeatDetails.map((seat: any, idx: number) => {
              const extraPrice = parseFloat(seat.extra_price) || 0;
              const seatTotal = basePrice + extraPrice;
              return (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: getSeatColorForSummary(seat) }}
                    >
                      <span className="text-sm font-bold text-white">
                        {seat.seat_number}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        Seat {seat.seat_number}
                      </p>
                      <p className="text-xs text-slate-400">
                        {seat.seat_type || "Standard"} • {seat.is_window ? "Window" : "Aisle"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm">
                      Rs. {seatTotal.toFixed(2)}
                    </p>
                    {extraPrice > 0 && (
                      <p className="text-[10px] text-green-600">+Rs.{extraPrice.toFixed(2)} extra</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600">Base Price</p>
                <p className="text-sm text-slate-600">Extra Charges</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">Total</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Rs. {basePrice.toFixed(2)}</p>
                <p className="text-sm text-slate-600">
                  Rs. {(totalPrice - basePrice * selectedSeats.length).toFixed(2)}
                </p>
                <p className="text-lg font-extrabold text-indigo-600 mt-1">
                  Rs. {totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700 font-medium">
                {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} selected
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getSeatColorForSummary(seat: any) {
  if (seat.seat_type === "SLEEPER") return "#3b82f6";
  if (seat.seat_type === "VIP") return "#f59e0b";
  return "#6366f1";
}