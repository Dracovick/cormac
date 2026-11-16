'use server'

// ─── L'histoire du personnage : écriture depuis la page d'histoire ───────────
// André, le 2026-11-15 : « une section dans le grimoire pour l'histoire des
// personnages… un lien dans la fiche qui amène à son histoire détaillée que le
// joueur pourrait écrire » (drizzle/0018).
//
// ⚠ Chaque action porte `personnageId` EN PLUS de l'id du chapitre, et le
// `where` vérifie les deux. L'id vient du navigateur : sans ce garde-fou, un
// identifiant erroné réécrirait l'histoire d'un autre personnage sans bruit.
// Même précaution que `actions/equipement.ts`.
//
// ⛔ Aucune entrée au journal de partie, délibérément. Le journal est la
// chronique de ce qui se JOUE; écrire son histoire est un geste d'auteur, pas
// un coup de dé. Une ligne « a modifié le chapitre 3 » par sauvegarde noierait
// le journal du MJ.
//
// Les garde-fous de saisie vivent dans `@/lib/histoire` : un fichier 'use
// server' ne peut exporter que des fonctions async, donc ils y seraient
// intestables — et trois écrans doivent appliquer les mêmes.

import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { and, asc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  MAX_CHAPITRES,
  MAX_TITRE_CHAPITRE,
  contenuChapitre,
  valeursChapitre,
  type SaisieChapitre,
} from '@/lib/histoire'

export type ResultatHistoire = { ok: boolean; message: string }

/** La fiche affiche l'aperçu de l'histoire : les deux pages se périment ensemble. */
function rafraichir(personnageId: number) {
  revalidatePath(`/personnage/${personnageId}/histoire`)
  revalidatePath(`/personnage/${personnageId}`)
}

export async function ajouterChapitre(
  personnageId: number,
  saisie: SaisieChapitre
): Promise<ResultatHistoire> {
  const valeurs = valeursChapitre(saisie)
  if (!valeurs.titre) return { ok: false, message: 'Donnez un titre au chapitre.' }

  const db = getDb()
  const existants = await db
    .select({ ordre: schema.characterStoryChapters.ordre })
    .from(schema.characterStoryChapters)
    .where(eq(schema.characterStoryChapters.personnageId, personnageId))

  if (existants.length >= MAX_CHAPITRES) {
    return { ok: false, message: `Maximum de ${MAX_CHAPITRES} chapitres atteint.` }
  }

  // Le nouveau chapitre se range à la fin : on écrit la suite de son histoire,
  // on ne la préface pas. Il se remonte ensuite avec ↑ si besoin.
  const ordre = existants.reduce((max, c) => Math.max(max, c.ordre + 1), 0)

  await db.insert(schema.characterStoryChapters).values({ personnageId, ...valeurs, ordre })
  rafraichir(personnageId)
  return { ok: true, message: `Chapitre « ${valeurs.titre} » ajouté` }
}

export async function modifierChapitre(
  personnageId: number,
  chapitreId: number,
  saisie: SaisieChapitre
): Promise<ResultatHistoire> {
  const valeurs = valeursChapitre(saisie)
  if (!valeurs.titre) return { ok: false, message: 'Donnez un titre au chapitre.' }

  const modifies = await getDb()
    .update(schema.characterStoryChapters)
    // ⚠ `updatedAt` n'est pas automatique en base (`defaultNow()` ne vaut qu'à
    // l'insertion) : sans cette ligne, « revu le … » resterait au jour de la
    // création et mentirait sur la fraîcheur du texte.
    .set({ ...valeurs, updatedAt: new Date() })
    .where(and(
      eq(schema.characterStoryChapters.id, chapitreId),
      eq(schema.characterStoryChapters.personnageId, personnageId),
    ))
    .returning({ id: schema.characterStoryChapters.id })

  if (modifies.length === 0) return { ok: false, message: 'Ce chapitre n’existe plus.' }
  rafraichir(personnageId)
  return { ok: true, message: 'Chapitre enregistré' }
}

export async function retirerChapitre(
  personnageId: number,
  chapitreId: number
): Promise<ResultatHistoire> {
  const retires = await getDb()
    .delete(schema.characterStoryChapters)
    .where(and(
      eq(schema.characterStoryChapters.id, chapitreId),
      eq(schema.characterStoryChapters.personnageId, personnageId),
    ))
    .returning({ titre: schema.characterStoryChapters.titre })

  if (retires.length === 0) return { ok: false, message: 'Ce chapitre n’existe plus.' }
  rafraichir(personnageId)
  return { ok: true, message: `Chapitre « ${retires[0].titre} » retiré` }
}

