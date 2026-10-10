/**
 * L'aperçu d'une description longue — pour les listes d'une fiche de personnage.
 *
 * Les descriptions relevées dans les livres portent un markdown léger
 * (**gras**, *italique*, tableaux, sauts de ligne) que la Bibliothèque rend
 * correctement. Une fiche de personnage, elle, n'en affiche qu'une ligne : le
 * balisage y apparaissait tel quel, « le carquois de **Cormac** ». Invisible
 * tant que les descriptions tenaient en une phrase; criant depuis qu'elles
 * portent la règle entière.
 *
 * On ne rend donc pas le markdown ici — on le RETIRE. Ces listes servent à
 * reconnaître une ligne d'un coup d'œil; la fiche complète est à un 📖 de là.
 */
export function apercuDescription(texte: string | null, maxCar = 220): string {
  if (!texte) return ''
  const nu = texte
    // Les tableaux ne veulent rien dire sur une ligne : on les coupe.
    .split('\n')
    .filter(l => !l.trimStart().startsWith('|'))
    .join(' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    // Les puces et les titres markdown deviennent du bruit une fois à plat.
    .replace(/^\s*[-*#>]+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
  return nu.length > maxCar ? nu.slice(0, maxCar - 1).trimEnd() + '…' : nu
}
