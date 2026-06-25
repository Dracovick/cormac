import { getDb } from '@/db'
import { eq } from 'drizzle-orm'
import * as schema from '@/db/schema'

export async function getCharacter(id: number) {
  const [character] = await getDb()
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, id))

  if (!character) return null

  const [race, clan, classes, abilityScores, combatStats, savingThrows, skills, feats] = await Promise.all([
    character.raceId ? getDb().select().from(schema.races).where(eq(schema.races.id, character.raceId)).then(r => r[0]) : null,
    character.clanId ? getDb().select().from(schema.clans).where(eq(schema.clans.id, character.clanId)).then(r => r[0]) : null,

    getDb().select({ characterClass: schema.characterClasses, classe: schema.classes })
      .from(schema.characterClasses)
      .innerJoin(schema.classes, eq(schema.characterClasses.classeId, schema.classes.id))
      .where(eq(schema.characterClasses.personnageId, id)),

    getDb().select().from(schema.characterAbilityScores)
      .where(eq(schema.characterAbilityScores.personnageId, id))
      .then(r => r[0]),

    getDb().select().from(schema.characterCombatStats)
      .where(eq(schema.characterCombatStats.personnageId, id))
      .then(r => r[0]),

    getDb().select().from(schema.characterSavingThrows)
      .where(eq(schema.characterSavingThrows.personnageId, id))
      .then(r => r[0]),

    getDb().select({ charSkill: schema.characterSkills, skill: schema.skills })
      .from(schema.characterSkills)
      .innerJoin(schema.skills, eq(schema.characterSkills.skillId, schema.skills.id))
      .where(eq(schema.characterSkills.personnageId, id))
      .orderBy(schema.skills.nom),

    getDb().select({ charFeat: schema.characterFeats, feat: schema.feats })
      .from(schema.characterFeats)
      .innerJoin(schema.feats, eq(schema.characterFeats.featId, schema.feats.id))
      .where(eq(schema.characterFeats.personnageId, id)),
  ])

  const [weapons, armor, magicItems, potions, currency, languages, creatures, companions] = await Promise.all([
    getDb().select({ charWeapon: schema.characterWeapons, weapon: schema.weapons })
      .from(schema.characterWeapons)
      .innerJoin(schema.weapons, eq(schema.characterWeapons.armeId, schema.weapons.id))
      .where(eq(schema.characterWeapons.personnageId, id)),

    getDb().select({ charArmor: schema.characterArmor, armor: schema.armor })
      .from(schema.characterArmor)
      .innerJoin(schema.armor, eq(schema.characterArmor.armureId, schema.armor.id))
      .where(eq(schema.characterArmor.personnageId, id)),

    getDb().select({ charItem: schema.characterMagicItems, item: schema.magicItems })
      .from(schema.characterMagicItems)
      .innerJoin(schema.magicItems, eq(schema.characterMagicItems.objetId, schema.magicItems.id))
      .where(eq(schema.characterMagicItems.personnageId, id)),

    getDb().select({ charPotion: schema.characterPotions, potion: schema.potions })
      .from(schema.characterPotions)
      .innerJoin(schema.potions, eq(schema.characterPotions.potionId, schema.potions.id))
      .where(eq(schema.characterPotions.personnageId, id)),

    getDb().select().from(schema.characterCurrency)
      .where(eq(schema.characterCurrency.personnageId, id))
      .then(r => r[0]),

    getDb().select({ charLang: schema.characterLanguages, language: schema.languages })
      .from(schema.characterLanguages)
      .innerJoin(schema.languages, eq(schema.characterLanguages.langueId, schema.languages.id))
      .where(eq(schema.characterLanguages.personnageId, id)),

    getDb().select({ charCreature: schema.characterCreatures, creature: schema.creatures })
      .from(schema.characterCreatures)
      .innerJoin(schema.creatures, eq(schema.characterCreatures.creatureId, schema.creatures.id))
      .where(eq(schema.characterCreatures.personnageId, id)),

    getDb().select().from(schema.characterCompanions)
      .where(eq(schema.characterCompanions.personnageId, id)),
  ])

  return { character, race, clan, classes, abilityScores, combatStats, savingThrows, skills, feats, weapons, armor, magicItems, potions, currency, languages, creatures, companions }
}

export type CharacterData = NonNullable<Awaited<ReturnType<typeof getCharacter>>>

export async function listCharacters() {
  const rows = await getDb()
    .select({
      id: schema.characters.id,
      nom: schema.characters.nom,
      surnom: schema.characters.surnom,
      alignement: schema.characters.alignement,
      race: schema.races.nom,
      xp: schema.characters.xp,
      classe: schema.classes.nom,
      niveau: schema.characterClasses.niveau,
    })
    .from(schema.characters)
    .leftJoin(schema.races, eq(schema.characters.raceId, schema.races.id))
    .leftJoin(schema.characterClasses, eq(schema.characterClasses.personnageId, schema.characters.id))
    .leftJoin(schema.classes, eq(schema.characterClasses.classeId, schema.classes.id))

  // Un seul résultat par personnage (classe principale = première entrée)
  const seen = new Set<number>()
  return rows.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true })
}
