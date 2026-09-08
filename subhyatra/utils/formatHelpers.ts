import { Wifi, Battery, Snowflake, Tv, Droplets, CheckCircle } from "lucide-react";

export const formatTime = (datetime: string) => {
  if (!datetime) return "N/A";
  const date = new Date(datetime);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatDate = (datetime: string) => {
  if (!datetime) return "N/A";
  const date = new Date(datetime);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const calculateDuration = (departure: string, arrival: string) => {
  if (!departure || !arrival) return "N/A";
  const start = new Date(departure);
  const end = new Date(arrival);
  const diffMs = end.getTime() - start.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHrs > 0) {
    return `${diffHrs}h ${diffMins > 0 ? diffMins + "m" : ""}`;
  }
  return `${diffMins}m`;
};

export const getAmenities = (data: any) => {
  const amenities = [];
  if (data.wifi) amenities.push({ name: "WiFi", icon: Wifi });
  if (data.charging) amenities.push({ name: "Charging Point", icon: Battery });
  if (data.ac) amenities.push({ name: "AC", icon: Snowflake });
  if (data.tv) amenities.push({ name: "TV", icon: Tv });
  if (data.water) amenities.push({ name: "Water Bottle", icon: Droplets });
  return amenities.length > 0
    ? amenities
    : [{ name: "Standard", icon: CheckCircle }];
};