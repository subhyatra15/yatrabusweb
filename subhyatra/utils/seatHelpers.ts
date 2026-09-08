import { Seat } from "@/types";

export const getSeatColor = (seat: any) => {
  if (!seat.available) {
    if (seat.is_mine) return "#4f46e5";
    if (seat.selected_by) return "#fbbf24";
    return "#fee2e2";
  }
  if (seat.selected) return "#4f46e5";
  if (seat.seat_type === "SLEEPER") return "#dbeafe";
  if (seat.seat_type === "VIP") return "#fef3c7";
  return "#dbeafe";
};

export const getSeatBorderColor = (seat: any) => {
  if (!seat.available) {
    if (seat.is_mine) return "#4f46e5";
    if (seat.selected_by) return "#fbbf24";
    return "#fca5a5";
  }
  if (seat.selected) return "#4f46e5";
  if (seat.seat_type === "SLEEPER") return "#60a5fa";
  if (seat.seat_type === "VIP") return "#fbbf24";
  return "#93c5fd";
};

export const getSeatTextColor = (seat: any) => {
  if (!seat.available) {
    if (seat.is_mine) return "#ffffff";
    if (seat.selected_by) return "#d97706";
    return "#ef4444";
  }
  if (seat.selected) return "#ffffff";
  if (seat.seat_type === "SLEEPER") return "#2563eb";
  if (seat.seat_type === "VIP") return "#d97706";
  return "#4f46e5";
};

export const getSeatIcon = (seat: any) => {
  if (!seat.available) {
    if (seat.is_mine) return "Check";
    if (seat.selected_by) return "Clock";
    return "Sofa";
  }
  if (seat.seat_type === "SLEEPER") return "Bed";
  if (seat.seat_type === "VIP") return "StarIcon";
  return "Sofa";
};

export const processSeatsData = (scheduleSeats: Seat[], busSeats: any[], userId?: number | null) => {
  const bookedSeats = new Set<string>();

  scheduleSeats.forEach((seat) => {
    if (seat.status === "BOOKED") {
      bookedSeats.add(seat.seat_number.toString());
    }
  });

  // Sort seats by row and col
  const sortedSeats = [...busSeats].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  // Group seats by row
  const seatsByRow: { [key: number]: any[] } = {};

  sortedSeats.forEach((seat) => {
    if (!seatsByRow[seat.row]) {
      seatsByRow[seat.row] = [];
    }
    seatsByRow[seat.row].push(seat);
  });

  const rows: any[] = [];

  // Process each row maintaining the exact seat positions
  Object.keys(seatsByRow)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((rowNumber) => {
      const rowSeats = seatsByRow[rowNumber]
        .sort((a, b) => a.col - b.col)
        .map((seat) => ({
          ...seat,
          id: seat.id,
          seat_number: seat.seat_number,
          available: !bookedSeats.has(seat.seat_number.toString()),
          selected: false,
          seat_type: seat.seat_type || "NORMAL",
          is_window: seat.is_window || false,
          is_mine: false,
          selected_by: undefined,
          selected_by_name: undefined,
          extra_price: seat.extra_price || "0.00",
        }));

      rows.push(rowSeats);
    });

  return rows;
};

export const getSeatPrice = (seat: any, basePrice: number) => {
  const extraPrice = parseFloat(seat.extra_price) || 0;
  return basePrice + extraPrice;
};

export const calculateTotalPrice = (seats: any[], selectedSeats: number[], basePrice: number) => {
  return selectedSeats.reduce((total, seatId) => {
    let seatPrice = basePrice;
    seats.forEach((row) => {
      row.forEach((s: any) => {
        if (s.id === seatId) {
          const extra = parseFloat(s.extra_price) || 0;
          seatPrice += extra;
        }
      });
    });
    return total + seatPrice;
  }, 0);
};

// WebSocket message handler for seats
export const updateSeatsFromWebSocket = (seats: any[], wsSeats: any[], userId: number | null) => {
  return seats.map((row) => {
    return row.map((seat: any) => {
      const wsSeat = wsSeats.find(
        (s: any) => s.seat_id === seat.id.toString(),
      );
      if (wsSeat) {
        const isMine = wsSeat.user_id === userId;
        return {
          ...seat,
          available: false,
          selected_by: wsSeat.user_id,
          selected_by_name: wsSeat.name,
          is_mine: isMine,
          selected: isMine,
        };
      }
      return {
        ...seat,
        available: true,
        selected_by: undefined,
        selected_by_name: undefined,
        is_mine: false,
        selected: false,
      };
    });
  });
};

export const markSeatAsSelected = (seats: any[], seatId: string, userId: number | null, username?: string) => {
  return seats.map((row) => {
    return row.map((seat: any) => {
      if (seat.id.toString() === seatId) {
        const isMine = userId !== null;
        return {
          ...seat,
          available: false,
          selected_by: userId || undefined,
          selected_by_name: username,
          is_mine: isMine,
          selected: isMine,
        };
      }
      return seat;
    });
  });
};

export const markSeatAsAvailable = (seats: any[], seatId: string) => {
  return seats.map((row) => {
    return row.map((seat: any) => {
      if (seat.id.toString() === seatId) {
        return {
          ...seat,
          available: true,
          selected_by: undefined,
          selected_by_name: undefined,
          is_mine: false,
          selected: false,
        };
      }
      return seat;
    });
  });
};