'use server'

import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logJournal } from '@/lib/journal'
import { normaliserNom } from '@/lib/noms'
import { UNITES_MONNAIE, uniteCourte } from '@/lib/dnd35/monnaie'

// ─── Butin : encaisser un trésor EN PLEINE PARTIE ─────────────────────────────
// Le formulaire de modification sert à *bâtir* un personnage; le butin sert à
// l'*enrichir* pendant qu'on joue. La différence de fond : ici on AJOUTE à ce qui
// existe (la monnaie s'additionne, les lots se cumulent), là-bas on REMPLACE tout.
//
// ⛔ Règle d'or de ce fichier : on ne MUTE JAMAIS une ligne de `weapons`,
// `magic_items` ou `potions` déjà en place. Ces tables sont partagées par nom
// entre tous les personnages (`saveCharacter` y fait un findOrCreateByNom), donc
// y écrire au nom du personnage qui encaisse écraserait l'objet homonyme des
// autres. On réutilise la ligne telle quelle, ou on en crée une neuve; ce qui
// appartient au personnage (bonus magique, emplacement, charges, quantité, note)
// va dans la table `character_*`, jamais dans le catalogue.

export type TypeButin = 'monnaie' | 'gemme' | 'potion' | 'objet' | 'arme'

export type EntreeButin =
  | { type: 'monnaie'; montant: number; unite: string; notes?: string }
  | { type: 'gemme'; nom: string; quantite: number; valeur: number; unite: string; notes?: string }
  | { type: 'potion'; nom: string; effet?: string; doses: number; notes?: string }
  | { type: 'objet'; nom: string; emplacement?: string; charges?: number; notes?: string }
  | { type: 'arme'; nom: string; degats?: string; bonusMagique?: number; quantite: number; notes?: string }

export type ResultatButin = {
  ok: boolean
  /** Confirmation courte affichée sous le formulaire. */
  message: string
  /** Avertissement facultatif : ce que le Grimoire n'a volontairement pas écrit. */
  avis?: string
}

// ─── Garde-fous de saisie ────────────────────────────────────────────────────
const MAX_NOM = 200
const MAX_NOTE = 500

function nettoie(s: string | undefined, max: number): string {
  return (s ?? '').trim().slice(0, max)
}

