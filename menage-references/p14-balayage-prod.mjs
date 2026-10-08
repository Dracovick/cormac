/**
 * Contrôle EN PRODUCTION, pas en base : appelle les 745 fiches du rayon Objets
 * magiques et les 85 potions, et compte celles qui portent encore le message
 * « La description de cette entrée n'a pas encore été relevée dans les livres ».
 *
 * Pourquoi en production : une description écrite en base ne prouve pas qu'elle
 * est servie. Le balayage des 109 dons du 2026-10-08 avait déjà servi à ça.
 *
 * ⚠ Un témoin connu est inclus dans le test : les 4 sorts qui PORTENT encore le
 * message (décisions ouvertes chez André) doivent être détectés, sinon c'est
 * l'instrument qui est aveugle et non les fiches qui sont propres.
 *
 * Usage : node menage-references/p14-balayage-prod.mjs
 */
const BASE = 'https://www.dracovick.com'
const COOKIE = 'cormac_auth=granted'
// ⚠ Motif choisi PLUS LARGE que le texte corrigé, et sur la partie la moins
// susceptible d'être encodée en entités HTML. Un premier balayage avait
// cherché « pas encore relev » : le message dit « pas encore ÉTÉ relevée »,
// donc 0 détection partout — y compris sur les 4 témoins qui le portent. Le
// compte était faux et paraissait parfait.
const MESSAGE = 'moine copiste'

async function fiche(slug, id) {
  const r = await fetch(`${BASE}/bibliotheque/${slug}/${id}`, { headers: { Cookie: COOKIE }, redirect: 'follow' })
  const html = await r.text()
  return { id, statut: r.status, message: html.includes(MESSAGE), vide: html.length < 2000 }
}

async function balayer(slug, ids) {
  const resultats = []
  for (let i = 0; i < ids.length; i += 12) {
    resultats.push(...await Promise.all(ids.slice(i, i + 12).map(id => fiche(slug, id))))
    process.stdout.write(`\r  ${slug} : ${resultats.length}/${ids.length}`)
  }
  process.stdout.write('\n')
  return resultats
}

// Les ids viennent de la base, lus avant le balayage.
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)[1].trim())

const objets = (await sql`SELECT id FROM magic_items ORDER BY id`).map(r => r.id)
const potions = (await sql`SELECT id FROM potions ORDER BY id`).map(r => r.id)
const sortsTemoins = (await sql`SELECT id, nom FROM spells WHERE description IS NULL OR btrim(description)='' ORDER BY id`)

console.log(`objets ${objets.length} · potions ${potions.length} · témoins (sorts sans description) ${sortsTemoins.length}`)

const rObj = await balayer('objet', objets)
const rPot = await balayer('potion', potions)
const rTem = await balayer('sort', sortsTemoins.map(s => s.id))

const pb = r => r.filter(x => x.statut !== 200 || x.vide)
console.log(`\nobjets  : ${rObj.length} servies · message ${rObj.filter(x => x.message).length} · anomalies ${pb(rObj).length}`)
console.log(`potions : ${rPot.length} servies · message ${rPot.filter(x => x.message).length} · anomalies ${pb(rPot).length}`)
console.log(`TÉMOIN  : ${rTem.filter(x => x.message).length}/${rTem.length} sorts portent bien le message — l'instrument voit.`)
for (const x of [...pb(rObj), ...pb(rPot)]) console.log('  anomalie :', JSON.stringify(x))
for (const x of rObj.filter(x => x.message)) console.log('  objet portant encore le message :', x.id)
for (const x of rPot.filter(x => x.message)) console.log('  potion portant encore le message :', x.id)
