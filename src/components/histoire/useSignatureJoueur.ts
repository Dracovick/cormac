'use client'

import { useSyncExternalStore } from 'react'

export const CLE_JOUEUR = 'cormac.joueur'
const MAX = 60

/**
 * Qui écrit, retenu SUR L'APPAREIL — l'iPad d'un joueur garde son nom.
 *
 * Le Grimoire n'a qu'un seul mot de passe, partagé : le serveur ne SAIT pas qui
 * écrit. Cette signature est donc déclarative et facultative, et c'est tout ce
 * qu'elle prétend être. ⛔ Elle n'autorise rien et ne protège rien — n'importe
 * qui de connecté peut écrire sur n'importe quelle histoire, comme partout
 * ailleurs sur le site.
 *
 * ⚠ `useSyncExternalStore` et non `useEffect` + `setState` : localStorage n'est
 * pas un état React (il survit au rechargement, il est partagé entre onglets, le
 * serveur l'ignore), et un `setState` au montage déclenche un rendu en cascade
 * que la règle `react-hooks/set-state-in-effect` interdit dans ce dépôt.
 *
 * ⛔ Pourquoi ce fichier plutôt que `useMaitreDeJeu` de `partie/IdentiteMJ` :
 * celui-là distingue `null` (« le navigateur n'a pas encore répondu ») de `''`
 * (« personne »), parce qu'un MJ non identifié doit voir un formulaire
 * d'identification et que l'afficher une fraction de seconde à chaque
 * chargement serait une faute d'écran. Ici rien ne dépend de cette distinction :
 * une signature absente n'ouvre aucun formulaire. Le store est donc plus simple
 * — et toucher à l'identification du MJ, livrée le 2026-11-09 et utilisée par
 * six écrans de /partie, pour mutualiser trente lignes serait un risque mal
 * payé.
 */

let instantane: string | null = null
const abonnes = new Set<() => void>()

function prevenir() {
  instantane = null // force une relecture au prochain rendu
  for (const f of abonnes) f()
}

function sAbonner(ecouter: () => void) {
  abonnes.add(ecouter)
  // L'événement `storage` arrive dans les AUTRES onglets, pas dans celui qui écrit :
  // deux onglets ouverts sur la même histoire restent d'accord.
  if (abonnes.size === 1) window.addEventListener('storage', prevenir)
  return () => {
    abonnes.delete(ecouter)
    if (abonnes.size === 0) window.removeEventListener('storage', prevenir)
  }
}

function lireInstantane(): string {
  if (instantane === null) {
    try {
      instantane = (window.localStorage.getItem(CLE_JOUEUR) ?? '').slice(0, MAX)
    } catch {
      instantane = '' // navigation privée, stockage refusé — on écrit quand même, sans signature
    }
  }
  return instantane
}

// Au rendu serveur, aucune signature : le HTML initial est le même pour tout le
// monde, ce qui évite une discordance d'hydratation sur un champ de texte.
const lireInstantaneServeur = () => ''

export function useSignatureJoueur(): [string, (nom: string) => void] {
  const nom = useSyncExternalStore(sAbonner, lireInstantane, lireInstantaneServeur)
  return [nom, definir]
}

function definir(nom: string) {
  const propre = nom.replace(/\s+/g, ' ').trim().slice(0, MAX)
  try {
    if (propre) window.localStorage.setItem(CLE_JOUEUR, propre)
    else window.localStorage.removeItem(CLE_JOUEUR)
  } catch {
    /* stockage refusé : le nom ne survivra pas au rechargement, l'écriture tient */
  }
  prevenir()
}
