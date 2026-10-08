/**
 * Sème le catalogue des 109 dons du Manuel des Joueurs (table 5-1, p. 90-91)
 * dans la table `feats`, SANS rien supprimer ni écraser.
 *
 * Même procédé que p7 pour les armes :
 *  - si une ligne existante porte déjà EXACTEMENT le nom du livre (aux accents,
 *    à la casse et aux espaces près), on l'ADOPTE : elle devient l'entrée de
 *    catalogue, et on ne remplit que ses champs VIDES. Ses porteurs la gardent;
 *  - sinon on crée une entrée neuve;
 *  - un champ déjà rempli par André n'est JAMAIS écrasé — il signale sa
 *    divergence et attend sa décision.
 *
 * ⚠ L'adoption ne vaut que pour un nom NU. « Arme de prédilection (arc long) »
 * n'est pas adoptée : la parenthèse nomme l'arme visée, c'est une donnée de
 * jeu que `feat-bonuses.ts` lit pour appliquer le +1 à la bonne arme. Ces
 * lignes restent des lignes de fiche; leur rattachement est une décision
 * d'André (voir p10-dons-classement.txt).
 *
 * Usage : npx tsx menage-references/p10-dons-semer.mts [--ecrire]
 */
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'

const RACINE = 'X:/Claude-Tools/cormac'
const sql = neon(fs.readFileSync(`${RACINE}/.env.local`, 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const ECRIRE = process.argv.includes('--ecrire')

type Don = {
  nom: string; type: 'General' | 'Creation' | 'Metamagie'; parent: string | null
  conditions: string | null; avantage: string
}
const catalogue: Don[] = JSON.parse(fs.readFileSync(`${RACINE}/menage-references/p10-dons-catalogue.json`, 'utf8')).dons

const CATEGORIE: Record<string, string> = {
  General: 'Général', Creation: "Création d'objets", Metamagie: 'Métamagie',
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[\u2019\u02bc]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * Garde-fou d'adoption. Porter le nom d'un don ne suffit pas : encore faut-il
 * que la ligne EN SOIT un. « talent » [409] se lit comme le don Talent, mais
 * elle est sur la fiche d'un Roublard 5 / Assassin 7 entre « botte secrète »,
 * « coup mortel » et « poison » — c'est le talent spécial du roublard. Adopter
 * cette ligne ferait d'une capacité de classe l'entrée de catalogue d'un don.
 * On ne retient donc que les lignes que le classement à la main déclare être
 * ce don précis (verdict D, cible = ce nom).
 */
const classement = new Map<number, { verdict: string; cible: string }>()
for (const l of fs.readFileSync(`${RACINE}/menage-references/p10-dons-classement.txt`, 'utf8').split(/\r?\n/)) {
  if (!l.trim() || l.startsWith('#')) continue
  const [id, verdict, cible] = l.split('|')
  classement.set(Number(id), { verdict, cible: (cible ?? '').trim() })
}

const rows = await sql`
  SELECT f.id, f.nom, f.categorie, f.prerequis, f.description, f.effet_mecanique, f.est_catalogue,
    (SELECT count(*)::int FROM character_feats cf WHERE cf.feat_id = f.id) porteurs
  FROM feats f ORDER BY f.id` as any[]
const parNom = new Map<string, any[]>()
for (const r of rows) {
  const k = norm(r.nom)
  if (!parNom.has(k)) parNom.set(k, [])
  parNom.get(k)!.push(r)
}

let adoptees = 0, creees = 0, deja = 0
const divergences: string[] = []
const refus: string[] = []

for (const d of catalogue) {
  const candidats = parNom.get(norm(d.nom)) ?? []
  if (candidats.length > 1) {
    refus.push(`« ${d.nom} » : ${candidats.length} lignes portent ce nom (${candidats.map(c => c.id).join(', ')}) — rien écrit`)
    continue
  }

  const voulu = {
    categorie: CATEGORIE[d.type],
    prerequis: d.conditions,
    effet_mecanique: d.avantage,
  }

  // L'entrée de catalogue existe déjà : rien à faire (idempotence). À vérifier
  // AVANT le garde-fou d'adoption, sinon un second passage tente de la recréer
  // et casse sur la contrainte d'unicité du nom.
  if (candidats.length === 1 && candidats[0].est_catalogue) { deja++; continue }

  // Une ligne homonyme que le classement ne déclare PAS être ce don reste une
  // ligne de fiche : on crée l'entrée de catalogue à côté, sans y toucher.
  const adoptables = candidats.filter(c => {
    const v = classement.get(c.id)
    return v?.verdict === 'D' && v.cible === d.nom
  })
  if (candidats.length === 1 && adoptables.length === 0) {
    const v = classement.get(candidats[0].id)
    refus.push(`« ${d.nom} » : la ligne [${candidats[0].id}] porte ce nom mais le classement la dit « ${v?.verdict ?? '?'} » — entrée créée à part, ligne intacte`)
    candidats.length = 0
  }

  if (candidats.length === 0) {
    if (ECRIRE) {
      await sql`INSERT INTO feats (nom, categorie, prerequis, effet_mecanique, est_catalogue)
        VALUES (${d.nom}, ${voulu.categorie}, ${voulu.prerequis}, ${voulu.effet_mecanique}, true)`
    }
    creees++
    continue
  }

  const r = candidats[0]
  if (r.est_catalogue) { deja++; continue }

  // Ne remplir que le vide. Signaler, sans l'écraser, ce qui dit autre chose.
  for (const [champ, val] of Object.entries(voulu)) {
    const actuel = r[champ]
    if (actuel != null && String(actuel).trim() !== '' && String(actuel).trim() !== String(val ?? '').trim()) {
      divergences.push(`[${r.id}] ${r.nom} — ${champ} : base « ${String(actuel).slice(0, 70)} » / livre « ${String(val ?? '').slice(0, 70)} »`)
    }
  }
  if (ECRIRE) {
    await sql`UPDATE feats SET
      categorie       = COALESCE(NULLIF(categorie, ''), ${voulu.categorie}),
      prerequis       = COALESCE(NULLIF(prerequis, ''), ${voulu.prerequis}),
      effet_mecanique = COALESCE(NULLIF(effet_mecanique, ''), ${voulu.effet_mecanique}),
      est_catalogue   = true
      WHERE id = ${r.id}`
  }
  adoptees++
  console.log(`  adoptée [${r.id}] « ${r.nom} »${r.porteurs ? ` — ${r.porteurs} porteur(s)` : ''}`)
}

console.log(`\n${ECRIRE ? 'écrit' : 'à écrire'} : ${adoptees} ligne(s) adoptée(s), ${creees} entrée(s) créée(s), ${deja} déjà au catalogue`)
if (divergences.length) {
  console.log(`\n⚠ ${divergences.length} champ(s) déjà remplis qui disent autre chose que le livre — RIEN ÉCRASÉ :`)
  for (const d of divergences) console.log('   ' + d)
}
if (refus.length) { console.log('\nREFUS :'); for (const r of refus) console.log('  ✗ ' + r) }

if (ECRIRE) {
  const [c] = await sql`SELECT count(*) FILTER (WHERE est_catalogue)::int cat, count(*)::int total FROM feats` as any[]
  console.log(`\ncontrôle : feats = ${c.total} lignes, dont ${c.cat} au catalogue (attendu ${catalogue.length})`)
}
if (!ECRIRE) console.log('\nEssai à blanc — relancer avec --ecrire.')
