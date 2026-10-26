'use server'

import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { eq, and, ne, or, isNull } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CLASSES_DND35, getClasseInfo } from '@/lib/dnd35/classes'
import { RACES_DND35, getRaceInfo } from '@/lib/dnd35/races'
import { COMPETENCES_DND35 } from '@/lib/dnd35/skills'
import { getBab, getMultiClassSave, xpPourNiveau } from '@/lib/dnd35/rules'
import { parseCritique } from '@/lib/dnd35/critique'
import { SORTS_DND35 } from '@/lib/dnd35/spells'
import { SORTS_EFFETS_CA, SORTS_EFFETS_CARAC, SORTS_EFFETS_VISUELS, SORTS_EFFETS_SUIVI, valeurEffetSelonNiveau } from '@/lib/dnd35/spell-effects'
import { UNITES_MONNAIE } from '@/lib/dnd35/monnaie'
import { logJournal } from '@/lib/journal'
import { nomParchemin } from '@/lib/parchemins'
import { normaliserNom } from '@/lib/noms'
import { aliasPour } from '@/lib/dnd35/anciens-noms'

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
  caNaturelle: number; caDeflexion: number; caDivers: number
  domaine1: string; domaine2: string
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
  objetsMagiques: { nom: string; type: string; emplacement: string; bonus: string; bonusType: string; description: string; charges: number }[]
  potions: { nom: string; effet: string; charges: number }[]
  gemmes: { nom: string; quantite: number; valeur: number; unite: string; notes: string }[]
  pp: number; po: number; pe: number; pa: number; pc: number; pm: number
  langues: string[]
  sorts: { nom: string; niveau: number; ecole: string; nombrePrepare: number; classe?: string }[]
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
/** Référence créée faute d'avoir été reconnue — sert à en avertir l'utilisateur. */
export type NouvelleReference = { table: string; nom: string }

async function findOrCreateByNom<T extends { id: number }>(
  selectFn: () => Promise<T[]>,
  insertFn: () => Promise<T[]>,
  souple?: {
    /** Tous les noms de la table. Chargés seulement si la recherche exacte a échoué. */
    tous: () => Promise<{ id: number; nom: string }[]>
    nom: string
    table: string
    /** Collecteur des créations, pour l'avertissement de fin de sauvegarde. */
    creees?: NouvelleReference[]
  }
): Promise<number> {
  const existing = await selectFn()
  if (existing.length > 0) return existing[0].id

  // Deuxième chance : le nom existe peut-être déjà à la casse, aux accents ou
  // aux espaces près. On réutilise alors l'entrée trouvée plutôt que d'en créer
  // une jumelle — c'est ainsi que 45 compétences en étaient devenues 191.
  // Cette requête ne part que lorsque la recherche exacte a échoué.
  if (souple && normaliserNom(souple.nom) !== '') {
    const cible = normaliserNom(souple.nom)
    const tous = await souple.tous()
    const trouve = tous.find(r => normaliserNom(r.nom) === cible)
    if (trouve) return trouve.id
  }

  const [created] = await insertFn()
  if (souple?.creees) souple.creees.push({ table: souple.table, nom: souple.nom })
  return created.id
}

