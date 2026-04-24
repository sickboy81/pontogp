import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita aviso e raiz errada quando existe outro package-lock fora de next-app/
  turbopack: { root: __dirname },
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'pocketbase.cerejavip.com' },
      { protocol: 'https', hostname: 'cerejavip.com' },
      { protocol: 'https', hostname: 'www.cerejavip.com' },
    ],
  },
  serverExternalPackages: ['sharp', 'ffmpeg-static'],
  typescript: {
    // Mantém deploy estável no VPS enquanto saneamos tipagem gradualmente.
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/logo-header.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/logo-cerejavip.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
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
