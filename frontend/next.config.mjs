/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: undefined,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
}
export default nextConfig;