function borne(n: number | undefined, min: number, max: number, defaut: number): number {
  if (n == null || !Number.isFinite(n)) return defaut
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

function uniteValide(code: string | undefined): string {
  return UNITES_MONNAIE.some(u => u.code === code) ? (code as string) : 'po'
}

/** Montant formaté sans décimale inutile : 250, 12,5 */
function montantLisible(n: number): string {
  return (Math.round(n * 100) / 100).toLocaleString('fr-CA', { maximumFractionDigits: 2 })
}

/**
 * Cherche une ligne de catalogue par son nom : d'abord à l'exact, puis à la
 * casse / aux accents / aux espaces près — la même souplesse que
 * `findOrCreateByNom` du formulaire, pour ne pas semer de jumelles.
 * ⛔ Ne crée rien et ne modifie rien : la décision revient à l'appelant.
 */
async function trouverParNom<T extends { id: number; nom: string }>(
  tous: () => Promise<T[]>,
  nom: string
): Promise<T | null> {
  const cible = normaliserNom(nom)
  if (!cible) return null
  const lignes = await tous()
  return lignes.find(l => l.nom === nom) ?? lignes.find(l => normaliserNom(l.nom) === cible) ?? null
}

// ─── Action unique, à discriminant ───────────────────────────────────────────
// Un seul point d'entrée : le journal, la revalidation et les garde-fous ne
// s'écrivent qu'une fois, et chaque onglet du panneau appelle le même chemin.
export async function ajouterButin(personnageId: number, entree: EntreeButin): Promise<ResultatButin> {
  const db = getDb()

  const [perso] = await db
    .select({ id: schema.characters.id })
    .from(schema.characters)
    .where(eq(schema.characters.id, personnageId))
    .limit(1)
  if (!perso) return { ok: false, message: 'Personnage introuvable.' }

  const note = nettoie(entree.notes, MAX_NOTE)
  let description = ''
  let valeurJournal: number | null = null
  let message = ''
  let avis: string | undefined

  switch (entree.type) {
    // ── Monnaie : on AJOUTE au magot, on ne le remplace pas ──
    case 'monnaie': {
      const unite = uniteValide(entree.unite)
      const montant = Math.round((Number(entree.montant) || 0) * 100) / 100
      if (!(montant > 0)) return { ok: false, message: 'Entrez un montant positif.' }
      if (montant > 99_999_999) return { ok: false, message: 'Montant trop élevé.' }

      const [existant] = await db
        .select()
        .from(schema.characterCurrency)
        .where(eq(schema.characterCurrency.personnageId, personnageId))
        .limit(1)

      if (existant) {
        const avant = Number((existant as Record<string, unknown>)[unite] ?? 0)
        const apres = Math.round((avant + montant) * 100) / 100
        await db
          .update(schema.characterCurrency)
          .set({ [unite]: apres.toString() })
          .where(eq(schema.characterCurrency.personnageId, personnageId))
        message = `+${montantLisible(montant)} ${uniteCourte(unite)} — bourse : ${montantLisible(apres)}`
      } else {
        await db.insert(schema.characterCurrency).values({ personnageId, [unite]: montant.toString() })
        message = `+${montantLisible(montant)} ${uniteCourte(unite)} — bourse : ${montantLisible(montant)}`
      }
      description = `Reçoit ${montantLisible(montant)} ${uniteCourte(unite)}`
      break
    }

    // ── Gemmes : écrites en clair dans character_gems, jamais via le catalogue ──
    case 'gemme': {
      const nom = nettoie(entree.nom, MAX_NOM)
      if (!nom) return { ok: false, message: 'Nommez la gemme.' }
      const quantite = borne(entree.quantite, 1, 9999, 1)
      const unite = uniteValide(entree.unite)
      const valeur = Math.round((Number(entree.valeur) || 0) * 100) / 100
      if (valeur < 0 || valeur > 99_999_999) return { ok: false, message: 'Valeur invalide.' }

      // Un lot identique (même nom, même valeur, même unité) se cumule plutôt que
      // de créer une deuxième ligne : trois perles de plus font « ×5 », pas deux lignes.
      const lots = await db
        .select()
        .from(schema.characterGems)
        .where(eq(schema.characterGems.personnageId, personnageId))
      const cible = normaliserNom(nom)
      const jumeau = lots.find(
        g =>
          normaliserNom(g.nom) === cible &&
          (g.unite ?? 'po') === unite &&
          Math.abs(Number(g.valeur ?? 0) - valeur) < 0.005
      )

      if (jumeau) {
        const total = (jumeau.quantite ?? 1) + quantite
        await db
          .update(schema.characterGems)
          .set({ quantite: total, notes: note || jumeau.notes })
          .where(eq(schema.characterGems.id, jumeau.id))
        message = `${jumeau.nom} — lot porté à ×${total}`
      } else {
        await db.insert(schema.characterGems).values({
          personnageId,
          nom,
          quantite,
          valeur: valeur.toString(),
          unite,
          notes: note || null,
        })
        message = `${nom}${quantite > 1 ? ` ×${quantite}` : ''} ajouté au trésor`
      }
      description =
        `Reçoit ${nom}${quantite > 1 ? ` ×${quantite}` : ''}` +
        (valeur > 0 ? ` (${montantLisible(valeur)} ${uniteCourte(unite)}${quantite > 1 ? ' pièce' : ''})` : '')
      valeurJournal = quantite
      break
    }

    // ── Potions ──
    case 'potion': {
      const nom = nettoie(entree.nom, MAX_NOM)
      if (!nom) return { ok: false, message: 'Nommez la potion.' }
      const doses = borne(entree.doses, 1, 999, 1)
      const effet = nettoie(entree.effet, MAX_NOM)

      const catalogue = await trouverParNom(
        () => db.select({ id: schema.potions.id, nom: schema.potions.nom, sortEffet: schema.potions.sortEffet }).from(schema.potions),
        nom
      )
      let potionId: number
      if (catalogue) {
        potionId = catalogue.id
        // ⛔ Aucun UPDATE : `potions` est partagée par nom avec les autres fiches.
        if (effet && catalogue.sortEffet && normaliserNom(effet) !== normaliserNom(catalogue.sortEffet)) {
          avis = `« ${catalogue.nom} » existe déjà avec l'effet « ${catalogue.sortEffet} ». L'effet saisi n'a pas été écrit pour ne pas modifier la potion des autres personnages.`
        }
      } else {
        const [creee] = await db
          .insert(schema.potions)
          .values({ nom, sortEffet: effet || null, chargesMax: doses })
          .returning({ id: schema.potions.id })
        potionId = creee.id
      }

      // Même potion déjà en poche : on cumule les doses au lieu d'empiler les lignes.
      const [dejaLa] = await db
        .select()
        .from(schema.characterPotions)
        .where(and(eq(schema.characterPotions.personnageId, personnageId), eq(schema.characterPotions.potionId, potionId)))
        .limit(1)

      if (dejaLa) {
        const total = (dejaLa.chargesRestantes ?? 0) + doses
        await db
          .update(schema.characterPotions)
          .set({ chargesRestantes: total, notes: note || dejaLa.notes })
          .where(eq(schema.characterPotions.id, dejaLa.id))
        message = `${nom} — ${total} dose${total > 1 ? 's' : ''} en poche`
      } else {
        await db.insert(schema.characterPotions).values({
          personnageId,
          potionId,
          chargesRestantes: doses,
          notes: note || null,
        })
        message = `${nom} ajoutée (${doses} dose${doses > 1 ? 's' : ''})`
      }
      description = `Reçoit ${nom}${doses > 1 ? ` (${doses} doses)` : ''}`
      valeurJournal = doses
      break
    }

    // ── Objets magiques ──
    case 'objet': {
      const nom = nettoie(entree.nom, MAX_NOM)
      if (!nom) return { ok: false, message: "Nommez l'objet." }
      const emplacement = nettoie(entree.emplacement, 100)
      const charges = borne(entree.charges, 0, 9999, 0)

      const catalogue = await trouverParNom(
        () => db.select({ id: schema.magicItems.id, nom: schema.magicItems.nom, bonus: schema.magicItems.bonus }).from(schema.magicItems),
        nom
      )
      let objetId: number
      if (catalogue) {
        objetId = catalogue.id
        // ⛔ Surtout PAS de `set({ bonus })` ici : c'est exactement le geste du
        // formulaire qui écrase l'objet homonyme des autres personnages, et
        // `magic_items.bonus` alimente directement la CA affichée.
      } else {
        const [creee] = await db
          .insert(schema.magicItems)
          .values({
            nom,
            emplacement: emplacement || null,
            // Un objet ramassé va au sac, il n'est pas encore porté : aucun effet de
            // CA tant que le joueur ne l'a pas déclaré dans Modifier. `bonus` reste NULL.
            bonus: null,
            chargesMax: charges > 0 ? charges : null,
          })
          .returning({ id: schema.magicItems.id })
        objetId = creee.id
      }

      // Pas de fusion ici : deux anneaux de protection sont deux objets distincts,
      // chacun avec son emplacement et ses charges.
      await db.insert(schema.characterMagicItems).values({
        personnageId,
        objetId,
        emplacement: emplacement || null,
        chargesRestantes: charges > 0 ? charges : null,
        notes: note || null,
      })
      message = `${nom} ajouté à l'équipement magique`
      // On n'avertit que dans le cas SURPRENANT : l'objet réutilisé porte déjà un
      // bonus de CA, donc la classe d'armure vient de bouger sans qu'on l'ait
      // demandé. Le cas normal (objet au sac, aucun effet) est rappelé en
      // permanence sous les champs du panneau — inutile de le répéter à chaque ajout.
      if (catalogue?.bonus != null) {
        avis = `« ${catalogue.nom} » porte déjà un bonus de CA de +${catalogue.bonus} au catalogue : il compte dès maintenant dans votre classe d'armure.`
      }
      description = `Reçoit ${nom}` + (emplacement ? ` (${emplacement})` : '') + (charges > 0 ? ` — ${charges} charges` : '')
      break
    }

    // ── Armes ──
    case 'arme': {
      const nom = nettoie(entree.nom, MAX_NOM)
      if (!nom) return { ok: false, message: "Nommez l'arme." }
      const quantite = borne(entree.quantite, 1, 9999, 1)
      const bonusMagique = borne(entree.bonusMagique, 0, 20, 0)
      const degats = nettoie(entree.degats, 30)

      const catalogue = await trouverParNom(
        () => db.select({ id: schema.weapons.id, nom: schema.weapons.nom, degats: schema.weapons.degats }).from(schema.weapons),
        nom
      )
      let armeId: number
      if (catalogue) {
        armeId = catalogue.id
        // ⛔ Aucun UPDATE : les dégâts d'une « épée longue » sont ceux du Manuel,
        // partagés par toutes les fiches. On garde la ligne telle quelle et on le dit.
        if (degats && catalogue.degats && normaliserNom(degats) !== normaliserNom(catalogue.degats)) {
          avis = `« ${catalogue.nom} » est déjà au catalogue avec ${catalogue.degats} dégâts. Les dégâts saisis n'ont pas été écrits pour ne pas modifier l'arme des autres personnages.`
        }
      } else {
        const [creee] = await db
          .insert(schema.weapons)
          .values({ nom, degats: degats || null })
          .returning({ id: schema.weapons.id })
        armeId = creee.id
        if (!degats) avis = "Arme créée sans dégâts ni critique : complétez-les dans Modifier → Équipement."
      }

      // Une pile identique (même arme, même bonus magique) se cumule — pratique
      // pour les flèches et les dagues de lancer.
      const [pile] = await db
        .select()
        .from(schema.characterWeapons)
        .where(
          and(
            eq(schema.characterWeapons.personnageId, personnageId),
            eq(schema.characterWeapons.armeId, armeId),
            eq(schema.characterWeapons.bonusMagique, bonusMagique)
          )
        )
        .limit(1)

      const etiquette = bonusMagique > 0 ? `${nom} +${bonusMagique}` : nom
      if (pile) {
        const total = (pile.quantite ?? 1) + quantite
        await db.update(schema.characterWeapons).set({ quantite: total }).where(eq(schema.characterWeapons.id, pile.id))
        message = `${etiquette} — ×${total} au râtelier`
      } else {
        await db.insert(schema.characterWeapons).values({ personnageId, armeId, bonusMagique, quantite })
        message = `${etiquette}${quantite > 1 ? ` ×${quantite}` : ''} ajoutée`
      }
      description = `Reçoit ${etiquette}${quantite > 1 ? ` ×${quantite}` : ''}`
      valeurJournal = quantite
      break
    }
  }

  // ── Trace au journal de partie ──
  // Même chronique que le reste de la fiche : on retrouvera après coup où et quand
  // le trésor a été trouvé. La note du butin (« coffre du gobelin ») vit ici.
  await logJournal(personnageId, 'butin', note ? `${description} — ${note}` : description, valeurJournal)

  revalidatePath(`/personnage/${personnageId}`)
  revalidatePath('/partie')

  return { ok: true, message, avis }
}
