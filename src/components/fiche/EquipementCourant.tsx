'use client'

import { useState, useTransition } from 'react'
import {
  ajouterEquipement,
  modifierEquipement,
  retirerEquipement,
  type ResultatEquipement,
} from '@/app/actions/equipement'
import { UNITES_MONNAIE, uniteCourte } from '@/lib/dnd35/monnaie'
import { nombreLisible, poidsEquipement, poidsLotEquipement } from '@/lib/equipement'

/**
 * L'équipement courant, modifiable SANS QUITTER LA FICHE.
 *
 * André, le 2026-11-12 : « j'aimerais que cette section soit modifiable tant du
 * côté de la page de modification que directement dans la page du personnage. »
 *
 * ⚠ Aucune liste en état local, et c'est volontaire : les lignes viennent du
 * serveur à chaque rendu, et les actions appellent `revalidatePath`. Garder une
 * copie ici la ferait diverger de la base dès qu'une autre fenêtre — ou le
 * formulaire de modification — touche la même fiche. Seule la ligne en cours
 * d'édition vit en local, le temps de la saisie.
 *
 * ⛔ `poids` et `valeur` restent `null` tant que personne ne les a saisis. Un
 * champ vide s'affiche vide, jamais « 0 kg » : la charge portée ne doit pas
 * compter un objet non pesé comme un objet sans poids.
 */

export type LigneEquipementVue = {
  id: number
  nom: string
  quantite: number
  emplacement: string
  valeur: number | null
  unite: string
  poids: number | null
  notes: string
}

type Props = { personnageId: number; lignes: LigneEquipementVue[] }

const CHAMP = 'w-full bg-stone-900 border border-stone-600 rounded px-2 py-1.5 text-stone-100 text-base sm:text-sm focus:outline-none focus:border-amber-600 placeholder:text-stone-600'

/** Champs d'un brouillon : tout en texte, pour que « vide » reste vide. */
type Brouillon = { nom: string; quantite: string; emplacement: string; valeur: string; unite: string; poids: string; notes: string }

const VIDE: Brouillon = { nom: '', quantite: '1', emplacement: '', valeur: '', unite: 'po', poids: '', notes: '' }

function brouillonDe(l: LigneEquipementVue): Brouillon {
  return {
    nom: l.nom,
    quantite: String(l.quantite ?? 1),
    emplacement: l.emplacement ?? '',
    valeur: l.valeur != null ? String(l.valeur) : '',
    unite: l.unite || 'po',
    poids: l.poids != null ? String(l.poids) : '',
    notes: l.notes ?? '',
  }
}

