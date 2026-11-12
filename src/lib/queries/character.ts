import { getDb } from '@/db'
import { eq } from 'drizzle-orm'
import { getSousRaceInfo, decomposerRace } from '@/lib/dnd35/sous-races'
import { alias } from 'drizzle-orm/pg-core'
import * as schema from '@/db/schema'

// `skills` porte deux populations : le catalogue du Manuel et les lignes de
// fiche importées de FileMaker. « Artisanat (serrurerie) » est une ligne de
// fiche rattachée à l'entrée de catalogue « Artisanat », qui porte ses règles
// — et le malus d'armure aux tests. Ce self-join ramène la mère avec la ligne.
const skillCatalogue = alias(schema.skills, 'skill_catalogue')

// Même histoire pour les armes, et c'est là que la famille du livre se trouve :
// 160 des 198 lignes d'armes des fiches viennent de FileMaker avec `famille`
// NULL et un nom libre souvent anglais (« Mace (light) +3 »). Leur `catalogue_id`
// pointe l'entrée du Manuel, qui porte le maniement — « corps à corps légère »,
// seule façon de savoir si Attaque en finesse s'applique.
const weaponCatalogue = alias(schema.weapons, 'weapon_catalogue')

export async function getCharacter(id: number) {
  const [character] = await getDb()
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, id))

  if (!character) return null

  const [race, clan, god, classes, abilityScores, combatStats, savingThrows, skills, feats, racialFeatures] = await Promise.all([
    character.raceId ? getDb().select().from(schema.races).where(eq(schema.races.id, character.raceId)).then(r => r[0]) : null,

    character.clanId ? getDb().select().from(schema.clans).where(eq(schema.clans.id, character.clanId)).then(r => r[0]) : null,

    character.dieuId ? getDb().select().from(schema.gods).where(eq(schema.gods.id, character.dieuId)).then(r => r[0] ?? null) : null,

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

    getDb().select({ charSkill: schema.characterSkills, skill: schema.skills, catalogue: skillCatalogue })
      .from(schema.characterSkills)
      .innerJoin(schema.skills, eq(schema.characterSkills.skillId, schema.skills.id))
      .leftJoin(skillCatalogue, eq(schema.skills.catalogueId, skillCatalogue.id))
      .where(eq(schema.characterSkills.personnageId, id))
      .orderBy(schema.skills.nom),

    getDb().select({ charFeat: schema.characterFeats, feat: schema.feats })
      .from(schema.characterFeats)
      .innerJoin(schema.feats, eq(schema.characterFeats.featId, schema.feats.id))
      .where(eq(schema.characterFeats.personnageId, id)),

    character.raceId
      ? getDb().select().from(schema.racialFeatures).where(eq(schema.racialFeatures.raceId, character.raceId))
      : Promise.resolve([]),
  ])

  const [spells, weapons, armor, magicItems, potions, scrolls, currency, gems, equipement, languages, creatures, companions, spellEffects] = await Promise.all([
    getDb().select({ charSpell: schema.characterSpells, spell: schema.spells })
      .from(schema.characterSpells)
      .innerJoin(schema.spells, eq(schema.characterSpells.sortId, schema.spells.id))
      .where(eq(schema.characterSpells.personnageId, id))
      .orderBy(schema.characterSpells.niveau, schema.spells.nom),


    getDb().select({ charWeapon: schema.characterWeapons, weapon: schema.weapons, catalogue: weaponCatalogue })
      .from(schema.characterWeapons)
      .innerJoin(schema.weapons, eq(schema.characterWeapons.armeId, schema.weapons.id))
      .leftJoin(weaponCatalogue, eq(schema.weapons.catalogueId, weaponCatalogue.id))
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

    // ⚠ leftJoin, pas innerJoin : un parchemin dont le sort n'est pas au
    // catalogue porte `sortId` NULL et son nom dans `nomLibre`. Un innerJoin
    // le ferait disparaître de la fiche sans la moindre erreur.
    getDb().select({ scroll: schema.characterScrolls, spell: schema.spells })
      .from(schema.characterScrolls)
      .leftJoin(schema.spells, eq(schema.characterScrolls.sortId, schema.spells.id))
      .where(eq(schema.characterScrolls.personnageId, id))
      .orderBy(schema.characterScrolls.niveauSort, schema.characterScrolls.id),

    getDb().select().from(schema.characterCurrency)
      .where(eq(schema.characterCurrency.personnageId, id))
      .then(r => r[0]),

    getDb().select().from(schema.characterGems)
      .where(eq(schema.characterGems.personnageId, id))
      .orderBy(schema.characterGems.id),

    // Équipement courant — nom libre, aucun catalogue à joindre (drizzle/0017).
    getDb().select().from(schema.characterEquipment)
      .where(eq(schema.characterEquipment.personnageId, id))
      .orderBy(schema.characterEquipment.id),

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

    getDb().select().from(schema.characterSpellEffects)
      .where(eq(schema.characterSpellEffects.personnageId, id))
      .orderBy(schema.characterSpellEffects.id),
  ])

  // ── Traits raciaux d'une SOUS-RACE ───────────────────────────────────────
  // Une sous-race ne porte en base que ce qui la DIFFÉRENCIE : un halfelin
  // vaillant reste un halfelin. Les traits de la race parente sont donc
  // ramenés ici, à la lecture — et non recopiés en base, sinon les copies
  // divergeraient le jour où l'original est corrigé.
  //
  // ⚠ On retire ceux que la sous-race contredit frontalement : « Chance
  // halfeline : +1 à tous les JS » à côté de « Pas de chance halfeline »,
  // c'est une fiche qui ment. La comparaison normalise l'apostrophe, parce
  // que la base porte l'apostrophe typographique d'André (U+2019) là où le
  // code écrit la droite.
  //
  // ⭐ Et la fiche peut porter l'autre appellation de la race : « Petite-gens
  // vaillant » est le même vaillant que « Halfelin vaillant ». Ses traits
  // propres sont alors lus sur la ligne canonique, et sa parente est cherchée
  // sous l'appellation portée d'abord — une seule source dans les deux cas,
  // jamais une copie de plus en base.
  const sousRace = getSousRaceInfo(race?.nom)
  // L'appellation de la race parente telle que la fiche la porte — « Halfelin »
  // ou « Petite-gens ». La fiche et la feuille imprimée l'écrivent toutes deux :
  // afficher le nom du Manuel sur une fiche saisie sous l'autre nom ferait
  // mentir la fiche sur le choix du joueur.
  const appellationRace = sousRace ? decomposerRace(race?.nom).race : (race?.nom ?? null)
  let traitsRaciaux = racialFeatures
  if (sousRace) {
    const traitsDe = async (nom: string) => {
      const [r] = await getDb().select({ id: schema.races.id }).from(schema.races).where(eq(schema.races.nom, nom))
      return r ? await getDb().select().from(schema.racialFeatures).where(eq(schema.racialFeatures.raceId, r.id)) : []
    }
    // Traits propres : ceux de la ligne de la fiche, ou ceux de la ligne
    // canonique quand la fiche porte l'autre appellation (ligne créée à la
    // volée par `findOrCreateByNom`, donc sans trait à elle).
    const propres = racialFeatures.length > 0 || race?.nom === sousRace.nom
      ? racialFeatures
      : await traitsDe(sousRace.nom)
    // Parente : sous l'appellation portée si cette ligne a des traits à elle
    // (les 6 traits de « Petite-gens » sont saisis, comme ceux d'« Halfelin »),
    // sinon sous le nom du Manuel.
    const sousAppellation = appellationRace && appellationRace !== sousRace.race ? await traitsDe(appellationRace) : []
    const heritesBruts = sousAppellation.length > 0 ? sousAppellation : await traitsDe(sousRace.race)
    if (heritesBruts.length > 0 || propres !== racialFeatures) {
      const cle = (t: string) => t.trim().toLowerCase().replace(/[‘’ʼ]/g, "'")
      const retires = new Set((sousRace.remplace ?? []).map(cle))
      traitsRaciaux = [...heritesBruts.filter(f => !retires.has(cle(f.nom))), ...propres]
    }
  }

  return { character, race, sousRace: sousRace ?? null, appellationRace, clan, god, classes, abilityScores, combatStats, savingThrows, skills, feats, racialFeatures: traitsRaciaux, spells, weapons, armor, magicItems, potions, scrolls, currency, gems, equipement, languages, creatures, companions, spellEffects }
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
      classeNom: schema.classes.nom,
      classeNiveau: schema.characterClasses.niveau,
      joueurPrenom: schema.characters.joueurPrenom,
      joueurNom: schema.characters.joueurNom,
      clan: schema.clans.nom,
    })
    .from(schema.characters)
    .leftJoin(schema.races, eq(schema.characters.raceId, schema.races.id))
    .leftJoin(schema.characterClasses, eq(schema.characterClasses.personnageId, schema.characters.id))
    .leftJoin(schema.classes, eq(schema.characterClasses.classeId, schema.classes.id))
    .leftJoin(schema.clans, eq(schema.characters.clanId, schema.clans.id))
    .orderBy(schema.characters.nom)

  const map = new Map<number, {
    id: number; nom: string; surnom: string | null; alignement: string | null
    race: string | null; xp: number | null; classes: { nom: string; niveau: number }[]
    joueurPrenom: string | null; joueurNom: string | null; clan: string | null
  }>()

  for (const r of rows) {
    if (!map.has(r.id)) {
      map.set(r.id, {
        id: r.id, nom: r.nom, surnom: r.surnom, alignement: r.alignement,
        race: r.race, xp: r.xp, classes: [],
        joueurPrenom: r.joueurPrenom, joueurNom: r.joueurNom, clan: r.clan,
      })
    }
    if (r.classeNom && r.classeNiveau != null) {
      map.get(r.id)!.classes.push({ nom: r.classeNom, niveau: r.classeNiveau })
    }
  }

  return [...map.values()]
}

/**
 * Nom d'affichage d'un personnage, sans charger sa fiche entière.
 *
 * Sert au bouton « ← Retour à Cormac » des fiches de la Bibliothèque : quand on
 * y arrive depuis une fiche de personnage (`?from=/personnage/33`), la fiche de
 * référence nomme le personnage dans son lien de retour plutôt que d'écrire
 * « la fiche ». Rend `null` si l'identifiant ne correspond à personne — le
 * paramètre vient de l'URL, il peut mentir.
 */
export async function getNomPersonnage(id: number): Promise<string | null> {
  const [ligne] = await getDb()
    .select({ nom: schema.characters.nom })
    .from(schema.characters)
    .where(eq(schema.characters.id, id))
    .limit(1)
  return ligne?.nom ?? null
}
