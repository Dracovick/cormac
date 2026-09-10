// Reproduit EXACTEMENT le filtre de src/components/CharacterList.tsx sur les vraies
// donnees de la liste d accueil, pour mesurer ce que « Daniel Tarte » retourne.
import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'
const raw = readFileSync('.env.local', 'utf-8')
for (const l of raw.split('\n')) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}
const sql = neon(process.env.DATABASE_URL)

const rows = await sql.query(`
  select c.id, c.nom, c.surnom, c.alignement, r.nom as race, c.xp,
         cl.nom as classe_nom, cc.niveau as classe_niveau,
         c.joueur_prenom, c.joueur_nom, k.nom as clan
  from characters c
  left join races r on r.id = c.race_id
  left join character_classes cc on cc.personnage_id = c.id
  left join classes cl on cl.id = cc.classe_id
  left join clans k on k.id = c.clan_id
  order by c.nom`)

const map = new Map()
for (const r of rows) {
  if (!map.has(r.id)) map.set(r.id, {
    id: r.id, nom: r.nom, surnom: r.surnom, alignement: r.alignement, race: r.race,
    xp: r.xp, classes: [], joueurPrenom: r.joueur_prenom, joueurNom: r.joueur_nom, clan: r.clan,
  })
  if (r.classe_nom && r.classe_niveau != null) map.get(r.id).classes.push({ nom: r.classe_nom, niveau: r.classe_niveau })
}
const characters = [...map.values()]

// ── copie conforme du filtre du composant ──
const SYNONYMES = { 'prêtre': ['clerc', 'prêtre'], 'pretre': ['clerc', 'prêtre'], 'clerc': ['clerc', 'prêtre'] }
const expandQuery = q => SYNONYMES[q] ?? [q]
const filtre = query => {
  const q = query.trim().toLowerCase()
  if (!q) return characters
  const terms = expandQuery(q)
  return characters.filter(c => {
    const fields = [c.nom, c.surnom, c.race, c.alignement, c.clan, c.joueurPrenom, c.joueurNom,
      c.xp?.toString(), ...c.classes.map(cl => cl.nom), ...c.classes.map(cl => cl.niveau.toString())]
    return fields.some(f => f && terms.some(t => f.toLowerCase().includes(t)))
  })
}

console.log('Personnages dans la liste d accueil : ' + characters.length)
for (const q of ['Daniel Tarte', 'Daniel', 'Tarte', 'Krugg', 'krugg le malchanceux']) {
  const r = filtre(q)
  console.log(`\n« ${q} » → ${r.length} resultat(s)` + (r.length && r.length < 8 ? ' : ' + r.map(x => `${x.nom} (${x.id})`).join(', ') : ''))
  if (r.length >= 8) console.log('   dont Krugg ? ' + (r.some(x => x.id === 82) ? 'OUI' : 'non'))
}
