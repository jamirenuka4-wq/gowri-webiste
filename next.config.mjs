/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow better-sqlite3 native addon (Next.js 15/16 API)
  serverExternalPackages: ['better-sqlite3', 'bcryptjs', 'jsonwebtoken'],
  // Disable image optimization for simpler static serving
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
