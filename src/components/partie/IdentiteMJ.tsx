'use client'

import { useState, useSyncExternalStore } from 'react'

export const CLE_MJ = 'cormac.mj'

/** Lit le Maître de jeu mémorisé sur cet appareil. '' si aucun. */
function lireStockage(): string {
  try {
    return (window.localStorage.getItem(CLE_MJ) ?? '').slice(0, 60)
  } catch {
    return '' // navigation privée, stockage refusé — on joue quand même, sans signature
  }
}

// ── Le nom du MJ, vu comme une source extérieure à React ─────────────────────
// localStorage n'est pas un état React : il survit au rechargement, il est partagé
// entre les onglets, et le serveur ne le connaît pas. useSyncExternalStore est fait
// pour ça — et il évite le piège du `useEffect` qui appelle `setState` au montage,
// qui provoque un rendu en cascade (règle react-hooks/set-state-in-effect).
let instantane: string | null = null
const abonnes = new Set<() => void>()

function prevenir() {
  instantane = null // force une relecture au prochain rendu
  for (const f of abonnes) f()
}

function sAbonner(ecouter: () => void) {
  abonnes.add(ecouter)
  // Deux onglets ouverts sur /partie (l'iPad et le portable du MJ) restent d'accord :
  // l'événement `storage` arrive dans les AUTRES onglets, pas dans celui qui écrit.
  if (abonnes.size === 1) window.addEventListener('storage', prevenir)
  return () => {
    abonnes.delete(ecouter)
    if (abonnes.size === 0) window.removeEventListener('storage', prevenir)
  }
}

function lireInstantane(): string {
  if (instantane === null) instantane = lireStockage()
  return instantane
}

// ⚠ null, et pas '' : le serveur ne SAIT PAS qui mène la partie, ce qui n'est pas la
// même chose que « personne ». Sans cette distinction, le formulaire d'identification
// s'afficherait une fraction de seconde à chaque chargement, même pour un MJ connu.
const lireInstantaneServeur = (): string | null => null

/** Le Maître de jeu de cet appareil. `null` tant que le navigateur n'a pas répondu. */
export function useMaitreDeJeu(): [string | null, (nom: string) => void] {
  const mj = useSyncExternalStore(sAbonner, lireInstantane, lireInstantaneServeur)
  return [mj, definirMj]
}

function definirMj(nom: string) {
  try {
    if (nom) window.localStorage.setItem(CLE_MJ, nom)
    else window.localStorage.removeItem(CLE_MJ)
  } catch {
    /* stockage refusé : le nom ne survivra pas au rechargement, mais la séance tient */
  }
  prevenir()
}

/**
 * Qui mène la partie — demandé par André le 2026-11-09 : « Comme nous sommes
 * plusieurs maîtres de Donjons à mener des parties avec le Grimoire, il faudrait un
 * champ pour s'identifier dans le journal du Maître. »
 *
 * ⛔ Le nom est mémorisé sur L'APPAREIL, pas en base et pas dans un réglage global du
 * site : chaque MJ a sa tablette, et deux MJ qui mènent la même semaine ne doivent pas
 * se marcher sur les pieds. Il n'y a donc rien à « changer d'utilisateur » en début de
 * séance — la tablette se souvient de son maître.
 *
 * ⚠ Jamais bloquant. Sans nom, les entrées partent quand même, non signées : en pleine
 * partie, un champ obligatoire qui refuse une note du MJ serait pire que l'anonymat.
 * L'écran invite, il n'exige pas.
 */
