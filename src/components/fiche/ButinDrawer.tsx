'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { ajouterButin, type TypeButin } from '@/app/actions/butin'
import type { PotionRef } from '@/app/actions/character'
import { UNITES_MONNAIE } from '@/lib/dnd35/monnaie'
import { ChampRechercheNom } from '@/components/ChampRechercheNom'

type Props = { personnageId: number; nomPersonnage: string; potionsCatalogue?: PotionRef[] }

const ONGLETS: { code: TypeButin; libelle: string; icone: string }[] = [
  { code: 'monnaie', libelle: 'Monnaie', icone: '🪙' },
  { code: 'gemme', libelle: 'Gemmes', icone: '💎' },
  { code: 'potion', libelle: 'Potions', icone: '🧪' },
  { code: 'objet', libelle: 'Objets magiques', icone: '🔮' },
  { code: 'arme', libelle: 'Armes', icone: '🗡️' },
]

// Champs vierges — un seul état pour tout le panneau : passer d'un onglet à
// l'autre ne perd rien, et un ajout ne vide que l'onglet qui vient de servir.
const VIDE = {
  montant: '',
  uniteMonnaie: 'po',
  gemNom: '',
  gemQuantite: '1',
  gemValeur: '',
  gemUnite: 'po',
  potNom: '',
  potEffet: '',
  potDoses: '1',
  objNom: '',
  objEmplacement: '',
  objCharges: '',
  armeNom: '',
  armeDegats: '',
  armeBonus: '0',
  armeQuantite: '1',
  note: '',
}

// Classes partagées — 16 px minimum sur mobile (text-base), sinon iOS Safari
// zoome tout seul dès qu'on touche un champ.
const CHAMP =
  'w-full bg-stone-900 border border-stone-700 rounded px-2 py-2 text-base sm:text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-600'

function Etiquette({ children }: { children: React.ReactNode }) {
  return <span className="block text-stone-500 text-xs mb-1">{children}</span>
}

/**
 * Tiroir « 💰 Butin » — encaisser un trésor sans quitter la fiche.
 *
 * Pensé pour la table, pas pour la gestion : le panneau reste OUVERT après un
 * ajout (on vide rarement un coffre en un seul objet), les champs se vident,
 * Entrée ajoute et Échap ferme. Chaque ajout laisse une trace au journal de
 * partie, avec la note (« coffre du gobelin ») pour retrouver plus tard où le
 * trésor a été trouvé.
 */
