/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverComponentsExternalPackages: ['docx', 'jszip'] },
};
module.exports = nextConfig;
