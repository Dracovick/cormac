'use client'

import { useState, useTransition } from 'react'
import { NotePleinePage } from '@/components/NotePleinePage'
import { RecitRendu } from '@/components/histoire/RecitRendu'
import { useSignatureJoueur } from '@/components/histoire/useSignatureJoueur'
import {
  ajouterChapitre,
  deplacerChapitre,
  modifierChapitre,
  reprendreHistoriqueFiche,
  retirerChapitre,
  type ResultatHistoire,
} from '@/app/actions/histoire'
import {
  MAX_CONTENU_CHAPITRE,
  MAX_TITRE_CHAPITRE,
  ancreChapitre,
  compteMots,
  dateCourte,
  deNom,
} from '@/lib/histoire'
import type { ChapitreHistoire } from '@/lib/queries/histoire'

/**
 * L'histoire d'un personnage, écrite par son joueur.
 *
 * André, le 2026-11-15 : « une section dans le grimoire pour l'histoire des
 * personnages… que le joueur pourrait écrire ».
 *
 * ⚠ Aucune liste en état local, comme dans `EquipementCourant` : les chapitres
 * viennent du serveur à chaque rendu et les actions appellent `revalidatePath`.
 * Une copie locale divergerait dès qu'un autre appareil touche la même histoire
 * — et une histoire s'écrit à plusieurs mains, sur des mois. Seul le chapitre en
 * cours d'écriture vit ici, le temps de la saisie.
 */

type Props = {
  personnageId: number
  nomPersonnage: string
  chapitres: ChapitreHistoire[]
  /** Le résumé de la fiche, s'il y en a un — proposé en premier chapitre. */
  historiqueFiche: string | null
}

const CHAMP = 'w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 text-stone-100 text-base sm:text-sm focus:outline-none focus:border-amber-600 placeholder:text-stone-600'
const BTN_ICONE = 'px-2 py-1 rounded border border-stone-700 text-stone-400 hover:text-amber-300 hover:border-amber-700 disabled:opacity-30 disabled:hover:text-stone-400 disabled:hover:border-stone-700 transition-colors text-xs min-h-[32px]'

type Brouillon = { titre: string; contenu: string }

