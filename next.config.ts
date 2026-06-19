import type { NextConfig } from "next";


const nextConfig: NextConfig = {
    output: "standalone",
    allowedDevOrigins: [
        "stampeo.10.1.241.183.nip.io",
        "10.1.241.183",
        "172.16.1.181",
        "172.16.1.230",
        "10.200.34.204",
    ],
};

export default nextConfig;
