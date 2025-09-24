import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Explicit root to silence multi-lockfile warning */
  outputFileTracingRoot: path.join(__dirname),
  /* Standalone output: facilite l'exécution dans des environnements serverless / Netlify */
  output: 'standalone',
  // (Ajoute d'autres options ici si nécessaire)
};

export default nextConfig;
