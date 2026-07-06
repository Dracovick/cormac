import type { MetadataRoute } from 'next'

// Manifest PWA : permet d'installer le Grimoire sur l'écran d'accueil (iPhone/Android)
// et de l'ouvrir plein écran, sans barre de navigateur.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Grimoire D&D 3e édition',
    short_name: 'Grimoire',
    description: 'Fiches de personnages et journal de partie — Donjons & Dragons 3.5',
    start_url: '/',
    display: 'standalone',
    background_color: '#080608',
    theme_color: '#0c0a09',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