/** « 1,5 » comme « 1.5 » : on tape à la virgule au Québec. `''` ⇒ null. */
function nombreOuNull(v: string): number | null {
  const t = v.replace(',', '.').trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function Etiquette({ children }: { children: React.ReactNode }) {
  return <span className="block text-stone-500 text-xs mb-1">{children}</span>
}

function Formulaire({
  brouillon, setBrouillon, onValider, onAnnuler, isPending, libelleValider,
}: {
  brouillon: Brouillon
  setBrouillon: (b: Brouillon) => void
  onValider: () => void
  onAnnuler: () => void
  isPending: boolean
  libelleValider: string
}) {
  const set = (k: keyof Brouillon, v: string) => setBrouillon({ ...brouillon, [k]: v })
  // Entrée valide, Échap annule — on saisit souvent trois objets d'affilée.
  const touches = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onValider() }
    if (e.key === 'Escape') { e.preventDefault(); onAnnuler() }
  }

  return (
    <div className="bg-stone-800/60 border border-amber-900/40 rounded p-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <label className="flex-1 min-w-[12rem]">
          <Etiquette>Objet</Etiquette>
          <input
            autoFocus
            value={brouillon.nom}
            onChange={e => set('nom', e.target.value)}
            onKeyDown={touches}
            placeholder="Corde de chanvre (15 m)"
            className={CHAMP}
          />
        </label>
        <label className="w-20">
          <Etiquette>Qté</Etiquette>
          <input
            type="text" inputMode="numeric" value={brouillon.quantite}
            onChange={e => set('quantite', e.target.value)} onKeyDown={touches} className={CHAMP}
          />
        </label>
        <label className="w-32">
          <Etiquette>Poids (kg)</Etiquette>
          <input
            type="text" inputMode="decimal" value={brouillon.poids}
            onChange={e => set('poids', e.target.value)} onKeyDown={touches}
            placeholder="—" className={CHAMP}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="flex-1 min-w-[10rem]">
          <Etiquette>Localisation</Etiquette>
          <input
            value={brouillon.emplacement}
            onChange={e => set('emplacement', e.target.value)} onKeyDown={touches}
            placeholder="sac à dos" className={CHAMP}
          />
        </label>
        <label className="w-24">
          <Etiquette>Valeur</Etiquette>
          <input
            type="text" inputMode="decimal" value={brouillon.valeur}
            onChange={e => set('valeur', e.target.value)} onKeyDown={touches}
            placeholder="—" className={CHAMP}
          />
        </label>
        <label className="w-24">
          <Etiquette>Unité</Etiquette>
          <select
            value={brouillon.unite}
            onChange={e => set('unite', e.target.value)}
            className={CHAMP + ' [color-scheme:dark]'}
          >
            {UNITES_MONNAIE.map(u => <option key={u.code} value={u.code}>{u.label}</option>)}
          </select>
        </label>
      </div>
      <label className="block">
        <Etiquette>Note</Etiquette>
        <input
          value={brouillon.notes}
          onChange={e => set('notes', e.target.value)} onKeyDown={touches}
          placeholder="Trouvée dans la crypte" className={CHAMP}
        />
      </label>
      <p className="text-stone-600 text-xs leading-snug">
        Poids et valeur s&apos;entendent <strong>à la pièce</strong>; laissés vides, ils ne
        comptent nulle part — mieux vaut rien qu&apos;un zéro inventé. Seul le poids
        <strong> saisi</strong> entre dans la charge portée.
      </p>
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onValider}
          disabled={isPending || !brouillon.nom.trim()}
          className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
        >
          {isPending ? 'Enregistrement…' : libelleValider}
        </button>
        <button
          onClick={onAnnuler}
          className="text-stone-500 hover:text-stone-300 text-xs px-3 py-1.5 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