export function ButinDrawer({ personnageId, nomPersonnage, potionsCatalogue = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [onglet, setOnglet] = useState<TypeButin>('monnaie')
  const [v, setV] = useState(VIDE)
  const [message, setMessage] = useState<string | null>(null)
  const [avis, setAvis] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const premierChamp = useRef<HTMLInputElement>(null)

  function maj(champ: keyof typeof VIDE, valeur: string) {
    setV(prev => ({ ...prev, [champ]: valeur }))
  }

  // Échap ferme le tiroir, où que soit le curseur.
  useEffect(() => {
    if (!open) return
    function surTouche(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', surTouche)
    return () => document.removeEventListener('keydown', surTouche)
  }, [open])

  // Le premier champ de l'onglet actif prend le curseur : à l'ouverture comme au
  // changement d'onglet, on peut taper tout de suite.
  useEffect(() => {
    if (open) premierChamp.current?.focus()
  }, [open, onglet])

  function fermer() {
    setOpen(false)
    setMessage(null)
    setAvis(null)
    setErreur(null)
  }

  function soumettre(e?: React.FormEvent) {
    e?.preventDefault()
    if (isPending) return
    setErreur(null)

    const entree = construireEntree()
    if (!entree) return

    startTransition(async () => {
      const res = await ajouterButin(personnageId, entree)
      if (!res.ok) {
        setErreur(res.message)
        setMessage(null)
        setAvis(null)
        return
      }
      setMessage(res.message)
      setAvis(res.avis ?? null)
      viderOngletCourant()
      premierChamp.current?.focus()
    })
  }

  function construireEntree() {
    const note = v.note.trim() || undefined
    switch (onglet) {
      case 'monnaie': {
        const montant = parseFloat(v.montant.replace(',', '.'))
        if (!Number.isFinite(montant) || montant <= 0) {
          setErreur('Entrez un montant positif.')
          return null
        }
        return { type: 'monnaie' as const, montant, unite: v.uniteMonnaie, notes: note }
      }
      case 'gemme': {
        if (!v.gemNom.trim()) {
          setErreur('Nommez la gemme.')
          return null
        }
        return {
          type: 'gemme' as const,
          nom: v.gemNom,
          quantite: parseInt(v.gemQuantite) || 1,
          valeur: parseFloat(v.gemValeur.replace(',', '.')) || 0,
          unite: v.gemUnite,
          notes: note,
        }
      }
      case 'potion': {
        if (!v.potNom.trim()) {
          setErreur('Nommez la potion.')
          return null
        }
        return {
          type: 'potion' as const,
          nom: v.potNom,
          effet: v.potEffet.trim() || undefined,
          doses: parseInt(v.potDoses) || 1,
          notes: note,
        }
      }
      case 'objet': {
        if (!v.objNom.trim()) {
          setErreur("Nommez l'objet.")
          return null
        }
        return {
          type: 'objet' as const,
          nom: v.objNom,
          emplacement: v.objEmplacement.trim() || undefined,
          charges: parseInt(v.objCharges) || 0,
          notes: note,
        }
      }
      case 'arme': {
        if (!v.armeNom.trim()) {
          setErreur("Nommez l'arme.")
          return null
        }
        return {
          type: 'arme' as const,
          nom: v.armeNom,
          degats: v.armeDegats.trim() || undefined,
          bonusMagique: parseInt(v.armeBonus) || 0,
          quantite: parseInt(v.armeQuantite) || 1,
          notes: note,
        }
      }
    }
  }

  // La note se garde d'un ajout à l'autre : tout ce qu'on sort du même coffre
  // porte la même provenance, ce serait pénible de la retaper cinq fois.
  function viderOngletCourant() {
    setV(prev => {
      switch (onglet) {
        case 'monnaie':
          return { ...prev, montant: '' }
        case 'gemme':
          return { ...prev, gemNom: '', gemQuantite: '1', gemValeur: '' }
        case 'potion':
          return { ...prev, potNom: '', potEffet: '', potDoses: '1' }
        case 'objet':
          return { ...prev, objNom: '', objEmplacement: '', objCharges: '' }
        case 'arme':
          return { ...prev, armeNom: '', armeDegats: '', armeBonus: '0', armeQuantite: '1' }
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs bg-amber-900/50 hover:bg-amber-800/70 border border-amber-700/70 text-amber-200 hover:text-amber-100 rounded px-2 py-1 min-h-[32px] transition-colors whitespace-nowrap cursor-pointer"
        title="Encaisser un trésor trouvé en partie — monnaie, gemmes, potions, objets magiques, armes"
      >
        💰 Butin
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          {/* Fond assombri */}
          <div className="absolute inset-0 bg-black/60" onClick={fermer} />

          {/* Tiroir */}
          <div className="absolute inset-y-0 right-0 w-full sm:w-[26rem] bg-stone-900 border-l border-stone-700 shadow-2xl flex flex-col">
            {/* En-tête */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700 shrink-0">
              <div>
                <div className="text-amber-400 font-semibold">💰 Ajouter au trésor</div>
                <div className="text-stone-500 text-xs">{nomPersonnage}</div>
              </div>
              <button
                onClick={fermer}
                className="text-stone-400 hover:text-white transition-colors text-lg leading-none px-2 py-1 min-h-[44px] min-w-[44px] cursor-pointer"
                title="Fermer (Échap)"
              >
                ✕
              </button>
            </div>

            {/* Onglets */}
            <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-stone-800 shrink-0">
              {ONGLETS.map(o => (
                <button
                  key={o.code}
                  onClick={() => {
                    setOnglet(o.code)
                    setErreur(null)
                  }}
                  className={`text-xs rounded px-2.5 py-2 min-h-[44px] border transition-colors cursor-pointer ${
                    onglet === o.code
                      ? 'bg-amber-900/60 border-amber-700 text-amber-200'
                      : 'bg-stone-800/70 border-stone-700 text-stone-400 hover:text-amber-300 hover:border-stone-600'
                  }`}
                >
                  <span className="mr-1">{o.icone}</span>
                  {o.libelle}
                </button>
              ))}
            </div>

            {/* Formulaire */}
            <form onSubmit={soumettre} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
              {onglet === 'monnaie' && (
                <>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <Etiquette>Montant</Etiquette>
                      <input
                        ref={premierChamp}
                        type="text"
                        inputMode="decimal"
                        value={v.montant}
                        onChange={e => maj('montant', e.target.value)}
                        placeholder="250"
                        className={CHAMP}
                      />
                    </label>
                    <label className="w-28">
                      <Etiquette>Unité</Etiquette>
                      <select
                        value={v.uniteMonnaie}
                        onChange={e => maj('uniteMonnaie', e.target.value)}
                        className={CHAMP}
                      >
                        {UNITES_MONNAIE.map(u => (
                          <option key={u.code} value={u.code}>
                            {u.label} — {u.nom}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="text-stone-600 text-xs leading-snug">
                    Le montant s&apos;<strong className="text-stone-500">ajoute</strong> à la bourse : rien n&apos;est remplacé.
                  </p>
                </>
              )}

              {onglet === 'gemme' && (
                <>
                  <label>
                    <Etiquette>Nom</Etiquette>
                    <input
                      ref={premierChamp}
                      type="text"
                      value={v.gemNom}
                      onChange={e => maj('gemNom', e.target.value)}
                      placeholder="Rubis étoilé"
                      className={CHAMP}
                    />
                  </label>
                  <div className="flex gap-2">
                    <label className="w-20">
                      <Etiquette>Qté</Etiquette>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={v.gemQuantite}
                        onChange={e => maj('gemQuantite', e.target.value)}
                        className={CHAMP}
                      />
                    </label>
                    <label className="flex-1">
                      <Etiquette>Valeur (chacune)</Etiquette>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={v.gemValeur}
                        onChange={e => maj('gemValeur', e.target.value)}
                        placeholder="50"
                        className={CHAMP}
                      />
                    </label>
                    <label className="w-24">
                      <Etiquette>Unité</Etiquette>
                      <select value={v.gemUnite} onChange={e => maj('gemUnite', e.target.value)} className={CHAMP}>
                        {UNITES_MONNAIE.map(u => (
                          <option key={u.code} value={u.code}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </>
              )}

              {onglet === 'potion' && (
                <>
                  <label>
                    <Etiquette>Nom</Etiquette>
                    <ChampRechercheNom
                      inputRef={premierChamp}
                      value={v.potNom}
                      onChange={texte => maj('potNom', texte)}
                      onPick={s => {
                        // Réutiliser la fiche du Grimoire : nom, effet et doses d'un coup.
                        const ref = potionsCatalogue.find(r => r.nom === s.nom)
                        setV(prev => ({
                          ...prev,
                          potNom: s.nom,
                          potEffet: ref?.effet ?? prev.potEffet,
                          potDoses: String(ref?.chargesMax ?? 1),
                        }))
                      }}
                      catalogue={potionsCatalogue.map(r => ({ nom: r.nom, detail: r.effet, alias: r.alias }))}
                      placeholder="Rechercher ou créer…"
                      className={CHAMP}
                      typeLabel="potion"
                    />
                  </label>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <Etiquette>Effet (facultatif)</Etiquette>
                      <input
                        type="text"
                        value={v.potEffet}
                        onChange={e => maj('potEffet', e.target.value)}
                        placeholder="Soins légers"
                        className={CHAMP}
                      />
                    </label>
                    <label className="w-24">
                      <Etiquette>Doses</Etiquette>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={v.potDoses}
                        onChange={e => maj('potDoses', e.target.value)}
                        className={CHAMP}
                      />
                    </label>
                  </div>
                </>
              )}

              {onglet === 'objet' && (
                <>
                  <label>
                    <Etiquette>Nom</Etiquette>
                    <input
                      ref={premierChamp}
                      type="text"
                      value={v.objNom}
                      onChange={e => maj('objNom', e.target.value)}
                      placeholder="Anneau de protection +1"
                      className={CHAMP}
                    />
                  </label>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <Etiquette>Emplacement (facultatif)</Etiquette>
                      <input
                        type="text"
                        value={v.objEmplacement}
                        onChange={e => maj('objEmplacement', e.target.value)}
                        placeholder="Doigt, cou, sac…"
                        className={CHAMP}
                      />
                    </label>
                    <label className="w-24">
                      <Etiquette>Charges</Etiquette>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={v.objCharges}
                        onChange={e => maj('objCharges', e.target.value)}
                        placeholder="0"
                        className={CHAMP}
                      />
                    </label>
                  </div>
                  <p className="text-stone-600 text-xs leading-snug">
                    Un objet ramassé va au sac : il ne touche pas à la CA tant que son bonus n&apos;est pas déclaré dans{' '}
                    <strong className="text-stone-500">Modifier → Équipement</strong>.
                  </p>
                </>
              )}

              {onglet === 'arme' && (
                <>
                  <label>
                    <Etiquette>Nom</Etiquette>
                    <input
                      ref={premierChamp}
                      type="text"
                      value={v.armeNom}
                      onChange={e => maj('armeNom', e.target.value)}
                      placeholder="Épée longue"
                      className={CHAMP}
                    />
                  </label>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <Etiquette>Dégâts</Etiquette>
                      <input
                        type="text"
                        value={v.armeDegats}
                        onChange={e => maj('armeDegats', e.target.value)}
                        placeholder="1d8"
                        className={CHAMP}
                      />
                    </label>
                    <label className="w-20">
                      <Etiquette>Bonus</Etiquette>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={v.armeBonus}
                        onChange={e => maj('armeBonus', e.target.value)}
                        className={CHAMP}
                      />
                    </label>
                    <label className="w-20">
                      <Etiquette>Qté</Etiquette>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={v.armeQuantite}
                        onChange={e => maj('armeQuantite', e.target.value)}
                        className={CHAMP}
                      />
                    </label>
                  </div>
                </>
              )}

              {/* Note commune — conservée d'un ajout à l'autre (même coffre, même provenance) */}
              <label>
                <Etiquette>Note — d&apos;où vient ce trésor ?</Etiquette>
                <input
                  type="text"
                  value={v.note}
                  onChange={e => maj('note', e.target.value)}
                  placeholder="coffre du gobelin"
                  className={CHAMP}
                />
              </label>

              {erreur && <p className="text-red-400 text-xs leading-snug">{erreur}</p>}
              {message && (
                <p className="text-emerald-300 text-sm leading-snug bg-emerald-950/30 border border-emerald-900/50 rounded px-2 py-1.5">
                  ✓ {message}
                </p>
              )}
              {avis && <p className="text-amber-500/90 text-xs leading-snug">⚠ {avis}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold px-3 py-2 min-h-[44px] rounded transition-colors cursor-pointer"
                >
                  {isPending ? '…' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={fermer}
                  className="text-stone-500 hover:text-stone-300 text-sm px-4 py-2 min-h-[44px] transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </form>

            {/* Pied */}
            <div className="px-4 py-2.5 border-t border-stone-700 shrink-0 text-stone-600 text-xs leading-snug">
              <kbd className="bg-stone-800 border border-stone-700 rounded px-1">Entrée</kbd> ajoute ·{' '}
              <kbd className="bg-stone-800 border border-stone-700 rounded px-1">Échap</kbd> ferme. Chaque ajout s&apos;inscrit
              au 📜 journal de partie.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
