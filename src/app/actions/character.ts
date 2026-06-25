'use server'

import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { CLASSES_DND35, getClasseInfo } from '@/lib/dnd35/classes'
import { RACES_DND35, getRaceInfo } from '@/lib/dnd35/races'
import { COMPETENCES_DND35 } from '@/lib/dnd35/skills'
import { getBab, getModifier } from '@/lib/dnd35/rules'

// ─── Type exported for the form component ───────────────────────────────────
export interface CharacterFormData {
  nom: string; surnom: string; sexe: string; age: number | string
  taille: string; poids: number | string; yeux: string; cheveux: string
  race: string; classe: string; niveau: number
  alignement: string; divinite: string; clan: string; xp: number
  photoUrl: string

  forBase: number; forMagique: number
  dexBase: number; dexMagique: number
  conBase: number; conMagique: number
  intBase: number; intMagique: number
  sagBase: number; sagMagique: number
  chaBase: number; chaMagique: number

  pvMax: number; pvActuels: number
  caArme: number; caBouclier: number; caNaturelle: number; caDeflexion: number; caDivers: number
  initiativeBonus: number
  bbaCorpsOverride: number | null
  bbaProjectilesOverride: number | null
  deplacement: number | null
  karma: number
  reflexesMagique: number; vigueurMagique: number; volonteMagique: number

  competences: { skillId: number; nom: string; caracteristique: string; rangs: number; divers: number }[]
  dons: string[]
  armes: { nom: string; degats: string; crit: string; typeDegats: string; portee: string; bonusMagique: number; quantite: number }[]
  armures: { nom: string; type: string; bonusCA: number; maxDex: number; malusComp: number; bonusMagique: number }[]
  objetsMagiques: { nom: string; type: string; emplacement: string; bonus: string; description: string }[]
  potions: { nom: string; effet: string; charges: number }[]
  po: number; pa: number; pc: number; pe: number; pm: number
  langues: string[]
  sorts: { nom: string; niveau: number; ecole: string; estPrepare: boolean }[]
  historique: string; notes: string
  compagnons: { nom: string; race: string; classe: string; joueur: string; notes: string }[]
}

