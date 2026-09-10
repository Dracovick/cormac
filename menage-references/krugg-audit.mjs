// Audit lecture seule avant l'import de « Krugg le malchanceux » — 2026-08-27
// Aucune écriture. Sert à épingler les id des références existantes.
import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const raw = readFileSync('.env.local', 'utf-8')
for (const l of raw.split('\n')) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i > 0) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}
const sql = neon(process.env.DATABASE_URL)
const show = async (label, q) => {
  const r = await sql.query(q)
  console.log('\n=== ' + label + ' (' + r.length + ') ===')
  for (const x of r) console.log(JSON.stringify(x))
}

await show('races', `select id,nom,bonus_for,bonus_dex,bonus_con,bonus_int,bonus_sag,bonus_cha,taille,deplacement_base,vision_nocturne from races order by id`)
await show('classes', `select id,nom,de_vie,bba_progression,vigueur_progression,reflexes_progression,volonte_progression from classes order by id`)
await show('gods (kord)', `select id,nom,alignement,domaines,arme_de_preference from gods where nom ilike '%kord%'`)
await show('gods total', `select count(*)::int as n, max(id)::int as maxid from gods`)
await show('languages', `select id,nom from languages order by id`)
await show('homonyme Krugg', `select id,nom,joueur_prenom,joueur_nom from characters where nom ilike '%krugg%'`)
await show('joueurs deja en base', `select distinct joueur_prenom, joueur_nom from characters where joueur_prenom is not null or joueur_nom is not null order by 1,2`)
