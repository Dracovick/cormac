'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { ajouterParchemin, getSortsCatalogue, type SortRef } from '@/app/actions/character'
import { ChampRechercheNom } from '@/components/ChampRechercheNom'
import { CLASSES_ARCANIQUES, CLASSES_DIVINES, TYPES_PARCHEMIN, nlsSuggere } from '@/lib/parchemins'

type Props = { personnageId: number }

const CHAMP = 'w-full bg-stone-900 border border-stone-600 rounded px-2 py-1.5 text-stone-100 text-base sm:text-sm focus:outline-none focus:border-amber-600 placeholder:text-stone-600'

function Etiquette({ children }: { children: React.ReactNode }) {
  return <span className="block text-stone-500 text-xs mb-1">{children}</span>
}

/** Le niveau le plus bas parmi les classes du Manuel qui portent ce sort. */
function niveauDuManuel(niveaux: Record<string, number>): number | null {
  const duManuel = [...CLASSES_ARCANIQUES, ...CLASSES_DIVINES]
    .map(c => niveaux[c])
    .filter((n): n is number => n != null)
  return duManuel.length ? Math.min(...duManuel) : null
}

/** Profane, divin — ou rien du tout quand le sort figure dans les deux listes. */
function typeDuSort(niveaux: Record<string, number>): string {
  const arcanique = CLASSES_ARCANIQUES.some(c => niveaux[c] != null)
  const divin = CLASSES_DIVINES.some(c => niveaux[c] != null)
  if (arcanique && !divin) return 'profane'
  if (divin && !arcanique) return 'divin'
  return ''
}

/**
 * Inscrire un parchemin sur la fiche, sans quitter la partie.
 *
 * Le cœur : le parchemin est RATTACHÉ à une fiche de sort de la Bibliothèque.
 * Choisir le sort remplit son niveau et sa nature (profane ou divine) depuis
 * `spell_class_levels` — rien n'est à chercher dans le livre.
 *
 * ⛔ Les 1221 sorts ne sont chargés qu'à la PREMIÈRE ouverture du panneau. Les
 * embarquer dans la fiche aurait alourdi chaque chargement de personnage pour
 * un panneau qui ne sert qu'au moment où on trouve un parchemin.
 */