export function HistoireClient({ personnageId, nomPersonnage, chapitres, historiqueFiche }: Props) {
  // null = personne n'écrit · 0 = nouveau chapitre · >0 = l'id d'un chapitre existant
  const [enEcriture, setEnEcriture] = useState<number | null>(null)
  const [brouillon, setBrouillon] = useState<Brouillon>({ titre: '', contenu: '' })
  const [plein, setPlein] = useState(false)
  const [message, setMessage] = useState<ResultatHistoire | null>(null)
  const [aSupprimer, setASupprimer] = useState<number | null>(null)
  const [signature, setSignature] = useSignatureJoueur()
  const [isPending, startTransition] = useTransition()

  function ouvrirNouveau() {
    setBrouillon({ titre: '', contenu: '' })
    setEnEcriture(0)
    setMessage(null)
  }

  function ouvrirChapitre(c: ChapitreHistoire) {
    setBrouillon({ titre: c.titre, contenu: c.contenu })
    setEnEcriture(c.id)
    setMessage(null)
  }

  function fermer() {
    setEnEcriture(null)
    setPlein(false)
    setBrouillon({ titre: '', contenu: '' })
  }

  function enregistrer() {
    if (!brouillon.titre.trim()) {
      setMessage({ ok: false, message: 'Donnez un titre au chapitre.' })
      // ⚠ La pleine page est refermée en même temps, sinon le message s'affiche
      // derrière elle et le joueur ne voit rien se passer.
      setPlein(false)
      return
    }
    const saisie = { ...brouillon, signature }
    startTransition(async () => {
      const r = enEcriture && enEcriture > 0
        ? await modifierChapitre(personnageId, enEcriture, saisie)
        : await ajouterChapitre(personnageId, saisie)
      setMessage(r)
      if (r.ok) fermer()
      else setPlein(false)
    })
  }

  function agir(action: () => Promise<ResultatHistoire>) {
    startTransition(async () => {
      setMessage(await action())
      setASupprimer(null)
    })
  }

  const ecrit = enEcriture !== null
  const chapitreEnCours = chapitres.find(c => c.id === enEcriture)

  return (
    <div className="space-y-6">
      {message && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-2 text-sm ${message.ok
            ? 'bg-emerald-900/20 border-emerald-800/50 text-emerald-300'
            : 'bg-red-900/20 border-red-800/50 text-red-300'}`}
        >
          {message.message}
        </div>
      )}

      {/* ── SOMMAIRE ── Dressé à partir des titres, comme sur une page de livre.
          Masqué sous deux chapitres : un sommaire d'une ligne n'aide personne. */}
      {chapitres.length > 1 && (
        <nav className="bg-stone-900/60 border border-stone-700/60 rounded-xl p-4">
          <div className="text-amber-500 text-xs uppercase tracking-wider mb-3">Sommaire</div>
          <ol className="space-y-1.5">
            {chapitres.map((c, i) => (
              <li key={c.id} className="flex items-baseline gap-2 text-sm">
                <span className="text-stone-600 tabular-nums w-5 shrink-0 text-right">{i + 1}.</span>
                <a href={`#${ancreChapitre(c.id)}`} className="text-stone-300 hover:text-amber-300 transition-colors">
                  {c.titre}
                </a>
                <span className="text-stone-700 text-xs ml-auto shrink-0 tabular-nums">
                  {compteMots(c.contenu)} mots
                </span>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* ── L'HISTOIRE, chapitre par chapitre ── */}
      {chapitres.length === 0 && !ecrit && (
        <div className="bg-stone-900/50 border border-stone-700/60 rounded-xl p-6 text-center space-y-4">
          <p className="text-stone-400 text-sm">
            L’histoire {deNom(nomPersonnage)} n’est pas encore écrite.
          </p>
          {historiqueFiche?.trim() && (
            <div className="space-y-2">
              <button
                onClick={() => agir(() => reprendreHistoriqueFiche(personnageId))}
                disabled={isPending}
                className="bg-stone-700/60 hover:bg-stone-600/70 border border-stone-600 text-stone-200 text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                ↩ Reprendre l’historique de la fiche comme premier chapitre
              </button>
              <p className="text-stone-600 text-xs">
                Le résumé reste sur la fiche — il est recopié, pas déplacé.
              </p>
            </div>
          )}
        </div>
      )}

      {chapitres.map((c, i) => (
        <article
          key={c.id}
          id={ancreChapitre(c.id)}
          // scroll-mt : les ancres du sommaire ne doivent pas coller le titre au
          // bord haut de l'écran, où l'en-tête collant le mangerait.
          className="scroll-mt-6 bg-stone-900/40 border border-stone-700/50 rounded-xl p-5 sm:p-6"
        >
          <header className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-stone-700/50">
            <div className="min-w-0">
              <div className="text-stone-600 text-xs uppercase tracking-wider mb-1">
                Chapitre {i + 1}
              </div>
              <h2 className="text-amber-300 text-xl font-semibold">{c.titre}</h2>
              <div className="text-stone-600 text-xs mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {c.signature && <span>écrit par {c.signature}</span>}
                {c.updatedAt && <span>revu le {dateCourte(c.updatedAt)}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => agir(() => deplacerChapitre(personnageId, c.id, -1))}
                disabled={isPending || i === 0}
                className={BTN_ICONE}
                title="Remonter ce chapitre"
              >↑</button>
              <button
                onClick={() => agir(() => deplacerChapitre(personnageId, c.id, 1))}
                disabled={isPending || i === chapitres.length - 1}
                className={BTN_ICONE}
                title="Descendre ce chapitre"
              >↓</button>
              <button
                onClick={() => ouvrirChapitre(c)}
                disabled={isPending}
                className="px-3 py-1 rounded border border-amber-800/60 text-amber-300 hover:bg-amber-900/30 transition-colors text-xs min-h-[32px]"
              >✏️ Écrire</button>
              <button
                onClick={() => { setASupprimer(c.id); setMessage(null) }}
                disabled={isPending}
                className={BTN_ICONE}
                title="Retirer ce chapitre"
              >🗑</button>
            </div>
          </header>

          {/* Suppression confirmée sur place : un chapitre peut porter des heures
              d'écriture, et rien ne le sauvegarde ailleurs. */}
          {aSupprimer === c.id && (
            <div className="mb-4 bg-red-950/30 border border-red-800/50 rounded-lg p-3 flex flex-wrap items-center gap-3">
              <span className="text-red-200 text-sm">
                Retirer « {c.titre} » ? Ce texte n’est sauvegardé nulle part ailleurs.
              </span>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => agir(() => retirerChapitre(personnageId, c.id))}
                  disabled={isPending}
                  className="bg-red-800 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                >Retirer</button>
                <button
                  onClick={() => setASupprimer(null)}
                  className="text-stone-400 hover:text-stone-200 text-xs px-3 py-1.5 transition-colors"
                >Annuler</button>
              </div>
            </div>
          )}

          {enEcriture === c.id
            ? <Editeur
                brouillon={brouillon}
                setBrouillon={setBrouillon}
                onEnregistrer={enregistrer}
                onAnnuler={fermer}
                onPleinePage={() => setPlein(true)}
                isPending={isPending}
              />
            : <RecitRendu contenu={c.contenu} />}
        </article>
      ))}

      {/* ── AJOUTER ── */}
      {enEcriture === 0 ? (
        <article className="bg-stone-900/40 border border-amber-800/40 rounded-xl p-5 sm:p-6">
          <div className="text-amber-500 text-xs uppercase tracking-wider mb-4">Nouveau chapitre</div>
          <Editeur
            brouillon={brouillon}
            setBrouillon={setBrouillon}
            onEnregistrer={enregistrer}
            onAnnuler={fermer}
            onPleinePage={() => setPlein(true)}
            isPending={isPending}
          />
        </article>
      ) : (
        <button
          onClick={ouvrirNouveau}
          disabled={isPending || ecrit}
          className="w-full border-2 border-dashed border-stone-700 hover:border-amber-700/60 text-stone-500 hover:text-amber-400 rounded-xl py-4 transition-colors disabled:opacity-40"
        >
          <span className="text-xl align-middle">+</span> Ajouter un chapitre
        </button>
      )}

      {/* ── SIGNATURE ── Retenue sur cet appareil, jamais demandée deux fois. */}
      <div className="bg-stone-900/30 border border-stone-800 rounded-xl p-4">
        <label className="block">
          <span className="block text-stone-500 text-xs mb-1.5">
            Signer mes chapitres (facultatif) — retenu sur cet appareil
          </span>
          <input
            className={CHAMP + ' max-w-xs'}
            value={signature}
            onChange={e => setSignature(e.target.value)}
            placeholder="Prénom du joueur"
            maxLength={60}
          />
        </label>
        <p className="text-stone-600 text-xs mt-2">
          Le Grimoire n’a qu’un mot de passe, partagé : il ne sait pas qui écrit. Ce nom
          est une signature, pas une serrure.
        </p>
      </div>

      {/* ── PLEINE PAGE ── Même composant que la note d'aventure et la note du MJ.
          ⚠ maxLength explicite : le défaut du composant est 4 000 caractères, et
          un chapitre tronqué à la frappe serait perdu sans un mot. */}
      {plein && ecrit && (
        <NotePleinePage
          titre="📖 Écrire l’histoire"
          sousTitre={`${nomPersonnage} — ${brouillon.titre.trim() || chapitreEnCours?.titre || 'nouveau chapitre'}`}
          valeur={brouillon.contenu}
          onChange={contenu => setBrouillon(b => ({ ...b, contenu }))}
          onPublier={enregistrer}
          onReduire={() => setPlein(false)}
          publicationBloquee={isPending}
          maxLength={MAX_CONTENU_CHAPITRE}
          libellePublier="📖 Enregistrer"
          placeholder="Son village, sa famille, ce qui l'a mise sur la route… (Ctrl+Entrée pour enregistrer)"
        />
      )}
    </div>
  )
}