// ─── Main save action ─────────────────────────────────────────────────────────
export async function saveCharacter(
  data: CharacterFormData,
  personnageId?: number
): Promise<{ id: number; nouvellesReferences: NouvelleReference[] }> {
  const db = getDb()
  const referencesCreees: NouvelleReference[] = []
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
    ,
      { tous: () => db.select({ id: schema.races.id, nom: schema.races.nom }).from(schema.races),
        nom: data.race, table: 'races', creees: referencesCreees }
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
    ,
      { tous: () => db.select({ id: schema.classes.id, nom: schema.classes.nom }).from(schema.classes),
        nom: data.classe, table: 'classes', creees: referencesCreees }
    )
  }

  // ── 3. Clan ──
  let clanId: number | null = null
  if (data.clan.trim()) {
    clanId = await findOrCreateByNom(
      () => db.select({ id: schema.clans.id }).from(schema.clans).where(eq(schema.clans.nom, data.clan.trim())).limit(1),
      () => db.insert(schema.clans).values({ nom: data.clan.trim() }).returning({ id: schema.clans.id })
    ,
      { tous: () => db.select({ id: schema.clans.id, nom: schema.clans.nom }).from(schema.clans),
        nom: data.clan.trim(), table: 'clans', creees: referencesCreees }
    )
  }

  // ── 3b. Divinité ──
  let dieuId: number | null = null
  if (data.divinite?.trim()) {
    dieuId = await findOrCreateByNom(
      () => db.select({ id: schema.gods.id }).from(schema.gods).where(eq(schema.gods.nom, data.divinite.trim())).limit(1),
      () => db.insert(schema.gods).values({ nom: data.divinite.trim() }).returning({ id: schema.gods.id })
    ,
      { tous: () => db.select({ id: schema.gods.id, nom: schema.gods.nom }).from(schema.gods),
        nom: data.divinite.trim(), table: 'gods', creees: referencesCreees }
    )
  }

  // ── 4. Personnage ──
  const charValues = {
    nom: data.nom.trim(),
    surnom: data.surnom || null,
    photoUrl: data.photoUrl || null,
    raceId, clanId, dieuId,
    sexe: data.sexe || null,
    taille: data.taille || null,
    poids: data.poids !== '' ? Number(data.poids) : null,
    yeux: data.yeux || null,
    cheveux: data.cheveux || null,
    age: data.age !== '' ? Number(data.age) : null,
    alignement: data.alignement || null,
    xp: data.xp,
    historique: data.historique || null,
    notes: data.notes || null,
    joueurPrenom: data.joueurPrenom?.trim() || null,
    joueurNom: data.joueurNom?.trim() || null,
  }

  let charId: number
  if (personnageId) {
    charId = personnageId
  } else {
    const [created] = await db.insert(schema.characters).values(charValues).returning({ id: schema.characters.id })
    charId = created.id
  }

  // Toutes les écritures sur les tables du personnage s'accumulent ici puis partent
  // en un seul db.batch — une transaction côté Neon. Une erreur à mi-chemin ne peut
  // plus laisser une section supprimée sans sa réinsertion : tout passe ou rien.
  const ecritures: BatchItem<'pg'>[] = []
  if (personnageId) {
    ecritures.push(db.update(schema.characters).set({ ...charValues, updatedAt: new Date() }).where(eq(schema.characters.id, personnageId)))
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
    ecritures.push(db.update(schema.characterAbilityScores).set(scores).where(eq(schema.characterAbilityScores.personnageId, charId)))
  } else {
    ecritures.push(db.insert(schema.characterAbilityScores).values({ personnageId: charId, ...scores }))
  }

  // ── 6. Stats de combat ──
  // Le BBA stocké est le bonus de BASE, sans modificateur de caractéristique : la
  // fiche ajoute elle-même FOR (corps à corps) et DEX (projectiles). Stocker base+FOR
  // ici ferait compter le modificateur deux fois à l'affichage.
  const bbaBase = allClasses.reduce((sum, c) => {
    const info = getClasseInfo(c.classe)
    return sum + (info ? getBab(info.bab, c.niveau) : 0)
  }, 0)
  const bbaCorps = data.bbaCorpsOverride ?? bbaBase
  const bbaProjectiles = data.bbaProjectilesOverride ?? bbaBase
  const deplacementFinal = data.deplacement ?? (raceInfo?.deplacement ?? 9)

  const combatValues = {
    pvMax: data.pvMax, pvActuels: data.pvActuels,
    caNaturelle: data.caNaturelle, caDeflexion: data.caDeflexion, caDivers: data.caDivers,
    domaine1: data.domaine1 || null, domaine2: data.domaine2 || null,
    deplacement: deplacementFinal, karma: data.karma,
    initiativeBonus: data.initiativeBonus,
    bbaCorpsACorps: bbaCorps,
    bbaProjectiles: bbaProjectiles,
  }
  const existingCombat = await db.select({ id: schema.characterCombatStats.id })
    .from(schema.characterCombatStats).where(eq(schema.characterCombatStats.personnageId, charId)).limit(1)
  if (existingCombat.length > 0) {
    ecritures.push(db.update(schema.characterCombatStats).set(combatValues).where(eq(schema.characterCombatStats.personnageId, charId)))
  } else {
    ecritures.push(db.insert(schema.characterCombatStats).values({ personnageId: charId, ...combatValues }))
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
    ecritures.push(db.update(schema.characterSavingThrows).set(saveValues).where(eq(schema.characterSavingThrows.personnageId, charId)))
  } else {
    ecritures.push(db.insert(schema.characterSavingThrows).values({ personnageId: charId, ...saveValues }))
  }

  // ── 8. Classes du personnage (multi-classe) ──
  ecritures.push(db.delete(schema.characterClasses).where(eq(schema.characterClasses.personnageId, charId)))
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
    ,
      { tous: () => db.select({ id: schema.classes.id, nom: schema.classes.nom }).from(schema.classes),
        nom: c.classe, table: 'classes', creees: referencesCreees }
    )
    ecritures.push(db.insert(schema.characterClasses).values({ personnageId: charId, classeId: cId, niveau: c.niveau }))
  }

  // ── 9. Compétences ──
  ecritures.push(db.delete(schema.characterSkills).where(eq(schema.characterSkills.personnageId, charId)))
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
      ,
      { tous: () => db.select({ id: schema.skills.id, nom: schema.skills.nom }).from(schema.skills),
        nom: comp.nom, table: 'skills', creees: referencesCreees }
    )
    }
    ecritures.push(db.insert(schema.characterSkills).values({
      personnageId: charId, skillId,
      rangsInvestis: comp.rangs ?? 0,
      modifDivers: comp.divers ?? 0,
    }))
  }

  // ── 10. Dons ──
  ecritures.push(db.delete(schema.characterFeats).where(eq(schema.characterFeats.personnageId, charId)))
  for (const featNom of data.dons) {
    if (!featNom.trim()) continue
    const featId = await findOrCreateByNom(
      () => db.select({ id: schema.feats.id }).from(schema.feats).where(eq(schema.feats.nom, featNom.trim())).limit(1),
      () => db.insert(schema.feats).values({ nom: featNom.trim() }).returning({ id: schema.feats.id })
    ,
      { tous: () => db.select({ id: schema.feats.id, nom: schema.feats.nom }).from(schema.feats),
        nom: featNom.trim(), table: 'feats', creees: referencesCreees }
    )
    ecritures.push(db.insert(schema.characterFeats).values({ personnageId: charId, featId }))
  }

  // ── 11. Armes ──
  ecritures.push(db.delete(schema.characterWeapons).where(eq(schema.characterWeapons.personnageId, charId)))
  for (const arme of data.armes) {
    if (!arme.nom.trim()) continue
    const critMatch = parseCritique(arme.crit)
    const critiqueMin = critMatch ? critMatch.min : 20
    const critiqueMult = critMatch ? critMatch.mult : 2
    const porteeNum = arme.portee && arme.portee !== 'Contact' ? parseInt(arme.portee) || null : null
    const armeId = await findOrCreateByNom(
      () => db.select({ id: schema.weapons.id }).from(schema.weapons).where(eq(schema.weapons.nom, arme.nom.trim())).limit(1),
      () => db.insert(schema.weapons).values({
        nom: arme.nom.trim(), degats: arme.degats || null,
        critiqueMin, critiqueMult,
        typeDegats: arme.typeDegats || null,
        portee: porteeNum,
      }).returning({ id: schema.weapons.id })
    ,
      { tous: () => db.select({ id: schema.weapons.id, nom: schema.weapons.nom }).from(schema.weapons),
        nom: arme.nom.trim(), table: 'weapons', creees: referencesCreees }
    )
    // La saisie fait foi — même principe que l'effet des potions : un champ rempli
    // met à jour la référence partagée, un champ vide ne détruit rien.
    const majArme: Partial<typeof schema.weapons.$inferInsert> = {}
    if (arme.degats?.trim()) majArme.degats = arme.degats.trim()
    if (critMatch) { majArme.critiqueMin = critiqueMin; majArme.critiqueMult = critiqueMult }
    if (arme.typeDegats?.trim()) majArme.typeDegats = arme.typeDegats.trim()
    if (arme.portee?.trim()) majArme.portee = porteeNum
    if (Object.keys(majArme).length > 0) {
      ecritures.push(db.update(schema.weapons).set(majArme).where(eq(schema.weapons.id, armeId)))
    }
    ecritures.push(db.insert(schema.characterWeapons).values({
      personnageId: charId, armeId,
      bonusMagique: arme.bonusMagique ?? 0,
      coteDeForce: arme.coteDeForce ?? null,
      bonusMunitions: arme.bonusMunitions ?? null,
      quantite: arme.quantite ?? 1,
    }))
  }

  // ── 12. Armure ──
  ecritures.push(db.delete(schema.characterArmor).where(eq(schema.characterArmor.personnageId, charId)))
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
    ,
      { tous: () => db.select({ id: schema.armor.id, nom: schema.armor.nom }).from(schema.armor),
        nom: armure.nom.trim(), table: 'armor', creees: referencesCreees }
    )
    // La saisie fait foi. Le bonus CA sert de sentinelle : à 0, la ligne n'a pas été
    // remplie (aucune armure réelle ne protège de 0) — on ne touche pas la référence.
    // Au formulaire, maxDex 10 signifie « sans limite » : en base, c'est null.
    const majArmure: Partial<typeof schema.armor.$inferInsert> = {}
    if (armure.type?.trim()) majArmure.type = armure.type.trim()
    if ((armure.bonusCA ?? 0) > 0) {
      majArmure.bonusArmure = armure.bonusCA
      majArmure.maxDex = armure.maxDex === 10 ? null : (armure.maxDex ?? null)
      majArmure.malusCompetence = armure.malusComp ?? 0
    }
    if (Object.keys(majArmure).length > 0) {
      ecritures.push(db.update(schema.armor).set(majArmure).where(eq(schema.armor.id, armureId)))
    }
    ecritures.push(db.insert(schema.characterArmor).values({
      personnageId: charId, armureId,
      bonusMagique: armure.bonusMagique ?? 0,
    }))
  }

  // ── 13. Objets magiques ──
  ecritures.push(db.delete(schema.characterMagicItems).where(eq(schema.characterMagicItems.personnageId, charId)))
  for (const obj of data.objetsMagiques) {
    if (!obj.nom.trim()) continue
    const bonusInt = parseInt(obj.bonus) || null
    const objetId = await findOrCreateByNom(
      () => db.select({ id: schema.magicItems.id }).from(schema.magicItems).where(eq(schema.magicItems.nom, obj.nom.trim())).limit(1),
      () => db.insert(schema.magicItems).values({
        nom: obj.nom.trim(), type: obj.type || null,
        emplacement: obj.emplacement || null,
        bonus: bonusInt,
        // Vide = ce bonus ne va PAS à la classe d'armure (voir drizzle/0011).
        bonusType: obj.bonusType?.trim() || null,
        description: obj.description || null,
        chargesMax: obj.charges > 0 ? obj.charges : null,
      }).returning({ id: schema.magicItems.id })
    ,
      { tous: () => db.select({ id: schema.magicItems.id, nom: schema.magicItems.nom }).from(schema.magicItems),
        nom: obj.nom.trim(), table: 'magicItems', creees: referencesCreees }
    )
    // La saisie fait foi — un champ rempli met à jour la référence partagée, un
    // champ vide ne détruit rien (l'ancien update inconditionnel du bonus écrasait
    // la valeur avec null dès que le champ était laissé vide).
    const majObjet: Partial<typeof schema.magicItems.$inferInsert> = {}
    if (obj.type?.trim()) majObjet.type = obj.type.trim()
    if (obj.bonus?.trim() && bonusInt !== null) majObjet.bonus = bonusInt
    // ⚠ Exception à la règle « un champ vide ne détruit rien » : pour le type de
    // bonus, vide VEUT DIRE quelque chose — « ce +2 ne va pas à la CA ». Le MJ
    // doit pouvoir retirer un type posé par erreur. On n'écrit donc que si
    // l'objet porte un bonus, seul cas où le type a un sens.
    if (obj.bonus?.trim() && bonusInt !== null) majObjet.bonusType = obj.bonusType?.trim() || null
    if (obj.description?.trim()) majObjet.description = obj.description.trim()
    if (Object.keys(majObjet).length > 0) {
      ecritures.push(db.update(schema.magicItems).set(majObjet).where(eq(schema.magicItems.id, objetId)))
    }
    ecritures.push(db.insert(schema.characterMagicItems).values({
      personnageId: charId, objetId,
      emplacement: obj.emplacement || null,
      chargesRestantes: obj.charges > 0 ? obj.charges : null,
    }))
  }

  // ── 14. Potions ──
  ecritures.push(db.delete(schema.characterPotions).where(eq(schema.characterPotions.personnageId, charId)))
  for (const pot of data.potions) {
    if (!pot.nom.trim()) continue
    const potionId = await findOrCreateByNom(
      () => db.select({ id: schema.potions.id }).from(schema.potions).where(eq(schema.potions.nom, pot.nom.trim())).limit(1),
      () => db.insert(schema.potions).values({
        nom: pot.nom.trim(), sortEffet: pot.effet || null, chargesMax: pot.charges ?? 1,
      }).returning({ id: schema.potions.id })
    ,
      { tous: () => db.select({ id: schema.potions.id, nom: schema.potions.nom }).from(schema.potions),
        nom: pot.nom.trim(), table: 'potions', creees: referencesCreees }
    )
    // L'effet saisi au formulaire fait foi : il met à jour la référence partagée
    // (tous les personnages qui portent cette potion voient le nouvel effet).
    if (pot.effet?.trim()) {
      ecritures.push(db.update(schema.potions)
        .set({ sortEffet: pot.effet.trim() })
        .where(and(eq(schema.potions.id, potionId), or(isNull(schema.potions.sortEffet), ne(schema.potions.sortEffet, pot.effet.trim())))))
    }
    ecritures.push(db.insert(schema.characterPotions).values({
      personnageId: charId, potionId,
      chargesRestantes: pot.charges ?? 1,
    }))
  }

  // ── 15. Trésor ──
  const currencyValues = {
    pp: data.pp.toString(), po: data.po.toString(), pe: data.pe.toString(),
    pa: data.pa.toString(), pc: data.pc.toString(), pm: data.pm.toString(),
  }
  const existingCurrency = await db.select({ id: schema.characterCurrency.id })
    .from(schema.characterCurrency).where(eq(schema.characterCurrency.personnageId, charId)).limit(1)
  if (existingCurrency.length > 0) {
    ecritures.push(db.update(schema.characterCurrency).set(currencyValues).where(eq(schema.characterCurrency.personnageId, charId)))
  } else {
    ecritures.push(db.insert(schema.characterCurrency).values({ personnageId: charId, ...currencyValues }))
  }

  // ── 15b. Gemmes ──
  // Écrites directement dans character_gems, sans passer par le catalogue
  // `gems` : la valeur d'une gemme appartient au trésor de CE personnage.
  ecritures.push(db.delete(schema.characterGems).where(eq(schema.characterGems.personnageId, charId)))
  for (const gem of data.gemmes ?? []) {
    if (!gem.nom.trim()) continue
    ecritures.push(db.insert(schema.characterGems).values({
      personnageId: charId,
      nom: gem.nom.trim(),
      quantite: gem.quantite > 0 ? gem.quantite : 1,
      valeur: (gem.valeur ?? 0).toString(),
      unite: UNITES_MONNAIE.some(u => u.code === gem.unite) ? gem.unite : 'po',
      notes: gem.notes?.trim() || null,
    }))
  }

  // ── 16. Langues ──
  ecritures.push(db.delete(schema.characterLanguages).where(eq(schema.characterLanguages.personnageId, charId)))
  for (const langNom of data.langues) {
    if (!langNom.trim()) continue
    const langueId = await findOrCreateByNom(
      () => db.select({ id: schema.languages.id }).from(schema.languages).where(eq(schema.languages.nom, langNom.trim())).limit(1),
      () => db.insert(schema.languages).values({ nom: langNom.trim() }).returning({ id: schema.languages.id })
    ,
      { tous: () => db.select({ id: schema.languages.id, nom: schema.languages.nom }).from(schema.languages),
        nom: langNom.trim(), table: 'languages', creees: referencesCreees }
    )
    ecritures.push(db.insert(schema.characterLanguages).values({ personnageId: charId, langueId }))
  }

  // ── 17. Sorts ──
  // Préserver le statut des sorts personnalisés (estConnu=2, ajoutés via ➕) : la
  // réécriture ne doit pas les rétrograder en sorts ordinaires, sinon ils seraient
  // balayés à la prochaine préparation de sorts.
  const sortsExistants = personnageId
    ? await db.select({ sortId: schema.characterSpells.sortId, estConnu: schema.characterSpells.estConnu })
        .from(schema.characterSpells).where(eq(schema.characterSpells.personnageId, charId))
    : []
  const statutSort = new Map(sortsExistants.map(r => [r.sortId, r.estConnu]))
  ecritures.push(db.delete(schema.characterSpells).where(eq(schema.characterSpells.personnageId, charId)))
  for (const sort of data.sorts) {
    if (!sort.nom.trim()) continue
    const sortRef = SORTS_DND35.find(s => s.nom === sort.nom.trim())
    const sortId = await findOrCreateByNom(
      () => db.select({ id: schema.spells.id }).from(schema.spells).where(eq(schema.spells.nom, sort.nom.trim())).limit(1),
      () => db.insert(schema.spells).values({
        nom: sort.nom.trim(), ecole: sort.ecole || null,
        description: sortRef?.description ?? null,
        composantes: sortRef?.composantes ?? null,
        portee: sortRef?.portee ?? null,
        duree: sortRef?.duree ?? null,
      }).returning({ id: schema.spells.id })
    ,
      { tous: () => db.select({ id: schema.spells.id, nom: schema.spells.nom }).from(schema.spells),
        nom: sort.nom.trim(), table: 'spells' }
    )
    ecritures.push(db.insert(schema.characterSpells).values({
      personnageId: charId, sortId,
      niveau: sort.niveau || null,
      estConnu: statutSort.get(sortId) ?? 1,
      estPrepare: sort.nombrePrepare ?? 0,
      classe: sort.classe || null,
    }))
  }

  // ── 18. Compagnons ──
  ecritures.push(db.delete(schema.characterCompanions).where(eq(schema.characterCompanions.personnageId, charId)))
  for (const comp of data.compagnons) {
    if (!comp.nom.trim()) continue
    ecritures.push(db.insert(schema.characterCompanions).values({
      personnageId: charId,
      nom: comp.nom.trim(), race: comp.race || null,
      classe: comp.classe || null, joueur: comp.joueur || null,
      notes: comp.notes || null,
    }))
  }

  // ── 19. Écriture atomique ──
  if (ecritures.length > 0) {
    await db.batch(ecritures as [BatchItem<'pg'>, ...BatchItem<'pg'>[]])
  }

  revalidatePath('/')
  revalidatePath(`/personnage/${charId}`)
  return { id: charId, nouvellesReferences: referencesCreees }
}

