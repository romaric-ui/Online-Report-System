import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Explicit root to silence multi-lockfile warning */
  outputFileTracingRoot: path.join(__dirname),
  /* Standalone output: facilite l'exécution dans des environnements serverless / Netlify */
  output: 'standalone',
  /* Configuration pour les origines de développement autorisées */
  allowedDevOrigins: [
    '10.5.0.2',
    'localhost',
    '127.0.0.1',
    '::1'
  ],
  // (Ajoute d'autres options ici si nécessaire)
};

export default nextConfig;
