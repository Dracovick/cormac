'use server'

// ─── Équipement courant : édition EN PLACE, depuis la fiche ───────────────────
// André, le 2026-11-12 : « j'aimerais que cette section soit modifiable tant du
// côté de la page de modification que directement dans la page du personnage. »
//
// Le formulaire de modification REMPLACE la liste entière (voir le bloc 15c de
// `saveCharacter`). Ces actions-ci touchent UNE ligne à la fois, par son id, et
// ne réécrivent rien d'autre : c'est ce qu'il faut en pleine partie, quand on
// coche deux rations de moins sans vouloir risquer le reste de la fiche.
//
// ⛔ Aucune entrée au journal de partie, délibérément. Le journal est la
// chronique de ce qui se JOUE — points de vie, sorts, potions bues, butin
// encaissé. Inscrire la corde qu'on avait oublié de noter est de la tenue de
// fiche : une ligne « +1 corde de chanvre » par objet noyerait le journal du MJ
// sous du bruit. Si André veut la trace, le type 'butin' existe déjà.
//
// ⚠ Les garde-fous de saisie (bornes, virgule décimale, `null` qui reste `null`)
// vivent dans `@/lib/equipement` : un fichier 'use server' ne peut exporter que
// des fonctions async, donc ils y seraient intestables — et les trois écrans qui
// parlent d'équipement doivent appliquer les mêmes.
//
// ⚠ Chaque action porte `personnageId` EN PLUS de l'id de la ligne, et le `where`
// vérifie les deux. L'id vient du navigateur : sans ce garde-fou, un identifiant
// erroné modifierait l'équipement d'un autre personnage sans le moindre bruit.

import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { valeursEquipement, type SaisieEquipement } from '@/lib/equipement'

export type ResultatEquipement = { ok: boolean; message: string }

export async function ajouterEquipement(
  personnageId: number,
  ligne: SaisieEquipement
): Promise<ResultatEquipement> {
  const valeurs = valeursEquipement(ligne)
  if (!valeurs.nom) return { ok: false, message: 'Nommez l’objet.' }

  await getDb().insert(schema.characterEquipment).values({ personnageId, ...valeurs })
  revalidatePath(`/personnage/${personnageId}`)
  return {
    ok: true,
    message: `${valeurs.nom}${valeurs.quantite > 1 ? ` ×${valeurs.quantite}` : ''} ajouté à l’équipement`,
  }
}

export async function modifierEquipement(
  personnageId: number,
  ligneId: number,
  ligne: SaisieEquipement
): Promise<ResultatEquipement> {
  const valeurs = valeursEquipement(ligne)
  if (!valeurs.nom) return { ok: false, message: 'Nommez l’objet.' }

  const modifiees = await getDb()
    .update(schema.characterEquipment)
    .set(valeurs)
    .where(and(
      eq(schema.characterEquipment.id, ligneId),
      eq(schema.characterEquipment.personnageId, personnageId),
    ))
    .returning({ id: schema.characterEquipment.id })

  if (modifiees.length === 0) return { ok: false, message: 'Cette ligne n’existe plus.' }
  revalidatePath(`/personnage/${personnageId}`)
  return { ok: true, message: `${valeurs.nom} modifié` }
}

export async function retirerEquipement(
  personnageId: number,
  ligneId: number
): Promise<ResultatEquipement> {
  const retirees = await getDb()
    .delete(schema.characterEquipment)
    .where(and(
      eq(schema.characterEquipment.id, ligneId),
      eq(schema.characterEquipment.personnageId, personnageId),
    ))
    .returning({ nom: schema.characterEquipment.nom })

  if (retirees.length === 0) return { ok: false, message: 'Cette ligne n’existe plus.' }
  revalidatePath(`/personnage/${personnageId}`)
  return { ok: true, message: `${retirees[0].nom} retiré` }
}