// ─── Delete character ─────────────────────────────────────────────────────────
export async function deleteCharacter(personnageId: number): Promise<void> {
  const db = getDb()
  // Un seul batch atomique — et TOUTES les tables qui portent un personnage_id :
  // oublier une table (gemmes, effets de sorts, journal…) fait échouer le delete
  // final sur sa contrainte et laisse un personnage squelette insupprimable.
  await db.batch([
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
    db.delete(schema.characterScrolls).where(eq(schema.characterScrolls.personnageId, personnageId)),
    db.delete(schema.characterCurrency).where(eq(schema.characterCurrency.personnageId, personnageId)),
    db.delete(schema.characterGems).where(eq(schema.characterGems.personnageId, personnageId)),
    db.delete(schema.characterLanguages).where(eq(schema.characterLanguages.personnageId, personnageId)),
    db.delete(schema.characterSpells).where(eq(schema.characterSpells.personnageId, personnageId)),
    db.delete(schema.characterSpellEffects).where(eq(schema.characterSpellEffects.personnageId, personnageId)),
    db.delete(schema.characterCreatures).where(eq(schema.characterCreatures.personnageId, personnageId)),
    db.delete(schema.characterCompanions).where(eq(schema.characterCompanions.personnageId, personnageId)),
    db.delete(schema.characterNotes).where(eq(schema.characterNotes.personnageId, personnageId)),
    db.delete(schema.characterJournal).where(eq(schema.characterJournal.personnageId, personnageId)),
    db.delete(schema.characters).where(eq(schema.characters.id, personnageId)),
  ])
  revalidatePath('/')
  redirect('/')
}

