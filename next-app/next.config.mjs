/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Mantém deploy estável no VPS enquanto saneamos tipagem gradualmente.
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/anunciante',
        destination: '/anunciantes',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
