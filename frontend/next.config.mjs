/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // In production, NEXT_PUBLIC_API_URL points to the Render backend URL.
    // In development, it falls back to http://localhost:5000.
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://path-finder-backend-0rkz.onrender.com/';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
