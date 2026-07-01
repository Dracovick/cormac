'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RACES_DND35 } from '@/lib/dnd35/races'
import { CLASSES_DND35 } from '@/lib/dnd35/classes'
import { ALIGNEMENTS } from '@/lib/dnd35/rules'
import { generateCharacter, type GenParams } from '@/lib/dnd35/generator'
import { CharacterForm } from '@/components/creation/CharacterForm'
import type { CharacterFormData } from '@/app/actions/character'

const SEL = 'bg-stone-800 border border-stone-700 rounded px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 w-full'
const LBL = 'text-stone-400 text-xs mb-1.5 block'

export default function GenererPersonnage() {
  const [params, setParams] = useState<GenParams>({
    race: 'Humain',
    classe: 'Guerrier',
    niveau: 1,
    alignement: 'Neutre',
    sexe: 'Masculin',
  })
  const [generated, setGenerated] = useState<CharacterFormData | null>(null)

  function handleGenerate() {
    setGenerated(generateCharacter(params))
  }

  const classeInfo = CLASSES_DND35.find(c => c.nom === params.classe)

  if (generated) {
    return (
      <div className="relative">
        <button
          onClick={() => setGenerated(null)}
          className="fixed top-3 right-4 z-50 bg-stone-800/95 hover:bg-stone-700 border border-stone-600 text-stone-300 hover:text-amber-300 text-xs px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm shadow-lg"
        >
          ⚡ Recommencer
        </button>
        <CharacterForm initialData={generated} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f0e0e' }}>
      <div className="max-w-lg mx-auto px-4 py-12">

        <div className="mb-8">
          <Link href="/" className="text-stone-500 hover:text-amber-400 text-sm transition-colors">
            ← Accueil
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-amber-300 mb-2">Générer un personnage</h1>
        <p className="text-stone-500 text-sm mb-8">
          Choisissez les options de base — le site génère le reste selon les règles D&amp;D 3e édition.
        </p>

        <div className="bg-stone-900/80 border border-stone-800/50 rounded-xl p-6">
          <div className="grid gap-5">

            <div>
              <label className={LBL}>Race</label>
              <select className={SEL} value={params.race} onChange={e => setParams(p => ({ ...p, race: e.target.value }))}>
                {RACES_DND35.map(r => <option key={r.nom} value={r.nom}>{r.nom}</option>)}
              </select>
            </div>

            <div>
              <label className={LBL}>Classe</label>
              <select className={SEL} value={params.classe} onChange={e => setParams(p => ({ ...p, classe: e.target.value }))}>
                {CLASSES_DND35.map(c => (
                  <option key={c.nom} value={c.nom}>{c.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={LBL}>Niveau</label>
              <select className={SEL} value={params.niveau} onChange={e => setParams(p => ({ ...p, niveau: +e.target.value }))}>
                {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>Niveau {n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={LBL}>Alignement</label>
              <select className={SEL} value={params.alignement} onChange={e => setParams(p => ({ ...p, alignement: e.target.value }))}>
                {ALIGNEMENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className={LBL}>Sexe</label>
              <select className={SEL} value={params.sexe} onChange={e => setParams(p => ({ ...p, sexe: e.target.value as 'Masculin' | 'Féminin' }))}>
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </select>
            </div>

          </div>

          <div className="mt-6 p-4 bg-stone-800/40 rounded-lg border border-stone-700/30 text-stone-500 text-xs space-y-1">
            <div className="text-stone-400 font-medium mb-2 text-xs uppercase tracking-wide">Ce qui sera généré</div>
            <div>• Caractéristiques — tableau standard D&amp;D 3.5 (15/14/13/12/10/8)</div>
            <div>• Points de vie selon la classe et la Constitution</div>
            <div>• Compétences distribuées selon la classe</div>
            <div>• {1 + Math.floor(params.niveau / 3) + (params.race === 'Humain' ? 1 : 0) + (params.classe === 'Guerrier' ? [1,2,4,6,8,10,12,14,16,18,20].filter(l => l <= params.niveau).length : 0)} don{(1 + Math.floor(params.niveau / 3)) > 1 ? 's' : ''} recommandés pour la classe</div>
            {classeInfo?.lanceurSorts && (
              <div>• Sorts connus selon la classe et le niveau</div>
            )}
            <div>• Équipement de base (armes et armures typiques)</div>
            <div>• Langues selon la race · XP de niveau {params.niveau}</div>
          </div>

          <button
            onClick={handleGenerate}
            className="mt-6 w-full bg-amber-800 hover:bg-amber-700 text-amber-100 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span>⚡</span>
            <span>Générer le personnage</span>
          </button>
        </div>

      </div>
    </div>
  )
}