/**
 * Monter (-1) ou descendre (+1) un chapitre d'un rang.
 *
 * ⚠ Les rangs sont RÉÉCRITS en 0..n-1 à chaque déplacement, au lieu d'échanger
 * deux valeurs. Un simple échange suppose que les rangs sont tous distincts —
 * or deux chapitres ajoutés à la même seconde depuis deux appareils peuvent
 * partager un rang, et l'échange ne ferait alors rien du tout, en silence.
 * Renuméroter la liste entière est le seul geste qui converge toujours.
 */
export async function deplacerChapitre(
  personnageId: number,
  chapitreId: number,
  sens: -1 | 1
): Promise<ResultatHistoire> {
  const db = getDb()
  const chapitres = await db
    .select({ id: schema.characterStoryChapters.id })
    .from(schema.characterStoryChapters)
    .where(eq(schema.characterStoryChapters.personnageId, personnageId))
    .orderBy(asc(schema.characterStoryChapters.ordre), asc(schema.characterStoryChapters.id))

  const depuis = chapitres.findIndex(c => c.id === chapitreId)
  if (depuis < 0) return { ok: false, message: 'Ce chapitre n’existe plus.' }

  const vers = depuis + sens
  if (vers < 0 || vers >= chapitres.length) {
    return { ok: false, message: sens < 0 ? 'Déjà en premier.' : 'Déjà en dernier.' }
  }

  const ordonnes = [...chapitres]
  ;[ordonnes[depuis], ordonnes[vers]] = [ordonnes[vers], ordonnes[depuis]]

  // ⛔ PAS `db.transaction()` : le driver `neon-http` lève
  // « No transactions support in neon-http driver » — à l'EXÉCUTION, donc
  // invisible pour `tsc --noEmit`, le seul contrôle possible ici (le build local
  // échoue sur chemin UNC). `db.batch()` passe les requêtes en un seul appel,
  // que Neon exécute dans une transaction : la renumérotation est atomique ou
  // n'a pas lieu. Une liste à moitié renumérotée est un ordre d'affichage faux.
  const ecritures = ordonnes.map((c, i) =>
    db.update(schema.characterStoryChapters)
      .set({ ordre: i })
      .where(and(
        eq(schema.characterStoryChapters.id, c.id),
        eq(schema.characterStoryChapters.personnageId, personnageId),
      ))
  )
  await db.batch(ecritures as unknown as [(typeof ecritures)[number], ...typeof ecritures])

  rafraichir(personnageId)
  return { ok: true, message: sens < 0 ? 'Chapitre remonté' : 'Chapitre descendu' }
}

/**
 * Reprendre `characters.historique` comme premier chapitre.
 *
 * Le résumé de la fiche est souvent le seul texte qui existe déjà — le proposer
 * en un geste évite au joueur de le recopier à la main dans son histoire.
 * ⛔ Le champ de la fiche n'est PAS effacé : il reste le résumé court lu sur la
 * fiche, et un effacement serait irréversible pour celui qui se ravise.
 */
export async function reprendreHistoriqueFiche(personnageId: number): Promise<ResultatHistoire> {
  const db = getDb()
  const [personnage] = await db
    .select({ historique: schema.characters.historique })
    .from(schema.characters)
    .where(eq(schema.characters.id, personnageId))

  const texte = contenuChapitre(personnage?.historique)
  if (!texte) return { ok: false, message: 'La fiche ne porte aucun historique à reprendre.' }

  const [{ nb }] = await db
    .select({ nb: sql<number>`count(*)::int` })
    .from(schema.characterStoryChapters)
    .where(eq(schema.characterStoryChapters.personnageId, personnageId))

  // ⛔ Refusé dès qu'un chapitre existe : rejouer le geste deux fois créerait un
  // doublon du même texte, et c'est exactement ce qu'on fait quand un bouton ne
  // dit pas qu'il a déjà servi.
  if (nb > 0) return { ok: false, message: 'L’histoire contient déjà des chapitres.' }

  await db.insert(schema.characterStoryChapters).values({
    personnageId,
    titre: 'Historique'.slice(0, MAX_TITRE_CHAPITRE),
    contenu: texte,
    ordre: 0,
  })

  rafraichir(personnageId)
  return { ok: true, message: 'Historique de la fiche reprise en premier chapitre' }
}
