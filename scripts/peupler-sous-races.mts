/**
 * PEUPLEMENT DES SOUS-RACES
 *
 *   npx tsx scripts/peupler-sous-races.mts            (mesure, n'écrit rien)
 *   npx tsx scripts/peupler-sous-races.mts --appliquer
 *
 * Pour chaque sous-race de `src/lib/dnd35/sous-races.ts` :
 *   • une ligne dans `races`, avec les ajustements DÉJÀ FUSIONNÉS — la page du
 *     personnage lit cette ligne, la feuille imprimée lit `getRaceOuSousRace()`,
 *     et `fusionner()` est la seule source des deux;
 *   • ses traits PROPRES dans `racial_features`. ⛔ Pas ceux de la race parente :
 *     la fiche fait l'union à la lecture (`src/lib/queries/character.ts`). Les
 *     dupliquer ferait diverger les copies le jour où André corrige l'original.
 *
 * ⚠ En .mts et lancé par tsx, pas en .mjs : un .mjs qui importe du TS applicatif
 * meurt sur ERR_MODULE_NOT_FOUND — Node dépouille les types mais n'a pas le
 * résolveur d'extensions.
 *
 * Idempotent : relançable sans rien casser. Les traits d'une sous-race sont
 * remplacés en bloc, jamais empilés.
 *
 * ⛔ Ne touche à AUCUNE des races existantes ni à leurs traits.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOUS_RACES_DND35, fusionner, picto } from '../src/lib/dnd35/sous-races'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APPLIQUER = process.argv.includes('--appliquer')

const env = fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8')
const url = env
  .split('\n')
  .find(l => l.startsWith('DATABASE_URL='))
  ?.slice('DATABASE_URL='.length)
  .trim()
  .replace(/\r/g, '')
  .replace(/^["']|["']$/g, '')
if (!url) throw new Error('DATABASE_URL introuvable dans .env.local')
const sql = neon(url)

// Les tailles ne sont pas dans le module TS : on reprend celle de la race parente
// telle qu'elle est en base, pour ne pas inventer une donnée que personne n'a saisie.
const parentes = await sql`select nom, taille, deplacement_base, vision_nocturne from races`
const tailleDe = new Map<string, string | null>(parentes.map(r => [r.nom as string, r.taille as string | null]))

let cree = 0, maj = 0, traitsEcrits = 0
const rapport: string[] = []

for (const sr of SOUS_RACES_DND35) {
  const profil = fusionner(sr)
  if (!profil) { rapport.push(`⛔ ${sr.nom} — race parente « ${sr.race} » introuvable dans RACES_DND35`); continue }

  const taille = tailleDe.get(sr.race) ?? 'Moyenne'
  const description = [
    sr.description,
    sr.regions ? `Régions : ${sr.regions}` : '',
    sr.ajustementNiveau ? `Ajustement de niveau du livre : +${sr.ajustementNiveau} (affiché, jamais appliqué aux calculs d'expérience).` : '',
    sr.divergence ? `⚠ ${sr.divergence}` : '',
    `Sous-race de ${sr.race} — ${sr.source}.`,
  ].filter(Boolean).join('\n\n')

  const existante = await sql`select id from races where nom = ${sr.nom} limit 1`
  let raceId: number
  if (existante.length > 0) {
    raceId = existante[0].id as number
    maj++
    if (APPLIQUER) {
      await sql`
        update races set
          bonus_for = ${profil.bonusFor}, bonus_dex = ${profil.bonusDex}, bonus_con = ${profil.bonusCon},
          bonus_int = ${profil.bonusInt}, bonus_sag = ${profil.bonusSag}, bonus_cha = ${profil.bonusCha},
          taille = ${taille}, deplacement_base = ${profil.deplacement},
          vision_nocturne = ${profil.visionNocturne}, description = ${description}
        where id = ${raceId}`
    }
  } else {
    cree++
    if (APPLIQUER) {
      const ins = await sql`
        insert into races (nom, bonus_for, bonus_dex, bonus_con, bonus_int, bonus_sag, bonus_cha,
                           taille, deplacement_base, vision_nocturne, description)
        values (${sr.nom}, ${profil.bonusFor}, ${profil.bonusDex}, ${profil.bonusCon},
                ${profil.bonusInt}, ${profil.bonusSag}, ${profil.bonusCha},
                ${taille}, ${profil.deplacement}, ${profil.visionNocturne}, ${description})
        returning id`
      raceId = ins[0].id as number
    } else {
      raceId = -1
    }
  }

  if (APPLIQUER && raceId > 0) {
    await sql`delete from racial_features where race_id = ${raceId}`
    for (const t of sr.traits) {
      await sql`
        insert into racial_features (race_id, nom, description)
        values (${raceId}, ${`${picto(t.effet)} ${t.nom}`}, ${t.description})`
      traitsEcrits++
    }
  } else {
    traitsEcrits += sr.traits.length
  }

  const b = [profil.bonusFor, profil.bonusDex, profil.bonusCon, profil.bonusInt, profil.bonusSag, profil.bonusCha]
  const resume = b.every(v => v === 0) ? 'aucun ajustement' : `FOR ${b[0]} DEX ${b[1]} CON ${b[2]} INT ${b[3]} SAG ${b[4]} CHA ${b[5]}`
  rapport.push(
    `${existante.length > 0 ? '↻' : '+'} ${sr.nom.padEnd(28)} ${resume.padEnd(46)} ` +
    `${sr.traits.length} trait(s)${sr.classePreferee ? ` · classe ${sr.classePreferee}` : ''}` +
    `${sr.ajustementNiveau ? ` · NGE +${sr.ajustementNiveau}` : ''}`)
}

console.log(rapport.join('\n'))
console.log(`\n${APPLIQUER ? 'ÉCRIT' : 'SIMULÉ'} — ${cree} race(s) créée(s), ${maj} mise(s) à jour, ${traitsEcrits} trait(s).`)

// Contrôle de non-régression : aucune fiche ne doit avoir changé de race.
const fiches = await sql`
  select r.nom, count(*)::int as n from characters c join races r on r.id = c.race_id group by r.nom order by r.nom`
console.log('\nFiches par race (doit être identique avant et après) :')
for (const f of fiches) console.log(`  ${String(f.nom).padEnd(28)} ${f.n}`)

if (!APPLIQUER) console.log('\n⚠ Rien n’a été écrit. Relancer avec --appliquer.')
