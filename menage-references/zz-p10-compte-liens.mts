import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const [d] = await sql`SELECT count(*)::int lignes, count(DISTINCT cf.personnage_id)::int persos
  FROM character_feats cf JOIN feats f ON f.id = cf.feat_id
  WHERE f.est_catalogue OR f.catalogue_id IS NOT NULL` as any[]
const [t] = await sql`SELECT count(*)::int lignes FROM character_feats` as any[]
const [p] = await sql`SELECT count(*)::int l, count(DISTINCT personnage_id)::int p FROM character_potions` as any[]
const [o] = await sql`SELECT count(*)::int l, count(DISTINCT personnage_id)::int p FROM character_magic_items` as any[]
const [a] = await sql`SELECT count(*)::int l, count(DISTINCT personnage_id)::int p FROM character_armor` as any[]
console.log(`dons   : ${d.lignes} lignes avec 📖 sur ${t.lignes} chez ${d.persos} personnages`)
console.log(`potions: ${p.l} lignes chez ${p.p} personnages`)
console.log(`objets : ${o.l} lignes chez ${o.p} personnages`)
console.log(`armures: ${a.l} lignes chez ${a.p} personnages`)
