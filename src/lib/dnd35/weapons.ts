export interface WeaponTemplate {
  nom: string
  degats: string
  crit: string       // format: "20-20/×2", "19-20/×2", "18-20/×2", etc.
  typeDegats: 'T' | 'C' | 'P'
  portee: string     // 'Contact' ou '27 m'
  categorie: 'Courante' | 'Guerre' | 'Exotique'
}

export const WEAPONS_DND35: WeaponTemplate[] = [
  // ─── Armes courantes ─────────────────────────────────────────────────────────
  // Légères
  { nom: 'Gourdin',            degats: '1d6',    crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', categorie: 'Courante' },
  { nom: 'Dague',              degats: '1d4',    crit: '19-20/×2', typeDegats: 'P', portee: 'Contact', categorie: 'Courante' },
  { nom: 'Dague (lancée)',     degats: '1d4',    crit: '19-20/×2', typeDegats: 'P', portee: '3 m',     categorie: 'Courante' },
  { nom: 'Faucille',           degats: '1d6',    crit: '20-20/×2', typeDegats: 'T', portee: 'Contact', categorie: 'Courante' },
  { nom: 'Gantelet',           degats: '1d3',    crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', categorie: 'Courante' },
  { nom: 'Gantelet clouté',    degats: '1d4',    crit: '20-20/×2', typeDegats: 'P', portee: 'Contact', categorie: 'Courante' },
  { nom: 'Matraque',           degats: '1d6',    crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', categorie: 'Courante' },
  // Une main
  { nom: 'Masse légère',       degats: '1d6',    crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', categorie: 'Courante' },
  { nom: 'Masse lourde',       degats: '1d8',    crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', categorie: 'Courante' },
  { nom: 'Morgenstern',        degats: '1d8',    crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', categorie: 'Courante' },
  { nom: 'Lance courte',       degats: '1d6',    crit: '20-20/×2', typeDegats: 'P', portee: 'Contact', categorie: 'Courante' },
  // Deux mains
  { nom: 'Bâton de combat',    degats: '1d6',    crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', categorie: 'Courante' },
  { nom: 'Lance',              degats: '1d8',    crit: '20-20/×3', typeDegats: 'P', portee: 'Contact', categorie: 'Courante' },
  { nom: 'Lance longue',       degats: '1d8',    crit: '20-20/×3', typeDegats: 'P', portee: 'Contact', categorie: 'Courante' },
  // Distance
  { nom: 'Arbalète légère',   degats: '1d8',    crit: '19-20/×2', typeDegats: 'P', portee: '24 m',    categorie: 'Courante' },
  { nom: 'Arbalète lourde',   degats: '1d10',   crit: '19-20/×2', typeDegats: 'P', portee: '36 m',    categorie: 'Courante' },
  { nom: 'Dard',               degats: '1d4',    crit: '20-20/×2', typeDegats: 'P', portee: '5 m',     categorie: 'Courante' },
  { nom: 'Fronde',             degats: '1d4',    crit: '20-20/×2', typeDegats: 'C', portee: '15 m',    categorie: 'Courante' },
  { nom: 'Javeline',           degats: '1d6',    crit: '20-20/×2', typeDegats: 'P', portee: '9 m',     categorie: 'Courante' },

  // ─── Armes de guerre ─────────────────────────────────────────────────────────
  // Légères
  { nom: 'Hachette',           degats: '1d6',    crit: '20-20/×3', typeDegats: 'T', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Hachette (lancée)',  degats: '1d6',    crit: '20-20/×2', typeDegats: 'T', portee: '9 m',     categorie: 'Guerre' },
  { nom: 'Kukri',              degats: '1d4',    crit: '18-20/×2', typeDegats: 'T', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Marteau léger',      degats: '1d4',    crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Marteau léger (lancé)', degats: '1d4', crit: '20-20/×2', typeDegats: 'C', portee: '6 m',    categorie: 'Guerre' },
  { nom: 'Pic léger',          degats: '1d4',    crit: '20-20/×4', typeDegats: 'P', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Épée courte',        degats: '1d6',    crit: '19-20/×2', typeDegats: 'P', portee: 'Contact', categorie: 'Guerre' },
  // Une main
  { nom: 'Hache de bataille',  degats: '1d8',    crit: '20-20/×3', typeDegats: 'T', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Fléau',              degats: '1d8',    crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Épée longue',        degats: '1d8',    crit: '19-20/×2', typeDegats: 'T', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Pic lourd',          degats: '1d6',    crit: '20-20/×4', typeDegats: 'P', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Rapière',            degats: '1d6',    crit: '18-20/×2', typeDegats: 'P', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Cimeterre',          degats: '1d6',    crit: '18-20/×2', typeDegats: 'T', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Trident',            degats: '1d8',    crit: '20-20/×2', typeDegats: 'P', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Marteau de guerre',  degats: '1d8',    crit: '20-20/×3', typeDegats: 'C', portee: 'Contact', categorie: 'Guerre' },
  // Deux mains
  { nom: 'Fauchon',            degats: '2d4',    crit: '18-20/×2', typeDegats: 'T', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Glaive',             degats: '1d10',   crit: '20-20/×3', typeDegats: 'T', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Grande hache',       degats: '1d12',   crit: '20-20/×3', typeDegats: 'T', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Grand gourdin',      degats: '1d10',   crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Épée à deux mains',  degats: '2d6',    crit: '19-20/×2', typeDegats: 'T', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Guisarme',           degats: '2d4',    crit: '20-20/×3', typeDegats: 'T', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Hallebarde',         degats: '1d10',   crit: '20-20/×3', typeDegats: 'P', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Fléau lourd',        degats: '1d10',   crit: '19-20/×2', typeDegats: 'C', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Lance de cavalerie', degats: '1d8',    crit: '20-20/×3', typeDegats: 'P', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Ranseur',            degats: '2d4',    crit: '20-20/×3', typeDegats: 'P', portee: 'Contact', categorie: 'Guerre' },
  { nom: 'Faux de guerre',     degats: '2d4',    crit: '20-20/×4', typeDegats: 'T', portee: 'Contact', categorie: 'Guerre' },
  // Distance
  { nom: 'Arc court',          degats: '1d6',    crit: '20-20/×3', typeDegats: 'P', portee: '18 m',    categorie: 'Guerre' },
  { nom: 'Arc long',           degats: '1d8',    crit: '20-20/×3', typeDegats: 'P', portee: '27 m',    categorie: 'Guerre' },
  { nom: 'Arc court composite', degats: '1d6',   crit: '20-20/×3', typeDegats: 'P', portee: '18 m',    categorie: 'Guerre' },
  { nom: 'Arc long composite',  degats: '1d8',   crit: '20-20/×3', typeDegats: 'P', portee: '27 m',    categorie: 'Guerre' },

  // ─── Armes exotiques ─────────────────────────────────────────────────────────
  // Légères
  { nom: 'Kama',               degats: '1d6',    crit: '20-20/×2', typeDegats: 'T', portee: 'Contact', categorie: 'Exotique' },
  { nom: 'Nunchaku',           degats: '1d6',    crit: '20-20/×2', typeDegats: 'C', portee: 'Contact', categorie: 'Exotique' },
  { nom: 'Sai',                degats: '1d4',    crit: '20-20/×2', typeDegats: 'P', portee: 'Contact', categorie: 'Exotique' },
  { nom: 'Siangham',           degats: '1d6',    crit: '20-20/×2', typeDegats: 'P', portee: 'Contact', categorie: 'Exotique' },
  // Une main
  { nom: 'Épée bâtarde',       degats: '1d10',   crit: '19-20/×2', typeDegats: 'T', portee: 'Contact', categorie: 'Exotique' },
  { nom: 'Hache de guerre naine', degats: '1d10', crit: '20-20/×3', typeDegats: 'T', portee: 'Contact', categorie: 'Exotique' },
  { nom: 'Fouet',              degats: '1d3',    crit: '20-20/×2', typeDegats: 'T', portee: 'Contact', categorie: 'Exotique' },
  // Deux mains
  { nom: 'Épée à deux lames',  degats: '1d8/1d8', crit: '19-20/×2', typeDegats: 'T', portee: 'Contact', categorie: 'Exotique' },
  { nom: 'Double hache orque', degats: '1d8/1d8', crit: '20-20/×3', typeDegats: 'T', portee: 'Contact', categorie: 'Exotique' },
  { nom: 'Chaîne cloutée',     degats: '2d4',    crit: '20-20/×2', typeDegats: 'P', portee: 'Contact', categorie: 'Exotique' },
  { nom: 'Hallebarde naine',   degats: '1d8/1d6', crit: '20-20/×3', typeDegats: 'P', portee: 'Contact', categorie: 'Exotique' },
  { nom: 'Marteau-crochet gnome', degats: '1d6/1d4', crit: '20-20/×3', typeDegats: 'C', portee: 'Contact', categorie: 'Exotique' },
  // Distance
  { nom: 'Arbalète de poing',  degats: '1d4',    crit: '19-20/×2', typeDegats: 'P', portee: '9 m',     categorie: 'Exotique' },
  { nom: 'Arbalète légère à répétition', degats: '1d8',  crit: '19-20/×2', typeDegats: 'P', portee: '24 m', categorie: 'Exotique' },
  { nom: 'Arbalète lourde à répétition', degats: '1d10', crit: '19-20/×2', typeDegats: 'P', portee: '36 m', categorie: 'Exotique' },
  { nom: 'Shuriken',           degats: '1d2',    crit: '20-20/×2', typeDegats: 'P', portee: '9 m',     categorie: 'Exotique' },
  { nom: 'Bolas',              degats: '1d4',    crit: '20-20/×2', typeDegats: 'C', portee: '5 m',     categorie: 'Exotique' },
]

export const WEAPON_CATEGORIES = ['Courante', 'Guerre', 'Exotique'] as const
