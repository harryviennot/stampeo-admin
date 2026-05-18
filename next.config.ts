import type { NextConfig } from "next";


const nextConfig: NextConfig = {
    output: "standalone",
    allowedDevOrigins: [
        "stampeo.10.196.9.69.nip.io",
        "10.196.9.69",
    ],
};

export default nextConfig;