// ─── Existing action ─────────────────────────────────────────────────────────
export async function updatePhotoUrl(personnageId: number, photoUrl: string) {
  const url = photoUrl.trim()
  await getDb()
    .update(schema.characters)
    .set({ photoUrl: url || null })
    .where(eq(schema.characters.id, personnageId))
  revalidatePath(`/personnage/${personnageId}`)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function findOrCreateByNom<T extends { id: number }>(
  selectFn: () => Promise<T[]>,
  insertFn: () => Promise<T[]>
): Promise<number> {
  const existing = await selectFn()
  if (existing.length > 0) return existing[0].id
  const [created] = await insertFn()
  return created.id
}

// ─── Main save action ─────────────────────────────────────────────────────────
export async function saveCharacter(
  data: CharacterFormData,
  personnageId?: number
): Promise<{ id: number }> {
  const db = getDb()
  const raceInfo = getRaceInfo(data.race)
  const classeInfo = getClasseInfo(data.classe)

  // ── 1. Race ──
  let raceId: number | null = null
  if (data.race) {
    raceId = await findOrCreateByNom(
      () => db.select({ id: schema.races.id }).from(schema.races).where(eq(schema.races.nom, data.race)).limit(1),
      () => db.insert(schema.races).values({
        nom: data.race,
        bonusFor: raceInfo?.bonusFor ?? 0, bonusDex: raceInfo?.bonusDex ?? 0,
        bonusCon: raceInfo?.bonusCon ?? 0, bonusInt: raceInfo?.bonusInt ?? 0,
        bonusSag: raceInfo?.bonusSag ?? 0, bonusCha: raceInfo?.bonusCha ?? 0,
        deplacementBase: raceInfo?.deplacement ?? 9,
        visionNocturne: raceInfo?.visionNocturne ?? false,
      }).returning({ id: schema.races.id })
    )
  }

  // ── 2. Classe ──
  let classeId: number | null = null
  if (data.classe) {
    classeId = await findOrCreateByNom(
      () => db.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.nom, data.classe)).limit(1),
      () => db.insert(schema.classes).values({
        nom: data.classe,
        deVie: `d${classeInfo?.de ?? 6}`,
        bbaProgression: classeInfo?.bab ?? 'faible',
        vigueurProgression: (classeInfo?.bonsSauvegardes ?? []).includes('vigueur') ? 'bon' : 'faible',
        reflexesProgression: (classeInfo?.bonsSauvegardes ?? []).includes('reflexes') ? 'bon' : 'faible',
        volonteProgression: (classeInfo?.bonsSauvegardes ?? []).includes('volonte') ? 'bon' : 'faible',
        competencesParNiveau: classeInfo?.competencesParNiveau ?? 2,
      }).returning({ id: schema.classes.id })
    )
  }

  // ── 3. Clan ──
  let clanId: number | null = null
  if (data.clan.trim()) {
    clanId = await findOrCreateByNom(
      () => db.select({ id: schema.clans.id }).from(schema.clans).where(eq(schema.clans.nom, data.clan.trim())).limit(1),
      () => db.insert(schema.clans).values({ nom: data.clan.trim() }).returning({ id: schema.clans.id })
    )
  }

  // ── 4. Personnage ──
  const charValues = {
    nom: data.nom.trim(),
    surnom: data.surnom || null,
    photoUrl: data.photoUrl || null,
    raceId, clanId,
    sexe: data.sexe || null,
    taille: data.taille || null,
    poids: data.poids !== '' ? Number(data.poids) : null,
    yeux: data.yeux || null,
    cheveux: data.cheveux || null,
    age: data.age !== '' ? Number(data.age) : null,
    alignement: data.alignement || null,
    xp: data.xp,
    notes: data.notes || null,
  }

  let charId: number
  if (personnageId) {
    await db.update(schema.characters).set({ ...charValues, updatedAt: new Date() }).where(eq(schema.characters.id, personnageId))
    charId = personnageId
  } else {
    const [created] = await db.insert(schema.characters).values(charValues).returning({ id: schema.characters.id })
    charId = created.id
  }

  // ── 5. Caractéristiques ──
  const scores = {
    forBase: data.forBase, forMagique: data.forMagique,
    dexBase: data.dexBase, dexMagique: data.dexMagique,
    conBase: data.conBase, conMagique: data.conMagique,
    intBase: data.intBase, intMagique: data.intMagique,
    sagBase: data.sagBase, sagMagique: data.sagMagique,
    chaBase: data.chaBase, chaMagique: data.chaMagique,
  }
  const existingScores = await db.select({ id: schema.characterAbilityScores.id })
    .from(schema.characterAbilityScores).where(eq(schema.characterAbilityScores.personnageId, charId)).limit(1)
  if (existingScores.length > 0) {
    await db.update(schema.characterAbilityScores).set(scores).where(eq(schema.characterAbilityScores.personnageId, charId))
  } else {
    await db.insert(schema.characterAbilityScores).values({ personnageId: charId, ...scores })
  }

  // ── 6. Stats de combat ──
  const forTotal = data.forBase + data.forMagique + (raceInfo?.bonusFor ?? 0)
  const dexTotal = data.dexBase + data.dexMagique + (raceInfo?.bonusDex ?? 0)
  const bbaBase = classeInfo ? getBab(classeInfo.bab, data.niveau) : 0
  const bbaCorps = data.bbaCorpsOverride ?? (bbaBase + getModifier(forTotal))
  const bbaProjectiles = data.bbaProjectilesOverride ?? (bbaBase + getModifier(dexTotal))
  const deplacementFinal = data.deplacement ?? (raceInfo?.deplacement ?? 9)

  const combatValues = {
    pvMax: data.pvMax, pvActuels: data.pvActuels,
    caArme: data.caArme, caBouclier: data.caBouclier,
    caNaturelle: data.caNaturelle, caDeflexion: data.caDeflexion, caDivers: data.caDivers,
    deplacement: deplacementFinal, karma: data.karma,
    initiativeBonus: data.initiativeBonus,
    bbaCorpsACorps: bbaCorps,
    bbaProjectiles: bbaProjectiles,
  }
  const existingCombat = await db.select({ id: schema.characterCombatStats.id })
    .from(schema.characterCombatStats).where(eq(schema.characterCombatStats.personnageId, charId)).limit(1)
  if (existingCombat.length > 0) {
    await db.update(schema.characterCombatStats).set(combatValues).where(eq(schema.characterCombatStats.personnageId, charId))
  } else {
    await db.insert(schema.characterCombatStats).values({ personnageId: charId, ...combatValues })
  }

  // ── 7. Jets de sauvegarde ──
  const isGoodVig = (classeInfo?.bonsSauvegardes ?? []).includes('vigueur')
  const isGoodRef = (classeInfo?.bonsSauvegardes ?? []).includes('reflexes')
  const isGoodVol = (classeInfo?.bonsSauvegardes ?? []).includes('volonte')
  const conTotal = data.conBase + data.conMagique + (raceInfo?.bonusCon ?? 0)
  const sagTotal = data.sagBase + data.sagMagique + (raceInfo?.bonusSag ?? 0)
  const saveValues = {
    vigueurBase: isGoodVig ? 2 + Math.floor(data.niveau / 2) : Math.floor(data.niveau / 3),
    vigueurMagique: data.vigueurMagique,
    reflexesBase: isGoodRef ? 2 + Math.floor(data.niveau / 2) : Math.floor(data.niveau / 3),
    reflexesMagique: data.reflexesMagique,
    volonteBase: isGoodVol ? 2 + Math.floor(data.niveau / 2) : Math.floor(data.niveau / 3),
    volonteMagique: data.volonteMagique,
  }
  const existingSaves = await db.select({ id: schema.characterSavingThrows.id })
    .from(schema.characterSavingThrows).where(eq(schema.characterSavingThrows.personnageId, charId)).limit(1)
  if (existingSaves.length > 0) {
    await db.update(schema.characterSavingThrows).set(saveValues).where(eq(schema.characterSavingThrows.personnageId, charId))
  } else {
    await db.insert(schema.characterSavingThrows).values({ personnageId: charId, ...saveValues })
  }

  // ── 8. Classe du personnage ──
  await db.delete(schema.characterClasses).where(eq(schema.characterClasses.personnageId, charId))
  if (classeId) {
    await db.insert(schema.characterClasses).values({ personnageId: charId, classeId, niveau: data.niveau })
  }

  // ── 9. Compétences ──
  await db.delete(schema.characterSkills).where(eq(schema.characterSkills.personnageId, charId))
  for (const comp of data.competences) {
    if ((comp.rangs ?? 0) === 0 && (comp.divers ?? 0) === 0) continue
    let skillId = comp.skillId > 0 ? comp.skillId : 0
    if (!skillId) {
      const compRef = COMPETENCES_DND35.find(c => c.nom === comp.nom)
      skillId = await findOrCreateByNom(
        () => db.select({ id: schema.skills.id }).from(schema.skills).where(eq(schema.skills.nom, comp.nom)).limit(1),
        () => db.insert(schema.skills).values({
          nom: comp.nom,
          caracteristique: comp.caracteristique,
          formationRequise: compRef?.formationRequise ?? false,
        }).returning({ id: schema.skills.id })
      )
    }
    await db.insert(schema.characterSkills).values({
      personnageId: charId, skillId,
      rangsInvestis: comp.rangs ?? 0,
      modifDivers: comp.divers ?? 0,
    })
  }

  // ── 10. Dons ──
  await db.delete(schema.characterFeats).where(eq(schema.characterFeats.personnageId, charId))
  for (const featNom of data.dons) {
    if (!featNom.trim()) continue
    const featId = await findOrCreateByNom(
      () => db.select({ id: schema.feats.id }).from(schema.feats).where(eq(schema.feats.nom, featNom.trim())).limit(1),
      () => db.insert(schema.feats).values({ nom: featNom.trim() }).returning({ id: schema.feats.id })
    )
    await db.insert(schema.characterFeats).values({ personnageId: charId, featId })
  }

  // ── 11. Armes ──
  await db.delete(schema.characterWeapons).where(eq(schema.characterWeapons.personnageId, charId))
  for (const arme of data.armes) {
    if (!arme.nom.trim()) continue
    const critMatch = arme.crit.match(/(\d+)(?:-20)?\/[×x](\d+)/)
    const critiqueMin = critMatch ? parseInt(critMatch[1]) : 20
    const critiqueMult = critMatch ? parseInt(critMatch[2]) : 2
    const armeId = await findOrCreateByNom(
      () => db.select({ id: schema.weapons.id }).from(schema.weapons).where(eq(schema.weapons.nom, arme.nom.trim())).limit(1),
      () => db.insert(schema.weapons).values({
        nom: arme.nom.trim(), degats: arme.degats || null,
        critiqueMin, critiqueMult,
        typeDegats: arme.typeDegats || null,
      }).returning({ id: schema.weapons.id })
    )
    await db.insert(schema.characterWeapons).values({
      personnageId: charId, armeId,
      bonusMagique: arme.bonusMagique ?? 0,
      quantite: arme.quantite ?? 1,
    })
  }

  // ── 12. Armure ──
  await db.delete(schema.characterArmor).where(eq(schema.characterArmor.personnageId, charId))
  for (const armure of data.armures) {
    if (!armure.nom.trim()) continue
    const armureId = await findOrCreateByNom(
      () => db.select({ id: schema.armor.id }).from(schema.armor).where(eq(schema.armor.nom, armure.nom.trim())).limit(1),
      () => db.insert(schema.armor).values({
        nom: armure.nom.trim(), type: armure.type || null,
        bonusArmure: armure.bonusCA ?? 0,
        maxDex: armure.maxDex ?? null,
        malusCompetence: armure.malusComp ?? 0,
      }).returning({ id: schema.armor.id })
    )
    await db.insert(schema.characterArmor).values({
      personnageId: charId, armureId,
      bonusMagique: armure.bonusMagique ?? 0,
    })
  }

  // ── 13. Objets magiques ──
  await db.delete(schema.characterMagicItems).where(eq(schema.characterMagicItems.personnageId, charId))
  for (const obj of data.objetsMagiques) {
    if (!obj.nom.trim()) continue
    const objetId = await findOrCreateByNom(
      () => db.select({ id: schema.magicItems.id }).from(schema.magicItems).where(eq(schema.magicItems.nom, obj.nom.trim())).limit(1),
      () => db.insert(schema.magicItems).values({
        nom: obj.nom.trim(), type: obj.type || null,
        emplacement: obj.emplacement || null,
        description: obj.description || null,
      }).returning({ id: schema.magicItems.id })
    )
    await db.insert(schema.characterMagicItems).values({
      personnageId: charId, objetId,
      emplacement: obj.emplacement || null,
      notes: obj.bonus ? `Bonus : ${obj.bonus}` : null,
    })
  }

  // ── 14. Potions ──
  await db.delete(schema.characterPotions).where(eq(schema.characterPotions.personnageId, charId))
  for (const pot of data.potions) {
    if (!pot.nom.trim()) continue
    const potionId = await findOrCreateByNom(
      () => db.select({ id: schema.potions.id }).from(schema.potions).where(eq(schema.potions.nom, pot.nom.trim())).limit(1),
      () => db.insert(schema.potions).values({
        nom: pot.nom.trim(), sortEffet: pot.effet || null, chargesMax: pot.charges ?? 1,
      }).returning({ id: schema.potions.id })
    )
    await db.insert(schema.characterPotions).values({
      personnageId: charId, potionId,
      chargesRestantes: pot.charges ?? 1,
    })
  }

  // ── 15. Trésor ──
  const currencyValues = {
    po: data.po.toString(), pa: data.pa.toString(),
    pc: data.pc.toString(), pe: data.pe.toString(), pm: data.pm.toString(),
  }
  const existingCurrency = await db.select({ id: schema.characterCurrency.id })
    .from(schema.characterCurrency).where(eq(schema.characterCurrency.personnageId, charId)).limit(1)
  if (existingCurrency.length > 0) {
    await db.update(schema.characterCurrency).set(currencyValues).where(eq(schema.characterCurrency.personnageId, charId))
  } else {
    await db.insert(schema.characterCurrency).values({ personnageId: charId, ...currencyValues })
  }

  // ── 16. Langues ──
  await db.delete(schema.characterLanguages).where(eq(schema.characterLanguages.personnageId, charId))
  for (const langNom of data.langues) {
    if (!langNom.trim()) continue
    const langueId = await findOrCreateByNom(
      () => db.select({ id: schema.languages.id }).from(schema.languages).where(eq(schema.languages.nom, langNom.trim())).limit(1),
      () => db.insert(schema.languages).values({ nom: langNom.trim() }).returning({ id: schema.languages.id })
    )
    await db.insert(schema.characterLanguages).values({ personnageId: charId, langueId })
  }

  // ── 17. Sorts ──
  await db.delete(schema.characterSpells).where(eq(schema.characterSpells.personnageId, charId))
  for (const sort of data.sorts) {
    if (!sort.nom.trim()) continue
    const sortId = await findOrCreateByNom(
      () => db.select({ id: schema.spells.id }).from(schema.spells).where(eq(schema.spells.nom, sort.nom.trim())).limit(1),
      () => db.insert(schema.spells).values({
        nom: sort.nom.trim(), ecole: sort.ecole || null,
      }).returning({ id: schema.spells.id })
    )
    await db.insert(schema.characterSpells).values({
      personnageId: charId, sortId,
      estConnu: 1,
      estPrepare: sort.estPrepare ? 1 : 0,
    })
  }

  // ── 18. Compagnons ──
  await db.delete(schema.characterCompanions).where(eq(schema.characterCompanions.personnageId, charId))
  for (const comp of data.compagnons) {
    if (!comp.nom.trim()) continue
    await db.insert(schema.characterCompanions).values({
      personnageId: charId,
      nom: comp.nom.trim(), race: comp.race || null,
      classe: comp.classe || null, joueur: comp.joueur || null,
      notes: comp.notes || null,
    })
  }

  revalidatePath('/')
  revalidatePath(`/personnage/${charId}`)
  return { id: charId }
}