// ─── Actions de jeu en temps réel ────────────────────────────────────────────

export async function updatePvActuels(personnageId: number, pvActuels: number) {
  const [avant] = await getDb()
    .select({ pvActuels: schema.characterCombatStats.pvActuels })
    .from(schema.characterCombatStats)
    .where(eq(schema.characterCombatStats.personnageId, personnageId))
  await getDb()
    .update(schema.characterCombatStats)
    .set({ pvActuels })
    .where(eq(schema.characterCombatStats.personnageId, personnageId))
  const pvAvant = avant?.pvActuels ?? pvActuels
  const delta = pvActuels - pvAvant
  if (delta !== 0) {
    await logJournal(personnageId, 'pv',
      delta < 0
        ? `Subit ${-delta} dégâts (PV ${pvAvant} → ${pvActuels})`
        : `Récupère ${delta} PV (${pvAvant} → ${pvActuels})`,
      delta)
  }
  revalidatePath(`/personnage/${personnageId}`)
}

// Montée de niveau quand l'XP a franchi le seuil (Manuel des Joueurs, table 3-2).
// Le joueur choisit sa classe avec le MJ et lance son dé de vie à la table — l'app
// ne lance aucun dé : elle reçoit le résultat et tient le registre. BAB, sauvegardes,
// emplacements de sorts et capacités de classe suivent d'eux-mêmes, car la fiche les
// calcule depuis le niveau. Points de compétence, dons et caractéristiques restent
// des choix à inscrire via ✏️ Modifier.
export async function monterNiveau(
  personnageId: number,
  characterClassId: number,
  pvGagnes: number
): Promise<{ niveauCible: number; classeNom: string } | null> {
  if (!Number.isInteger(pvGagnes) || pvGagnes < 1 || pvGagnes > 100) return null
  const db = getDb()
  const [perso] = await db
    .select({ xp: schema.characters.xp })
    .from(schema.characters)
    .where(eq(schema.characters.id, personnageId))
  if (!perso) return null

  const cls = await db
    .select({
      id: schema.characterClasses.id,
      niveau: schema.characterClasses.niveau,
      nom: schema.classes.nom,
    })
    .from(schema.characterClasses)
    .innerJoin(schema.classes, eq(schema.classes.id, schema.characterClasses.classeId))
    .where(eq(schema.characterClasses.personnageId, personnageId))
  const choisie = cls.find(c => c.id === characterClassId)
  if (!choisie) return null

  // Garde serveur : l'XP doit réellement justifier le niveau visé
  const niveauTotal = cls.reduce((s, c) => s + c.niveau, 0)
  const niveauCible = niveauTotal + 1
  if ((perso.xp ?? 0) < xpPourNiveau(niveauCible)) return null

  await db.update(schema.characterClasses)
    .set({ niveau: choisie.niveau + 1 })
    .where(eq(schema.characterClasses.id, characterClassId))

  // Les PV du nouveau dé de vie s'ajoutent au maximum ET aux PV actuels.
  // Le BBA de base stocké suit la montée : +delta selon la progression de la classe
  // choisie (table 3-1 du Manuel). Une valeur stockée à 0 signifie « calcul auto »
  // sur la fiche — on n'y touche pas, l'auto suit le niveau de lui-même.
  const infoClasse = getClasseInfo(choisie.nom)
  const deltaBab = infoClasse
    ? getBab(infoClasse.bab, choisie.niveau + 1) - getBab(infoClasse.bab, choisie.niveau)
    : 0
  const [stats] = await db
    .select({
      pvMax: schema.characterCombatStats.pvMax,
      pvActuels: schema.characterCombatStats.pvActuels,
      bbaCorpsACorps: schema.characterCombatStats.bbaCorpsACorps,
      bbaProjectiles: schema.characterCombatStats.bbaProjectiles,
    })
    .from(schema.characterCombatStats)
    .where(eq(schema.characterCombatStats.personnageId, personnageId))
  if (stats) {
    await db.update(schema.characterCombatStats)
      .set({
        pvMax: (stats.pvMax ?? 0) + pvGagnes,
        pvActuels: (stats.pvActuels ?? 0) + pvGagnes,
        ...(deltaBab > 0 && (stats.bbaCorpsACorps ?? 0) > 0
          ? { bbaCorpsACorps: (stats.bbaCorpsACorps ?? 0) + deltaBab } : {}),
        ...(deltaBab > 0 && (stats.bbaProjectiles ?? 0) > 0
          ? { bbaProjectiles: (stats.bbaProjectiles ?? 0) + deltaBab } : {}),
      })
      .where(eq(schema.characterCombatStats.personnageId, personnageId))
  }
  await db.update(schema.characters)
    .set({ updatedAt: new Date() })
    .where(eq(schema.characters.id, personnageId))

  await logJournal(personnageId, 'niveau',
    `🆙 Passe au niveau ${niveauCible} — ${choisie.nom} ${choisie.niveau + 1}, +${pvGagnes} PV (maximum ${(stats?.pvMax ?? 0) + pvGagnes})`,
    niveauCible)

  revalidatePath(`/personnage/${personnageId}`)
  revalidatePath('/partie')
  revalidatePath('/')
  return { niveauCible, classeNom: choisie.nom }
}

