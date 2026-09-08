export interface Seat {
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

export interface WebSocketSeatEvent {
  type: "initial_seats" | "seat_selected" | "seat_available" | "error" | "pong";
  seat_id?: string;
  user_id?: number;
  username?: string;
  seats?: any[];
  message?: string;
}

export interface City {
  id: number;
  name: string;
  province: string;
  latitude: string;
  longitude: string;
}

export interface BusData {
  id: string;
  name: string;
  type: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  rating: number;
  busNumber: string;
  amenities: any[];
  description: string;
  driver: {
    name: string;
    phone: string;
    experience: string;
    rating: number;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  seatLayout: { left: number; right: number };
  status: string;
  operator: string;
  bus: number;
}