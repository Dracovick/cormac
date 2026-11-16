'use client'

import { useState, useTransition } from 'react'
import { ouvrirPartage, revoquerPartage } from '@/app/actions/partage'
import { cheminPartage } from '@/lib/partage'

/**
 * PARTAGER L'HISTOIRE — fabriquer le lien, le copier, le couper.
 *
 * André, le 2026-11-16 : « J'ai besoin d'être capable de partager l'histoire.
 * Lorsque je copie le lien de la page ce lien amène à l'accueil du site. »
 *
 * Deux liens existent désormais, et ce bloc dit lequel sert à quoi :
 *   - l'adresse de cette page, pour les JOUEURS — elle demande le mot de passe
 *     et, depuis aujourd'hui, ramène ici après l'avoir donné;
 *   - l'adresse à jeton, pour TOUT LE MONDE — lecture seule, sans mot de passe,
 *     révocable.
 *
 * ⚠ L'adresse affichée est bâtie sur `window.location.origin`, jamais sur un
 * nom de domaine écrit en dur : le Grimoire répond sur `dracovick.com`,
 * `www.dracovick.com` ET `cormac-two.vercel.app`, et un lien collé depuis la
 * mauvaise origine ferait un aller-retour de redirection chez le destinataire.
 */
export function PartageHistoire({
  personnageId,
  jetonInitial,
}: {
  personnageId: number
  jetonInitial: string | null
}) {
  const [jeton, setJeton] = useState(jetonInitial)
  const [deplie, setDeplie] = useState(false)
  const [copie, setCopie] = useState(false)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  // Rendu côté serveur, `window` n'existe pas : l'adresse complète ne se calcule
  // qu'au premier rendu client. Le chemin, lui, est toujours affichable.
  const adresse = (j: string) =>
    typeof window === 'undefined' ? cheminPartage(j) : `${window.location.origin}${cheminPartage(j)}`

  function creer() {
    setMessage('')
    startTransition(async () => {
      const r = await ouvrirPartage(personnageId)
      if (!r.ok || !r.chemin) { setMessage(r.message); return }
      setJeton(r.chemin.split('/').pop() ?? null)
      setDeplie(true)
    })
  }

  function couper() {
    // ⚠ Une confirmation, parce que c'est irréversible : le jeton est effacé,
    // pas désactivé, et l'ancienne adresse ne répondra plus jamais.
    if (!window.confirm('Couper ce lien ? Celui à qui vous l’avez donné perdra l’accès, et un nouveau partage donnera une autre adresse.')) return
    setMessage('')
    startTransition(async () => {
      const r = await revoquerPartage(personnageId)
      setMessage(r.message)
      if (r.ok) { setJeton(null); setCopie(false) }
    })
  }

  async function copier() {
    if (!jeton) return
    try {
      await navigator.clipboard.writeText(adresse(jeton))
      setCopie(true)
      setMessage('')
    } catch {
      // Le presse-papier est refusé hors contexte sécurisé et dans certains
      // navigateurs intégrés. Le champ reste sélectionnable à la main — on le
      // dit, au lieu de laisser croire que la copie a eu lieu.
      setMessage('Copie refusée par le navigateur — sélectionnez l’adresse ci-dessous.')
    }
  }

  return (
    <div className="bg-stone-900/60 border border-stone-700/60 rounded-xl p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => (jeton ? setDeplie(d => !d) : creer())}
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-amber-900/40 hover:bg-amber-800/50 border border-amber-800/50 text-amber-200 text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50 min-h-[40px]"
        >
          🔗 {jeton ? (deplie ? 'Masquer le lien de partage' : 'Voir le lien de partage') : 'Partager cette histoire'}
        </button>
        <span className="text-stone-500 text-xs">
          {jeton
            ? 'Un lien de lecture circule pour cette histoire.'
            : 'Crée une adresse de lecture seule, ouvrable sans mot de passe.'}
        </span>
      </div>

      {message && <p className="text-amber-400/90 text-xs mt-3">{message}</p>}

      {jeton && deplie && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-stone-500 text-xs uppercase tracking-wider mb-1.5">
              Adresse de lecture — sans mot de passe
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                readOnly
                value={adresse(jeton)}
                onFocus={e => e.currentTarget.select()}
                className="flex-1 min-w-0 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-300 text-xs sm:text-sm font-mono"
              />
              <button
                onClick={copier}
                className="bg-stone-700/60 hover:bg-stone-600/70 border border-stone-600 text-stone-200 text-sm px-3 py-2 rounded-lg transition-colors min-h-[40px]"
              >
                {copie ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          </div>

          <p className="text-stone-500 text-xs leading-relaxed">
            Qui ouvre cette adresse lit l’histoire et peut en sortir le PDF.
            Il ne voit <strong className="text-stone-400">ni la fiche, ni les chiffres, ni le reste du
            Grimoire</strong>, et ne peut rien écrire.
          </p>

          <button
            onClick={couper}
            disabled={isPending}
            className="text-red-400/80 hover:text-red-300 text-xs underline underline-offset-2 disabled:opacity-50"
          >
            Couper ce lien
          </button>
        </div>
      )}
    </div>
  )
}