export type ResultatNuitDeRepos =
  | { statut: 'soigne'; gain: number; pvApres: number }
  | { statut: 'complet' }
  | { statut: 'negatif' }

// Nuit de repos (8 h de sommeil, règle 3.5) : guérison naturelle de 1 PV par niveau
// de personnage. PV négatifs = pas de guérison naturelle — le personnage doit d'abord
// être stabilisé et soigné (au MJ de décider, au prêtre de soigner).
export async function nuitDeRepos(personnageId: number): Promise<ResultatNuitDeRepos | null> {
  const db = getDb()
  const [stats] = await db
    .select({ pvActuels: schema.characterCombatStats.pvActuels, pvMax: schema.characterCombatStats.pvMax })
    .from(schema.characterCombatStats)
    .where(eq(schema.characterCombatStats.personnageId, personnageId))
  if (!stats) return null

  const pvAvant = stats.pvActuels ?? 0
  const pvMax = stats.pvMax ?? 0

  if (pvAvant < 0) {
    await logJournal(personnageId, 'repos',
      `Nuit de repos — PV négatifs (${pvAvant}), aucune guérison naturelle`)
    revalidatePath(`/personnage/${personnageId}`)
    return { statut: 'negatif' }
  }

  const classesRows = await db
    .select({ niveau: schema.characterClasses.niveau })
    .from(schema.characterClasses)
    .where(eq(schema.characterClasses.personnageId, personnageId))
  const niveauTotal = Math.max(1, classesRows.reduce((somme, c) => somme + (c.niveau ?? 0), 0))

  const pvApres = Math.min(pvMax, pvAvant + niveauTotal)
  const gain = pvApres - pvAvant

  if (gain <= 0) {
    await logJournal(personnageId, 'repos', 'Nuit de repos (PV déjà au maximum)')
    revalidatePath(`/personnage/${personnageId}`)
    return { statut: 'complet' }
  }

  await db
    .update(schema.characterCombatStats)
    .set({ pvActuels: pvApres })
    .where(eq(schema.characterCombatStats.personnageId, personnageId))
  await logJournal(personnageId, 'repos',
    `Nuit de repos : récupère ${gain} PV (${pvAvant} → ${pvApres})`, gain)
  revalidatePath(`/personnage/${personnageId}`)
  return { statut: 'soigne', gain, pvApres }
}

export async function depenseSort(charSpellId: number, personnageId: number) {
  const [row] = await getDb()
    .select({ estPrepare: schema.characterSpells.estPrepare, nomSort: schema.spells.nom })
    .from(schema.characterSpells)
    .innerJoin(schema.spells, eq(schema.characterSpells.sortId, schema.spells.id))
    .where(eq(schema.characterSpells.id, charSpellId))
  if (!row) return
  const newVal = Math.max(0, (row.estPrepare ?? 0) - 1)
  await getDb()
    .update(schema.characterSpells)
    .set({ estPrepare: newVal })
    .where(eq(schema.characterSpells.id, charSpellId))

  // Sort qui affecte la CA ou une caractéristique : l'effet s'active automatiquement
  // au lancement. Le joueur le retire lui-même (✕ dans la section Combat) quand le
  // sort prend fin.
  await logJournal(personnageId, 'sort', `Lance « ${row.nomSort} »`)

  const effetCA = SORTS_EFFETS_CA.find(e => e.nom === row.nomSort)
  const effetCarac = SORTS_EFFETS_CARAC.find(e => e.nom === row.nomSort)
  const effetVisuel = SORTS_EFFETS_VISUELS.find(e => e.nom === row.nomSort)
  const effetSuivi = SORTS_EFFETS_SUIVI.find(e => e.nom === row.nomSort)
  if (effetCA || effetCarac || effetVisuel || effetSuivi) {
    const nomEffet = (effetCA ?? effetCarac ?? effetVisuel ?? effetSuivi)!.nom
    const [dejaActif] = await getDb()
      .select({ id: schema.characterSpellEffects.id })
      .from(schema.characterSpellEffects)
      .where(and(
        eq(schema.characterSpellEffects.personnageId, personnageId),
        eq(schema.characterSpellEffects.nom, nomEffet)
      ))
    if (!dejaActif) {
      if (effetSuivi) {
        await getDb().insert(schema.characterSpellEffects).values({
          personnageId,
          nom: effetSuivi.nom,
          cible: effetSuivi.cible ?? 'SUIVI',
          typeBonus: 'suivi',
          valeur: effetSuivi.valeur ?? 0,
        })
      } else if (effetVisuel) {
        await getDb().insert(schema.characterSpellEffects).values({
          personnageId,
          nom: effetVisuel.nom,
          cible: 'VISUEL',
          typeBonus: effetVisuel.effet,
          valeur: 0,
        })
      } else if (effetCarac) {
        await getDb().insert(schema.characterSpellEffects).values({
          personnageId,
          nom: effetCarac.nom,
          cible: effetCarac.carac,
          typeBonus: effetCarac.typeBonus,
          valeur: effetCarac.valeur,
        })
      } else if (effetCA) {
        const classesRows = await getDb()
          .select({ niveau: schema.characterClasses.niveau })
          .from(schema.characterClasses)
          .where(eq(schema.characterClasses.personnageId, personnageId))
        const niveauLanceur = Math.max(1, ...classesRows.map(c => c.niveau ?? 0))
        await getDb().insert(schema.characterSpellEffects).values({
          personnageId,
          nom: effetCA.nom,
          cible: 'CA',
          typeBonus: effetCA.typeBonus,
          valeur: valeurEffetSelonNiveau(effetCA, niveauLanceur),
        })
      }
    }
  }
  revalidatePath(`/personnage/${personnageId}`)
}

