/**
 * Script de migration FileMaker → Neon PostgreSQL
 * Importe les 7 fichiers CSV exportés de FileMaker dans la base de données Cormac.
 *
 * Exécution :
 *   npx tsx --env-file=.env.local scripts/import-filemaker.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { getDb } from '../src/db/index'
import * as schema from '../src/db/schema'
import { eq } from 'drizzle-orm'

// Charger .env.local si DATABASE_URL absent (fallback manuel)
if (!process.env.DATABASE_URL) {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i > 0) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
    }
  } catch { /* ignore si fichier absent */ }
}

// ── Chemin vers les CSV ──────────────────────────────────────────────────────
const CSV_DIR = resolve(process.cwd(), 'Anciens Personnages FileMaker TABLES')

// ── Parseur CSV (gère les guillemets et virgules dans les champs) ────────────
function parseCSV(content: string): string[][] {
  const result: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuote = false

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    const next = content[i + 1]

    if (ch === '"') {
      if (inQuote && next === '"') { field += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      row.push(field); field = ''
    } else if ((ch === '\n' || (ch === '\r' && next === '\n')) && !inQuote) {
      if (ch === '\r') i++
      row.push(field); field = ''
      if (row.some(f => f !== '')) result.push(row)
      row = []
    } else if (ch === '\r' && !inQuote) {
      row.push(field); field = ''
      if (row.some(f => f !== '')) result.push(row)
      row = []
    } else {
      field += ch
    }
  }
  if (field || row.length > 0) {
    row.push(field)
    if (row.some(f => f !== '')) result.push(row)
  }
  return result
}

// ── Utilitaires de conversion ─────────────────────────────────────────────────
function num(v: string | undefined): number | null {
  if (v === undefined || v.trim() === '') return null
  const n = parseInt(v.trim(), 10)
  return isNaN(n) ? null : n
}

function numFloat(v: string | undefined): string | null {
  if (v === undefined || v.trim() === '') return null
  const n = parseFloat(v.trim())
  return isNaN(n) ? null : n.toFixed(2)
}

function str(v: string | undefined): string | null {
  if (v === undefined || v.trim() === '') return null
  return v.trim()
}

