import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Chromium et puppeteer ne doivent pas passer par le bundler : le binaire de
     Chromium est un fichier `.br` chargé au moment de l'exécution, et puppeteer
     résout ses modules par chemin. Les laisser externes les copie tels quels
     dans la fonction `/api/pdf`. */
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  /* Les quatre archives brotli de `@sparticuz/chromium/bin` sont ouvertes par
     chemin à l'exécution, jamais par un `import` : l'analyse de dépendances ne
     les voit pas et la fonction partirait sans son navigateur. On les joint
     explicitement à la route qui s'en sert. */
  outputFileTracingIncludes: {
    "/api/pdf": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
