import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins:['192.168.101.10','192.168.101.5'],
  images:{
    "domains":["192.168.101.10","backend.yatrabus.com"]
  }

};

export default nextConfig;