// ── Script principal ──────────────────────────────────────────────────────────
async function main() {
  const db = getDb()
  console.log('Connexion Neon établie.\n')

  // Charger toutes les tables de référence en mémoire
  const [racesAll, classesAll, godsAll, skillsAll, featsAll,
         weaponsAll, magicItemsAll, languagesAll] = await Promise.all([
    db.select().from(schema.races),
    db.select().from(schema.classes),
    db.select().from(schema.gods),
    db.select().from(schema.skills),
    db.select().from(schema.feats),
    db.select().from(schema.weapons),
    db.select().from(schema.magicItems),
    db.select().from(schema.languages),
  ])

  const raceMap     = new Map(racesAll.map(r => [r.nom.toLowerCase(), r.id]))
  const classMap    = new Map(classesAll.map(c => [c.nom.toLowerCase(), c.id]))
  const godMap      = new Map(godsAll.map(g => [g.nom.toLowerCase(), g.id]))
  const skillMap    = new Map(skillsAll.map(s => [s.nom.toLowerCase(), s.id]))
  const featMap     = new Map(featsAll.map(f => [f.nom.toLowerCase(), f.id]))
  const weaponMap   = new Map(weaponsAll.map(w => [w.nom.toLowerCase(), w.id]))
  const magicMap    = new Map(magicItemsAll.map(m => [m.nom.toLowerCase(), m.id]))
  const langMap     = new Map(languagesAll.map(l => [l.nom.toLowerCase(), l.id]))

  // Fonctions getOrCreate pour chaque table de référence
  async function getOrCreateRace(nom: string): Promise<number> {
    const key = nom.toLowerCase()
    if (raceMap.has(key)) return raceMap.get(key)!
    const [r] = await db.insert(schema.races).values({ nom }).returning()
    raceMap.set(key, r.id)
    console.log(`  + Race: ${nom}`)
    return r.id
  }

  async function getOrCreateGod(nom: string): Promise<number> {
    const key = nom.toLowerCase()
    if (godMap.has(key)) return godMap.get(key)!
    const [g] = await db.insert(schema.gods).values({ nom }).returning()
    godMap.set(key, g.id)
    console.log(`  + Dieu: ${nom}`)
    return g.id
  }

  async function getOrCreateClass(nom: string): Promise<number> {
    const key = nom.toLowerCase()
    if (classMap.has(key)) return classMap.get(key)!
    const [c] = await db.insert(schema.classes).values({
      nom,
      deVie: 'd8',
      bbaProgression: 'Moyen',
      vigueurProgression: 'Mauvais',
      reflexesProgression: 'Mauvais',
      volonteProgression: 'Mauvais',
      competencesParNiveau: 2,
    }).returning()
    classMap.set(key, c.id)
    console.log(`  + Classe: ${nom}`)
    return c.id
  }

  async function getOrCreateSkill(nom: string, caracteristique: string): Promise<number> {
    const key = nom.toLowerCase()
    if (skillMap.has(key)) return skillMap.get(key)!
    const [s] = await db.insert(schema.skills).values({
      nom,
      caracteristique: caracteristique.toUpperCase().slice(0, 10),
    }).returning()
    skillMap.set(key, s.id)
    return s.id
  }

  async function getOrCreateFeat(raw: string): Promise<number> {
    // FileMaker stockait "Nom du don : Description longue"
    const sepIdx = raw.indexOf(' : ')
    const nom = (sepIdx > 0 ? raw.slice(0, sepIdx) : raw).slice(0, 199).trim()
    const description = sepIdx > 0 ? raw.slice(sepIdx + 3).trim() : undefined
    const key = nom.toLowerCase()
    if (featMap.has(key)) return featMap.get(key)!
    const [f] = await db.insert(schema.feats).values({ nom, description }).returning()
    featMap.set(key, f.id)
    return f.id
  }

  async function getOrCreateWeapon(
    rawNom: string,
    extras: Partial<typeof schema.weapons.$inferInsert> = {}
  ): Promise<number> {
    const nom = rawNom.slice(0, 199)
    const key = nom.toLowerCase()
    if (weaponMap.has(key)) return weaponMap.get(key)!
    const [w] = await db.insert(schema.weapons).values({ nom, ...extras }).returning()
    weaponMap.set(key, w.id)
    return w.id
  }

  async function getOrCreateMagicItem(rawNom: string, chargesMax?: number | null): Promise<number> {
    const nom = rawNom.slice(0, 199)
    const key = nom.toLowerCase()
    if (magicMap.has(key)) return magicMap.get(key)!
    const [m] = await db.insert(schema.magicItems).values({
      nom,
      chargesMax: chargesMax ?? null,
    }).returning()
    magicMap.set(key, m.id)
    return m.id
  }

  async function getOrCreateLanguage(nom: string): Promise<number> {
    const key = nom.toLowerCase()
    if (langMap.has(key)) return langMap.get(key)!
    const [l] = await db.insert(schema.languages).values({ nom }).returning()
    langMap.set(key, l.id)
    return l.id
  }

  // Map FileMaker PKID → nouvel ID de personnage Neon
  const pkidToCharId = new Map<string, number>()

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PERSONNAGES.CSV
  // Colonnes (0-indexé, d'après les 183 champs FileMaker exportés) :
  //   [0]  Age             [1]  Alignement      [2]  Armure Bonus
  //   [4]  Armure Divers   [5]  Armure Naturelle [27] Bouclier Bonus
  //   [34] CHA             [35] CHA_Temp         [36] Cheveux
  //   [37] ClassePrestige  [38] ClassePrincipale [48] CON
  //   [49] CON_Temp        [67] DEX              [68] DEX_Temp
  //   [69] Dieu            [73] FOR              [74] FOR_Temp
  //   [76] Grandeur (taille)   [81] Initiative DIVERS
  //   [83] INT             [84] INT_Temp
  //   [85] JdS Reflexe BASE    [88] JdS Reflexe magique
  //   [92] JdS Vigueur BASE    [95] JdS Vigueur magique
  //   [99] JdS Volonte BASE    [102] JdS Volonte magique
  //   [106] karma          [124] NiveauClassePrestige
  //   [125] NiveauClassePrincipale  [126] Nom joueur
  //   [127] Nom Perso ← CLEF FILTRE   [128] Notes
  //   [130] PKID Perso ← ID FileMaker  [131] PO
  //   [134] PoidsPerso     [137] Points de Vie (max HP)
  //   [138] Prénom Joueur  [139] PV (HP actuels)
  //   [140] Race           [142] SAG             [143] SAG_Temp
  //   [144] Sexe           [177] Vitesse de deplacement
  //   [179] XP_AcquisClassePrincipale  [182] Yeux
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('=== Import Personnages ===')
  const persoRows = parseCSV(readFileSync(resolve(CSV_DIR, 'Personnages.csv'), 'utf-8'))

  let persoCount = 0
  for (const row of persoRows) {
    const nomPerso = str(row[127])
    if (!nomPerso) continue  // Ignorer les sous-lignes portail FileMaker

    const pkid = str(row[130])

    // Déduplication : si déjà importé (re-run), récupérer l'ID existant
    const existing = await db.select({ id: schema.characters.id })
      .from(schema.characters)
      .where(eq(schema.characters.nom, nomPerso))
      .limit(1)
    if (existing.length > 0) {
      if (pkid) pkidToCharId.set(pkid, existing[0].id)
      console.log(`  ~ ${nomPerso} déjà présent (ID: ${existing[0].id})`)
      continue
    }

    const raceNom = str(row[140])
    const raceId = raceNom ? await getOrCreateRace(raceNom) : null

    const dieuNom = str(row[69])
    const dieuId = dieuNom ? await getOrCreateGod(dieuNom) : null

    const [char] = await db.insert(schema.characters).values({
      nom: nomPerso,
      raceId,
      dieuId,
      age: num(row[0]),
      alignement: str(row[1]),
      cheveux: str(row[36]),
      sexe: str(row[144]),
      taille: str(row[76]),        // Grandeur = catégorie de taille
      yeux: str(row[182]),
      notes: [str(row[108]), str(row[128])].filter(Boolean).join('\n') || null,
      joueurPrenom: str(row[138]),
      joueurNom: str(row[126]),
      xp: Math.min(num(row[179]) ?? 0, 2_000_000),
    }).returning()

    if (pkid) pkidToCharId.set(pkid, char.id)

    // Classe principale
    const classePrincipale = str(row[38])
    const niveauPrincipale = num(row[125])
    if (classePrincipale && niveauPrincipale && niveauPrincipale > 0) {
      const classeId = await getOrCreateClass(classePrincipale)
      await db.insert(schema.characterClasses).values({
        personnageId: char.id,
        classeId,
        niveau: niveauPrincipale,
      })
    }

    // Classe de prestige (si elle existe)
    const classePrestige = str(row[37])
    const niveauPrestige = num(row[124])
    if (classePrestige && niveauPrestige && niveauPrestige > 0) {
      const classeId = await getOrCreateClass(classePrestige)
      await db.insert(schema.characterClasses).values({
        personnageId: char.id,
        classeId,
        niveau: niveauPrestige,
      })
    }

    // Caractéristiques
    await db.insert(schema.characterAbilityScores).values({
      personnageId: char.id,
      forBase:    num(row[73])  ?? 10,
      forMagique: num(row[74])  ?? 0,
      dexBase:    num(row[67])  ?? 10,
      dexMagique: num(row[68])  ?? 0,
      conBase:    num(row[48])  ?? 10,
      conMagique: num(row[49])  ?? 0,
      intBase:    num(row[83])  ?? 10,
      intMagique: num(row[84])  ?? 0,
      sagBase:    num(row[142]) ?? 10,
      sagMagique: num(row[143]) ?? 0,
      chaBase:    num(row[34])  ?? 10,
      chaMagique: num(row[35])  ?? 0,
    })

    // Stats de combat
    await db.insert(schema.characterCombatStats).values({
      personnageId:     char.id,
      pvMax:            num(row[137]) ?? 0,   // Points de Vie
      pvActuels:        num(row[139]) ?? 0,   // PV actuels
      caBase:           10,
      caArme:           num(row[2])   ?? 0,   // Armure Bonus
      caBouclier:       num(row[27])  ?? 0,   // Bouclier Bonus
      caNaturelle:      num(row[5])   ?? 0,   // Armure Naturelle
      caDeflexion:      0,
      caDivers:         num(row[4])   ?? 0,   // Armure Divers
      deplacement:      num(row[177]) ?? 9,   // Vitesse de deplacement
      karma:            num(row[106]) ?? 0,
      initiativeBonus:  num(row[81])  ?? 0,   // Initiative DIVERS
      bbaCorpsACorps:   num(row[10])  ?? 0,   // BonusAttaqueBase1
      bbaProjectiles:   num(row[10])  ?? 0,
    })

    // Jets de sauvegarde
    await db.insert(schema.characterSavingThrows).values({
      personnageId:    char.id,
      reflexesBase:    num(row[85])  ?? 0,
      reflexesMagique: num(row[88])  ?? 0,
      vigueurBase:     num(row[92])  ?? 0,
      vigueurMagique:  num(row[95])  ?? 0,
      volonteBase:     num(row[99])  ?? 0,
      volonteMagique:  num(row[102]) ?? 0,
    })

    // Monnaie
    await db.insert(schema.characterCurrency).values({
      personnageId: char.id,
      po: numFloat(row[131]) ?? '0',
    })

    persoCount++
    console.log(`  ✓ ${nomPerso} (FM-ID: ${pkid} → Neon: ${char.id})`)
  }
  console.log(`→ ${persoCount} personnages importés\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. COMPÉTENCES.CSV
  // Colonnes : [0]=total [1]=base [2]=caracteristique [3]=nom
  //            [4]=hors_classe [5]=rang [6]=personnage_id [7]=mod_car
  //            [8]=bonus_divers [9]=class_flag [10]=id
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('=== Import Compétences ===')
  const compRows = parseCSV(readFileSync(resolve(CSV_DIR, 'Compétences.csv'), 'utf-8'))
  let compCount = 0

  // Déduplication : sauter si déjà importées
  const existingSkillsCount = await db.$count(schema.characterSkills)
  if (existingSkillsCount > 0) {
    console.log(`  ~ ${existingSkillsCount} compétences déjà en DB, section ignorée\n`)
  } else {
  for (const row of compRows) {
    const pkid = str(row[6])
    const charId = pkid ? pkidToCharId.get(pkid) : undefined
    if (!charId) continue

    const nomSkill = str(row[3])
    if (!nomSkill) continue

    const rang = num(row[5]) ?? 0
    const bonusDivers = num(row[8]) ?? 0
    if (rang === 0 && bonusDivers === 0) continue  // Ignorer les compétences non investies

    const caracteristique = str(row[2]) || 'INT'
    const skillId = await getOrCreateSkill(nomSkill, caracteristique)

    await db.insert(schema.characterSkills).values({
      personnageId: charId,
      skillId,
      rangsInvestis: rang,
      modifDivers: bonusDivers,
    })
    compCount++
  }
  } // fin else (compétences)
  console.log(`→ ${compCount} compétences importées\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. DONS.CSV
  // Colonnes : [0]=nom [1]=personnage_id [2]=id
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('=== Import Dons ===')
  const donsRows = parseCSV(readFileSync(resolve(CSV_DIR, 'Dons.csv'), 'utf-8'))
  let donsCount = 0

  for (const row of donsRows) {
    const nomDon = str(row[0])
    const pkid = str(row[1])
    if (!nomDon || !pkid) continue

    const charId = pkidToCharId.get(pkid)
    if (!charId) continue

    const featId = await getOrCreateFeat(nomDon)
    await db.insert(schema.characterFeats).values({
      personnageId: charId,
      featId,
    })
    donsCount++
  }
  console.log(`→ ${donsCount} dons importés\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ARMES.CSV
  // Colonnes : [0]=nom [1]=bonus_attaque [2]=critique [3]=degats
  //            [4]=personnage_id [5]=arme_id [6]=poids [7]=portee
  //            [8]=notes [9]=taille [10]=type
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('=== Import Armes ===')
  const armesRows = parseCSV(readFileSync(resolve(CSV_DIR, 'Armes.csv'), 'utf-8'))
  let armesCount = 0

  for (const row of armesRows) {
    const nomArme = str(row[0])
    const pkid = str(row[4])
    if (!nomArme || !pkid) continue

    const charId = pkidToCharId.get(pkid)
    if (!charId) continue

    const armeId = await getOrCreateWeapon(nomArme, {
      degats:     str(row[3]) ?? undefined,
      typeDegats: str(row[10]) ?? undefined,
      taille:     str(row[9]) ?? undefined,
    })

    await db.insert(schema.characterWeapons).values({
      personnageId: charId,
      armeId,
    })
    armesCount++
  }
  console.log(`→ ${armesCount} armes importées\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. OBJETS MAGIQUES.CSV
  // Colonnes : [0]=nom [1]=personnage_id [2]=charges [3]=valeur
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('=== Import Objets magiques ===')
  const objetsRows = parseCSV(readFileSync(resolve(CSV_DIR, 'Objets magiques.csv'), 'utf-8'))
  let objetsCount = 0

  for (const row of objetsRows) {
    const nomObjet = str(row[0])
    const pkid = str(row[1])
    if (!nomObjet || !pkid) continue

    const charId = pkidToCharId.get(pkid)
    if (!charId) continue

    const charges = num(row[2])
    const objetId = await getOrCreateMagicItem(nomObjet, charges)

    await db.insert(schema.characterMagicItems).values({
      personnageId: charId,
      objetId,
      chargesRestantes: charges,
    })
    objetsCount++
  }
  console.log(`→ ${objetsCount} objets magiques importés\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ÉQUIPEMENTS.CSV → stockés en note de personnage
  // Colonnes : [0]=personnage_id [1]=conteneur [2]=nom [3]=equip_id
  //            [4]=poids [5]=description
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('=== Import Équipements ===')
  const equipRows = parseCSV(readFileSync(resolve(CSV_DIR, 'Equipements.csv'), 'utf-8'))

  const equipByChar = new Map<number, string[]>()
  for (const row of equipRows) {
    const pkid = str(row[0])
    if (!pkid) continue
    const charId = pkidToCharId.get(pkid)
    if (!charId) continue
    const nom = str(row[2])
    if (!nom) continue
    if (!equipByChar.has(charId)) equipByChar.set(charId, [])
    const conteneur = str(row[1])
    equipByChar.get(charId)!.push(conteneur ? `[${conteneur}] ${nom}` : nom)
  }

  let equipCount = 0
  for (const [charId, items] of Array.from(equipByChar)) {
    await db.insert(schema.characterNotes).values({
      personnageId: charId,
      titre: 'Équipement (importé de FileMaker)',
      contenu: items.join('\n'),
    })
    equipCount += items.length
  }
  console.log(`→ ${equipCount} équipements importés (regroupés en notes)\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. LANGUES.CSV
  // Colonnes : [0]=personnage_id [1]=langue [2]=id
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('=== Import Langues ===')
  const languesRows = parseCSV(readFileSync(resolve(CSV_DIR, 'Langues.csv'), 'utf-8'))
  let languesCount = 0

  for (const row of languesRows) {
    const pkid = str(row[0])
    const langue = str(row[1])
    if (!pkid || !langue) continue

    const charId = pkidToCharId.get(pkid)
    if (!charId) continue

    const langueId = await getOrCreateLanguage(langue)
    await db.insert(schema.characterLanguages).values({
      personnageId: charId,
      langueId,
    })
    languesCount++
  }
  console.log(`→ ${languesCount} langues importées\n`)

  console.log('✅ Import FileMaker terminé!')
  console.log(`   Personnages: ${persoCount}`)
  console.log(`   Compétences: ${compCount}`)
  console.log(`   Dons: ${donsCount}`)
  console.log(`   Armes: ${armesCount}`)
  console.log(`   Objets magiques: ${objetsCount}`)
  console.log(`   Équipements: ${equipCount}`)
  console.log(`   Langues: ${languesCount}`)
}

main().catch(err => {
  console.error('Erreur fatale:', err)
  process.exit(1)
})
