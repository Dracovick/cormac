import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local','utf8').match(/DATABASE_URL=(.+)/)![1].trim())
const derives = ['Cercle magique contre la Loi','Cercle magique contre le Bien','Cercle magique contre le Chaos',
 'Détection de la Loi','Détection du Bien','Détection du Chaos',
 'Protection contre la Loi','Protection contre le Bien','Protection contre le Chaos',
 'Rejet de la Loi','Rejet du Bien','Rejet du Chaos']
const r = await sql`SELECT nom, left(description, 130) debut FROM spells WHERE nom = ANY(${derives}) ORDER BY nom` as any[]
for (const x of r) console.log(`${x.nom}\n    ${String(x.debut).replace(/\n/g,' ')}`)
