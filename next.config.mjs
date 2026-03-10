/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: false,
  turbopack: {
    // sourceMap: false, // This option is not valid
  },
}

export default nextConfig
