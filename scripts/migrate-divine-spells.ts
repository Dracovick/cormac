/**
 * Migration : sorts divins vers la nouvelle mécanique
 *
 * Les Prêtres, Druides, Paladins et Rôdeurs ont maintenant accès à toute
 * leur liste automatiquement lors de la prière. Les sorts manuellement
 * stockés en DB deviennent redondants et doivent être supprimés.
 *
 * Exécution :
 *   npx tsx --env-file=.env.local scripts/migrate-divine-spells.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { getDb } from '../src/db/index'
import * as schema from '../src/db/schema'
import { eq, inArray } from 'drizzle-orm'

if (!process.env.DATABASE_URL) {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i > 0) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
    }
  } catch { /* ignore */ }
}

const CLASSES_DIVINES = ['Prêtre', 'Druide', 'Paladin', 'Rôdeur']

async function main() {
  const db = getDb()

  // 1. Trouver toutes les classes divines en DB
  const classesDivines = await db
    .select({ id: schema.classes.id, nom: schema.classes.nom })
    .from(schema.classes)
    .then(rows => rows.filter(r => CLASSES_DIVINES.includes(r.nom)))

  if (classesDivines.length === 0) {
    console.log('Aucune classe divine trouvée en base de données.')
    return
  }
  console.log(`Classes divines trouvées : ${classesDivines.map(c => c.nom).join(', ')}`)

  // 2. Trouver tous les personnages ayant une de ces classes
  const classeIds = classesDivines.map(c => c.id)
  const charClasses = await db
    .select({ personnageId: schema.characterClasses.personnageId, classeId: schema.characterClasses.classeId })
    .from(schema.characterClasses)
    .where(inArray(schema.characterClasses.classeId, classeIds))

  if (charClasses.length === 0) {
    console.log('Aucun personnage avec une classe divine.')
    return
  }

  const divineCharIds = [...new Set(charClasses.map(c => c.personnageId))]

  // 3. Vérifier combien ont des sorts stockés
  const spellsByChar = await Promise.all(
    divineCharIds.map(async id => {
      const spells = await db
        .select({ id: schema.characterSpells.id })
        .from(schema.characterSpells)
        .where(eq(schema.characterSpells.personnageId, id))
      return { charId: id, count: spells.length }
    })
  )

  const withSpells = spellsByChar.filter(s => s.count > 0)

  if (withSpells.length === 0) {
    console.log('Aucun sort à migrer — tous les lanceurs divins sont déjà propres.')
    return
  }

  console.log(`\n${divineCharIds.length} personnage(s) divin(s) trouvé(s) :`)

  // 4. Afficher et supprimer
  for (const { charId, count } of spellsByChar) {
    const [char] = await db
      .select({ nom: schema.characters.nom })
      .from(schema.characters)
      .where(eq(schema.characters.id, charId))

    const classeNom = classesDivines.find(c =>
      charClasses.find(cc => cc.personnageId === charId && cc.classeId === c.id)
    )?.nom ?? '?'

    if (count > 0) {
      await db.delete(schema.characterSpells).where(eq(schema.characterSpells.personnageId, charId))
      console.log(`  ✓ ${char?.nom ?? `ID ${charId}`} (${classeNom}) — ${count} sort(s) supprimé(s)`)
    } else {
      console.log(`  - ${char?.nom ?? `ID ${charId}`} (${classeNom}) — aucun sort (déjà propre)`)
    }
  }

  console.log('\n✅ Migration terminée. Les lanceurs divins utiliseront la prière pour préparer leurs sorts.')
}

main().catch(err => {
  console.error('Erreur :', err)
  process.exit(1)
})
