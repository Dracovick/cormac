'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ajouterNoteJoueur, getJournal, supprimerEntreeJournal, type EntreeJournalPartie } from '@/app/actions/journal'
import { journeeLudique, journeeLudiqueCourante, dateLisible, heureQuebec, iconeEntree, lirePhoto } from '@/lib/journal-format'

type Props = { personnageId: number; nomPersonnage: string }

// Tiroir « 📜 Journal » de la fiche : chronologie des actions de jeu du personnage
// (écrites automatiquement par les boutons de la fiche) + marqueurs de round globaux.
export function JournalDrawer({ personnageId, nomPersonnage }: Props) {
  const [open, setOpen] = useState(false)
  const [entrees, setEntrees] = useState<EntreeJournalPartie[] | null>(null)
  const [noteOuverte, setNoteOuverte] = useState(false)
  const [note, setNote] = useState('')
  // Pleine page : la note occupe tout l'écran. Pensé pour l'Apple Pencil — à la
  // table, on écrit à la main dans le champ, et Scribble a besoin de place.
  const [plein, setPlein] = useState(false)
  const zonePleine = useRef<HTMLTextAreaElement>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!plein) return
    // ⚠ Pas d'autofocus au doigt ni au crayon : il fait monter le clavier virtuel,
    // qui mange la moitié de la page qu'on vient justement d'agrandir pour écrire.
    // Au crayon on écrit directement dans le champ, sans le toucher avant.
    if (window.matchMedia('(pointer: fine)').matches) zonePleine.current?.focus()
    // Le corps de page ne doit pas défiler sous la pleine page : au crayon, un
    // trait qui dépasse la zone ferait glisser la fiche derrière.
    const defilement = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const echap = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setPlein(false) }
    window.addEventListener('keydown', echap)
    return () => {
      document.body.style.overflow = defilement
      window.removeEventListener('keydown', echap)
    }
  }, [plein])

  function charger() {
    startTransition(async () => {
      setEntrees(await getJournal(personnageId))
    })
  }

  function ouvrir() {
    setOpen(true)
    charger()
  }

  // Note d'aventure du joueur : signée du personnage, partagée avec toute la table
  function publierNote() {
    const t = note.trim()
    if (!t) return
    setNote('')
    setNoteOuverte(false)
    setPlein(false)
    startTransition(async () => {
      await ajouterNoteJoueur(personnageId, t)
      setEntrees(await getJournal(personnageId))
    })
  }

  function supprimer(id: number) {
    // Confirmation : à la table, un doigt qui glisse ne doit pas effacer une vraie entrée
    if (!confirm('Effacer cette entrée du journal ?\n(la trace disparaît, mais l’action sur la fiche n’est pas annulée)')) return
    setEntrees(prev => prev?.filter(e => e.id !== id) ?? null)
    startTransition(async () => {
      await supprimerEntreeJournal(id, personnageId)
    })
  }

  // Groupement par journée ludique, en antichronologique : la dernière action en haut,
  // pas besoin de scroller pendant la partie. Un marqueur de round fait alors office de
  // « plancher » : tout ce qui est au-dessus appartient à ce round.
  const jours: { jour: string; items: EntreeJournalPartie[] }[] = []
  for (const e of entrees ?? []) {
    const jour = journeeLudique(new Date(e.createdAt))
    let bloc = jours.find(j => j.jour === jour)
    if (!bloc) {
      bloc = { jour, items: [] }
      jours.push(bloc)
    }
    bloc.items.push(e)
  }

  return (
    <>
      <button
        onClick={ouvrir}
        className="text-xs rounded px-2 py-1 border bg-stone-800/80 hover:bg-stone-700 border-stone-600 hover:border-amber-700 text-stone-300 hover:text-amber-300 transition-all cursor-pointer"
        title="Journal de partie — les actions de la fiche s'y inscrivent automatiquement"
      >
        📜 Journal
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          {/* Fond assombri */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />

          {/* Tiroir — élargi sur tablette et bureau : à 26rem, la note d'aventure
              était un timbre-poste sur un iPad de 1024 px de large. */}
          <div className="absolute inset-y-0 right-0 w-full sm:w-[32rem] lg:w-[40rem] bg-stone-900 border-l border-stone-700 shadow-2xl flex flex-col">
            {/* En-tête */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700 shrink-0">
              <div>
                <div className="text-amber-400 font-semibold">📜 Journal de partie</div>
                <div className="text-stone-500 text-xs">{nomPersonnage}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNoteOuverte(v => !v)}
                  className={`transition-colors text-sm px-1 ${noteOuverte ? 'text-amber-400' : 'text-stone-500 hover:text-amber-400'}`}
                  title="Écrire une note d'aventure — partagée avec toute la table"
                >✏️</button>
                <button
                  onClick={charger}
                  disabled={isPending}
                  className="text-stone-500 hover:text-amber-400 transition-colors text-sm"
                  title="Rafraîchir"
                >↻</button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-stone-400 hover:text-white transition-colors text-lg leading-none px-1"
                  title="Fermer"
                >✕</button>
              </div>
            </div>

            {/* Note d'aventure (✏️) : le joueur consigne un indice, un PNJ, une décision.
                Datée et signée du personnage, elle est partagée avec toute la table. */}
            {noteOuverte && (
              <div className="px-4 py-3 border-b border-stone-700 shrink-0 bg-stone-800/40">
                {/* text-base sans variante sm: — c'était `sm:text-sm` qui ramenait le
                    champ à 14 px dès l'iPad, au moment où on a le plus de place.
                    Lignes aérées (leading-relaxed) : on écrit mal entre deux lignes
                    serrées, au crayon comme au stylo. */}
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); publierNote() } }}
                  autoFocus
                  rows={6}
                  maxLength={4000}
                  placeholder="Note d'aventure — indice, PNJ rencontré, décision du groupe… (Ctrl+Entrée pour publier)"
                  className="w-full bg-stone-900 border border-amber-700/50 focus:border-amber-500 rounded-lg px-3 py-2.5 text-stone-200 text-base leading-relaxed resize-y focus:outline-none placeholder:text-stone-600"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={publierNote}
                    disabled={!note.trim() || isPending}
                    className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
                  >
                    📝 Publier
                  </button>
                  <button
                    onClick={() => setPlein(true)}
                    className="text-amber-500 hover:text-amber-300 text-xs px-3 py-1.5 border border-amber-800/60 hover:border-amber-600 rounded-lg transition-colors"
                    title="Écrire en pleine page — pour l'Apple Pencil"
                  >
                    ⤢ Pleine page
                  </button>
                  <button
                    onClick={() => { setNoteOuverte(false); setNote('') }}
                    className="text-stone-500 hover:text-stone-300 text-xs px-3 py-1.5 transition-colors"
                  >
                    Annuler
                  </button>
                  <span className="ml-auto text-stone-600 text-xs hidden sm:inline">Visible par toute la table</span>
                </div>
              </div>
            )}

            {/* Chronologie (les marqueurs de round sont gérés par le MJ depuis /partie) */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {entrees === null ? (
                <div className="text-stone-500 text-sm italic mt-4 text-center">Chargement…</div>
              ) : jours.length === 0 ? (
                <div className="text-stone-500 text-sm mt-6 text-center leading-relaxed">
                  Le journal est vide.<br />
                  <span className="text-stone-600 text-xs">
                    Les actions de la fiche (PV, sorts, potions, attaques…)<br />s&apos;inscriront ici automatiquement.
                  </span>
                </div>
              ) : (
                jours.map(({ jour, items }) => (
                  <div key={jour} className="mb-5">
                    <div className="text-amber-600 text-xs uppercase tracking-wider font-semibold mb-2 sticky top-0 bg-stone-900 py-1">
                      {jour === journeeLudiqueCourante() ? `Aujourd'hui — ${dateLisible(jour)}` : dateLisible(jour)}
                    </div>
                    <div className="space-y-1">
                      {items.map(e => {
                        if (e.type === 'round') {
                          return (
                            <div key={e.id} className="flex items-center gap-2 py-1 group">
                              <div className="flex-1 h-px bg-amber-900/60" />
                              <span className="text-amber-500 text-xs font-semibold uppercase tracking-wide">{e.description}</span>
                              <div className="flex-1 h-px bg-amber-900/60" />
                              {/* Toujours visible : au survol seulement, le bouton n'existait pas sur tablette */}
                              <button
                                onClick={() => supprimer(e.id)}
                                className="text-stone-600 hover:text-red-400 active:text-red-400 text-xs transition-colors px-1.5 py-0.5"
                                title="Effacer ce marqueur"
                              >✕</button>
                            </div>
                          )
                        }
                        if (e.type === 'photo') {
                          // Photo de la table (prise par le MJ depuis /partie) — partagée
                          // avec toute la table, comme les marqueurs de round.
                          const { url, legende } = lirePhoto(e.description)
                          return (
                            <div key={e.id} className="flex items-start gap-2 text-sm group rounded px-1 py-1.5 hover:bg-stone-800/60">
                              <span className="text-stone-600 text-xs font-mono mt-0.5 shrink-0">{heureQuebec(new Date(e.createdAt))}</span>
                              <span className="shrink-0 text-sky-300">📷</span>
                              <div className="flex-1">
                                <a href={url} target="_blank" rel="noopener noreferrer" title="Ouvrir la photo en grand">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt={legende ?? 'Photo de la table'} className="max-h-48 rounded border border-stone-700 hover:border-sky-700 transition-colors" loading="lazy" />
                                </a>
                                {legende && <div className="text-stone-400 text-xs italic mt-1">{legende}</div>}
                              </div>
                            </div>
                          )
                        }
                        const { icone, couleur } = iconeEntree(e.type, e.valeur)
                        // Notes (MJ ou joueur) et bilans : surlignés en ambre. Une note de
                        // joueur est signée du nom de son personnage — elle vient peut-être
                        // d'une autre fiche, puisque les notes sont partagées par la table.
                        const estNote = e.type === 'note' || e.type === 'bilan'
                        const noteJoueur = e.type === 'note' && e.personnageId != null
                        // ✕ seulement sur ce que ce personnage a le droit d'effacer :
                        // ses propres entrées et les marqueurs globaux — pas les notes des autres
                        const effacable = e.personnageId == null || e.personnageId === personnageId
                        return (
                          <div key={e.id} className={`flex items-start gap-2 text-sm group rounded px-1 py-0.5 hover:bg-stone-800/60 ${estNote ? 'bg-amber-950/30 border-l-2 border-amber-700/60' : ''}`}>
                            <span className="text-stone-600 text-xs font-mono mt-0.5 shrink-0">{heureQuebec(new Date(e.createdAt))}</span>
                            <span className={`shrink-0 ${couleur}`}>{icone}</span>
                            <span className={`flex-1 leading-snug whitespace-pre-wrap ${estNote ? 'text-amber-100/90 italic' : 'text-stone-300'}`}>
                              {noteJoueur && <span className="not-italic font-semibold text-amber-300">{e.nomPersonnage ?? '?'} — </span>}
                              {e.description}
                            </span>
                            {effacable && (
                              <button
                                onClick={() => supprimer(e.id)}
                                className="text-stone-600 hover:text-red-400 active:text-red-400 text-xs transition-colors shrink-0 mt-0.5 px-1.5 py-0.5"
                                title="Effacer cette entrée (n'annule pas l'action)"
                              >✕</button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pied */}
            <div className="px-4 py-2.5 border-t border-stone-700 shrink-0 flex items-center justify-between">
              <span className="text-stone-600 text-xs">Écrit par la fiche — ✏️ pour vos notes d&apos;aventure</span>
              <Link
                href="/partie"
                className="text-xs text-amber-500 hover:text-amber-300 transition-colors"
                title="Journal fusionné de tous les personnages (vue du MJ)"
              >
                Vue de table (MJ) →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── Pleine page ────────────────────────────────────────────────────────
          La note d'aventure seule, sur tout l'écran. Même état `note` que le
          panneau du tiroir : réduire ne perd rien, publier publie la même chose.
          h-[100dvh] et pas h-full : sur iPad, le clavier virtuel rétrécit le
          viewport visuel, et un `fixed inset-0` laisserait le pied des boutons
          sous le clavier. */}
      {plein && (
        <div className="fixed inset-0 z-[60] h-[100dvh] bg-stone-900 flex flex-col">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-700 shrink-0">
            <div className="min-w-0">
              <div className="text-amber-400 font-semibold">✏️ Note d&apos;aventure</div>
              <div className="text-stone-500 text-xs truncate">{nomPersonnage} — visible par toute la table</div>
            </div>
            <button
              onClick={() => setPlein(false)}
              className="text-stone-400 hover:text-amber-300 text-xs px-3 py-1.5 border border-stone-600 hover:border-amber-700 rounded-lg transition-colors shrink-0"
              title="Revenir au tiroir (Échap) — le texte est conservé"
            >
              ⤡ Réduire
            </button>
          </div>

          {/* text-lg + leading-loose : des lignes de 2 em, assez hautes pour
              qu'une écriture manuscrite ne morde pas sur la ligne du dessous. */}
          <textarea
            ref={zonePleine}
            value={note}
            onChange={e => setNote(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); publierNote() } }}
            maxLength={4000}
            placeholder="Note d'aventure — indice, PNJ rencontré, décision du groupe, butin à partager… (Ctrl+Entrée pour publier)"
            className="flex-1 min-h-0 w-full bg-stone-900 px-5 py-4 text-stone-100 text-lg leading-loose resize-none focus:outline-none placeholder:text-stone-700"
          />

          <div className="px-4 py-3 border-t border-stone-700 shrink-0 flex items-center gap-3">
            <button
              onClick={publierNote}
              disabled={!note.trim() || isPending}
              className="bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              📝 Publier
            </button>
            <button
              onClick={() => setPlein(false)}
              className="text-stone-500 hover:text-stone-300 text-xs px-3 py-2 transition-colors"
            >
              Continuer plus tard
            </button>
            <span className={`ml-auto text-xs tabular-nums ${note.length >= 3800 ? 'text-amber-400' : 'text-stone-600'}`}>
              {note.length} / 4000
            </span>
          </div>
        </div>
      )}
    </>
  )
}
