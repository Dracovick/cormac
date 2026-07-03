import type { CharacterFormData } from '@/app/actions/character'
import type { CharacterData } from '@/lib/queries/character'
import { COMPETENCES_DND35 } from '@/lib/dnd35/skills'

export function charDataToForm(d: CharacterData): CharacterFormData {
  const { character, race, clan, god, classes, abilityScores, combatStats, savingThrows,
    skills, feats, weapons, armor, magicItems, potions, currency, languages, companions, spells } = d
  const firstClass = classes[0]

  const competences = COMPETENCES_DND35.map(c => {
    const saved = skills.find(s => s.skill.nom === c.nom)
    return { skillId: saved?.skill.id ?? 0, nom: c.nom, caracteristique: c.caracteristique, rangs: saved?.charSkill.rangsInvestis ?? 0, divers: saved?.charSkill.modifDivers ?? 0 }
  })
  for (const s of skills) {
    if (!competences.find(c => c.nom === s.skill.nom)) {
      competences.push({ skillId: s.skill.id, nom: s.skill.nom, caracteristique: s.skill.caracteristique as 'FOR' | 'DEX' | 'CON' | 'INT' | 'SAG' | 'CHA', rangs: s.charSkill.rangsInvestis ?? 0, divers: s.charSkill.modifDivers ?? 0 })
    }
  }

  return {
    nom: character.nom, surnom: character.surnom ?? '', sexe: character.sexe ?? '',
    age: character.age ?? '', taille: character.taille ?? '', poids: character.poids ?? '',
    yeux: character.yeux ?? '', cheveux: character.cheveux ?? '',
    joueurPrenom: character.joueurPrenom ?? '', joueurNom: character.joueurNom ?? '',
    race: race?.nom ?? '',
    classe: firstClass?.classe.nom ?? '',
    niveau: classes.reduce((sum, c) => sum + c.characterClass.niveau, 0) || (firstClass?.characterClass.niveau ?? 1),
    classes: classes.length > 0
      ? classes.map(c => ({ classe: c.classe.nom, niveau: c.characterClass.niveau }))
      : [{ classe: firstClass?.classe.nom ?? '', niveau: firstClass?.characterClass.niveau ?? 1 }],
    alignement: character.alignement ?? '', divinite: god?.nom ?? '', clan: clan?.nom ?? '',
    xp: character.xp ?? 0, photoUrl: character.photoUrl ?? '',
    forBase: abilityScores?.forBase ?? 10, forMagique: abilityScores?.forMagique ?? 0,
    dexBase: abilityScores?.dexBase ?? 10, dexMagique: abilityScores?.dexMagique ?? 0,
    conBase: abilityScores?.conBase ?? 10, conMagique: abilityScores?.conMagique ?? 0,
    intBase: abilityScores?.intBase ?? 10, intMagique: abilityScores?.intMagique ?? 0,
    sagBase: abilityScores?.sagBase ?? 10, sagMagique: abilityScores?.sagMagique ?? 0,
    chaBase: abilityScores?.chaBase ?? 10, chaMagique: abilityScores?.chaMagique ?? 0,
    pvMax: combatStats?.pvMax ?? 0, pvActuels: combatStats?.pvActuels ?? 0,
    caNaturelle: combatStats?.caNaturelle ?? 0, caDeflexion: combatStats?.caDeflexion ?? 0,
    caDivers: combatStats?.caDivers ?? 0, initiativeBonus: combatStats?.initiativeBonus ?? 0,
    domaine1: combatStats?.domaine1 || '', domaine2: combatStats?.domaine2 || '',
    bbaCorpsOverride: combatStats?.bbaCorpsACorps ?? null,
    bbaProjectilesOverride: combatStats?.bbaProjectiles ?? null,
    deplacement: combatStats?.deplacement ?? null, karma: combatStats?.karma ?? 0,
    reflexesMagique: savingThrows?.reflexesMagique ?? 0,
    vigueurMagique: savingThrows?.vigueurMagique ?? 0,
    volonteMagique: savingThrows?.volonteMagique ?? 0,
    competences,
    dons: feats.map(f => f.feat.nom),
    armes: weapons.map(w => ({
      nom: w.weapon.nom, degats: w.weapon.degats ?? '',
      crit: `${w.weapon.critiqueMin ?? 20}-20/×${w.weapon.critiqueMult ?? 2}`,
      typeDegats: w.weapon.typeDegats ?? '',
      portee: w.weapon.portee ? `${w.weapon.portee} m` : 'Contact',
      bonusMagique: w.charWeapon.bonusMagique ?? 0,
      coteDeForce: w.charWeapon.coteDeForce ?? null,
      bonusMunitions: w.charWeapon.bonusMunitions ?? null,
      quantite: w.charWeapon.quantite ?? 1,
    })),
    armures: armor.map(a => ({
      nom: a.armor.nom, type: a.armor.type ?? '', bonusCA: a.armor.bonusArmure ?? 0,
      maxDex: a.armor.maxDex ?? 10, malusComp: a.armor.malusCompetence ?? 0,
      bonusMagique: a.charArmor.bonusMagique ?? 0,
    })),
    objetsMagiques: magicItems.map(m => ({
      nom: m.item.nom, type: m.item.type ?? '', emplacement: m.charItem.emplacement ?? '',
      bonus: m.item.bonus?.toString() ?? '', description: m.item.description ?? '',
      charges: m.charItem.chargesRestantes ?? 0,
    })),
    potions: potions.map(p => ({
      nom: p.potion.nom, effet: p.potion.sortEffet ?? p.potion.description ?? '',
      charges: p.charPotion.chargesRestantes ?? 1,
    })),
    pp: parseFloat(currency?.pp?.toString() ?? '0'), po: parseFloat(currency?.po?.toString() ?? '0'),
    pe: parseFloat(currency?.pe?.toString() ?? '0'), pa: parseFloat(currency?.pa?.toString() ?? '0'),
    pc: parseFloat(currency?.pc?.toString() ?? '0'), pm: parseFloat(currency?.pm?.toString() ?? '0'),
    langues: languages.map(l => l.language.nom),
    sorts: spells.map(s => ({
      nom: s.spell.nom,
      niveau: s.charSpell.niveau ?? 0,
      ecole: s.spell.ecole ?? '',
      nombrePrepare: s.charSpell.estPrepare ?? 0,
      classe: s.charSpell.classe ?? undefined,
    })),
    historique: character.historique ?? '', notes: character.notes ?? '',
    compagnons: companions.map(c => ({ nom: c.nom, race: c.race ?? '', classe: c.classe ?? '', joueur: c.joueur ?? '', notes: c.notes ?? '' })),
  }
}
