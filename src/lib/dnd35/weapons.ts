/**
 * Les armes du Manuel des Joueurs 3.5 — table 7-5 (p. 116-117).
 *
 * ⛔ FICHIER GÉNÉRÉ. Ne pas modifier à la main :
 *    npx tsx menage-references/p9-liste-formulaire.mts
 *
 * La source est `menage-references/p7-armes-catalogue.json`, le relevé à
 * l'image du livre — celui qui a aussi semé le catalogue publié à la
 * Bibliothèque. Les deux disaient autrefois des choses différentes : 25
 * anciennes traductions et 6 valeurs fausses dans cette liste. Comme choisir
 * une entrée réécrit la référence partagée (« la saisie fait foi »), la liste
 * reprenait le dessus sur le catalogue au premier enregistrement.
 *
 * Le nom tombe à l'octet près sur celui de l'entrée de catalogue en base :
 * c'est ce qui fait que choisir une arme réutilise la référence partagée au
 * lieu d'en créer une jumelle (`findOrCreateByNom`).
 */

export type WeaponCategorie = 'Courante' | 'Guerre' | 'Exotique' | 'Munition'

export interface WeaponTemplate {
  nom: string
  /** Groupe du livre : « Arme de guerre — corps à corps à une main ». */
  famille: string
  /** Courante / de guerre / exotique : c'est elle qui décide du don de maniement. */
  categorie: WeaponCategorie
  /** Dégâts pour une arme de taille M, puis pour une arme de taille P. */
  degats: string | null
  degatsP: string | null
  /** null pour les munitions et le filet : le livre ne leur donne pas de
   *  critique propre (la munition prend celui de son arme de tir). */
  critMin: number | null
  critMult: number | null
  typeDegats: 'T' | 'C' | 'P'
  /** 'Contact' ou « 9 m ». Une arme de contact lançable reste à 'Contact' :
   *  son facteur de portée ne vaut que pour son entrée « (lancée) ». */
  portee: string
  /** Entrée de mode de lancer d'une arme de contact (« Dague (lancée) »). */
  modeLancer?: boolean
}

