// Détecter un `**gras**` écrit à l'INTÉRIEUR d'un `*italique*`.
//
// Pourquoi ça compte : le moteur de rendu de la page d'histoire lit le gras
// avant l'italique, et un gras imbriqué est AVALÉ sans laisser d'astérisque
// visible. Mesuré le 2026-11-16 sur l'histoire de Duncan : 109 paires de gras
// écrites, 104 rendues. Rien ne le signale à l'écran — seul le compte le voit.
//
// ⛔ La version naïve — « un astérisque isolé, du texte sans astérisque, puis
// deux astérisques » — est FAUSSE, et elle m'a donné un faux positif sur
// « Dans le *Tome of Battle*, un épéiste-sage nommé **Harran Turiyeshor** » :
// elle prenait l'astérisque de FERMETURE de l'italique pour une ouverture, puis
// trouvait le gras qui suivait. Un astérisque isolé ne dit pas s'il ouvre ou
// s'il ferme — il faut apparier de gauche à droite.
//
// ⛔ Et ces commentaires sont en `//` et non en bloc : une expression régulière
// qui finit par deux astérisques porte la séquence qui FERME un commentaire de
// bloc, et le fichier cessait de se charger avec un « Unexpected end of input »
// à sa dernière ligne, loin du vrai coupable.

/** Les italiques du texte, appariés de gauche à droite, gras compris. */
export function italiquesDe(texte) {
  const trouves = []
  const motif = /(?<!\*)\*(?!\*)((?:[^*]|\*\*)*?)\*(?!\*)/g
  let m
  while ((m = motif.exec(texte)) !== null) trouves.push({ index: m.index, contenu: m[1] })
  return trouves
}

/** Les italiques qui contiennent un gras — ceux-là seront rendus amputés. */
export function grasImbriques(texte) {
  return italiquesDe(texte).filter(i => i.contenu.includes('**'))
}