export async function depensePotion(charPotionId: number, personnageId: number) {
  const [row] = await getDb()
    .select({ chargesRestantes: schema.characterPotions.chargesRestantes, nomPotion: schema.potions.nom })
    .from(schema.characterPotions)
    .innerJoin(schema.potions, eq(schema.characterPotions.potionId, schema.potions.id))
    .where(eq(schema.characterPotions.id, charPotionId))
  if (!row) return
  const newVal = Math.max(0, (row.chargesRestantes ?? 1) - 1)
  await getDb()
    .update(schema.characterPotions)
    .set({ chargesRestantes: newVal })
    .where(eq(schema.characterPotions.id, charPotionId))
  await logJournal(personnageId, 'potion',
    `Boit « ${row.nomPotion} » (${newVal} ${newVal > 1 ? 'gorgées restantes' : 'gorgée restante'})`)
  revalidatePath(`/personnage/${personnageId}`)
}

export async function jeterPotion(charPotionId: number, personnageId: number) {
  // Ancré sur (id, personnageId) : impossible de jeter la potion d'un autre personnage
  const filtre = and(
    eq(schema.characterPotions.id, charPotionId),
    eq(schema.characterPotions.personnageId, personnageId)
  )
  const [row] = await getDb()
    .select({ nomPotion: schema.potions.nom, chargesRestantes: schema.characterPotions.chargesRestantes })
    .from(schema.characterPotions)
    .innerJoin(schema.potions, eq(schema.characterPotions.potionId, schema.potions.id))
    .where(filtre)
  if (!row) return
  await getDb().delete(schema.characterPotions).where(filtre)
  const charges = row.chargesRestantes ?? 1
  await logJournal(personnageId, 'potion',
    charges > 0
      ? `Se débarrasse de « ${row.nomPotion} » (${charges} ${charges > 1 ? 'gorgées' : 'gorgée'} au moment du geste)`
      : `Jette la fiole vide de « ${row.nomPotion} »`)
  revalidatePath(`/personnage/${personnageId}`)
}

// ─── Parchemins ──────────────────────────────────────────────────────────────
// Un parchemin ne se boit pas : il se LIT, et il se consume quand le sort part
// (SRD, Magic Items — Scrolls). D'où un vocabulaire à lui, jusque dans le
// journal : c'est ce mélange qui avait fait écrire « Boit « Parchemin Porte
// dimensionnelle » (0 gorgée restante) » le 2026-10-25.

export async function lireParchemin(charScrollId: number, personnageId: number) {
  // Ancré sur (id, personnageId) : impossible de lire le parchemin d'un autre
  const filtre = and(
    eq(schema.characterScrolls.id, charScrollId),
    eq(schema.characterScrolls.personnageId, personnageId)
  )
  const [row] = await getDb()
    .select({
      quantite: schema.characterScrolls.quantite,
      niveauSort: schema.characterScrolls.niveauSort,
      niveauLanceur: schema.characterScrolls.niveauLanceur,
      nomLibre: schema.characterScrolls.nomLibre,
      nomSort: schema.spells.nom,
    })
    .from(schema.characterScrolls)
    .leftJoin(schema.spells, eq(schema.characterScrolls.sortId, schema.spells.id))
    .where(filtre)
  if (!row) return
  if (row.quantite <= 0) return

  const reste = Math.max(0, row.quantite - 1)
  await getDb().update(schema.characterScrolls).set({ quantite: reste }).where(filtre)

  // Le NLS va au journal quand il est connu : c'est lui qui a fixé la portée et
  // les dégâts du sort qui vient de partir, pas le niveau du lecteur.
  const precisions = [
    row.niveauSort != null ? `sort de niveau ${row.niveauSort}` : null,
    row.niveauLanceur != null ? `NLS ${row.niveauLanceur}` : null,
  ].filter(Boolean).join(', ')
  const suite = reste > 0
    ? `il reste ${reste} exemplaire${reste > 1 ? 's' : ''}`
    : 'le parchemin se consume'
  await logJournal(personnageId, 'parchemin',
    `Lit le parchemin « ${nomParchemin(row.nomSort, row.nomLibre)} »${precisions ? ` (${precisions})` : ''} — ${suite}`)
  revalidatePath(`/personnage/${personnageId}`)
}

export async function jeterParchemin(charScrollId: number, personnageId: number) {
  const filtre = and(
    eq(schema.characterScrolls.id, charScrollId),
    eq(schema.characterScrolls.personnageId, personnageId)
  )
  const [row] = await getDb()
    .select({
      quantite: schema.characterScrolls.quantite,
      nomLibre: schema.characterScrolls.nomLibre,
      nomSort: schema.spells.nom,
    })
    .from(schema.characterScrolls)
    .leftJoin(schema.spells, eq(schema.characterScrolls.sortId, schema.spells.id))
    .where(filtre)
  if (!row) return
  await getDb().delete(schema.characterScrolls).where(filtre)
  const nom = nomParchemin(row.nomSort, row.nomLibre)
  await logJournal(personnageId, 'parchemin',
    row.quantite > 0
      ? `Se débarrasse du parchemin « ${nom} » (${row.quantite} exemplaire${row.quantite > 1 ? 's' : ''} au moment du geste)`
      : `Jette le parchemin consumé de « ${nom} »`)
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
  await logJournal(personnageId, 'repos', 'Étudie et prépare ses sorts (repos)')
  revalidatePath(`/personnage/${personnageId}`)
}

