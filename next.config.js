/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  async rewrites() {
    return [
      // Serve the standalone provider portal (public/portal.html) at a clean URL.
      { source: "/portal", destination: "/portal.html" },
    ];
  },
};

module.exports = nextConfig;
