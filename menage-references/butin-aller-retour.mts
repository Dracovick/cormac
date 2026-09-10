/**
 * Aller-retour de preuve pour le bouton 💰 Butin.
 *
 * Appelle la VRAIE server action `ajouterButin` (pas une copie de son SQL), relit
 * par le VRAI chemin de lecture de la fiche (`getCharacter`), puis efface tout et
 * vérifie qu'il ne reste rien — ni ligne de personnage, ni ligne de catalogue créée.
 *
 * Le cœur du test : prouver qu'un ajout de butin NE MUTE PAS les lignes partagées
 * de `weapons` / `magic_items` / `potions`, qui sont communes à toutes les fiches.
 *
 * Le test travaille sur un personnage jetable créé pour l'occasion : aucune fiche
 * réelle n'est touchée.
 *
 *   npx tsx menage-references/butin-aller-retour.mts
 */
import fs from 'node:fs'
import { createRequire } from 'node:module'

process.env.DATABASE_URL =
  fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim()

// `revalidatePath` exige un contexte de requête Next, qui n'existe pas dans un
// script. On le neutralise AVANT de charger l'action — et on note ses appels, ce
// qui prouve du même coup que la fiche est bien invalidée à chaque ajout.
const chemins: string[] = []
const cacheNext = createRequire(import.meta.url)('next/cache')
cacheNext.revalidatePath = (p: string) => chemins.push(p)

const { getDb } = await import('../src/db/index.ts')
const schema = await import('../src/db/schema/index.ts')
const { eq, inArray, isNotNull } = await import('drizzle-orm')
const { ajouterButin } = await import('../src/app/actions/butin.ts')
const { getCharacter } = await import('../src/lib/queries/character.ts')

const db = getDb()
const NOM_TEMOIN = 'ZZ Témoin Butin (à supprimer)'
const controles: [string, boolean, string][] = []
const verifie = (quoi: string, vrai: boolean, mesure: string) => controles.push([quoi, vrai, mesure])

function titre(t: string) {
  console.log(`\n\x1b[33m── ${t} ──\x1b[0m`)
}

// ── Cibles réelles du catalogue, pour l'épreuve de non-mutation ──
const [armeExistante] = await db
  .select({ id: schema.weapons.id, nom: schema.weapons.nom, degats: schema.weapons.degats })
  .from(schema.weapons)
  .where(isNotNull(schema.weapons.degats))
  .limit(1)
const [objetExistant] = await db
  .select({ id: schema.magicItems.id, nom: schema.magicItems.nom, bonus: schema.magicItems.bonus })
  .from(schema.magicItems)
  .where(isNotNull(schema.magicItems.bonus))
  .limit(1)
console.log(`Cible arme      : « ${armeExistante.nom} » (dégâts ${armeExistante.degats}, id ${armeExistante.id})`)
console.log(`Cible objet     : « ${objetExistant.nom} » (bonus ${objetExistant.bonus}, id ${objetExistant.id})`)

// Qui d'autre possède ces lignes ? Ce sont eux qu'une mutation abîmerait.
const proprietairesArme = await db
  .select({ n: schema.characterWeapons.personnageId })
  .from(schema.characterWeapons)
  .where(eq(schema.characterWeapons.armeId, armeExistante.id))
const proprietairesObjet = await db
  .select({ n: schema.characterMagicItems.personnageId })
  .from(schema.characterMagicItems)
  .where(eq(schema.characterMagicItems.objetId, objetExistant.id))
console.log(`  déjà portées par ${proprietairesArme.length} et ${proprietairesObjet.length} personnage(s)`)

// ── Personnage jetable ──
const [temoin] = await db.insert(schema.characters).values({ nom: NOM_TEMOIN }).returning({ id: schema.characters.id })
const ID = temoin.id
console.log(`Personnage témoin créé : id=${ID}`)

const avant = {
  weapons: (await db.select({ id: schema.weapons.id }).from(schema.weapons)).map(r => r.id),
  magicItems: (await db.select({ id: schema.magicItems.id }).from(schema.magicItems)).map(r => r.id),
  potions: (await db.select({ id: schema.potions.id }).from(schema.potions)).map(r => r.id),
}

// `revalidatePath` n'existe pas hors d'une requête Next : l'écriture en base est
// déjà faite quand il lève, on l'avale et on juge sur ce que la base contient.
async function butin(entree: Parameters<typeof ajouterButin>[1]) {
  return ajouterButin(ID, entree)
}

