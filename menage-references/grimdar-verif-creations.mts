import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import { normaliserNom } from '../src/lib/noms'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

// Ce que le script veut CRÉER. Le script ne contrôle les doublons que pour le clan,
// la compétence et les 2 dons — pas pour les armes, l'armure ni les objets magiques.
const aCreer: Array<[string, string]> = [
  ['clans', 'Marteau Profond'],
  ['skills', 'Connaissance (architecture et ingénierie)'],
  ['feats', 'Arme de prédilection (hache de guerre naine)'],
  ['feats', 'Spécialisation martiale (hache de guerre naine)'],
  ['weapons', 'Hache de guerre naine'],
  ['weapons', 'Marteau léger'],
  ['weapons', 'Arbalète lourde'],
  ['weapons', "Masse d'armes lourde"],
  ['armor', 'Plaque complète'],
  ['magic_items', 'Médaillon du Masque de Pierre'],
  ['magic_items', "L'Œil de Kagyar"],
]

console.log('=== LES 11 ENTREES A CREER SONT-ELLES REELLEMENT ABSENTES ? ===')
console.log('(comparaison exacte ET normalisee : casse, accents, espaces)\n')
const cache = new Map<string, { id: number; nom: string }[]>()
for (const [table, nom] of aCreer) {
  if (!cache.has(table)) cache.set(table, await sql.query(`select id, nom from ${table}`) as { id: number; nom: string }[])
  const rows = cache.get(table)!
  const exact = rows.find(r => r.nom === nom)
  const souple = rows.filter(r => r.nom !== nom && normaliserNom(r.nom) === normaliserNom(nom))
  // voisins : meme debut de nom, pour reperer une variante que la normalisation ne voit pas
  const cle = normaliserNom(nom).split(' ').slice(0, 2).join(' ')
  const voisins = rows.filter(r => r.nom !== nom && !souple.includes(r) && normaliserNom(r.nom).startsWith(cle))
  const verdict = exact ? 'DEJA PRESENT (exact)' : souple.length ? 'DEJA PRESENT (variante)' : 'absent'
  console.log(`${verdict.padEnd(24)} ${table.padEnd(12)} « ${nom} »`)
  if (exact) console.log(`      -> id=${exact.id}`)
  for (const s of souple) console.log(`      -> variante id=${s.id} « ${s.nom} »`)
  for (const v of voisins.slice(0, 6)) console.log(`         voisin  id=${v.id} « ${v.nom} »`)
}

console.log('\n=== LES REFERENCES EPINGLEES QUI ONT BOUGE ===')
const epingles: Array<[string, number, string]> = [
  ['races', 4, 'Nain'], ['classes', 1, 'Guerrier'], ['gods', 22, 'Kagyar'],
  ['languages', 26, 'Nain'], ['languages', 2, 'Commun'], ['languages', 33, 'Gnomish'], ['languages', 20, 'Goblinour'],
  ['feats', 48, 'Attaque en puissance'], ['feats', 473, 'Robustesse'], ['feats', 6, "Science de l'initiative"],
  ['skills', 51, 'Artisanat (armes)'], ['skills', 5, 'Escalade'], ['skills', 54, 'Déguisement'],
  ['skills', 175, 'intimidation'], ['skills', 9, 'Survie'], ['magic_items', 12, 'Anneau de protection +1'],
]
for (const [table, id, attendu] of epingles) {
  const r = await sql.query(`select nom from ${table} where id = $1`, [id]) as { nom: string }[]
  if (!r.length) {
    console.log(`  ⛔ ${table}.${id} SUPPRIME (portait « ${attendu} »)`)
    // ou est passe le contenu ? on cherche le nom officiel correspondant
    const rows = cache.get(table) ?? await sql.query(`select id, nom from ${table}`) as { id: number; nom: string }[]
    const remplacant = rows.filter(x => normaliserNom(x.nom) === normaliserNom(attendu))
    for (const x of remplacant) console.log(`       remplace par id=${x.id} « ${x.nom} »`)
  } else if (r[0].nom !== attendu) {
    console.log(`  ⚠️ ${table}.${id} porte maintenant « ${r[0].nom} » (attendu « ${attendu} »)`)
  }
}
console.log('  (rien d autre affiche = tout le reste est intact)')
