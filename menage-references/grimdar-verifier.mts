import { getCharacter } from '../src/lib/queries/character'
import { getFeatWeaponBonuses } from '../src/lib/dnd35/feat-bonuses'
import { getRaceInfo } from '../src/lib/dnd35/races'
import { getClasseInfo } from '../src/lib/dnd35/classes'
import fs from 'fs'
if (!process.env.DATABASE_URL) {
  const raw = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf-8')
  for (const l of raw.split('\n')) { const t = l.trim(); const i = t.indexOf('='); if (i > 0 && !t.startsWith('#')) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim() }
}

const ID = 86
const d = await getCharacter(ID)
if (!d) { console.error('personnage introuvable'); process.exit(1) }
const { character, race, clan, god, classes, abilityScores, combatStats, savingThrows,
  skills, feats, weapons, armor, magicItems, currency, languages, companions } = d

let ko = 0
const test = (label: string, obtenu: unknown, attendu: unknown) => {
  const bon = String(obtenu) === String(attendu)
  if (!bon) ko++
  console.log(`  ${bon ? 'OK   ' : 'ECHEC'} ${label.padEnd(34)} ${String(obtenu).padEnd(24)} ${bon ? '' : '(attendu ' + attendu + ')'}`)
}

console.log('=== IDENTITE ===')
test('nom', character.nom, 'Grimdar')
test('race', race?.nom, 'Nain')
test('classe et niveau', `${classes[0]?.classe.nom} ${classes[0]?.characterClass.niveau}`, 'Guerrier 6')
test('alignement', character.alignement, 'LN')
test('dieu', god?.nom, 'Kagyar')
test('clan', clan?.nom, 'Marteau Profond')
test('XP', character.xp, 15022)
test('age', character.age, 88)

console.log('\n=== CARACTERISTIQUES (base + racial, comme la fiche) ===')
const ri = getRaceInfo(race?.nom ?? '')!
const val = (b: number | null | undefined, m: number | null | undefined, bonus: number) => (b ?? 10) + (m ?? 0) + bonus
const forT = val(abilityScores?.forBase, abilityScores?.forMagique, ri.bonusFor)
const dexT = val(abilityScores?.dexBase, abilityScores?.dexMagique, ri.bonusDex)
const conT = val(abilityScores?.conBase, abilityScores?.conMagique, ri.bonusCon)
const chaT = val(abilityScores?.chaBase, abilityScores?.chaMagique, ri.bonusCha)
const mod = (v: number) => Math.floor((v - 10) / 2)
test('FOR', forT, 16); test('DEX', dexT, 12); test('CON (14 + 2 nain)', conT, 16); test('CHA (10 - 2 nain)', chaT, 8)
const forMod = mod(forT), dexMod = mod(dexT)

console.log('\n=== POINTS DE VIE ET DEPLACEMENT ===')
test('PV actuels / max', `${combatStats?.pvActuels}/${combatStats?.pvMax}`, '51/62')
const armorDepl = armor.map(({ armor: a }) => a.deplacement).filter((x): x is number => x != null)
const deplacement = armorDepl.length ? Math.min(...armorDepl) : (combatStats?.deplacement ?? 9)
test('deplacement (plaque complete)', `${deplacement}m`, '6m')
test('armure portee', armor[0]?.armor.nom, 'Plaque complète')

console.log('\n=== CLASSE D ARMURE ===')
const caArmure = armor.reduce((s, { armor: a, charArmor }) => s + (a.bonusArmure ?? 0) + (charArmor.bonusMagique ?? 0), 0)
const caMagique = magicItems.reduce((s, { item }) => s + (item.bonus ?? 0), 0)
const maxDex = armor.length ? Math.min(...armor.map(({ armor: a }) => a.maxDex ?? 10)) : 10
const dexModCA = Math.min(dexMod, maxDex)
const ca = 10 + dexModCA + caArmure + (combatStats?.caNaturelle ?? 0) + (combatStats?.caDeflexion ?? 0) + (combatStats?.caDivers ?? 0) + caMagique
console.log(`         detail : 10 + armure ${caArmure} + DEX ${dexModCA} (plafond ${maxDex}) + objets ${caMagique} + naturelle ${combatStats?.caNaturelle} + deflexion ${combatStats?.caDeflexion} + divers ${combatStats?.caDivers}`)
test('CA totale', ca, 20)
test('CA contact', 10 + dexModCA + (combatStats?.caDeflexion ?? 0) + caMagique, 12)
test('CA pris au depourvu', ca - dexModCA, 19)
test('anneau compte une seule fois', caMagique, 1)