export function AjouterParchemin({ personnageId }: Props) {
  const [open, setOpen] = useState(false)
  const [catalogue, setCatalogue] = useState<SortRef[] | null>(null)
  const [isPending, startTransition] = useTransition()
  const [resultat, setResultat] = useState<{ ok: boolean; message: string } | null>(null)
  const premierChamp = useRef<HTMLInputElement>(null)

  const [nom, setNom] = useState('')
  const [sortId, setSortId] = useState<number | null>(null)
  const [niveauSort, setNiveauSort] = useState('')
  const [nls, setNls] = useState('')
  const [type, setType] = useState('')
  const [quantite, setQuantite] = useState('1')
  const [notes, setNotes] = useState('')
  /** Les niveaux par classe du sort choisi, montrés sous le champ. */
  const [niveauxClasses, setNiveauxClasses] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!open) return
    premierChamp.current?.focus()
    if (catalogue != null) return
    startTransition(async () => { setCatalogue(await getSortsCatalogue()) })
  }, [open, catalogue])

  function vider() {
    setNom(''); setSortId(null); setNiveauSort(''); setNls('')
    setType(''); setQuantite('1'); setNotes(''); setNiveauxClasses({})
  }

  function choisirSort(id: number | undefined, nomChoisi: string) {
    const ref = id != null ? catalogue?.find(s => s.id === id) : catalogue?.find(s => s.nom === nomChoisi)
    setNom(nomChoisi)
    setSortId(ref?.id ?? null)
    setNiveauxClasses(ref?.niveaux ?? {})
    if (!ref) return
    const niv = niveauDuManuel(ref.niveaux)
    setNiveauSort(niv == null ? '' : String(niv))
    // Le NLS n'est qu'une SUGGESTION : un parchemin trouvé peut porter mieux.
    const suggere = nlsSuggere(niv)
    setNls(suggere == null ? '' : String(suggere))
    setType(typeDuSort(ref.niveaux))
  }

  function enregistrer() {
    const n = (v: string) => { const x = parseInt(v, 10); return Number.isFinite(x) ? x : null }
    startTransition(async () => {
      const r = await ajouterParchemin(personnageId, {
        sortId,
        nomLibre: sortId == null ? nom : undefined,
        niveauSort: n(niveauSort),
        niveauLanceur: n(nls),
        type: type || null,
        quantite: n(quantite) ?? 1,
        notes,
      })
      setResultat(r)
      if (r.ok) vider()
    })
  }

  const listeClasses = Object.entries(niveauxClasses)
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], 'fr'))
    .map(([classe, niv]) => `${classe} ${niv}`)
    .join(' · ')

  return (
    <>
      <button
        onClick={() => { setOpen(true); setResultat(null) }}
        className="text-xs rounded px-2 py-1 border bg-stone-800/80 hover:bg-stone-700 border-stone-600 hover:border-amber-700 text-stone-300 hover:text-amber-300 transition-all cursor-pointer"
        title="Inscrire un parchemin — le sort se choisit dans la Bibliothèque, sa description reste à un clic"
      >
        ➕ Ajouter un parchemin
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full sm:w-[32rem] bg-stone-900 border-l border-stone-700 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700 shrink-0">
              <div>
                <div className="text-amber-400 font-semibold">📜 Inscrire un parchemin</div>
                <div className="text-stone-500 text-xs">
                  {catalogue == null ? 'Chargement des sorts…' : `${catalogue.length} sorts au catalogue`}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-stone-400 hover:text-white transition-colors text-lg leading-none px-1"
                title="Fermer"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <label className="block">
                <Etiquette>Sort inscrit sur le parchemin</Etiquette>
                <ChampRechercheNom
                  inputRef={premierChamp}
                  value={nom}
                  onChange={texte => {
                    setNom(texte)
                    // Retaper après avoir choisi défait le lien : la ligne ne doit
                    // pas garder le sort d'avant sous un nom qui a changé.
                    if (sortId != null) { setSortId(null); setNiveauxClasses({}) }
                  }}
                  onPick={s => choisirSort(s.id, s.nom)}
                  catalogue={(catalogue ?? []).map(s => ({
                    id: s.id,
                    nom: s.nom,
                    detail: Object.entries(s.niveaux)
                      .sort((a, b) => a[1] - b[1])
                      .map(([c, n]) => `${c} ${n}`)
                      .join(' · ') || null,
                  }))}
                  placeholder={catalogue == null ? 'Chargement…' : 'Rechercher un sort…'}
                  className={CHAMP}
                  typeLabel="parchemin, sans fiche de sort"
                  genre="m"
                />
                {sortId != null && listeClasses && (
                  <span className="block text-stone-500 text-xs mt-1">🔗 lié à la fiche du sort — {listeClasses}</span>
                )}
                {sortId == null && nom.trim().length >= 2 && (
                  <span className="block text-amber-600/80 text-xs mt-1">
                    ⚠ Aucun sort choisi : le parchemin sera inscrit sous ce nom, sans fiche à ouvrir.
                  </span>
                )}
              </label>

              <div className="flex gap-2">
                <label className="w-28">
                  <Etiquette>Niveau du sort</Etiquette>
                  <input type="text" inputMode="numeric" value={niveauSort}
                    onChange={e => setNiveauSort(e.target.value)} placeholder="—" className={CHAMP} />
                </label>
                <label className="w-28">
                  <Etiquette>NLS</Etiquette>
                  <input type="text" inputMode="numeric" value={nls}
                    onChange={e => setNls(e.target.value)} placeholder="—" className={CHAMP} />
                </label>
                <label className="flex-1">
                  <Etiquette>Nature</Etiquette>
                  <select value={type} onChange={e => setType(e.target.value)}
                    className={CHAMP + ' [color-scheme:dark]'}>
                    <option value="">— non précisée —</option>
                    {TYPES_PARCHEMIN.map(t => <option key={t.code} value={t.code}>{t.libelle}</option>)}
                  </select>
                </label>
              </div>
              <p className="text-stone-600 text-xs leading-snug">
                Le <strong>NLS</strong>{' '}(niveau de lanceur) fixe la portée, la durée et les dégâts du sort qui
                en sort — pas le niveau de celui qui lit. Proposé au minimum du SRD; corrigez-le si le MJ a
                dit mieux. Laissez vide s&apos;il n&apos;est pas connu.
              </p>

              <div className="flex gap-2">
                <label className="w-28">
                  <Etiquette>Exemplaires</Etiquette>
                  <input type="text" inputMode="numeric" value={quantite}
                    onChange={e => setQuantite(e.target.value)} className={CHAMP} />
                </label>
                <label className="flex-1">
                  <Etiquette>Note (provenance, DD fixé par le MJ…)</Etiquette>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Coffre du gobelin" className={CHAMP} />
                </label>
              </div>

              {resultat && (
                <p className={`text-xs ${resultat.ok ? 'text-green-400' : 'text-red-400'}`}>{resultat.message}</p>
              )}
            </div>

            <div className="px-4 py-3 border-t border-stone-700 shrink-0 flex items-center gap-3">
              <button
                onClick={enregistrer}
                disabled={isPending || (!nom.trim() && sortId == null)}
                className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                {isPending ? 'Enregistrement…' : '📜 Inscrire'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-stone-500 hover:text-stone-300 text-xs px-3 py-2 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
