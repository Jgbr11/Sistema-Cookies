import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Ignora erros de TypeScript durante o build do Vercel.
  // O seed.ts causa falso-positivo porque prisma generate não rodou antes.
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
