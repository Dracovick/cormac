'use server'

import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CLASSES_DND35, getClasseInfo } from '@/lib/dnd35/classes'
import { RACES_DND35, getRaceInfo } from '@/lib/dnd35/races'
import { COMPETENCES_DND35 } from '@/lib/dnd35/skills'
import { getBab, getModifier, getMultiClassSave } from '@/lib/dnd35/rules'

// ─── Type exported for the form component ───────────────────────────────────
export interface CharacterFormData {
  nom: string; surnom: string; sexe: string; age: number | string
  taille: string; poids: number | string; yeux: string; cheveux: string
  race: string; classe: string; niveau: number
  classes: { classe: string; niveau: number }[]
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
  armes: { nom: string; degats: string; crit: string; typeDegats: string; portee: string; bonusMagique: number; coteDeForce?: number | null; bonusMunitions?: number | null; quantite: number }[]
  armures: { nom: string; type: string; bonusCA: number; maxDex: number; malusComp: number; bonusMagique: number }[]
  objetsMagiques: { nom: string; type: string; emplacement: string; bonus: string; description: string; charges: number }[]
  potions: { nom: string; effet: string; charges: number }[]
  pp: number; po: number; pe: number; pa: number; pc: number; pm: number
  langues: string[]
  sorts: { nom: string; niveau: number; ecole: string; nombrePrepare: number }[]
  historique: string; notes: string
  compagnons: { nom: string; race: string; classe: string; joueur: string; notes: string }[]
  joueurPrenom: string; joueurNom: string
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
  const allClasses = data.classes?.length > 0 ? data.classes : [{ classe: data.classe, niveau: data.niveau }]

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

  // ── 2. Classe principale (pour compatibilité) ──
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
    joueurPrenom: data.joueurPrenom?.trim() || null,
    joueurNom: data.joueurNom?.trim() || null,
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
  const bbaBase = allClasses.reduce((sum, c) => {
    const info = getClasseInfo(c.classe)
    return sum + (info ? getBab(info.bab, c.niveau) : 0)
  }, 0)
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

  // ── 7. Jets de sauvegarde — multi-classe ──
  const classesForSaves = allClasses.map(c => ({
    bonsSauvegardes: getClasseInfo(c.classe)?.bonsSauvegardes ?? [],
    niveau: c.niveau,
  }))
  const saveValues = {
    vigueurBase: getMultiClassSave('vigueur', classesForSaves),
    vigueurMagique: data.vigueurMagique,
    reflexesBase: getMultiClassSave('reflexes', classesForSaves),
    reflexesMagique: data.reflexesMagique,
    volonteBase: getMultiClassSave('volonte', classesForSaves),
    volonteMagique: data.volonteMagique,
  }
  const existingSaves = await db.select({ id: schema.characterSavingThrows.id })
    .from(schema.characterSavingThrows).where(eq(schema.characterSavingThrows.personnageId, charId)).limit(1)
  if (existingSaves.length > 0) {
    await db.update(schema.characterSavingThrows).set(saveValues).where(eq(schema.characterSavingThrows.personnageId, charId))
  } else {
    await db.insert(schema.characterSavingThrows).values({ personnageId: charId, ...saveValues })
  }

