'use client'

import { useState, useTransition } from 'react'
import { ajouterEffetCA, retirerEffetCA } from '@/app/actions/character'
import { SORTS_EFFETS_CA, TYPES_BONUS_CA, type ContributionEffetCA } from '@/lib/dnd35/ca-effects'

type Props = {
  personnageId: number
  contributions: ContributionEffetCA[]
}

const CUSTOM = '__custom__'

export function EffetsCA({ personnageId, contributions }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const [choix, setChoix] = useState('')
  const [nomCustom, setNomCustom] = useState('')
  const [typeCustom, setTypeCustom] = useState('divers')
  const [valeur, setValeur] = useState('')
  const [isPending, startTransition] = useTransition()

  const catalogue = SORTS_EFFETS_CA.find(s => s.nom === choix)
  const estCustom = choix === CUSTOM
  const valeurNum = parseInt(valeur, 10)
  const pret = estCustom
    ? nomCustom.trim() !== '' && Number.isFinite(valeurNum) && valeurNum !== 0
    : catalogue != null && Number.isFinite(valeurNum) && valeurNum !== 0

  function choisir(nom: string) {
    setChoix(nom)
    const cat = SORTS_EFFETS_CA.find(s => s.nom === nom)
    setValeur(cat ? String(cat.valeur) : '')
  }

  function fermer() {
    setOuvert(false)
    setChoix('')
    setNomCustom('')
    setTypeCustom('divers')
    setValeur('')
  }

  function activer() {
    if (!pret) return
    const nom = estCustom ? nomCustom.trim() : catalogue!.nom
    const type = estCustom ? typeCustom : catalogue!.typeBonus
    fermer()
    startTransition(async () => { await ajouterEffetCA(personnageId, nom, type, valeurNum) })
  }

  function retirer(effetId: number) {
    startTransition(async () => { await retirerEffetCA(effetId, personnageId) })
  }

  return (
    <div className={`mb-4 ${isPending ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-violet-400 text-xs uppercase tracking-wide">✨ Sorts actifs sur la CA</span>

        {contributions.map(c => (
          <span
            key={c.id}
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs border ${
              c.effective !== 0
                ? 'bg-violet-900/40 border-violet-700 text-violet-200'
                : 'bg-stone-800/60 border-stone-700 text-stone-500'
            }`}
            title={c.effective !== 0
              ? `Bonus de ${c.typeBonus} : ${c.effective > 0 ? '+' : ''}${c.effective} CA`
              : `Ne se cumule pas (bonus de ${c.typeBonus}) — remplacé par ${c.remplacePar ?? 'un meilleur bonus'}`}
          >
            {c.nom}
            <span className="font-mono font-bold">
              {c.effective !== 0 ? `${c.effective > 0 ? '+' : ''}${c.effective}` : '⊘'}
            </span>
            <button
              onClick={() => retirer(c.id)}
              className="text-stone-500 hover:text-red-400 transition-colors ml-0.5"
              title="Le sort prend fin — retirer l'effet"
            >✕</button>
          </span>
        ))}

        {!ouvert && (
          <button
            onClick={() => setOuvert(true)}
            className="text-xs bg-violet-900/40 hover:bg-violet-800/60 text-violet-300 hover:text-violet-200 border border-violet-800 rounded px-2 py-0.5 transition-colors"
          >＋ Lancer un sort</button>
        )}
      </div>

      {ouvert && (
        <div className="mt-2 flex flex-wrap items-end gap-2 bg-stone-800/60 border border-stone-700 rounded p-2">
          <label className="flex flex-col gap-0.5 text-xs text-stone-400">
            Sort
            <select
              value={choix}
              onChange={e => choisir(e.target.value)}
              autoFocus
              className="bg-stone-700 border border-stone-600 rounded px-1.5 py-1 text-stone-100 text-sm focus:outline-none focus:border-violet-500"
            >
              <option value="">— choisir —</option>
              {SORTS_EFFETS_CA.map(s => (
                <option key={s.nom} value={s.nom}>
                  {s.nom} ({s.valeur > 0 ? '+' : ''}{s.valeur}{s.valeurMax ? ` à +${s.valeurMax}` : ''} {s.typeBonus})
                </option>
              ))}
              <option value={CUSTOM}>Autre sort ou effet…</option>
            </select>
          </label>

          {estCustom && (
            <>
              <label className="flex flex-col gap-0.5 text-xs text-stone-400">
                Nom
                <input
                  type="text"
                  value={nomCustom}
                  onChange={e => setNomCustom(e.target.value)}
                  className="w-40 bg-stone-700 border border-stone-600 rounded px-1.5 py-1 text-stone-100 text-sm focus:outline-none focus:border-violet-500"
                  placeholder="Nom du sort"
                />
              </label>
              <label className="flex flex-col gap-0.5 text-xs text-stone-400">
                Type de bonus
                <select
                  value={typeCustom}
                  onChange={e => setTypeCustom(e.target.value)}
                  className="bg-stone-700 border border-stone-600 rounded px-1.5 py-1 text-stone-100 text-sm focus:outline-none focus:border-violet-500"
                >
                  {TYPES_BONUS_CA.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </>
          )}

          {(catalogue || estCustom) && (
            <label className="flex flex-col gap-0.5 text-xs text-stone-400">
              Bonus CA
              <input
                type="number"
                value={valeur}
                onChange={e => setValeur(e.target.value)}
                min={catalogue && !catalogue.valeurMax ? catalogue.valeur : undefined}
                max={catalogue?.valeurMax}
                className="w-16 bg-stone-700 border border-stone-600 rounded px-1.5 py-1 text-stone-100 text-sm text-center focus:outline-none focus:border-violet-500"
              />
            </label>
          )}

          <button
            onClick={activer}
            disabled={!pret}
            className="text-xs bg-violet-700 hover:bg-violet-600 disabled:opacity-30 text-white rounded px-2 py-1 transition-colors"
          >Activer</button>
          <button
            onClick={fermer}
            className="text-xs text-stone-500 hover:text-stone-300 px-1 py-1 transition-colors"
          >Annuler</button>

          {catalogue?.note && (
            <p className="w-full text-xs text-stone-500 mt-1">
              {catalogue.duree ? `Durée : ${catalogue.duree} · ` : ''}{catalogue.note}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