export function IdentiteMJ({
  mj,
  onChange,
  maitres,
}: {
  mj: string | null
  onChange: (nom: string) => void
  maitres: string[]
}) {
  // Le champ est ouvert quand le MJ le demande (✎) ou quand personne n'est identifié
  // sur cet appareil. Dérivé plutôt que stocké : un état à synchroniser avec `mj`
  // demanderait un effet, donc un rendu de plus et une vérité en double.
  const [demande, setDemande] = useState(false)
  const [brouillon, setBrouillon] = useState('')
  const edition = demande || mj === ''

  function valider(nom: string) {
    const propre = nom.replace(/\s+/g, ' ').trim().slice(0, 60)
    onChange(propre)
    setBrouillon(propre)
    if (propre) setDemande(false)
  }

  // Tant que le navigateur n'a pas répondu, on ne montre rien : ni un formulaire qui
  // va se refermer, ni un nom qui n'est pas encore le bon.
  if (mj === null) return <div className="mb-2 h-6" />

  if (!edition) {
    return (
      <div className="flex items-center gap-2 mb-2">
        <span className="text-stone-600 text-xs uppercase tracking-wide">Maître de jeu :</span>
        <span className="text-xs bg-amber-900/40 text-amber-200 border border-amber-700/60 rounded-full px-2.5 py-0.5">
          🎩 {mj}
        </span>
        <button
          onClick={() => { setBrouillon(mj); setDemande(true) }}
          className="text-stone-500 hover:text-amber-300 active:text-amber-300 text-xs px-1.5 py-0.5 transition-colors"
          title="Changer de Maître de jeu sur cet appareil"
        >✎ changer</button>
      </div>
    )
  }

  // Les autres MJ déjà passés par le journal, en raccourci tactile : à la table, une
  // pastille se touche mieux qu'une liste déroulante, et elle évite qu'« André » et
  // « Andre » deviennent deux maîtres de jeu différents.
  const autres = maitres.filter(m => m !== mj).slice(0, 5)

  return (
    <div className={`mb-3 rounded-lg p-3 bg-stone-900/80 border ${mj ? 'border-stone-700' : 'border-amber-800/60'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="champ-mj" className="text-amber-300 text-sm font-semibold shrink-0">
          🎩 Maître de jeu
        </label>
        <input
          id="champ-mj"
          type="text"
          list="mjs-connus"
          value={brouillon}
          onChange={e => setBrouillon(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); valider(brouillon) } }}
          maxLength={60}
          placeholder="Votre nom — ex. André"
          autoComplete="off"
          className="flex-1 min-w-[10rem] bg-stone-950 border border-stone-700 rounded px-3 py-1.5 text-stone-200 text-base placeholder:text-stone-600 focus:outline-none focus:border-amber-600"
        />
        <datalist id="mjs-connus">
          {maitres.map(m => <option key={m} value={m} />)}
        </datalist>
        <button
          onClick={() => valider(brouillon)}
          disabled={!brouillon.trim()}
          className="text-sm bg-amber-900/40 hover:bg-amber-800/60 disabled:opacity-40 border border-amber-800/50 text-amber-300 rounded px-3 py-1.5 transition-colors shrink-0"
        >
          C&apos;est moi
        </button>
        {mj && (
          <button
            onClick={() => setDemande(false)}
            className="text-sm text-stone-400 hover:text-stone-200 px-2 py-1.5 transition-colors shrink-0"
          >
            Annuler
          </button>
        )}
      </div>

      {autres.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-stone-600 text-xs">Déjà au journal :</span>
          {autres.map(m => (
            <button
              key={m}
              onClick={() => valider(m)}
              className="text-xs bg-stone-800/80 text-stone-300 border border-stone-700 hover:border-amber-700/60 hover:text-amber-200 rounded-full px-2 py-0.5 transition-colors"
              title={`S'identifier comme ${m}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      <div className="text-stone-600 text-xs mt-2">
        Signe vos notes, vos ordres d&apos;initiative, vos bilans de combat, vos photos et vos distributions d&apos;XP.
        Retenu sur cet appareil — vous ne le retaperez pas la prochaine fois.
        {!mj && <span className="text-amber-600/90"> Sans nom, vos entrées restent anonymes.</span>}
      </div>
    </div>
  )
}
