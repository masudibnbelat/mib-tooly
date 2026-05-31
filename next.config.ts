import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
};

module.exports = {
  allowedDevOrigins: ["192.168.0.110"],
};

export default nextConfig;
