import type { EffetDon, StatutEffet } from '@/lib/dnd35/dons-effets'

/**
 * Ce que le Grimoire fait vraiment d'un don, sous le don, sur la fiche.
 *
 * Demande d'André le 2026-11-12 : « est-ce que les calculs tiennent compte des
 * dons. il faut voir ces modifications sur la page du personnage. »
 *
 * ⚠ Ce bloc ne décrit PAS le don — la ligne ambre au-dessus le fait déjà, et
 * d'après le livre. Celui-ci répond à une autre question : « le chiffre que je
 * lis dans la case l'inclut-il déjà, ou dois-je l'ajouter moi-même? » C'est la
 * question qui fait compter deux fois quand personne n'y répond.
 *
 * Le silence est donc une réponse, pas un trou : un don sans aucune ligne ici
 * est un don qu'aucun chiffre de la fiche ne porte. On l'écrit, parce que
 * « rien d'affiché » se lit tout aussi bien comme « rien à dire ».
 */
const STYLE: Record<StatutEffet, { pastille: string; couleur: string; suffixe: string }> = {
  // Le total affiché l'inclut déjà. C'est l'information qui évite le double compte.
  compte: { pastille: '⚙', couleur: 'text-emerald-400/90', suffixe: 'déjà dans le total' },
  // Reconnu, montré dans le détail du calcul, mais hors du total : conditionnel.
  main: { pastille: '✋', couleur: 'text-amber-500/90', suffixe: 'à ajouter à la main' },
  // Le moteur le connaît sans l'appliquer (Robustesse : le pv max est saisi).
  informatif: { pastille: 'ℹ', couleur: 'text-stone-500', suffixe: 'pour information' },
  // Reconnu, mais sans effet SUR CETTE FICHE. Le dire évite la question.
  inactif: { pastille: '◦', couleur: 'text-stone-500', suffixe: 'sans effet ici' },
}

export function EffetsDon({ effets }: { effets: EffetDon[] }) {
  if (effets.length === 0) {
    return (
      <div className="text-stone-600 text-[11px] mt-1 italic">
        aucun calcul automatique — à appliquer à la table
      </div>
    )
  }

  return (
    <div className="mt-1 space-y-0.5">
      {effets.map((e, i) => {
        const s = STYLE[e.statut]
        return (
          <div key={i} className="text-[11px] leading-snug">
            <span className={s.couleur}>
              {s.pastille} {e.ou} <span className="font-mono">{e.quoi}</span>
            </span>
            <span className="text-stone-600"> · {s.suffixe}</span>
            {e.note && <div className="text-stone-600 pl-3.5">{e.note}</div>}
          </div>
        )
      })}
    </div>
  )
}