function Editeur({
  brouillon, setBrouillon, onEnregistrer, onAnnuler, onPleinePage, isPending,
}: {
  brouillon: Brouillon
  setBrouillon: (f: (b: Brouillon) => Brouillon) => void
  onEnregistrer: () => void
  onAnnuler: () => void
  onPleinePage: () => void
  isPending: boolean
}) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="block text-stone-500 text-xs mb-1">Titre du chapitre</span>
        <input
          className={CHAMP}
          value={brouillon.titre}
          onChange={e => setBrouillon(b => ({ ...b, titre: e.target.value }))}
          placeholder="Fonteclaire, et le pays qui ne retient personne"
          maxLength={MAX_TITRE_CHAPITRE}
          // ⛔ Pas d'Échap qui annule ici, contrairement aux lignes d'équipement :
          // on perdrait un texte long d'une frappe malheureuse.
          onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
        />
      </label>

      <label className="block">
        <span className="flex items-baseline justify-between text-stone-500 text-xs mb-1">
          <span>Le récit</span>
          <button
            type="button"
            onClick={onPleinePage}
            className="text-amber-500 hover:text-amber-300 transition-colors"
            title="Écrire sur tout l’écran — pensé pour l’Apple Pencil"
          >⤢ Pleine page</button>
        </span>
        <textarea
          rows={12}
          className={CHAMP + ' resize-y leading-relaxed'}
          value={brouillon.contenu}
          onChange={e => setBrouillon(b => ({ ...b, contenu: e.target.value }))}
          maxLength={MAX_CONTENU_CHAPITRE}
          placeholder={'Du texte libre.\n\nUne ligne vide sépare deux paragraphes.\n### Un intertitre\n> Une réplique\n- Une liste\n**Du gras**, *de l’italique*.'}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onEnregistrer}
          disabled={isPending || !brouillon.titre.trim()}
          className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          {isPending ? 'Enregistrement…' : '📖 Enregistrer'}
        </button>
        <button
          onClick={onAnnuler}
          disabled={isPending}
          className="text-stone-500 hover:text-stone-300 text-xs px-3 py-2 transition-colors"
        >Annuler</button>
        <span className={`ml-auto text-xs tabular-nums ${brouillon.contenu.length >= MAX_CONTENU_CHAPITRE - 500 ? 'text-amber-400' : 'text-stone-600'}`}>
          {brouillon.contenu.length} / {MAX_CONTENU_CHAPITRE}
        </span>
      </div>
    </div>
  )
}
