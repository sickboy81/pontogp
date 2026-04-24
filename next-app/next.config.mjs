import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita aviso e raiz errada quando existe outro package-lock fora de next-app/
  turbopack: { root: __dirname },
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ['sharp', 'ffmpeg-static'],
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