  // ── 8. Classes du personnage (multi-classe) ──
  await db.delete(schema.characterClasses).where(eq(schema.characterClasses.personnageId, charId))
  for (const c of allClasses) {
    if (!c.classe) continue
    const cInfo = getClasseInfo(c.classe)
    const cId = await findOrCreateByNom(
      () => db.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.nom, c.classe)).limit(1),
      () => db.insert(schema.classes).values({
        nom: c.classe,
        deVie: `d${cInfo?.de ?? 6}`,
        bbaProgression: cInfo?.bab ?? 'faible',
        vigueurProgression: (cInfo?.bonsSauvegardes ?? []).includes('vigueur') ? 'bon' : 'faible',
        reflexesProgression: (cInfo?.bonsSauvegardes ?? []).includes('reflexes') ? 'bon' : 'faible',
        volonteProgression: (cInfo?.bonsSauvegardes ?? []).includes('volonte') ? 'bon' : 'faible',
        competencesParNiveau: cInfo?.competencesParNiveau ?? 2,
      }).returning({ id: schema.classes.id })
    )
    await db.insert(schema.characterClasses).values({ personnageId: charId, classeId: cId, niveau: c.niveau })
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
    const porteeNum = arme.portee && arme.portee !== 'Contact' ? parseInt(arme.portee) || null : null
    const armeId = await findOrCreateByNom(
      () => db.select({ id: schema.weapons.id }).from(schema.weapons).where(eq(schema.weapons.nom, arme.nom.trim())).limit(1),
      () => db.insert(schema.weapons).values({
        nom: arme.nom.trim(), degats: arme.degats || null,
        critiqueMin, critiqueMult,
        typeDegats: arme.typeDegats || null,
        portee: porteeNum,
      }).returning({ id: schema.weapons.id })
    )
    await db.insert(schema.characterWeapons).values({
      personnageId: charId, armeId,
      bonusMagique: arme.bonusMagique ?? 0,
      coteDeForce: arme.coteDeForce ?? null,
      bonusMunitions: arme.bonusMunitions ?? null,
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
        chargesMax: obj.charges > 0 ? obj.charges : null,
      }).returning({ id: schema.magicItems.id })
    )
    await db.insert(schema.characterMagicItems).values({
      personnageId: charId, objetId,
      emplacement: obj.emplacement || null,
      notes: obj.bonus ? `Bonus : ${obj.bonus}` : null,
      chargesRestantes: obj.charges > 0 ? obj.charges : null,
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
    pp: data.pp.toString(), po: data.po.toString(), pe: data.pe.toString(),
    pa: data.pa.toString(), pc: data.pc.toString(), pm: data.pm.toString(),
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
      niveau: sort.niveau || null,
      estConnu: 1,
      estPrepare: sort.nombrePrepare ?? 0,
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

// ─── Delete character ─────────────────────────────────────────────────────────
export async function deleteCharacter(personnageId: number): Promise<void> {
  const db = getDb()
  await Promise.all([
    db.delete(schema.characterAbilityScores).where(eq(schema.characterAbilityScores.personnageId, personnageId)),
    db.delete(schema.characterCombatStats).where(eq(schema.characterCombatStats.personnageId, personnageId)),
    db.delete(schema.characterSavingThrows).where(eq(schema.characterSavingThrows.personnageId, personnageId)),
    db.delete(schema.characterClasses).where(eq(schema.characterClasses.personnageId, personnageId)),
    db.delete(schema.characterSkills).where(eq(schema.characterSkills.personnageId, personnageId)),
    db.delete(schema.characterFeats).where(eq(schema.characterFeats.personnageId, personnageId)),
    db.delete(schema.characterWeapons).where(eq(schema.characterWeapons.personnageId, personnageId)),
    db.delete(schema.characterArmor).where(eq(schema.characterArmor.personnageId, personnageId)),
    db.delete(schema.characterMagicItems).where(eq(schema.characterMagicItems.personnageId, personnageId)),
    db.delete(schema.characterPotions).where(eq(schema.characterPotions.personnageId, personnageId)),
    db.delete(schema.characterCurrency).where(eq(schema.characterCurrency.personnageId, personnageId)),
    db.delete(schema.characterLanguages).where(eq(schema.characterLanguages.personnageId, personnageId)),
    db.delete(schema.characterSpells).where(eq(schema.characterSpells.personnageId, personnageId)),
    db.delete(schema.characterCreatures).where(eq(schema.characterCreatures.personnageId, personnageId)),
    db.delete(schema.characterCompanions).where(eq(schema.characterCompanions.personnageId, personnageId)),
    db.delete(schema.characterNotes).where(eq(schema.characterNotes.personnageId, personnageId)),
  ])
  await db.delete(schema.characters).where(eq(schema.characters.id, personnageId))
  revalidatePath('/')
  redirect('/')
}

// ─── Actions de jeu en temps réel ────────────────────────────────────────────

export async function updatePvActuels(personnageId: number, pvActuels: number) {
  await getDb()
    .update(schema.characterCombatStats)
    .set({ pvActuels })
    .where(eq(schema.characterCombatStats.personnageId, personnageId))
  revalidatePath(`/personnage/${personnageId}`)
}

export async function depenseSort(charSpellId: number, personnageId: number) {
  const [row] = await getDb()
    .select({ estPrepare: schema.characterSpells.estPrepare })
    .from(schema.characterSpells)
    .where(eq(schema.characterSpells.id, charSpellId))
  if (!row) return
  const newVal = Math.max(0, (row.estPrepare ?? 0) - 1)
  await getDb()
    .update(schema.characterSpells)
    .set({ estPrepare: newVal })
    .where(eq(schema.characterSpells.id, charSpellId))
  revalidatePath(`/personnage/${personnageId}`)
}

export async function depensePotion(charPotionId: number, personnageId: number) {
  const [row] = await getDb()
    .select({ chargesRestantes: schema.characterPotions.chargesRestantes })
    .from(schema.characterPotions)
    .where(eq(schema.characterPotions.id, charPotionId))
  if (!row) return
  const newVal = Math.max(0, (row.chargesRestantes ?? 1) - 1)
  await getDb()
    .update(schema.characterPotions)
    .set({ chargesRestantes: newVal })
    .where(eq(schema.characterPotions.id, charPotionId))
  revalidatePath(`/personnage/${personnageId}`)
}

export async function preparerSorts(personnageId: number, preparations: { charSpellId: number; estPrepare: number }[]) {
  const db = getDb()
  await Promise.all(
    preparations.map(p =>
      db.update(schema.characterSpells)
        .set({ estPrepare: p.estPrepare })
        .where(eq(schema.characterSpells.id, p.charSpellId))
    )
  )
  revalidatePath(`/personnage/${personnageId}`)
}

export async function preparerSortsDivins(
  personnageId: number,
  preparations: { nom: string; ecole: string; niveau: number; estPrepare: number; estPersonnalise?: boolean }[]
) {
  const db = getDb()
  // Supprimer seulement les sorts non-personnalisés (estConnu != 2), garder les custom
  await db.delete(schema.characterSpells).where(
    and(eq(schema.characterSpells.personnageId, personnageId), ne(schema.characterSpells.estConnu, 2))
  )
  // Remettre estPrepare=0 pour les sorts personnalisés avant de les réappliquer
  await db.update(schema.characterSpells)
    .set({ estPrepare: 0 })
    .where(and(eq(schema.characterSpells.personnageId, personnageId), eq(schema.characterSpells.estConnu, 2)))

  for (const sort of preparations) {
    if (sort.estPrepare <= 0) continue
    if (sort.estPersonnalise) {
      // Mettre à jour l'estPrepare du sort personnalisé déjà en base
      const [spell] = await db.select({ id: schema.spells.id })
        .from(schema.spells).where(eq(schema.spells.nom, sort.nom)).limit(1)
      if (spell) {
        await db.update(schema.characterSpells)
          .set({ estPrepare: sort.estPrepare })
          .where(and(
            eq(schema.characterSpells.personnageId, personnageId),
            eq(schema.characterSpells.sortId, spell.id),
            eq(schema.characterSpells.estConnu, 2)
          ))
      }
    } else {
      const sortId = await findOrCreateByNom(
        () => db.select({ id: schema.spells.id }).from(schema.spells).where(eq(schema.spells.nom, sort.nom)).limit(1),
        () => db.insert(schema.spells).values({ nom: sort.nom, ecole: sort.ecole || null }).returning({ id: schema.spells.id })
      )
      await db.insert(schema.characterSpells).values({
        personnageId, sortId, niveau: sort.niveau, estConnu: 1, estPrepare: sort.estPrepare,
      })
    }
  }
  revalidatePath(`/personnage/${personnageId}`)
}

export async function ajouterSortPersonnalise(
  personnageId: number,
  sort: { nom: string; ecole: string; niveau: number }
) {
  const db = getDb()
  const sortId = await findOrCreateByNom(
    () => db.select({ id: schema.spells.id }).from(schema.spells).where(eq(schema.spells.nom, sort.nom.trim())).limit(1),
    () => db.insert(schema.spells).values({ nom: sort.nom.trim(), ecole: sort.ecole || null }).returning({ id: schema.spells.id })
  )
  const existing = await db.select({ id: schema.characterSpells.id })
    .from(schema.characterSpells)
    .where(and(eq(schema.characterSpells.personnageId, personnageId), eq(schema.characterSpells.sortId, sortId)))
    .limit(1)
  if (existing.length === 0) {
    await db.insert(schema.characterSpells).values({
      personnageId, sortId, niveau: sort.niveau, estConnu: 2, estPrepare: 0,
    })
  }
  revalidatePath(`/personnage/${personnageId}`)
}

export async function supprimerSortPersonnalise(charSpellId: number, personnageId: number) {
  const db = getDb()
  await db.delete(schema.characterSpells).where(
    and(
      eq(schema.characterSpells.id, charSpellId),
      eq(schema.characterSpells.personnageId, personnageId),
      eq(schema.characterSpells.estConnu, 2)
    )
  )
  revalidatePath(`/personnage/${personnageId}`)
}

export async function updateNotes(personnageId: number, notes: string) {
  await getDb()
    .update(schema.characters)
    .set({ notes: notes.trim() || null })
    .where(eq(schema.characters.id, personnageId))
  revalidatePath(`/personnage/${personnageId}`)
}

export async function depenseChargeObjet(charItemId: number, personnageId: number) {
  const [row] = await getDb()
    .select({ chargesRestantes: schema.characterMagicItems.chargesRestantes })
    .from(schema.characterMagicItems)
    .where(eq(schema.characterMagicItems.id, charItemId))
  if (!row) return
  const newVal = Math.max(0, (row.chargesRestantes ?? 0) - 1)
  await getDb()
    .update(schema.characterMagicItems)
    .set({ chargesRestantes: newVal })
    .where(eq(schema.characterMagicItems.id, charItemId))
  revalidatePath(`/personnage/${personnageId}`)
}