console.log('\n=== ARMES (formule de la fiche) ===')
const attendues: Record<string, [number, string]> = {
  'Hache de guerre naine': [11, '1d10+6'],
  'Marteau léger': [9, '1d4+3'],
  'Arbalète lourde': [8, '1d10+1'],
  'Masse d’armes lourde': [11, '1d8+5'],
}
const rawBab = combatStats?.bbaCorpsACorps ?? 0
for (const { weapon, charWeapon } of weapons) {
  const isRanged = weapon.portee != null
  const wpn = charWeapon.bonusMagique ?? 0
  const { attackItems, damageItems } = getFeatWeaponBonuses(feats.map(f => f.feat.nom), weapon.nom, isRanged)
  const atkF = attackItems.reduce((s, b) => s + b.value, 0)
  const dmgF = damageItems.reduce((s, b) => s + b.value, 0)
  const abilityDmg = !isRanged ? forMod : 0
  const atk = rawBab + (isRanged ? dexMod : forMod) + wpn + atkF
  const tot = wpn + abilityDmg + dmgF
  const dmg = tot === 0 ? weapon.degats : `${weapon.degats}${tot > 0 ? '+' : ''}${tot}`
  const [aAtk, aDmg] = attendues[weapon.nom] ?? [0, '?']
  const bon = atk === aAtk && dmg === aDmg
  if (!bon) ko++
  console.log(`  ${bon ? 'OK   ' : 'ECHEC'} ${weapon.nom.padEnd(24)} +${atk} / ${dmg.padEnd(8)} ${isRanged ? '(distance)' : '(melee)'}${bon ? '' : '  attendu +' + aAtk + ' / ' + aDmg}`)
  if (atkF || dmgF) console.log(`         dons apparies : ${[...attackItems, ...damageItems].map(b => b.label + ' ' + (b.value > 0 ? '+' : '') + b.value).join(', ')}`)
}

console.log('\n=== SAUVEGARDES ===')
const ci = getClasseInfo(classes[0]?.classe.nom ?? '')
const vigImp = (savingThrows?.vigueurBase ?? 0) + mod(conT) + (savingThrows?.vigueurMagique ?? 0)
const sagT = val(abilityScores?.sagBase, abilityScores?.sagMagique, ri.bonusSag)
const volImp = (savingThrows?.volonteBase ?? 0) + mod(sagT) + (savingThrows?.volonteMagique ?? 0)
const vigEcran = (savingThrows?.vigueurBase ?? 0) + mod((abilityScores?.conBase ?? 10) + (abilityScores?.conMagique ?? 0)) + (savingThrows?.vigueurMagique ?? 0)
test('Vigueur (fiche imprimee)', `+${vigImp}`, '+8')
test('Volonte (fiche imprimee)', `+${volImp}`, '+3')
console.log(`  ⚠️  Vigueur affichee a l ECRAN : +${vigEcran} — l ecran omet le bonus racial de CON (defaut de l app, pas des donnees)`)
test('classe reconnue par le code', ci ? ci.nom : 'INCONNUE', 'Guerrier')
test('de de vie affiche', classes[0]?.classe.deVie, 'd10')

console.log('\n=== CONTENU ===')
test('competences rattachees', skills.length, 0)
test('dons', feats.length, 5)
test('armes', weapons.length, 4)
test('objets magiques', magicItems.length, 3)
test('langues', languages.length, 4)
test('compagnons', companions.length, 2)
test('monnaie (po)', Math.round(parseFloat(String(currency?.po ?? '0'))), 1022)
console.log('  dons : ' + feats.map(f => f.feat.nom).join(' · '))
console.log('  langues : ' + languages.map(l => l.language.nom).join(' · '))

console.log(ko === 0 ? '\n✅ Toutes les verifications passent.' : `\n❌ ${ko} verification(s) en echec.`)