titre('1. Les ajouts, par la vraie action')
await butin({ type: 'monnaie', montant: 250, unite: 'po', notes: 'coffre du gobelin' })
await butin({ type: 'monnaie', montant: 30, unite: 'po', notes: 'coffre du gobelin' })
await butin({ type: 'gemme', nom: 'Rubis étoilé', quantite: 2, valeur: 50, unite: 'po', notes: 'coffre du gobelin' })
await butin({ type: 'gemme', nom: 'rubis  ÉTOILÉ', quantite: 3, valeur: 50, unite: 'po' }) // même lot, écrit autrement
await butin({ type: 'potion', nom: 'Potion ZZ de test', effet: 'Soins légers', doses: 2 })
await butin({ type: 'objet', nom: 'Amulette ZZ de test', emplacement: 'Cou', charges: 0, notes: 'au cou du chef' })
await butin({ type: 'arme', nom: 'Dague ZZ de test', degats: '1d4', bonusMagique: 1, quantite: 2 })
await butin({ type: 'arme', nom: 'Dague ZZ de test', degats: '1d4', bonusMagique: 1, quantite: 3 }) // même pile
// ── Les deux cas qui piègent : un nom DÉJÀ au catalogue, avec des données contradictoires
const conflitArme = await butin({ type: 'arme', nom: armeExistante.nom, degats: '9d99', quantite: 1 })
const conflitObjet = await butin({ type: 'objet', nom: objetExistant.nom, emplacement: 'Sac' })
console.log(`  avis arme  : ${conflitArme?.avis ?? '(aucun)'}`)
console.log(`  avis objet : ${conflitObjet?.avis ?? '(aucun)'}`)

titre('2. Relecture par le VRAI chemin de lecture de la fiche (getCharacter)')
const fiche = await getCharacter(ID)
if (!fiche) throw new Error('getCharacter n’a rien retourné')
console.log('  Monnaie :', JSON.stringify({ po: fiche.currency?.po }))
console.log('  Gemmes  :', fiche.gems.map(g => `${g.nom} ×${g.quantite} @ ${g.valeur} ${g.unite} [${g.notes ?? '—'}]`))
console.log('  Potions :', fiche.potions.map(p => `${p.potion.nom} — ${p.charPotion.chargesRestantes} dose(s)`))
console.log('  Objets  :', fiche.magicItems.map(m => `${m.item.nom} · bonus=${m.item.bonus} · empl=${m.charItem.emplacement} · note=${m.charItem.notes}`))
console.log('  Armes   :', fiche.weapons.map(w => `${w.weapon.nom} +${w.charWeapon.bonusMagique} ×${w.charWeapon.quantite} · dégâts=${w.weapon.degats}`))

titre('3. Journal de partie')
const entrees = await db
  .select({ type: schema.characterJournal.type, description: schema.characterJournal.description, valeur: schema.characterJournal.valeur })
  .from(schema.characterJournal)
  .where(eq(schema.characterJournal.personnageId, ID))
for (const e of entrees) console.log(`  [${e.type}] ${e.description}${e.valeur != null ? ` (valeur ${e.valeur})` : ''}`)

titre('4. ÉPREUVE DE NON-MUTATION — les lignes partagées ont-elles bougé ?')
const [armeApres] = await db
  .select({ nom: schema.weapons.nom, degats: schema.weapons.degats })
  .from(schema.weapons)
  .where(eq(schema.weapons.id, armeExistante.id))
const [objetApres] = await db
  .select({ nom: schema.magicItems.nom, bonus: schema.magicItems.bonus })
  .from(schema.magicItems)
  .where(eq(schema.magicItems.id, objetExistant.id))
verifie(`weapons #${armeExistante.id} intacte malgré des dégâts contradictoires`, armeApres.degats === armeExistante.degats, `${armeExistante.degats} → ${armeApres.degats}`)
verifie(`magic_items #${objetExistant.id} intacte (bonus non réécrit)`, objetApres.bonus === objetExistant.bonus, `${objetExistant.bonus} → ${objetApres.bonus}`)
verifie('avis levé quand les dégâts saisis contredisent le catalogue', !!conflitArme?.avis, conflitArme?.avis ?? 'aucun avis')
verifie('avis levé quand l’objet réutilisé porte déjà un bonus de CA', !!conflitObjet?.avis, conflitObjet?.avis ?? 'aucun avis')
verifie('la fiche est invalidée à chaque ajout (revalidatePath)', chemins.filter(c => c === `/personnage/${ID}`).length === 10, `${chemins.filter(c => c === `/personnage/${ID}`).length} appel(s) sur /personnage/${ID}, ${chemins.filter(c => c === '/partie').length} sur /partie`)

