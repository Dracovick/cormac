import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const RACINE = 'X:/Claude-Tools/cormac'
const sql = neon(fs.readFileSync(`${RACINE}/.env.local`, 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const total = await sql`SELECT count(*)::int n FROM magic_items`
const vides = await sql`SELECT count(*)::int n FROM magic_items WHERE description IS NULL OR btrim(description) = ''`
console.log('total', total[0].n, '| sans description', vides[0].n)

const lignes = await sql`
  SELECT m.id, m.nom, m.type, m.emplacement, m.bonus, m.aura_magique, m.niveau_lanceur, m.prix, m.charges_max,
         (SELECT count(*)::int FROM character_magic_items c WHERE c.objet_id = m.id) AS porteurs
  FROM magic_items m
  WHERE m.description IS NULL OR btrim(m.description) = ''
  ORDER BY m.type NULLS FIRST, m.nom`
for (const l of lignes) console.log(JSON.stringify(l))
