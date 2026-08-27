export type BusType = "AC Deluxe" | "Sofa Seater" | "Non-AC" | "Micro";

export interface SearchQuery {
  from: string;
  to: string;
  date: string; // ISO date
  passengers: number;
}

export interface Bus {
  id: string;
  operator: string;
  busType: BusType;
  from: string;
  to: string;
  departTime: string; // "06:30"
  arriveTime: string; // "13:45"
  durationLabel: string; // "7h 15m"
  price: number; // NPR
  rating: number; // 0-5
  seatsLeft: number;
  amenities: string[];
  boardingPoints: string[];
}

export type SeatStatus = "available" | "selected" | "booked" | "female-only";

export interface Seat {
  id: string; // "U1", "L4" etc.
  deck: "lower" | "upper";
  row: number;
  col: number;
  status: SeatStatus;
}

export interface Passenger {
  seatId: string;
  name: string;
  age: string;
  gender: "Male" | "Female" | "Other";
}

export type Step = "search" | "results" | "seats" | "passengers" | "confirm";
