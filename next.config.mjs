/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/clientes', destination: '/titulares', permanent: false },
    ]
  },
};

export default nextConfig;