export function EquipementCourant({ personnageId, lignes }: Props) {
  const [isPending, startTransition] = useTransition()
  const [resultat, setResultat] = useState<ResultatEquipement | null>(null)
  /** id de la ligne en édition, ou 'ajout' pour la ligne neuve. */
  const [mode, setMode] = useState<number | 'ajout' | null>(null)
  const [brouillon, setBrouillon] = useState<Brouillon>(VIDE)

  function ouvrirAjout() {
    setBrouillon(VIDE); setMode('ajout'); setResultat(null)
  }

  function ouvrirEdition(l: LigneEquipementVue) {
    setBrouillon(brouillonDe(l)); setMode(l.id); setResultat(null)
  }

  function fermer() { setMode(null); setBrouillon(VIDE) }

  function valeursEnvoyees() {
    const q = parseInt(brouillon.quantite.replace(/\D/g, ''), 10)
    return {
      nom: brouillon.nom,
      quantite: Number.isFinite(q) && q > 0 ? q : 1,
      emplacement: brouillon.emplacement,
      valeur: nombreOuNull(brouillon.valeur),
      unite: brouillon.unite,
      poids: nombreOuNull(brouillon.poids),
      notes: brouillon.notes,
    }
  }

  function enregistrer() {
    const valeurs = valeursEnvoyees()
    startTransition(async () => {
      const r = mode === 'ajout'
        ? await ajouterEquipement(personnageId, valeurs)
        : await modifierEquipement(personnageId, mode as number, valeurs)
      setResultat(r)
      // ⚠ On ne referme QUE sur succès : refermer sur un refus ferait disparaître
      // la saisie en même temps que le message qui explique pourquoi.
      if (r.ok) {
        if (mode === 'ajout') setBrouillon(VIDE)
        else fermer()
      }
    })
  }

  function retirer(l: LigneEquipementVue) {
    startTransition(async () => {
      setResultat(await retirerEquipement(personnageId, l.id))
      if (mode === l.id) fermer()
    })
  }

  // Sous-totaux : seules les lignes CHIFFRÉES y entrent, et le compte des autres
  // est affiché — un total muet sur ce qu'il n'a pas pesé est un total qui ment.
  const { total: poidsTotal, nonPesees } = poidsEquipement(lignes)

  return (
    <div className="space-y-2">
      {lignes.length === 0 && mode !== 'ajout' && (
        <p className="text-stone-600 text-sm italic">
          Rien d&apos;inscrit — corde, miroir, outils de voleur, rations, torches…
        </p>
      )}

      {lignes.map(l => (
        mode === l.id ? (
          <Formulaire
            key={l.id}
            brouillon={brouillon}
            setBrouillon={setBrouillon}
            onValider={enregistrer}
            onAnnuler={fermer}
            isPending={isPending}
            libelleValider="Enregistrer"
          />
        ) : (
          <div
            key={l.id}
            className="group flex items-baseline gap-2 py-1 border-b border-stone-800 last:border-0"
          >
            <div className="flex-1 min-w-0">
              <button
                onClick={() => ouvrirEdition(l)}
                className="text-left text-stone-200 text-sm hover:text-amber-300 transition-colors cursor-pointer"
                title="Modifier cette ligne sans quitter la fiche"
              >
                {l.nom}
                {(l.quantite ?? 1) > 1 && <span className="text-amber-300"> ×{l.quantite}</span>}
                <span className="text-stone-700 group-hover:text-stone-500 text-xs ml-1.5">✎</span>
              </button>
              {l.emplacement && <span className="text-stone-600 text-xs ml-2">{l.emplacement}</span>}
              {l.notes && <p className="text-amber-600 text-xs italic mt-0.5">{l.notes}</p>}
            </div>
            <div className="shrink-0 text-right text-xs space-x-2 whitespace-nowrap">
              {l.poids != null && (
                <span className="text-stone-500" title={(l.quantite ?? 1) > 1 ? `${nombreLisible(l.poids)} kg la pièce` : undefined}>
                  {nombreLisible(poidsLotEquipement(l))} kg
                </span>
              )}
              {l.valeur != null && (
                <span className="text-stone-500" title={(l.quantite ?? 1) > 1 ? 'prix à la pièce' : undefined}>
                  {nombreLisible(l.valeur)} {uniteCourte(l.unite || 'po')}
                </span>
              )}
              <button
                onClick={() => retirer(l)}
                disabled={isPending}
                className="text-stone-700 hover:text-red-400 disabled:opacity-40 transition-colors"
                title="Retirer cette ligne"
              >✕</button>
            </div>
          </div>
        )
      ))}

      {mode === 'ajout' ? (
        <Formulaire
          brouillon={brouillon}
          setBrouillon={setBrouillon}
          onValider={enregistrer}
          onAnnuler={fermer}
          isPending={isPending}
          libelleValider="➕ Ajouter"
        />
      ) : (
        <button
          onClick={ouvrirAjout}
          className="text-xs rounded px-2 py-1 border bg-stone-800/80 hover:bg-stone-700 border-stone-600 hover:border-amber-700 text-stone-300 hover:text-amber-300 transition-all cursor-pointer"
          title="Inscrire un objet d'équipement sans quitter la fiche"
        >
          ➕ Ajouter un objet
        </button>
      )}

      {resultat && (
        <p className={`text-xs ${resultat.ok ? 'text-green-400' : 'text-red-400'}`}>{resultat.message}</p>
      )}

      {lignes.length > 0 && (
        <div className="text-stone-600 text-xs pt-1 border-t border-stone-800">
          {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
          {poidsTotal > 0 && <> · <span className="text-stone-500">{nombreLisible(poidsTotal)} kg</span></>}
          {nonPesees > 0 && <> · {nonPesees} non pesée{nonPesees > 1 ? 's' : ''}</>}
        </div>
      )}
    </div>
  )
}