export async function preparerSortsDivins(
  personnageId: number,
  preparations: { nom: string; ecole: string; niveau: number; estPrepare: number; estPersonnalise?: boolean }[],
  classe?: string
) {
  const db = getDb()
  // Multi-classes : ne toucher qu'aux sorts de la classe lanceuse concernée
  // (les sorts sans classe — anciens enregistrements — appartiennent à la classe par défaut)
  const filtreClasse = classe
    ? or(eq(schema.characterSpells.classe, classe), isNull(schema.characterSpells.classe))
    : undefined
  // Supprimer seulement les sorts non-personnalisés (estConnu != 2), garder les custom
  await db.delete(schema.characterSpells).where(
    and(eq(schema.characterSpells.personnageId, personnageId), ne(schema.characterSpells.estConnu, 2), filtreClasse)
  )
  // Remettre estPrepare=0 pour les sorts personnalisés avant de les réappliquer
  await db.update(schema.characterSpells)
    .set({ estPrepare: 0 })
    .where(and(eq(schema.characterSpells.personnageId, personnageId), eq(schema.characterSpells.estConnu, 2), filtreClasse))

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
      const ref = SORTS_DND35.find(s => s.nom === sort.nom)
      const sortId = await findOrCreateByNom(
        () => db.select({ id: schema.spells.id }).from(schema.spells).where(eq(schema.spells.nom, sort.nom)).limit(1),
        () => db.insert(schema.spells).values({
          nom: sort.nom, ecole: sort.ecole || null,
          description: ref?.description ?? null,
          composantes: ref?.composantes ?? null,
          portee: ref?.portee ?? null,
          duree: ref?.duree ?? null,
        }).returning({ id: schema.spells.id })
      ,
      { tous: () => db.select({ id: schema.spells.id, nom: schema.spells.nom }).from(schema.spells),
        nom: sort.nom, table: 'spells' }
    )
      await db.insert(schema.characterSpells).values({
        personnageId, sortId, niveau: sort.niveau, estConnu: 1, estPrepare: sort.estPrepare,
        classe: classe ?? null,
      })
    }
  }
  await logJournal(personnageId, 'repos', 'Prie et prépare ses sorts (repos)')
  revalidatePath(`/personnage/${personnageId}`)
}

export async function ajouterSortPersonnalise(
  personnageId: number,
  sort: { nom: string; ecole: string; niveau: number; description?: string; classe?: string }
) {
  const db = getDb()
  const sortId = await findOrCreateByNom(
    () => db.select({ id: schema.spells.id }).from(schema.spells).where(eq(schema.spells.nom, sort.nom.trim())).limit(1),
    () => db.insert(schema.spells).values({
      nom: sort.nom.trim(), ecole: sort.ecole || null,
      description: sort.description?.trim() || null,
    }).returning({ id: schema.spells.id })
  ,
      { tous: () => db.select({ id: schema.spells.id, nom: schema.spells.nom }).from(schema.spells),
        nom: sort.nom.trim(), table: 'spells' }
    )
  if (sort.description?.trim()) {
    await db.update(schema.spells).set({ description: sort.description.trim() }).where(eq(schema.spells.id, sortId))
  }
  const existing = await db.select({ id: schema.characterSpells.id })
    .from(schema.characterSpells)
    .where(and(eq(schema.characterSpells.personnageId, personnageId), eq(schema.characterSpells.sortId, sortId)))
    .limit(1)
  if (existing.length === 0) {
    await db.insert(schema.characterSpells).values({
      personnageId, sortId, niveau: sort.niveau, estConnu: 2, estPrepare: 0,
      classe: sort.classe || null,
    })
  }
  revalidatePath(`/personnage/${personnageId}`)
}

