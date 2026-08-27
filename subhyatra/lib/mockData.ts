import { Bus, Seat } from "./types";

export const CITIES = [
  "Kathmandu",
  "Pokhara",
  "Butwal",
  "Chitwan",
  "Biratnagar",
  "Dharan",
  "Nepalgunj",
  "Birgunj",
  "Janakpur",
  "Bhairahawa",
];

export function buildMockBuses(from: string, to: string): Bus[] {
  const operators = [
    { name: "Himalayan Yatayat", type: "AC Deluxe" as const, rating: 4.6 },
    { name: "Greenline Nepal", type: "AC Deluxe" as const, rating: 4.8 },
    { name: "Sundar Yatra Sewa", type: "Sofa Seater" as const, rating: 4.2 },
    { name: "Baba Bland Travels", type: "Non-AC" as const, rating: 3.9 },
    { name: "Everest Link Coach", type: "AC Deluxe" as const, rating: 4.4 },
    { name: "Prithvi Express", type: "Micro" as const, rating: 4.0 },
    { name: "Annapurna Deluxe", type: "Sofa Seater" as const, rating: 4.5 },
  ];

  const departures = [
    "05:30", "06:15", "07:00", "08:45", "10:30",
    "13:00", "16:20", "19:00", "20:30", "21:15",
  ];

  return operators.map((op, i) => {
    const depart = departures[i % departures.length];
    const durationHrs = 6 + (i % 5);
    const durationMin = (i * 13) % 60;
    const [dh, dm] = depart.split(":").map(Number);
    const totalMin = dh * 60 + dm + durationHrs * 60 + durationMin;
    const arriveH = Math.floor(totalMin / 60) % 24;
    const arriveM = totalMin % 60;
    const arrive = `${String(arriveH).padStart(2, "0")}:${String(
      arriveM
    ).padStart(2, "0")}`;

    const basePrice =
      op.type === "AC Deluxe" ? 1800 : op.type === "Sofa Seater" ? 1400 : op.type === "Micro" ? 900 : 1100;

    const amenities =
      op.type === "AC Deluxe"
        ? ["WiFi", "Charging Port", "Blanket", "Water Bottle"]
        : op.type === "Sofa Seater"
        ? ["Charging Port", "Water Bottle"]
        : op.type === "Micro"
        ? ["Direct Route"]
        : ["Charging Port"];

    return {
      id: `bus-${i}`,
      operator: op.name,
      busType: op.type,
      from,
      to,
      departTime: depart,
      arriveTime: arrive,
      durationLabel: `${durationHrs}h ${durationMin}m`,
      price: basePrice + i * 35,
      rating: op.rating,
      seatsLeft: [2, 4, 7, 12, 18, 1, 9][i % 7],
      amenities,
      boardingPoints: [
        `${from} New Bus Park`,
        `${from} City Center`,
        `${from} Ring Road`,
      ],
    };
  });
}

const BOOKED_SET = new Set(["L3", "L7", "L12", "L18", "U2", "U9", "U15"]);
const FEMALE_SET = new Set(["L5", "L20"]);

export function buildSeatMap(): Seat[] {
  const seats: Seat[] = [];
  // Lower deck: 9 rows x 4 cols with aisle gap between col 2 & 3 (2+2), last row is a 5-seat back row
  for (let row = 1; row <= 9; row++) {
    for (let col = 1; col <= 4; col++) {
      const num = (row - 1) * 4 + col;
      const id = `L${num}`;
      seats.push({
        id,
        deck: "lower",
        row,
        col,
        status: BOOKED_SET.has(id)
          ? "booked"
          : FEMALE_SET.has(id)
          ? "female-only"
          : "available",
      });
    }
  }
  return seats;
}
