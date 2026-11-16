/* MESURE — ce que la TAILLE devrait modifier, et ce que le Grimoire en fait.
 *
 * Question d'André, le 2026-11-16 : « Est-ce que les caractéristiques de
 * grandeurs sont prises en compte dans la Classe d'armure ? Exemple, un
 * Halfelin comme Azadrielle Pétales de Lune est de petite taille… »
 *
 * ── Ce que dit le livre, relevé au SRD 3.5 VF (dépôt orey/DD-3e, cp1252) ────
 *   « La CA se calcule de la façon suivante : 10 + bonus d'armure + bonus de
 *     bouclier + modificateur de Dextérité + MODIFICATEUR DE TAILLE. »
 *   « Bonus de base à l'attaque + modificateur de Force + modificateur de
 *     taille » (et la Dextérité à distance).
 *   Table des modificateurs de taille : Petit (P) = +1, Moyen = +0.
 *   Discrétion : taille P → +4.  Charge transportable : taille P → ×3/4.
 *
 * ⛔ Le modificateur NE DÉPEND PAS de la taille de l'adversaire : il s'applique
 * toujours. Seule la LUTTE utilise un « modificateur de taille spécial », qui
 * remplace l'habituel et se compare, lui, à la taille de l'autre.
 *
 * Ce script ne corrige rien. Il relève le périmètre avant d'écrire une ligne.
 *
 *   node scripts/mesure-taille-ca.mjs
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env.split('\n').find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length).trim().replace(/\r/g, '').replace(/^["']|["']$/g, '')
const sql = neon(url)

console.log('── 1. Les tailles au catalogue des races ───────────────────────────')
const tailles = await sql`
  select r.taille, count(distinct r.id)::int races, count(c.id)::int fiches
  from races r
  left join characters c on c.race_id = r.id
  group by r.taille
  order by r.taille`
for (const t of tailles) {
  console.log(`  ${String(t.taille).padEnd(10)} ${String(t.races).padStart(3)} race(s), ${String(t.fiches).padStart(3)} fiche(s)`)
}

console.log('\n── 2. Les fiches de petite taille : CA saisie et BBA ───────────────')
const petites = await sql`
  select c.id, c.nom, c.joueur_prenom, r.nom race,
         s.ca_base, s.ca_arme, s.ca_naturelle, s.ca_deflexion, s.ca_divers,
         s.bba_corps_a_corps, s.bba_projectiles
  from characters c
  join races r on r.id = c.race_id
  left join character_combat_stats s on s.personnage_id = c.id
  where lower(coalesce(r.taille, '')) = 'petite'
  order by c.id`
for (const p of petites) {
  const pnj = /^(pnj|npc)$/i.test(p.joueur_prenom ?? '') ? '  [PNJ]' : ''
  console.log(`  [${String(p.id).padStart(3)}] ${String(p.nom).padEnd(28)} ${String(p.race).padEnd(18)}` +
    ` divers=${String(p.ca_divers ?? 'NULL').padStart(4)} naturelle=${String(p.ca_naturelle ?? 'NULL').padStart(4)}` +
    ` · bba ${p.bba_corps_a_corps ?? '?'}/${p.bba_projectiles ?? '?'}${pnj}`)
}
// ⚠ Un `ca_divers` de +1 sur une fiche de petite taille PEUT être le
// modificateur de taille saisi à la main. Le câbler sans le dire le compterait
// deux fois — c'est le piège d'Uhlmar [59], « +1 attack — déjà inclus ».
const suspectes = petites.filter(p => (p.ca_divers ?? 0) === 1)
console.log(`\n  ⚠ ${suspectes.length} fiche(s) avec ca_divers = +1 exactement — peut-être le modificateur`)
console.log(`    de taille déjà saisi à la main : ${suspectes.map(p => `[${p.id}] ${p.nom}`).join(', ') || '—'}`)

console.log('\n── 3. Leurs lignes d’armes (le +1 s’applique à chacune) ────────────')
const armes = await sql`
  select c.id, c.nom personnage, a.nom arme, a.famille,
         w.bonus_magique, w.bonus_munitions, w.quantite_munitions, w.carac_attaque
  from characters c
  join races r on r.id = c.race_id
  join character_weapons w on w.personnage_id = c.id
  left join weapons a on a.id = w.arme_id
  where lower(coalesce(r.taille, '')) = 'petite'
  order by c.id, w.id`
console.log(`  ${armes.length} ligne(s) d’arme sur les fiches de petite taille.`)
for (const a of armes) {
  console.log(`  [${String(a.id).padStart(3)}] ${String(a.personnage).padEnd(24)} ${String(a.arme ?? '(catalogue absent)').padEnd(30)}` +
    ` alt=+${a.bonus_magique ?? 0} mun=${a.bonus_munitions ?? 'NULL'} famille=${a.famille ?? 'NULL'}`)
}

console.log('\n── 4. Discrétion : le +4 de taille est-il déjà saisi ? ─────────────')
const discretion = await sql`
  select c.id, c.nom, s.nom competence, cs.rangs_investis, cs.modif_divers
  from characters c
  join races r on r.id = c.race_id
  join character_skills cs on cs.personnage_id = c.id
  join skills s on s.id = cs.skill_id
  where lower(coalesce(r.taille, '')) = 'petite'
    and lower(s.nom) like 'discr%'
  order by c.id`
if (discretion.length === 0) console.log('  aucune ligne de Discrétion sur ces fiches')
for (const d of discretion) {
  console.log(`  [${String(d.id).padStart(3)}] ${String(d.nom).padEnd(28)} ${String(d.competence).padEnd(12)}` +
    ` rangs=${d.rangs_investis ?? 0} divers=${d.modif_divers ?? 0}` +
    ((d.modif_divers ?? 0) === 4 ? '   ⚠ exactement +4 : déjà saisi ?' : ''))
}

console.log('\n── 5. Charge : ce que ×3/4 changerait ──────────────────────────────')
// Les seuils du Manuel VF (kg). Reproduits ici tels que `encumbrance.ts` les
// pose — le script mesure, il n'importe pas le module (un .mjs ne peut pas
// importer du TypeScript applicatif).
const SEUILS = {
  1: 1.5, 2: 3, 3: 5, 4: 6.5, 5: 8, 6: 10, 7: 11.5, 8: 13, 9: 15, 10: 16.5,
  11: 19, 12: 21.5, 13: 24, 14: 26.5, 15: 29, 16: 32.5, 17: 36, 18: 39.5,
  19: 43, 20: 46.5, 21: 51.5, 22: 57.5, 23: 63.5, 24: 69.5, 25: 76.5,
}
const poids = await sql`
  select c.id, c.nom, a.for_base, a.for_magique,
         coalesce((select sum(coalesce(e.poids, 0) * greatest(coalesce(e.quantite, 1), 1))
                   from character_equipment e where e.personnage_id = c.id), 0) poids_equip,
         coalesce((select sum(coalesce(w2.poids, 0))
                   from character_weapons cw
                   join weapons w2 on w2.id = cw.arme_id
                   where cw.personnage_id = c.id), 0) poids_armes,
         coalesce((select sum(coalesce(ar.poids, 0))
                   from character_armor ca2
                   join armor ar on ar.id = ca2.armure_id
                   where ca2.personnage_id = c.id), 0) poids_armures
  from characters c
  join races r on r.id = c.race_id
  left join character_ability_scores a on a.personnage_id = c.id
  where lower(coalesce(r.taille, '')) = 'petite'
  order by c.id`
for (const p of poids) {
  const force = (p.for_base ?? 10) + (p.for_magique ?? 0)
  const legere = SEUILS[force] ?? 0
  const kg = Number(p.poids_equip) + Number(p.poids_armes) + Number(p.poids_armures)
  const cat = kg <= legere ? 'légère' : kg <= legere * 2 ? 'moyenne' : 'lourde'
  const legere34 = legere * 0.75
  const cat34 = kg <= legere34 ? 'légère' : kg <= legere34 * 2 ? 'moyenne' : 'lourde'
  console.log(`  [${String(p.id).padStart(3)}] ${String(p.nom).padEnd(28)} FOR ${String(force).padStart(2)}` +
    ` · porte ${kg.toFixed(2).padStart(6)} kg · seuil léger ${String(legere).padStart(5)} -> ${legere34.toFixed(2).padStart(6)}` +
    ` · ${cat} -> ${cat34}${cat !== cat34 ? '   ⚠ CHANGE' : ''}`)
}