export async function modifierDescriptionSort(sortId: number, description: string, personnageId: number) {
  const db = getDb()
  await db.update(schema.spells)
    .set({ description: description.trim() || null })
    .where(eq(schema.spells.id, sortId))
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

export async function retirerEffetSort(effetId: number, personnageId: number) {
  const [effet] = await getDb()
    .select({ nom: schema.characterSpellEffects.nom })
    .from(schema.characterSpellEffects)
    .where(eq(schema.characterSpellEffects.id, effetId))
  await getDb().delete(schema.characterSpellEffects).where(
    and(
      eq(schema.characterSpellEffects.id, effetId),
      eq(schema.characterSpellEffects.personnageId, personnageId)
    )
  )
  if (effet) {
    await logJournal(personnageId, 'effet', `Fin de l'effet « ${effet.nom} »`)
  }
  revalidatePath(`/personnage/${personnageId}`)
}

export async function depenseChargeObjet(charItemId: number, personnageId: number) {
  const [row] = await getDb()
    .select({ chargesRestantes: schema.characterMagicItems.chargesRestantes, nomObjet: schema.magicItems.nom })
    .from(schema.characterMagicItems)
    .innerJoin(schema.magicItems, eq(schema.characterMagicItems.objetId, schema.magicItems.id))
    .where(eq(schema.characterMagicItems.id, charItemId))
  if (!row) return
  const newVal = Math.max(0, (row.chargesRestantes ?? 0) - 1)
  await getDb()
    .update(schema.characterMagicItems)
    .set({ chargesRestantes: newVal })
    .where(eq(schema.characterMagicItems.id, charItemId))
  await logJournal(personnageId, 'charge',
    `Utilise « ${row.nomObjet} » (${newVal} ${newVal > 1 ? 'charges restantes' : 'charge restante'})`)
  revalidatePath(`/personnage/${personnageId}`)
}

// ─── Catalogue des potions pour les champs à suggestions ────────────────────
// Chargé côté serveur par les pages, ou en secours par le formulaire lui-même
// (page « générer », rendue côté client). La recherche se fait ensuite dans le
// navigateur : aucun appel réseau à la frappe.
export type PotionRef = { nom: string; effet: string | null; chargesMax: number | null; alias: string[] }

export async function getPotionsCatalogue(): Promise<PotionRef[]> {
  const rows = await getDb()
    .select({ nom: schema.potions.nom, effet: schema.potions.sortEffet, chargesMax: schema.potions.chargesMax })
    .from(schema.potions)
  return rows
    .map(r => ({ ...r, alias: aliasPour(r.nom) }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

// ─── Catalogue des sorts, pour inscrire un parchemin ────────────────────────
// ⛔ PAS chargé avec la fiche : 1221 sorts et leurs niveaux par classe pèsent
// bien plus que les 89 potions. Le panneau des parchemins l'appelle à sa
// première ouverture, et la recherche se fait ensuite dans le navigateur.
export type SortRef = {
  id: number
  nom: string
  /** Niveau du sort par classe du Manuel : { Magicien: 4, Ensorceleur: 4 }. */
  niveaux: Record<string, number>
}

export async function getSortsCatalogue(): Promise<SortRef[]> {
  const db = getDb()
  const [sorts, niveaux] = await Promise.all([
    db.select({ id: schema.spells.id, nom: schema.spells.nom }).from(schema.spells),
    db.select({ sortId: schema.spellClassLevels.sortId, niveau: schema.spellClassLevels.niveau, classe: schema.classes.nom })
      .from(schema.spellClassLevels)
      .innerJoin(schema.classes, eq(schema.spellClassLevels.classeId, schema.classes.id)),
  ])
  const parSort = new Map<number, Record<string, number>>()
  for (const n of niveaux) {
    if (!n.classe) continue
    const bloc = parSort.get(n.sortId) ?? {}
    // Le plus bas gagne si une classe apparaît deux fois (listes de domaine).
    if (bloc[n.classe] == null || n.niveau < bloc[n.classe]) bloc[n.classe] = n.niveau
    parSort.set(n.sortId, bloc)
  }
  return sorts
    .map(s => ({ ...s, niveaux: parSort.get(s.id) ?? {} }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

export type EntreeParchemin = {
  /** Le sort du catalogue. NULL quand le joueur a tapé un nom qui n'y est pas. */
  sortId: number | null
  nomLibre?: string
  niveauSort?: number | null
  niveauLanceur?: number | null
  type?: string | null
  quantite: number
  notes?: string
}

export async function ajouterParchemin(personnageId: number, e: EntreeParchemin): Promise<{ ok: boolean; message: string }> {
  const db = getDb()
  const [perso] = await db.select({ id: schema.characters.id }).from(schema.characters)
    .where(eq(schema.characters.id, personnageId)).limit(1)
  if (!perso) return { ok: false, message: 'Personnage introuvable.' }

  const nomLibre = (e.nomLibre ?? '').trim().slice(0, 200)
  if (e.sortId == null && !nomLibre) {
    return { ok: false, message: 'Choisissez un sort, ou donnez un nom au parchemin.' }
  }

  // Le sort lié fait foi : son nom vient alors de la Bibliothèque, pas de la
  // saisie. Garder les deux laisserait deux noms possibles pour la même ligne.
  let sortId: number | null = null
  let nomSort: string | null = null
  if (e.sortId != null) {
    const [s] = await db.select({ id: schema.spells.id, nom: schema.spells.nom })
      .from(schema.spells).where(eq(schema.spells.id, e.sortId)).limit(1)
    if (s) { sortId = s.id; nomSort = s.nom }
  }

  const borneOuNull = (n: number | null | undefined, min: number, max: number) =>
    n == null || !Number.isFinite(n) ? null : Math.min(max, Math.max(min, Math.trunc(n)))

  const quantite = Math.min(99, Math.max(1, Math.trunc(Number(e.quantite) || 1)))
  const type = e.type === 'profane' || e.type === 'divin' ? e.type : null

  await db.insert(schema.characterScrolls).values({
    personnageId,
    sortId,
    nomLibre: sortId == null ? nomLibre : null,
    niveauSort: borneOuNull(e.niveauSort, 0, 9),
    niveauLanceur: borneOuNull(e.niveauLanceur, 1, 20),
    type,
    quantite,
    notes: (e.notes ?? '').trim().slice(0, 500) || null,
  })

  const nom = nomParchemin(nomSort, nomLibre)
  await logJournal(personnageId, 'parchemin',
    `Inscrit ${quantite > 1 ? `${quantite} parchemins` : 'un parchemin'} de « ${nom} »`)
  revalidatePath(`/personnage/${personnageId}`)
  return {
    ok: true,
    message: sortId == null
      ? `Parchemin « ${nom} » ajouté — sans fiche de sort : ce nom n'est pas au catalogue.`
      : `Parchemin « ${nom} » ajouté.`,
  }
}

// ─── Catalogues du Butin : objets magiques, armes, armures ──────────────────
// Demande d'André le 2026-10-25 : « les Objets magiques, les armes, proposent
// une recherche dans la grande bibliothèque comme pour les parchemins et les
// potions ». Le périmètre de chaque liste est donc celui de SON rayon, relu
// dans `lib/queries/bibliotheque.ts` plutôt que supposé :
//
//   · objets  — TOUT (745), les lignes de campagne marquées 🗃️ comme au rayon
//   · armes   — le CATALOGUE seul (78). Les 158 autres sont des lignes
//               d'inventaire importées (« Bastard sword +2 », « Masse de
//               fantascin +3 ») : des noms qu'on ne veut pas voir reproposés.
//   · armures — TOUT (8), la table n'a pas de colonne `estCatalogue`.
//
// ⛔ PAS chargés avec la fiche : 831 lignes. Le panneau du Butin les appelle à
// la première ouverture d'un des trois onglets, en un seul aller-retour.
export type ObjetRef = {
  id: number; nom: string; type: string | null; emplacement: string | null
  chargesMax: number | null; bonus: number | null
  /** Ligne de la campagne d'André, pas une règle de livre — marquée 🗃️. */
  campagne: boolean
  alias: string[]
}
export type ArmeRef = {
  id: number; nom: string; degats: string | null
  critiqueMin: number | null; critiqueMult: number | null
  typeDegats: string | null; portee: number | null; alias: string[]
}
export type ArmureRef = {
  id: number; nom: string; type: string | null; bonusArmure: number | null
  maxDex: number | null; malusCompetence: number | null; risqueEchecMagique: number | null
}

export async function getCataloguesButin(): Promise<{
  objets: ObjetRef[]; armes: ArmeRef[]; armures: ArmureRef[]
}> {
  const db = getDb()
  const [objets, armes, armures] = await Promise.all([
    db.select({
      id: schema.magicItems.id, nom: schema.magicItems.nom, type: schema.magicItems.type,
      emplacement: schema.magicItems.emplacement, chargesMax: schema.magicItems.chargesMax,
      bonus: schema.magicItems.bonus, estCatalogue: schema.magicItems.estCatalogue,
    }).from(schema.magicItems),
    db.select({
      id: schema.weapons.id, nom: schema.weapons.nom, degats: schema.weapons.degats,
      critiqueMin: schema.weapons.critiqueMin, critiqueMult: schema.weapons.critiqueMult,
      typeDegats: schema.weapons.typeDegats, portee: schema.weapons.portee,
    }).from(schema.weapons).where(eq(schema.weapons.estCatalogue, true)),
    db.select().from(schema.armor),
  ])
  const parNom = (a: { nom: string }, b: { nom: string }) => a.nom.localeCompare(b.nom, 'fr')
  return {
    objets: objets
      .map(({ estCatalogue, ...o }) => ({ ...o, campagne: !estCatalogue, alias: aliasPour(o.nom) }))
      .sort(parNom),
    armes: armes.map(a => ({ ...a, alias: aliasPour(a.nom) })).sort(parNom),
    armures: armures
      .map(a => ({
        id: a.id, nom: a.nom, type: a.type, bonusArmure: a.bonusArmure,
        maxDex: a.maxDex, malusCompetence: a.malusCompetence,
        risqueEchecMagique: a.risqueEchecMagique,
      }))
      .sort(parNom),
  }
}
