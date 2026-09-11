/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const apiServerUrl = process.env.API_SERVER_URL || "http://localhost:4000";
    return [
      {
        source: "/api/node/:path*",
        destination: `${apiServerUrl}/api/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${apiServerUrl}/api/:path*`,
      },
      {
        source: "/node-health",
        destination: `${apiServerUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
