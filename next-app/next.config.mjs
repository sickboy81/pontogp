import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita aviso e raiz errada quando existe outro package-lock fora de next-app/
  turbopack: { root: __dirname },
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Em VPS pequena, o otimizador runtime do Next pode gerar picos de CPU/RAM
    // ao processar muitas imagens remotas do PocketBase. Mantemos <Image />,
    // mas servimos os arquivos diretamente para preservar estabilidade.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'pocketbase.cerejavip.com' },
      { protocol: 'https', hostname: 'cerejavip.com' },
      { protocol: 'https', hostname: 'www.cerejavip.com' },
    ],
  },
  serverExternalPackages: ['sharp', 'ffmpeg-static'],
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
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/service-worker.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
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
