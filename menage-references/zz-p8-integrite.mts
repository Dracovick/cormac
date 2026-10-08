/**
 * Contrôle d'intégrité après le rattachement (p8).
 * Tout doit être à zéro sauf les totaux annoncés.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

const n = async (q: any) => (q as any[])[0].n as number

console.log('lignes weapons              :', await n(await sql`SELECT count(*)::int n FROM weapons`))
console.log('  dont catalogue            :', await n(await sql`SELECT count(*)::int n FROM weapons WHERE est_catalogue`))
console.log('  dont inventaire           :', await n(await sql`SELECT count(*)::int n FROM weapons WHERE NOT est_catalogue`))
console.log('inventaire rattaché         :', await n(await sql`SELECT count(*)::int n FROM weapons WHERE NOT est_catalogue AND catalogue_id IS NOT NULL`))
console.log('inventaire non rattaché     :', await n(await sql`SELECT count(*)::int n FROM weapons WHERE NOT est_catalogue AND catalogue_id IS NULL`))
console.log('liens character_weapons     :', await n(await sql`SELECT count(*)::int n FROM character_weapons`))
console.log('')
console.log('✗ cible hors catalogue      :', await n(await sql`
  SELECT count(*)::int n FROM weapons w JOIN weapons c ON c.id = w.catalogue_id WHERE NOT c.est_catalogue`))
console.log('✗ cible inexistante         :', await n(await sql`
  SELECT count(*)::int n FROM weapons w WHERE w.catalogue_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM weapons c WHERE c.id = w.catalogue_id)`))
console.log('✗ auto-référence            :', await n(await sql`SELECT count(*)::int n FROM weapons WHERE catalogue_id = id`))
console.log('✗ ligne catalogue rattachée :', await n(await sql`SELECT count(*)::int n FROM weapons WHERE est_catalogue AND catalogue_id IS NOT NULL`))
console.log('✗ lien perso → arme absente :', await n(await sql`
  SELECT count(*)::int n FROM character_weapons cw
    WHERE NOT EXISTS (SELECT 1 FROM weapons w WHERE w.id = cw.arme_id)`))
console.log('✗ nom vide                  :', await n(await sql`SELECT count(*)::int n FROM weapons WHERE nom IS NULL OR btrim(nom) = ''`))

// Les porteurs qui gagnent un accès aux règles officielles grâce au rattachement.
const porteurs = await sql`
  SELECT count(DISTINCT cw.personnage_id)::int n FROM character_weapons cw
    JOIN weapons w ON w.id = cw.arme_id WHERE w.catalogue_id IS NOT NULL` as any[]
const liens = await sql`
  SELECT count(*)::int n FROM character_weapons cw
    JOIN weapons w ON w.id = cw.arme_id WHERE w.catalogue_id IS NOT NULL` as any[]
console.log(`\nlignes d'arme de personnage désormais reliées aux règles : ${liens[0].n}, chez ${porteurs[0].n} personnages`)