export const WEAPONS_DND35: WeaponTemplate[] = [
  // ── Arme courante — à distance ──
  { nom: 'Arbalète légère', famille: 'Arme courante — à distance', categorie: 'Courante', degats: '1d8', degatsP: '1d6', critMin: 19, critMult: 2, typeDegats: 'P', portee: '24 m' },
  { nom: 'Arbalète lourde', famille: 'Arme courante — à distance', categorie: 'Courante', degats: '1d10', degatsP: '1d8', critMin: 19, critMult: 2, typeDegats: 'P', portee: '36 m' },
  { nom: 'Dard', famille: 'Arme courante — à distance', categorie: 'Courante', degats: '1d4', degatsP: '1d3', critMin: 20, critMult: 2, typeDegats: 'P', portee: '6 m' },
  { nom: 'Fronde', famille: 'Arme courante — à distance', categorie: 'Courante', degats: '1d4', degatsP: '1d3', critMin: 20, critMult: 2, typeDegats: 'C', portee: '15 m' },
  { nom: 'Javeline', famille: 'Arme courante — à distance', categorie: 'Courante', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'P', portee: '9 m' },
  // ── Arme courante — combat à mains nues ──
  { nom: 'Attaque à mains nues', famille: 'Arme courante — combat à mains nues', categorie: 'Courante', degats: '1d3', degatsP: '1d2', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Gantelet', famille: 'Arme courante — combat à mains nues', categorie: 'Courante', degats: '1d3', degatsP: '1d2', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  // ── Arme courante — corps à corps à deux mains ──
  { nom: 'Bâton', famille: 'Arme courante — corps à corps à deux mains', categorie: 'Courante', degats: '1d6/1d6', degatsP: '1d4/1d4', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Lance', famille: 'Arme courante — corps à corps à deux mains', categorie: 'Courante', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 3, typeDegats: 'P', portee: '6 m' },
  { nom: 'Pique', famille: 'Arme courante — corps à corps à deux mains', categorie: 'Courante', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 3, typeDegats: 'P', portee: 'Contact' },
  // ── Arme courante — corps à corps à une main ──
  { nom: 'Épieu', famille: 'Arme courante — corps à corps à une main', categorie: 'Courante', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'P', portee: '6 m' },
  { nom: 'Gourdin', famille: 'Arme courante — corps à corps à une main', categorie: 'Courante', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'C', portee: '3 m' },
  { nom: 'Masse d\'armes lourde', famille: 'Arme courante — corps à corps à une main', categorie: 'Courante', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Morgenstern', famille: 'Arme courante — corps à corps à une main', categorie: 'Courante', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  // ── Arme courante — corps à corps légère ──
  { nom: 'Dague', famille: 'Arme courante — corps à corps légère', categorie: 'Courante', degats: '1d4', degatsP: '1d3', critMin: 19, critMult: 2, typeDegats: 'P', portee: '3 m' },
  { nom: 'Dague coup-de-poing', famille: 'Arme courante — corps à corps légère', categorie: 'Courante', degats: '1d4', degatsP: '1d3', critMin: 20, critMult: 3, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Gantelet clouté', famille: 'Arme courante — corps à corps légère', categorie: 'Courante', degats: '1d4', degatsP: '1d3', critMin: 20, critMult: 2, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Masse d\'armes légère', famille: 'Arme courante — corps à corps légère', categorie: 'Courante', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Serpe', famille: 'Arme courante — corps à corps légère', categorie: 'Courante', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'T', portee: 'Contact' },
  // ── Arme de guerre — à distance ──
  { nom: 'Arc court', famille: 'Arme de guerre — à distance', categorie: 'Guerre', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 3, typeDegats: 'P', portee: '18 m' },
  { nom: 'Arc court composite', famille: 'Arme de guerre — à distance', categorie: 'Guerre', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 3, typeDegats: 'P', portee: '21 m' },
  { nom: 'Arc long', famille: 'Arme de guerre — à distance', categorie: 'Guerre', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 3, typeDegats: 'P', portee: '30 m' },
  { nom: 'Arc long composite', famille: 'Arme de guerre — à distance', categorie: 'Guerre', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 3, typeDegats: 'P', portee: '33 m' },
  // ── Arme de guerre — corps à corps à deux mains ──
  { nom: 'Cimeterre à deux mains', famille: 'Arme de guerre — corps à corps à deux mains', categorie: 'Guerre', degats: '2d4', degatsP: '1d6', critMin: 18, critMult: 2, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Corsèque', famille: 'Arme de guerre — corps à corps à deux mains', categorie: 'Guerre', degats: '2d4', degatsP: '1d6', critMin: 20, critMult: 3, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Coutille', famille: 'Arme de guerre — corps à corps à deux mains', categorie: 'Guerre', degats: '1d10', degatsP: '1d8', critMin: 20, critMult: 3, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Épée à deux mains', famille: 'Arme de guerre — corps à corps à deux mains', categorie: 'Guerre', degats: '2d6', degatsP: '1d10', critMin: 19, critMult: 2, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Faux', famille: 'Arme de guerre — corps à corps à deux mains', categorie: 'Guerre', degats: '2d4', degatsP: '1d6', critMin: 20, critMult: 4, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Fléau d\'armes lourd', famille: 'Arme de guerre — corps à corps à deux mains', categorie: 'Guerre', degats: '1d10', degatsP: '1d8', critMin: 19, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Grande hache', famille: 'Arme de guerre — corps à corps à deux mains', categorie: 'Guerre', degats: '1d12', degatsP: '1d10', critMin: 20, critMult: 3, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Guisarme', famille: 'Arme de guerre — corps à corps à deux mains', categorie: 'Guerre', degats: '2d4', degatsP: '1d6', critMin: 20, critMult: 3, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Hallebarde', famille: 'Arme de guerre — corps à corps à deux mains', categorie: 'Guerre', degats: '1d10', degatsP: '1d8', critMin: 20, critMult: 3, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Lance d\'arçon', famille: 'Arme de guerre — corps à corps à deux mains', categorie: 'Guerre', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 3, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Massue', famille: 'Arme de guerre — corps à corps à deux mains', categorie: 'Guerre', degats: '1d10', degatsP: '1d8', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  // ── Arme de guerre — corps à corps à une main ──
  { nom: 'Cimeterre', famille: 'Arme de guerre — corps à corps à une main', categorie: 'Guerre', degats: '1d6', degatsP: '1d4', critMin: 18, critMult: 2, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Écu', famille: 'Arme de guerre — corps à corps à une main', categorie: 'Guerre', degats: '1d4', degatsP: '1d3', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Écu à pointes', famille: 'Arme de guerre — corps à corps à une main', categorie: 'Guerre', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Épée longue', famille: 'Arme de guerre — corps à corps à une main', categorie: 'Guerre', degats: '1d8', degatsP: '1d6', critMin: 19, critMult: 2, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Fléau d\'armes léger', famille: 'Arme de guerre — corps à corps à une main', categorie: 'Guerre', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Hache d\'armes', famille: 'Arme de guerre — corps à corps à une main', categorie: 'Guerre', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 3, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Marteau de guerre', famille: 'Arme de guerre — corps à corps à une main', categorie: 'Guerre', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 3, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Pic de guerre lourd', famille: 'Arme de guerre — corps à corps à une main', categorie: 'Guerre', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 4, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Rapière', famille: 'Arme de guerre — corps à corps à une main', categorie: 'Guerre', degats: '1d6', degatsP: '1d4', critMin: 18, critMult: 2, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Trident', famille: 'Arme de guerre — corps à corps à une main', categorie: 'Guerre', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 2, typeDegats: 'P', portee: '3 m' },
  // ── Arme de guerre — corps à corps légère ──
  { nom: 'Arme à pointes', famille: 'Arme de guerre — corps à corps légère', categorie: 'Guerre', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Épée courte', famille: 'Arme de guerre — corps à corps légère', categorie: 'Guerre', degats: '1d6', degatsP: '1d4', critMin: 19, critMult: 2, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Hache de lancer', famille: 'Arme de guerre — corps à corps légère', categorie: 'Guerre', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'T', portee: '3 m' },
  { nom: 'Hachette', famille: 'Arme de guerre — corps à corps légère', categorie: 'Guerre', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 3, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Kukri', famille: 'Arme de guerre — corps à corps légère', categorie: 'Guerre', degats: '1d4', degatsP: '1d3', critMin: 18, critMult: 2, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Marteau léger', famille: 'Arme de guerre — corps à corps légère', categorie: 'Guerre', degats: '1d4', degatsP: '1d3', critMin: 20, critMult: 2, typeDegats: 'C', portee: '6 m' },
  { nom: 'Matraque', famille: 'Arme de guerre — corps à corps légère', categorie: 'Guerre', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Pic de guerre léger', famille: 'Arme de guerre — corps à corps légère', categorie: 'Guerre', degats: '1d4', degatsP: '1d3', critMin: 20, critMult: 4, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Rondache', famille: 'Arme de guerre — corps à corps légère', categorie: 'Guerre', degats: '1d3', degatsP: '1d2', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Rondache à pointes', famille: 'Arme de guerre — corps à corps légère', categorie: 'Guerre', degats: '1d4', degatsP: '1d3', critMin: 20, critMult: 2, typeDegats: 'P', portee: 'Contact' },
  // ── Arme exotique — à distance ──
  { nom: 'Arbalète de poing', famille: 'Arme exotique — à distance', categorie: 'Exotique', degats: '1d4', degatsP: '1d3', critMin: 19, critMult: 2, typeDegats: 'P', portee: '9 m' },
  { nom: 'Arbalète légère à répétition', famille: 'Arme exotique — à distance', categorie: 'Exotique', degats: '1d8', degatsP: '1d6', critMin: 19, critMult: 2, typeDegats: 'P', portee: '24 m' },
  { nom: 'Arbalète lourde à répétition', famille: 'Arme exotique — à distance', categorie: 'Exotique', degats: '1d10', degatsP: '1d8', critMin: 19, critMult: 2, typeDegats: 'P', portee: '36 m' },
  { nom: 'Bolas', famille: 'Arme exotique — à distance', categorie: 'Exotique', degats: '1d4', degatsP: '1d3', critMin: 20, critMult: 2, typeDegats: 'C', portee: '3 m' },
  { nom: 'Filet', famille: 'Arme exotique — à distance', categorie: 'Exotique', degats: null, degatsP: null, critMin: null, critMult: null, typeDegats: 'C', portee: '3 m' },
  { nom: 'Shuriken (5)', famille: 'Arme exotique — à distance', categorie: 'Exotique', degats: '1d2', degatsP: '1', critMin: 20, critMult: 2, typeDegats: 'P', portee: '3 m' },
  // ── Arme exotique — corps à corps à deux mains ──
  { nom: 'Chaîne cloutée', famille: 'Arme exotique — corps à corps à deux mains', categorie: 'Exotique', degats: '2d4', degatsP: '1d6', critMin: 20, critMult: 2, typeDegats: 'P', portee: 'Contact' },
  { nom: 'Double-lame', famille: 'Arme exotique — corps à corps à deux mains', categorie: 'Exotique', degats: '1d8/1d8', degatsP: '1d6/1d6', critMin: 19, critMult: 2, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Fléau double', famille: 'Arme exotique — corps à corps à deux mains', categorie: 'Exotique', degats: '1d8/1d8', degatsP: '1d6/1d6', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Hache double orque', famille: 'Arme exotique — corps à corps à deux mains', categorie: 'Exotique', degats: '1d8/1d8', degatsP: '1d6/1d6', critMin: 20, critMult: 3, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Marteau-piolet gnome', famille: 'Arme exotique — corps à corps à deux mains', categorie: 'Exotique', degats: '1d8/1d6', degatsP: '1d6/1d4', critMin: 20, critMult: 3, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Urgrosh nain', famille: 'Arme exotique — corps à corps à deux mains', categorie: 'Exotique', degats: '1d8/1d6', degatsP: '1d6/1d4', critMin: 20, critMult: 3, typeDegats: 'P', portee: 'Contact' },
  // ── Arme exotique — corps à corps à une main ──
  { nom: 'Épée bâtarde', famille: 'Arme exotique — corps à corps à une main', categorie: 'Exotique', degats: '1d10', degatsP: '1d8', critMin: 19, critMult: 2, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Fouet', famille: 'Arme exotique — corps à corps à une main', categorie: 'Exotique', degats: '1d3', degatsP: '1d2', critMin: 20, critMult: 2, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Hache de guerre naine', famille: 'Arme exotique — corps à corps à une main', categorie: 'Exotique', degats: '1d10', degatsP: '1d8', critMin: 20, critMult: 3, typeDegats: 'T', portee: 'Contact' },
  // ── Arme exotique — corps à corps légère ──
  { nom: 'Kama', famille: 'Arme exotique — corps à corps légère', categorie: 'Exotique', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'T', portee: 'Contact' },
  { nom: 'Nunchaku', famille: 'Arme exotique — corps à corps légère', categorie: 'Exotique', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Saï', famille: 'Arme exotique — corps à corps légère', categorie: 'Exotique', degats: '1d4', degatsP: '1d3', critMin: 20, critMult: 2, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Siangham', famille: 'Arme exotique — corps à corps légère', categorie: 'Exotique', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'P', portee: 'Contact' },
  // ── Munition ──
  { nom: 'Billes de fronde (10)', famille: 'Munition', categorie: 'Munition', degats: null, degatsP: null, critMin: null, critMult: null, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Carreaux d\'arbalète (10)', famille: 'Munition', categorie: 'Munition', degats: null, degatsP: null, critMin: null, critMult: null, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Carreaux d\'arbalète de poing (10)', famille: 'Munition', categorie: 'Munition', degats: null, degatsP: null, critMin: null, critMult: null, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Carreaux pour arbalète à répétition (5)', famille: 'Munition', categorie: 'Munition', degats: null, degatsP: null, critMin: null, critMult: null, typeDegats: 'C', portee: 'Contact' },
  { nom: 'Flèches (20)', famille: 'Munition', categorie: 'Munition', degats: null, degatsP: null, critMin: null, critMult: null, typeDegats: 'C', portee: 'Contact' },

  // ── Modes de lancer : même arme du Manuel, autre mode d'attaque ──
  { nom: 'Dague (lancée)', famille: 'Arme courante — corps à corps légère', categorie: 'Courante', degats: '1d4', degatsP: '1d3', critMin: 19, critMult: 2, typeDegats: 'P', portee: '3 m', modeLancer: true },
  { nom: 'Épieu (lancé)', famille: 'Arme courante — corps à corps à une main', categorie: 'Courante', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'P', portee: '6 m', modeLancer: true },
  { nom: 'Gourdin (lancé)', famille: 'Arme courante — corps à corps à une main', categorie: 'Courante', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'C', portee: '3 m', modeLancer: true },
  { nom: 'Hache de lancer (lancée)', famille: 'Arme de guerre — corps à corps légère', categorie: 'Guerre', degats: '1d6', degatsP: '1d4', critMin: 20, critMult: 2, typeDegats: 'T', portee: '3 m', modeLancer: true },
  { nom: 'Lance (lancée)', famille: 'Arme courante — corps à corps à deux mains', categorie: 'Courante', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 3, typeDegats: 'P', portee: '6 m', modeLancer: true },
  { nom: 'Marteau léger (lancé)', famille: 'Arme de guerre — corps à corps légère', categorie: 'Guerre', degats: '1d4', degatsP: '1d3', critMin: 20, critMult: 2, typeDegats: 'C', portee: '6 m', modeLancer: true },
  { nom: 'Trident (lancé)', famille: 'Arme de guerre — corps à corps à une main', categorie: 'Guerre', degats: '1d8', degatsP: '1d6', critMin: 20, critMult: 2, typeDegats: 'P', portee: '3 m', modeLancer: true },
]

export const WEAPON_CATEGORIES = ['Courante', 'Guerre', 'Exotique', 'Munition'] as const

export const WEAPON_CATEGORIE_LIBELLE: Record<WeaponCategorie, string> = {
  Courante: 'Armes courantes',
  Guerre: 'Armes de guerre',
  Exotique: 'Armes exotiques',
  Munition: 'Munitions',
}

/**
 * Arme de tir/de jet, ou arme de corps à corps ?
 *
 * ⚠️ Ne PAS déduire de la portée. Le Manuel donne un facteur de portée à des
 * armes de corps à corps parfaitement ordinaires — la dague se lance à 3 m, la
 * lance à 6 m — sans cesser d'être des armes de contact. Déduire « à distance »
 * d'une portée non nulle fait calculer la dague au BBA de projectiles et lui
 * retire le modificateur de Force aux dégâts : c'est ce qui est arrivé à neuf
 * lignes d'arme le 2026-10-08, quand le semis du catalogue a rempli la portée
 * de la dague (jusque-là vide) avec les 3 m du livre.
 *
 * C'est la FAMILLE qui tranche — « Arme de guerre — à distance », « Munition ».
 * Les lignes d'inventaire d'avant le catalogue n'en ont pas : pour elles on
 * garde l'ancienne lecture, qui est la seule information disponible.
 */
export function estArmeADistance(
  famille: string | null | undefined,
  portee: number | null | undefined
): boolean {
  if (famille) return famille.includes('— à distance') || famille === 'Munition'
  return portee != null
}