titre('5. Autres vérifications')
const nouvelObjet = fiche.magicItems.find(m => m.item.nom === 'Amulette ZZ de test')
verifie('monnaie cumulée (250 + 30 = 280)', Number(fiche.currency?.po) === 280, `po = ${fiche.currency?.po}`)
verifie('gemmes fusionnées en un seul lot ×5', fiche.gems.length === 1 && fiche.gems[0].quantite === 5, `${fiche.gems.length} lot(s), ×${fiche.gems[0]?.quantite}`)
verifie('note de la gemme conservée', (fiche.gems[0]?.notes ?? '') === 'coffre du gobelin', String(fiche.gems[0]?.notes))
verifie('potion : 2 doses sur 1 ligne', fiche.potions.length === 1 && fiche.potions[0].charPotion.chargesRestantes === 2, `${fiche.potions.length} ligne(s)`)
verifie('objet NEUF créé avec bonus NULL (aucun effet sur la CA)', nouvelObjet?.item.bonus === null, `bonus = ${nouvelObjet?.item.bonus}`)
verifie('note de l’objet conservée et relue', nouvelObjet?.charItem.notes === 'au cou du chef', String(nouvelObjet?.charItem.notes))
verifie('armes empilées ×5 sur une seule ligne', (fiche.weapons.find(w => w.weapon.nom === 'Dague ZZ de test')?.charWeapon.quantite ?? 0) === 5, `×${fiche.weapons.find(w => w.weapon.nom === 'Dague ZZ de test')?.charWeapon.quantite}`)
verifie('10 entrées de journal de type « butin »', entrees.filter(e => e.type === 'butin').length === 10, `${entrees.filter(e => e.type === 'butin').length} entrée(s)`)

titre('6. Nettoyage')
const apres = {
  weapons: (await db.select({ id: schema.weapons.id }).from(schema.weapons)).map(r => r.id),
  magicItems: (await db.select({ id: schema.magicItems.id }).from(schema.magicItems)).map(r => r.id),
  potions: (await db.select({ id: schema.potions.id }).from(schema.potions)).map(r => r.id),
}
const nouveaux = {
  weapons: apres.weapons.filter(i => !avant.weapons.includes(i)),
  magicItems: apres.magicItems.filter(i => !avant.magicItems.includes(i)),
  potions: apres.potions.filter(i => !avant.potions.includes(i)),
}
console.log('  Lignes de catalogue créées par le butin :', JSON.stringify(nouveaux))

await db.delete(schema.characterJournal).where(eq(schema.characterJournal.personnageId, ID))
await db.delete(schema.characterGems).where(eq(schema.characterGems.personnageId, ID))
await db.delete(schema.characterPotions).where(eq(schema.characterPotions.personnageId, ID))
await db.delete(schema.characterMagicItems).where(eq(schema.characterMagicItems.personnageId, ID))
await db.delete(schema.characterWeapons).where(eq(schema.characterWeapons.personnageId, ID))
await db.delete(schema.characterCurrency).where(eq(schema.characterCurrency.personnageId, ID))
if (nouveaux.weapons.length) await db.delete(schema.weapons).where(inArray(schema.weapons.id, nouveaux.weapons))
if (nouveaux.magicItems.length) await db.delete(schema.magicItems).where(inArray(schema.magicItems.id, nouveaux.magicItems))
if (nouveaux.potions.length) await db.delete(schema.potions).where(inArray(schema.potions.id, nouveaux.potions))
await db.delete(schema.characters).where(eq(schema.characters.id, ID))

titre('7. Il ne doit plus rien rester')
const reste = {
  characters: (await db.select().from(schema.characters).where(eq(schema.characters.id, ID))).length,
  journal: (await db.select().from(schema.characterJournal).where(eq(schema.characterJournal.personnageId, ID))).length,
  gems: (await db.select().from(schema.characterGems).where(eq(schema.characterGems.personnageId, ID))).length,
  potions: (await db.select().from(schema.characterPotions).where(eq(schema.characterPotions.personnageId, ID))).length,
  magicItems: (await db.select().from(schema.characterMagicItems).where(eq(schema.characterMagicItems.personnageId, ID))).length,
  weapons: (await db.select().from(schema.characterWeapons).where(eq(schema.characterWeapons.personnageId, ID))).length,
  currency: (await db.select().from(schema.characterCurrency).where(eq(schema.characterCurrency.personnageId, ID))).length,
}
console.log('  Reste pour le témoin :', JSON.stringify(reste))
verifie('aucune ligne résiduelle pour le témoin', Object.values(reste).every(n => n === 0), JSON.stringify(reste))

const final = {
  weapons: (await db.select({ id: schema.weapons.id }).from(schema.weapons)).length,
  magicItems: (await db.select({ id: schema.magicItems.id }).from(schema.magicItems)).length,
  potions: (await db.select({ id: schema.potions.id }).from(schema.potions)).length,
}
verifie(
  'catalogues revenus exactement à leur compte de départ',
  final.weapons === avant.weapons.length && final.magicItems === avant.magicItems.length && final.potions === avant.potions.length,
  `weapons ${avant.weapons.length}→${final.weapons}, magic_items ${avant.magicItems.length}→${final.magicItems}, potions ${avant.potions.length}→${final.potions}`
)

titre('BILAN')
let echecs = 0
for (const [quoi, vrai, mesure] of controles) {
  console.log(`  ${vrai ? '\x1b[32m✓' : '\x1b[31m✗'} ${quoi}\x1b[0m — mesuré : ${mesure}`)
  if (!vrai) echecs++
}
console.log(`\n${echecs === 0 ? `\x1b[32m${controles.length}/${controles.length} — TOUT EST VÉRIFIÉ` : `\x1b[31m${echecs} ÉCHEC(S) sur ${controles.length}`}\x1b[0m`)
