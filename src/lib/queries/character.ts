import { db } from '@/db'
import { eq } from 'drizzle-orm'
import * as schema from '@/db/schema'

export async function getCharacter(id: number) {
  const [character] = await db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, id))

  if (!character) return null

  const [race, clan, classes, abilityScores, combatStats, savingThrows, skills, feats, weapons, armor, magicItems, potions, currency, languages, creatures, companions] = await Promise.all([
    character.raceId ? db.select().from(schema.races).where(eq(schema.races.id, character.raceId)).then(r => r[0]) : null,
    character.clanId ? db.select().from(schema.clans).where(eq(schema.clans.id, character.clanId)).then(r => r[0]) : null,

    db.select({ characterClass: schema.characterClasses, classe: schema.classes })
      .from(schema.characterClasses)
      .innerJoin(schema.classes, eq(schema.characterClasses.classeId, schema.classes.id))
      .where(eq(schema.characterClasses.personnageId, id)),

    db.select().from(schema.characterAbilityScores)
      .where(eq(schema.characterAbilityScores.personnageId, id))
      .then(r => r[0]),

    db.select().from(schema.characterCombatStats)
      .where(eq(schema.characterCombatStats.personnageId, id))
      .then(r => r[0]),

    db.select().from(schema.characterSavingThrows)
      .where(eq(schema.characterSavingThrows.personnageId, id))
      .then(r => r[0]),

    db.select({ charSkill: schema.characterSkills, skill: schema.skills })
      .from(schema.characterSkills)
      .innerJoin(schema.skills, eq(schema.characterSkills.skillId, schema.skills.id))
      .where(eq(schema.characterSkills.personnageId, id))
      .orderBy(schema.skills.nom),

    db.select({ charFeat: schema.characterFeats, feat: schema.feats })
      .from(schema.characterFeats)
      .innerJoin(schema.feats, eq(schema.characterFeats.featId, schema.feats.id))
      .where(eq(schema.characterFeats.personnageId, id)),

    db.select({ charWeapon: schema.characterWeapons, weapon: schema.weapons })
      .from(schema.characterWeapons)
      .innerJoin(schema.weapons, eq(schema.characterWeapons.armeId, schema.weapons.id))
      .where(eq(schema.characterWeapons.personnageId, id)),

    db.select({ charArmor: schema.characterArmor, armor: schema.armor })
      .from(schema.characterArmor)
      .innerJoin(schema.armor, eq(schema.characterArmor.armureId, schema.armor.id))
      .where(eq(schema.characterArmor.personnageId, id)),

    db.select({ charItem: schema.characterMagicItems, item: schema.magicItems })
      .from(schema.characterMagicItems)
      .innerJoin(schema.magicItems, eq(schema.characterMagicItems.objetId, schema.magicItems.id))
      .where(eq(schema.characterMagicItems.personnageId, id)),

    db.select({ charPotion: schema.characterPotions, potion: schema.potions })
      .from(schema.characterPotions)
      .innerJoin(schema.potions, eq(schema.characterPotions.potionId, schema.potions.id))
      .where(eq(schema.characterPotions.personnageId, id)),

    db.select().from(schema.characterCurrency)
      .where(eq(schema.characterCurrency.personnageId, id))
      .then(r => r[0]),

    db.select({ charLang: schema.characterLanguages, language: schema.languages })
      .from(schema.characterLanguages)
      .innerJoin(schema.languages, eq(schema.characterLanguages.langueId, schema.languages.id))
      .where(eq(schema.characterLanguages.personnageId, id)),

    db.select({ charCreature: schema.characterCreatures, creature: schema.creatures })
      .from(schema.characterCreatures)
      .innerJoin(schema.creatures, eq(schema.characterCreatures.creatureId, schema.creatures.id))
      .where(eq(schema.characterCreatures.personnageId, id)),

    db.select().from(schema.characterCompanions)
      .where(eq(schema.characterCompanions.personnageId, id)),
  ])

  return { character, race, clan, classes, abilityScores, combatStats, savingThrows, skills, feats, weapons, armor, magicItems, potions, currency, languages, creatures, companions }
}

export type CharacterData = NonNullable<Awaited<ReturnType<typeof getCharacter>>>

export async function listCharacters() {
  return db
    .select({
      id: schema.characters.id,
      nom: schema.characters.nom,
      surnom: schema.characters.surnom,
      race: schema.races.nom,
      xp: schema.characters.xp,
    })
    .from(schema.characters)
    .leftJoin(schema.races, eq(schema.characters.raceId, schema.races.id))
}
