// Application du plan sorts-fiches-plan-2026-09-29.json : remplit les champs
// composantes / portee / duree / description VIDES depuis le catalogue statique
// SORTS_DND35 (celui que la fiche affiche déjà en repli quand la base est vide).
// EXCLU : [41] Métamorphose des autres — l'entrée du catalogue porte la fiche de
// Transformation en pierre (niveau 6, Vigueur annule, permanent) sous le mauvais
// nom ; le sort est utilisé par DracoVick Von Drag -> pile d'arbitrage d'André,
// avec [21] Mur de brouillard (inutilisé, probable doublon de traduction).
// Les composantes passent en notation officielle : S -> G, DF -> FD.
// Ne remplit QUE les champs NULL/vides — jamais d'écrasement.
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const DIR = 'X:/Claude-Tools/cormac/menage-references'
const EXCLUS = new Set([41])

const normComposantes = (c: string) => c.split(',').map(t =>
  t.trim().split('/').map(x => ({ S: 'G', DF: 'FD' }[x.trim()] ?? x.trim())).join('/')
).join(', ')

const plan: Array<{ id: number, nom: string, set: Record<string, string>, source: string }> =
  JSON.parse(fs.readFileSync(`${DIR}/sorts-fiches-plan-2026-09-29.json`, 'utf8'))
const retenu = plan.filter(p => !EXCLUS.has(p.id))
console.log(`plan : ${plan.length} entrées, ${retenu.length} retenues (exclu : ${plan.length - retenu.length})`)

const CHAMPS = ['composantes', 'portee', 'duree', 'description'] as const
let majFaites = 0, champsRemplis = 0, sautes = 0
for (const p of retenu) {
  let touche = false
  for (const champ of CHAMPS) {
    const brut = p.set[champ]
    if (!brut) continue
    const valeur = champ === 'composantes' ? normComposantes(brut) : brut
    // Garde-fou dans le WHERE : on ne remplit que si le champ est encore vide.
    const r = champ === 'composantes'
      ? await sql`UPDATE spells SET composantes = ${valeur} WHERE id = ${p.id} AND (composantes IS NULL OR trim(composantes) = '') RETURNING id`
      : champ === 'portee'
      ? await sql`UPDATE spells SET portee = ${valeur} WHERE id = ${p.id} AND (portee IS NULL OR trim(portee) = '') RETURNING id`
      : champ === 'duree'
      ? await sql`UPDATE spells SET duree = ${valeur} WHERE id = ${p.id} AND (duree IS NULL OR trim(duree) = '') RETURNING id`
      : await sql`UPDATE spells SET description = ${valeur} WHERE id = ${p.id} AND (description IS NULL OR trim(description) = '') RETURNING id`
    if (r.length === 1) { champsRemplis++; touche = true }
    else sautes++
  }
  if (touche) majFaites++
}
console.log(`sorts touchés : ${majFaites} | champs remplis : ${champsRemplis} | champs sautés (déjà remplis) : ${sautes}`)

// Vérification : re-comptage
const compte = async () => ({
  sansPortee: (await sql`SELECT count(*)::int n FROM spells WHERE portee IS NULL OR trim(portee)=''`)[0].n,
  sansDuree: (await sql`SELECT count(*)::int n FROM spells WHERE duree IS NULL OR trim(duree)=''`)[0].n,
  sansComp: (await sql`SELECT count(*)::int n FROM spells WHERE composantes IS NULL OR trim(composantes)=''`)[0].n,
  sansDesc: (await sql`SELECT count(*)::int n FROM spells WHERE description IS NULL OR trim(description)=''`)[0].n,
})
console.log('après :', JSON.stringify(await compte()))
