/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    viewTransition: true,
  },
  output: "export",
  distDir: 'electron/out'
}
 
export default nextConfig