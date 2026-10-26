import Link from 'next/link'

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="bg-stone-900/60 border border-stone-800 rounded-xl p-6 mb-4">
      <h2 className="text-amber-400 font-bold text-lg mb-4">{titre}</h2>
      <div className="space-y-3 text-stone-300 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg px-4 py-2 text-amber-200 text-xs">
      {children}
    </div>
  )
}

function Onglet({ label }: { label: string }) {
  return <span className="inline-block bg-stone-800 border border-stone-700 text-amber-300 text-xs font-medium px-2 py-0.5 rounded">{label}</span>
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 font-semibold text-stone-400 w-44">{label}</span>
      <span>{children}</span>
    </div>
  )
}

export default async function AideCreation({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams
  const retour = from?.startsWith('/personnage/') ? from : '/'
  const labelRetour = from?.startsWith('/personnage/') ? '← Retour au formulaire' : '← Grimoire D&D 3e édition'
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-900/40 py-6 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href={retour} className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-300 active:text-amber-300 text-sm transition-colors px-3 -mx-3 min-h-[44px] rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            {labelRetour}
          </Link>
          <Link href="/aide/joueur" className="text-stone-500 hover:text-amber-300 text-xs transition-colors">
            ← Aide — Fiche joueur
          </Link>
        </div>
        <div className="max-w-3xl mx-auto mt-4">
          <h1 className="text-3xl font-bold text-amber-300">Guide de création et modification</h1>
          <p className="text-stone-500 text-sm mt-1">Comment créer et modifier un personnage D&D 3.5</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

        <Section titre="⚡ Générer un personnage automatiquement">
          <p>Depuis la page d'accueil, cliquez sur <strong className="text-amber-200">⚡ Générer automatiquement</strong>. Choisissez :</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Race</strong> (Humain, Elfe, Nain, Halfelin, Demi-Elfe, Demi-Orque, Gnome)</li>
            <li><strong>Classe</strong> (toutes les classes de base D&D 3.5)</li>
            <li><strong>Niveau</strong> (1 à 20)</li>
            <li><strong>Alignement</strong> et <strong>Sexe</strong></li>
          </ul>
          <p>Le système génère automatiquement : les caractéristiques (tableau standard [15,14,13,12,10,8] assigné par priorité de classe), les PV, les compétences, les dons, les sorts, une arme et une armure de départ, les langues raciales, et un nom aléatoire.</p>
          <p>Le formulaire s'ouvre pré-rempli — vous pouvez tout modifier avant de sauvegarder.</p>
          <Tip>Les anciennes fiches où la race est écrite <em>Petite-gens</em> (le nom de la 3.0) sont reconnues comme des <strong>Halfelins</strong> : elles reçoivent bien −2 en Force, +2 en Dextérité, la taille P et les six traits raciaux. Le nom reste affiché tel qu'il est écrit sur la fiche.</Tip>
          <Tip>Un bouton <strong>⚡ Recommencer</strong> flottant en haut à droite permet de revenir au formulaire de sélection sans perdre votre travail.</Tip>
        </Section>

        <Section titre="📄 Créer sur papier — la fiche vierge">
          <p>Quand la création se fait à la table sans ordinateur, l&apos;accueil propose <strong className="text-amber-200">🖨️ Fiche vierge à imprimer</strong>. On la remplit au crayon, puis on la saisit dans le Grimoire après la séance.</p>
          <Row label="Classe et niveau">Deux menus <em>facultatifs</em>. Laissés vides, la feuille est générique et convient à n&apos;importe quel personnage, multiclassé compris. Renseignés, ils impriment en gris les repères que la règle impose — sans remplir aucune valeur de personnage.</Row>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-stone-800/50 rounded p-3">
              <div className="text-amber-300 font-semibold text-sm">Ce qui s&apos;imprime en gris</div>
              <ul className="list-disc list-inside text-stone-300 text-xs mt-1 space-y-0.5">
                <li>Dé de vie de la classe</li>
                <li>Attaque de base au niveau choisi</li>
                <li>Jets de sauvegarde de base, bons jets marqués ✦</li>
                <li>Plafond de rangs : de classe et hors classe</li>
                <li>Nombre de dons dus, ventilé par origine</li>
                <li>Niveaux de sort de la classe</li>
              </ul>
            </div>
            <div className="bg-stone-800/50 rounded p-3">
              <div className="text-stone-300 font-semibold text-sm">Ce qui reste à remplir</div>
              <ul className="list-disc list-inside text-stone-300 text-xs mt-1 space-y-0.5">
                <li>Les six caractéristiques et leurs modificateurs</li>
                <li>PV, CA, initiative, déplacement</li>
                <li>Rangs de compétence et bonus divers</li>
                <li>Armes, armures, équipement, monnaie</li>
                <li>Les dons choisis, les pouvoirs de classe</li>
                <li>Les sorts connus ou préparés</li>
              </ul>
            </div>
          </div>
          <Tip>Les repères sortent des <strong>mêmes tables de règles que le formulaire et la fiche imprimée</strong> (<span className="font-mono text-xs">classes.ts</span>, <span className="font-mono text-xs">rules.ts</span>, <span className="font-mono text-xs">skills.ts</span>). Une table corrigée corrige les trois documents du même coup.</Tip>
          <Row label="Rappel des points de compétence">Le bas de la page des compétences affiche la formule de la classe choisie : <span className="font-mono text-stone-400">(N + mod. INT) × 4</span> au niveau 1, puis <span className="font-mono text-stone-400">N + mod. INT</span> par niveau — avec le vrai N de la classe, et le plafond de rangs des deux colonnes.</Row>
          <Row label="Feuilles de sorts">Le menu <strong>Document</strong> permet d&apos;imprimer <strong>seulement</strong> des feuilles de sorts, jusqu&apos;à six d&apos;un coup : niveau, sort, école, portée, durée, DD, et une rangée de cases à cocher.</Row>
          <Row label="Garder un réglage en favori">Les menus s&apos;écrivent aussi dans l&apos;adresse : <span className="font-mono text-xs text-stone-400">/personnage/vierge?classe=Prêtre&amp;niveau=5</span>, ou <span className="font-mono text-xs text-stone-400">?mode=sorts&amp;copies=4</span>. Mettez en favori la feuille exacte que vous réimprimez chaque séance — elle s&apos;ouvre déjà réglée.</Row>
          <Row label="Deux boutons, deux gestes"><strong>Sauvegarder en PDF</strong> télécharge un fichier — le document est rendu par le serveur depuis la page elle-même, donc identique à ce que l&apos;imprimante sortirait, arrière-plans compris. <strong>Imprimer</strong> ouvre la boîte de dialogue du navigateur, pour du papier immédiat. Le PDF reprend le réglage affiché (classe, niveau, race, copies) et se nomme d&apos;après lui — <span className="font-mono text-xs text-stone-400">fiche-vierge-Pretre-5.pdf</span>. Les accents tombent dans le nom de fichier, pas dans le document.</Row>
          <Tip>⚠ Le <strong>quota d&apos;emplacements par jour n&apos;est pas imprimé</strong> : les tables d&apos;emplacements du Grimoire divergent du Manuel des Joueurs (relevé contre le texte officiel le 24 octobre 2026, décision du MJ en attente). La feuille imprime les niveaux de sort de la classe et laisse une ligne pour reporter le quota du manuel — plutôt que d&apos;imprimer un chiffre qui se lirait comme une règle à la table.</Tip>
        </Section>

        <Section titre="📋 Les onglets du formulaire">
          <p>Le formulaire est divisé en 8 onglets. La barre d'onglets est accessible en tout temps en haut de l'écran.</p>
          <div className="grid gap-2 mt-2">
            <Row label={<Onglet label="Identité" /> as any}>Nom, surnom, race, classe, niveau, alignement, divinité, clan, XP, photo, joueur.</Row>
            <Row label={<Onglet label="Caractéristiques" /> as any}>Les 6 scores (FOR, DEX, CON, INT, SAG, CHA) avec leur valeur de base et leur bonus magique. Les modificateurs et totaux sont calculés automatiquement.</Row>
            <Row label={<Onglet label="Combat" /> as any}>PV max et actuels, CA (naturelle, déflexion, divers — l&apos;armure et le bouclier viennent de l&apos;onglet Équipement), initiative, déplacement, karma, BBA. Le BBA est calculé automatiquement depuis la classe et le niveau — laissez à 0 pour le calcul auto. <strong>N'entrez pas les bonus de dons dans les champs « divers »</strong> : Science de l'initiative, Volonté de fer, Vigueur surhumaine, Réflexes surhumains et Vigilance sont comptés automatiquement par la fiche dès que le don est inscrit.</Row>
            <Row label={<Onglet label="Compétences" /> as any}>Liste complète des compétences D&D 3.5. Entrez les <strong>rangs investis</strong> et un éventuel modificateur divers. Le total (rangs + carac + divers) s'affiche automatiquement.</Row>
            <Row label={<Onglet label="Dons" /> as any}>Sélecteur de dons filtré par classe, organisé par catégorie (Combat, Tir, Magie, etc.). Inclut un champ de saisie libre pour les dons hors liste.</Row>
            <Row label={<Onglet label="Équipement" /> as any}>Armes, armures, objets magiques (avec leur bonus, sa sorte et leurs charges), potions, trésor (monnaies et gemmes) et langues. Les <strong>parchemins</strong> font exception : ils s&apos;inscrivent depuis la fiche, pas ici.</Row>
            <Row label={<Onglet label="Sorts ✨" /> as any}>Visible uniquement pour les classes lanceuses de sorts. Sélection par niveau de sort.</Row>
            <Row label={<Onglet label="Notes" /> as any}>Texte libre pour l'historique, les traits de personnalité ou toute autre information.</Row>
          </div>
          <Tip>L'onglet <strong>Sorts ✨</strong> n'apparaît que si la classe sélectionnée est un lanceur de sorts.</Tip>
        </Section>

        <Section titre="⚔️ Onglet Combat — détails">
          <Row label="BBA (Bonus de Base à l'Attaque)">Laissez à <strong>0</strong> pour que le système le calcule automatiquement selon votre classe et niveau D&D 3.5. Saisissez une valeur pour forcer manuellement : elle remplace le <strong>BBA de base</strong> — la FOR (mêlée) ou la DEX (distance) s&apos;ajoute toujours par-dessus, comme sur la fiche. Une valeur forcée n&apos;est plus figée : elle augmente d&apos;elle-même à chaque montée de niveau 🆙, selon la progression de la classe choisie.</Row>
          <Row label="CA — calcul automatique">La Classe d'Armure est calculée automatiquement : <span className="font-mono text-stone-300">10 + armures (bonus + magique) + mod DEX (plafonné par max DEX)</span>, puis les bonus des <strong>objets portés</strong>, des champs <em>naturelle / déflexion / divers</em> et des <strong>sorts actifs</strong> — <strong>arbitrés par type</strong> : deux bonus de même sorte ne se cumulent pas, le meilleur s'applique et l'autre s'affiche barré dans le panneau de détail. Il n'y a plus de champs manuels Armure/Bouclier.</Row>
          <Row label="⚠ Sauf sur le papier">Les <strong>sorts actifs</strong> comptent à l&apos;écran, et seulement à l&apos;écran. La <strong>feuille imprimée</strong> est un <strong>état au repos</strong> : aucun effet magique temporaire n&apos;entre dans ses totaux — ni la CA, ni l&apos;attaque, ni les jets de sauvegarde, ni les compétences. Elle le dit elle-même dans un bandeau <em>État au repos</em> sous l&apos;en-tête, qui nomme les sorts en cours et chiffre ce qu&apos;ils changeraient. Décision du MJ, 10 octobre 2026.</Row>
          <Row label="Max DEX de l'armure">Si une armure portée limite le bonus de DEX (ex. Chemise de mailles : Max DEX +6), le modificateur de DEX positif est automatiquement plafonné. Un modificateur négatif s'applique toujours en entier.</Row>
          <Row label="PV actuels">Peut différer des PV max si le personnage a subi des dégâts. Utilisez la fiche joueur pour les ajuster en temps réel.</Row>
          <Row label="Déplacement">En mètres. Laissez vide pour utiliser la valeur par défaut (9 m). Si le personnage porte une armure lourde, la fiche réduit automatiquement le déplacement à 6 m.</Row>
          <Row label="Jets de sauvegarde">Les bases sont calculées automatiquement. Entrez un bonus magique si le personnage porte des objets qui les améliorent.</Row>
          <Row label="Domaines divins">Si le personnage a la classe <strong>Prêtre</strong> ou <strong>Druide</strong>, une carte <em>Domaines divins</em> apparaît dans cet onglet avec deux menus déroulants : les 23 domaines du PHB 3.5, <strong>les 34 domaines des Royaumes Oubliés</strong> (Araignées, Charme, Drows, Elfes, Lune, Nains, Noblesse, Obscurité, Océan, Runes, Tempête, Temps…) <strong>et les 19 domaines du Codex Divin</strong> (Célérité, Communauté, Convocation, Folie, Forces, Froid, Inquisition, Mysticisme, Oracles, Pestilence, Rêves…). Les domaines choisis s'affichent sur la fiche — et sur la feuille imprimée — avec leur pouvoir et leurs 9 sorts de domaine.</Row>
          <Tip>Pour vérifier où atterrit chaque valeur saisie ici (divers, magique, naturelle, déflexion…), ouvrez la fiche et <strong>touchez le chiffre</strong> : la CA, l'initiative, les jets de sauvegarde, les attaques, les armes (attaque et dégâts) et les compétences affichent leur décomposition complète, ligne par ligne, avec la contribution de chaque champ du formulaire. Voir le Guide du joueur, section « Pourquoi +7 ? ».</Tip>
        </Section>

        <Section titre="🧙 Onglet Sorts — grimoire et préparations">
          <p>L'onglet Sorts ✨ fonctionne différemment selon le type de lanceur de sorts.</p>
          <Tip>Le catalogue inclut maintenant <strong>plus de 500 sorts de suppléments</strong> : Royaumes Oubliés, Codex Divin, Codex Profane, Maîtres de la Nature et Manuel des Joueurs de Faerûn — y compris les résumés des sorts de <strong>Magie de Faerûn</strong>, de <strong>L'Outreterre</strong> et de <strong>L'Inaccessible Orient</strong> compilés par ce dernier. Chaque sort indique son livre source entre crochets à la fin de sa description, ex. « [Codex Divin] » ou « [Magie de Faerûn] ». Les sorts précédés de « <strong>Sort d&apos;initié (Initié de X)</strong> » sont des sorts propres aux dieux de Faerûn : seuls les personnages possédant le don d&apos;initié correspondant (onglet Dons) devraient les choisir.</Tip>
          <Tip>Quatre de ces suppléments ont été relevés page par page et portent maintenant leur fiche complète — <strong>Codex Divin</strong>, <strong>Codex Profane</strong>, <strong>Les Maîtres de la Nature</strong> et le <strong>Manuel des Joueurs de Faerûn</strong> : composantes, portée, cible, durée, jet de sauvegarde et résistance à la magie, lisibles au 📖 comme pour les sorts du Manuel. Les sorts dont seul le résumé est connu (Magie de Faerûn, L&apos;Outreterre, Seigneurs des Ténèbres, Races de Faerûn, L&apos;Inaccessible Orient) attendent que le Grimoire ait ces livres.</Tip>

          <Row label="Lire un sort avant de le choisir">La liste n'affiche plus que le <strong>nom</strong> et l'<strong>école</strong> de chaque sort. Cliquez le petit livre <span className="text-stone-500">📖</span> à droite du nom pour déplier sa définition et ses composantes · portée · durée; cliquez-le de nouveau pour la refermer. Une seule définition reste ouverte à la fois, et le livre n'ouvre <strong>jamais</strong> la case à cocher : cocher le sort demande toujours un clic sur la ligne elle-même.</Row>

          <p className="font-semibold text-stone-400 mt-2">Lanceurs divins — Prêtre, Druide, Paladin, Rôdeur</p>
          <p>Aucune saisie n'est nécessaire dans cet onglet. Ces classes ont accès à toute leur liste de sorts automatiquement selon leur niveau — la fiche les affiche directement lors de la prière. Vous pouvez ignorer l'onglet Sorts lors de la création ou modification du personnage.</p>
          <Tip>Un Prêtre de niveau 5 aura automatiquement accès à tous les sorts de prêtre de niveau 0 à 3 via le bouton 🙏 Prier sur sa fiche, sans configuration préalable.</Tip>
          <Tip>La liste de sorts du prêtre est désormais <strong>complète</strong> : les <strong>230 sorts</strong> du Manuel des Joueurs 3.5, du niveau 0 au niveau 9, relevés page par page dans le livre. Les noms sont ceux du Manuel ; quand le résumé et le chapitre des sorts se contredisent, c&apos;est le chapitre qui a été retenu — les deux noms sont conservés lorsque le livre lui-même hésite (« Soins critiques de groupe » et « Soins intensifs de groupe » désignent le même sort).</Tip>
          <Tip>Les listes du <strong>paladin</strong> et du <strong>rôdeur</strong> sont elles aussi <strong>complètes</strong> : les <strong>45 sorts de paladin</strong> et les <strong>51 sorts de rôdeur</strong> du Manuel des Joueurs 3.5, des niveaux 1 à 4, relevés page par page. Ces deux classes ne lancent aucune oraison et n&apos;obtiennent leur premier sort qu&apos;au <strong>niveau 4 de classe</strong>. Rien à saisir : la liste s&apos;affiche seule au bouton 🙏 Prier.</Tip>
          <Tip>Quatre points où le chapitre des sorts contredit la liste résumée du livre — c&apos;est toujours le <strong>chapitre</strong> qui a été retenu. <strong>Soins légers</strong> est un sort de rôdeur de niveau <strong>2</strong> (le Grimoire le donnait à tort au niveau 1) : la série soins légers / modérés / importants vaut 2 / 3 / 4 pour le rôdeur, soit un cran de plus que pour le prêtre et le paladin. <strong>Restauration partielle</strong> est un sort de paladin de niveau <strong>1</strong>, et c&apos;est <strong>Restauration</strong> — que la liste résumée oublie — qui occupe le niveau 4. <strong>Détection du poison</strong> est bien un sort de rôdeur de niveau 1, malgré son absence du résumé. Enfin le livre s&apos;orthographie lui-même de deux façons : le Grimoire retient <strong>Passage sans trace</strong>, le titre imprimé du bloc.</Tip>

          <Tip>La liste du <strong>druide</strong> est désormais <strong>complète</strong> elle aussi : les <strong>169 sorts</strong> du Manuel des Joueurs 3.5, du niveau 0 au niveau 9, relevés page par page. C&apos;est la <strong>septième et dernière</strong> classe du Manuel : le Grimoire porte maintenant les sept listes entières (prêtre, ensorceleur/magicien, paladin, rôdeur, barde, druide). Répartition : 13 oraisons puis 20, 26, 22, 17, 19, 18, 13, 11 et 10 sorts. Comme le prêtre, le druide n&apos;a rien à saisir dans cet onglet.</Tip>
          <Tip>Trois points où le <strong>chapitre des sorts</strong> contredit le catalogue ou la liste résumée du livre — c&apos;est toujours le chapitre qui a été retenu. <strong>Soins importants de groupe</strong> est bien un sort de druide de <strong>niveau 8</strong> : la liste résumée l&apos;oublie purement et simplement (d&apos;où 169 sorts et non 168). <strong>Régénération</strong> passe de 7 à <strong>9</strong> et <strong>Peau de pierre</strong> de 6 à <strong>5</strong>.</Tip>
          <Tip>Sur les 169 sorts du druide, <strong>126 existaient déjà</strong> au catalogue — la liste recoupe très largement celles du prêtre et du rôdeur — et <strong>43</strong> ont été créés. Ces créations ont au passage réparé <strong>28 liens morts</strong> dans les domaines de prêtre : des sorts de domaine (Air, Faune, Flore, Terre, Soleil…) qui étaient nommés sans exister au catalogue.</Tip>

          <p className="font-semibold text-stone-400 mt-3">Magicien — grimoire</p>
          <p>L'onglet affiche la liste complète des sorts de magicien. Cliquez sur un sort pour l'ajouter au grimoire du personnage. Seuls les sorts dans le grimoire sont disponibles lors de l'étude.</p>
          <Row label="Ajouter un sort">Cliquez sur le nom du sort dans la liste. Il apparaît dans le grimoire avec une préparation de 0.</Row>
          <Row label="Retirer un sort">Cliquez sur le sort dans le grimoire pour le retirer.</Row>
          <Tip>La liste d&apos;ensorceleur/magicien est désormais <strong>complète</strong> : les <strong>377 sorts</strong> du Manuel des Joueurs 3.5, du niveau 0 au niveau 9, relevés page par page dans le livre. En 3.5, le magicien et l&apos;ensorceleur partagent <strong>une seule et même liste</strong> — chaque sort est donc au même niveau pour les deux, et tout ce qui est ajouté ici sert aux deux classes. Comme pour le prêtre, quand la liste résumée et le chapitre des sorts se contredisent, c&apos;est le <strong>chapitre</strong> qui a été retenu : le sort de niveau 2 s&apos;appelle « Contrôle <em>mineur</em> des morts-vivants » (celui de niveau 7 garde « Contrôle des morts-vivants »), et « Téléportation suprême » est enregistrée sous « Téléportation sans erreur », le titre imprimé de son bloc.</Tip>
          <Tip>Deux exceptions à connaître. <strong>Mémorisation de Rary</strong> (niveau 4) et <strong>Remémoration de Mordenkainen</strong> (niveau 6) sont réservées au <strong>magicien</strong> : le Manuel les note « Mag » et non « Ens/Mag », car elles servent à préparer ou à retrouver un sort préparé — ce qu&apos;un ensorceleur ne fait jamais. Elles n&apos;apparaissent donc pas dans la liste d&apos;un ensorceleur. À l&apos;inverse, la ligne « Endurance » qu&apos;on lit dans la liste résumée du livre n&apos;a <strong>aucun sort correspondant</strong> dans le chapitre des sorts : c&apos;est un vestige de la 3.0 resté dans l&apos;édition française, et elle n&apos;a pas été reprise.</Tip>

          <p className="font-semibold text-stone-400 mt-3">Ensorceleur / Barde — sorts connus</p>
          <p>Ces lanceurs spontanés ne préparent pas de sorts mais connaissent un nombre limité de sorts permanents. Ajoutez ici les sorts connus du personnage — ils seront disponibles sur la fiche sans nécessiter de préparation quotidienne. Sur la fiche, leur bouton s'appelle <strong>✨ Repos</strong> (au lieu de 📖 Étudier) et sert uniquement à suivre les emplacements dépensés dans la journée.</p>
          <Tip>La liste du <strong>barde</strong> est désormais <strong>complète</strong> : les <strong>164 sorts</strong> du Manuel des Joueurs 3.5, du <strong>niveau 0 au niveau 6</strong>, relevés page par page dans le livre — 16 tours de magie, puis 26, 35, 30, 21, 16 et 20 sorts. Le barde a bien des sorts de niveau 0, mais il n&apos;obtient son premier emplacement qu&apos;au <strong>niveau 2 de classe</strong>. Sa liste recoupe très largement celle de l&apos;ensorceleur/magicien : sur les 164 sorts, <strong>152 étaient déjà au catalogue</strong> et ont simplement reçu leur niveau de barde, et <strong>12</strong> lui sont propres — <em>Bagou</em>, <em>Berceuse</em>, <em>Chant de discorde</em>, <em>Confusion mineure</em>, <em>Convocation d&apos;instrument</em>, <em>Espoir</em>, <em>Hypnose des animaux</em>, <em>Manipulation des sons</em>, <em>Modification de mémoire</em>, <em>Repérage</em>, <em>Résonance</em> et <em>Zone de silence</em>.</Tip>
          <Tip>Deux niveaux de barde étaient faux au catalogue et le <strong>chapitre des sorts</strong> les a redressés, comme pour le prêtre, le magicien et le rôdeur. <strong>Soins modérés</strong> passe du niveau 3 au niveau <strong>2</strong> : le Manuel imprime « Bard 2, Dru 3, Guérison 2, Pal 3, Prê 2, Rôd 3 ». <strong>Dissipation de la magie</strong> passe du niveau 4 au niveau <strong>3</strong> : le Manuel imprime « Bard 3, Dru 4, Ens/Mag 3, Magie 3, Pal 3, Prê 3 ». Dans les deux cas la liste résumée du livre disait déjà la même chose que le chapitre — c&apos;est le Grimoire qui était en écart.</Tip>

          <Row label="Emplacements par jour">Le tableau en haut de l'onglet affiche les emplacements disponibles par niveau de sort selon le niveau de classe.</Row>

          <p className="font-semibold text-stone-400 mt-3">Sorts personnalisés — homebrew et magie de campagne</p>
          <p>Pour tous les lanceurs de sorts, un bouton <span className="bg-stone-800 border border-stone-700 text-amber-400/80 px-1.5 py-0.5 rounded text-xs font-mono">+ Ajouter un sort personnalisé</span> est disponible directement sur la <strong>fiche joueur</strong> (pas dans ce formulaire). Il permet d'ajouter n'importe quel sort inventé, issu d'un supplément ou béni par une divinité de campagne.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-1">
            <li>Les sorts personnalisés sont marqués d'une étoile <span className="text-amber-700 font-bold">★</span> dans la liste et dans la modale de prière.</li>
            <li>Pour les <strong>divins</strong>, ils persistent entre les prières et s'intègrent automatiquement au panneau de prière chaque jour.</li>
            <li>Un bouton <span className="text-stone-400 font-mono text-xs">✕</span> permet de les supprimer depuis la fiche joueur.</li>
            <li>Chaque sort personnalisé peut avoir une <strong>description libre</strong> (effets, portée, durée, composantes…), saisie lors de la création ou ajoutée/modifiée directement sur la fiche à tout moment. La loupe 🔍 est remplacée par cette description éditable.</li>
          </ul>
          <Tip>La gestion des préparations quotidiennes (qui lance quoi aujourd'hui) se fait directement sur la fiche joueur via les boutons 🙏 Prier ou 📖 Étudier — pas dans ce formulaire.</Tip>
        </Section>

        <Section titre="🎯 Onglet Dons — sélecteur par catégorie">
          <p>L'onglet Dons affiche une liste filtrée selon les classes du personnage, organisée en catégories.</p>
          <Tip>Le catalogue inclut maintenant <strong>plus de 150 dons de suppléments</strong> : Codex Divin (dons divins de renvoi, forme animale…), Codex Profane (dons draconiques, métamagie soudaine…), Maîtres de la Nature (rage, robustesse, ennemis jurés…) et les dons régionaux de Faerûn en version 3.5 du Manuel des Joueurs de Faerûn (Éducation, Chance des héros, Charge furieuse, Magie de la Toile d'Ombre…). Règle de Faerûn : un seul don régional par personnage, choisi au niveau 1. Le livre source est indiqué entre crochets.</Tip>
          <Tip>Nouveau : les <strong>11 dons d&apos;initié</strong> du Manuel des Joueurs de Faerûn (catégorie Divin) — Initié de Baine, de Cyric, de Gond, de Heaum, d&apos;Ilmater, de Lathandre, de Malar, de Mystra, de la Nature, de Séluné et de Tyr. Réservés aux prêtres (parfois paladins, druides ou rôdeurs) de la divinité indiquée, ils confèrent un pouvoir spécial et ajoutent des <strong>sorts propres au dieu</strong> à la liste de sorts du personnage (marqués « Sort d&apos;initié » dans le catalogue). Règle : un seul don d&apos;initié par personnage.</Tip>
          <Row label="Onglets de catégories">Seules les catégories pertinentes pour vos classes apparaissent — ex. un Guerrier voit <strong>Combat / Tir / Général</strong>, un Magicien voit <strong>Magie / Métamagie / Général</strong>, un Guerrier/Magicien voit les deux groupes réunis.</Row>
          <Row label="Ajouter un don">Cliquez sur le don dans la liste. Il est ajouté immédiatement à la liste du personnage. Les dons déjà sélectionnés s'affichent grisés avec une ✓.</Row>
          <Row label="Dons ciblant une arme">Pour <strong>Arme de prédilection</strong>, <strong>Spécialisation martiale</strong>, <strong>Acuité martiale</strong> et leurs variantes, un sélecteur d'arme s'ouvre après le clic. Il liste les 78 armes de la table 7-5 du Manuel (groupées par catégorie) et les armes personnalisées du personnage.</Row>
          <Row label="Don hors liste">Un champ de saisie libre en bas de l'onglet permet d'ajouter n'importe quel don non présent dans la liste (suppléments, homebrew, etc.).</Row>
          <Row label="Prérequis vérifiés">Les dons majeurs ont leurs prérequis D&D 3.5 encodés (BBA minimum, caractéristique minimum, dons requis). Sur la <strong>fiche joueur</strong>, un avertissement <span className="text-red-400 font-mono">⚠</span> rouge signale tout don dont les prérequis ne sont pas satisfaits, avec le détail de ce qui manque.</Row>
          <Tip>Les dons d'arme (ex. Arme de prédilection) peuvent être pris plusieurs fois avec des armes différentes — ils ne se grisent donc pas après sélection.</Tip>
          <Row label="⚠️ La parenthèse est une donnée">Dans <span className="font-mono text-xs">Arme de prédilection (arc long composite)</span>, la parenthèse n&apos;est pas une décoration : c&apos;est elle qui dit au Grimoire à quelle arme appliquer le +1. Elle doit reprendre le nom de l&apos;arme tel qu&apos;il figure sur la fiche (la casse et les accents sont ignorés). Un don d&apos;arme sans parenthèse ne s&apos;applique à rien.</Row>
          <Tip>Chaque don du Manuel porte un <strong>📖</strong> sur la fiche de personnage : il ouvre sa <strong>règle entière</strong> à la Grande Bibliothèque — à quoi sert le don, le détail de son avantage, ce qu&apos;on subit sans lui, et les classes qui l&apos;obtiennent gratuitement. Les <strong>109 dons</strong> de la table 5-1 y sont décrits; vérifier les conditions d&apos;un don avant de le choisir évite d&apos;avoir à le reprendre.</Tip>
        </Section>

        <Section titre="🗡️ Onglet Équipement — sélecteur d'armes">
          <p>Le champ <strong>Nom</strong> de chaque arme est un menu déroulant contenant les <strong>78 armes de la table 7-5 du Manuel des Joueurs</strong>, sous leur <strong>nom officiel VF</strong>, groupées en quatre : <em>Armes courantes</em> (19) · <em>Armes de guerre</em> (35) · <em>Armes exotiques</em> (19) · <em>Munitions</em> (5).</p>
          <Row label="Les noms sont ceux du livre">Le menu portait jusqu&apos;au 8 octobre 2026 une ancienne traduction pour 25 entrées, et six valeurs fausses. Il est maintenant <strong>engendré à partir du même relevé</strong> que le catalogue publié à la Bibliothèque : <em>Hache de bataille</em> est devenue <em>Hache d&apos;armes</em>, <em>Ranseur</em> → <em>Corsèque</em>, <em>Glaive</em> → <em>Coutille</em>, <em>Grand gourdin</em> → <em>Massue</em>, <em>Lance longue</em> → <em>Pique</em>, <em>Masse légère/lourde</em> → <em>Masse d&apos;armes légère/lourde</em>, <em>Fléau</em> → <em>Fléau d&apos;armes léger</em>, <em>Sai</em> → <em>Saï</em>. Les anciens noms déjà inscrits sur une fiche n&apos;ont pas bougé : ils apparaissent dans le groupe <em>Personnalisées</em>.</Row>
          <Row label="Modes de lancer">Un cinquième groupe, <strong>Modes de lancer</strong>, offre la même arme du Manuel sous son autre mode d&apos;attaque : <em>Dague (lancée)</em>, <em>Lance (lancée)</em>, <em>Trident (lancé)</em>, <em>Gourdin (lancé)</em>, <em>Épieu (lancé)</em>, <em>Marteau léger (lancé)</em>, <em>Hache de lancer (lancée)</em>. Choisir le mode de lancer plutôt que l&apos;arme nue est ce qui fait calculer l&apos;attaque au <strong>BBA de projectiles</strong> et non au corps à corps.</Row>
          <Tip>Le Manuel donne un facteur de portée à sept armes de <strong>contact</strong> — la dague se lance à 3 m, la lance à 6 m — sans qu&apos;elles cessent d&apos;être des armes de contact. Le champ <strong>Portée</strong> porte donc toujours la valeur du livre : c&apos;est un facteur de jet, pas un verdict. Ce qui décide du calcul, c&apos;est la <strong>famille</strong> de l&apos;arme — l&apos;entrée nue se calcule à la <strong>Force</strong>, son mode de lancer à la <strong>Dextérité</strong>.</Tip>
          <Row label="Sélectionner une arme">Choisissez une arme dans le menu déroulant. Les champs <strong>Dégâts</strong>, <strong>Critique</strong>, <strong>Type</strong> et <strong>Portée</strong> se remplissent avec les valeurs de la table 7-5. Les munitions n&apos;ont ni dégâts ni critique propres au livre : ces champs restent vides, c&apos;est l&apos;arme de tir qui les donne.</Row>
          <Row label="Le champ Crit">Il s&apos;écrit comme au Manuel : <span className="text-amber-300 font-mono text-xs">×2</span> ou <span className="text-amber-300 font-mono text-xs">×3</span> pour une arme qui ne critique que sur un 20 naturel, <span className="text-amber-300 font-mono text-xs">19-20/×2</span> pour une zone élargie. Les anciennes saisies en <span className="font-mono text-xs">20-20/×2</span> restent comprises et sont réécrites dans la forme du livre.</Row>
          <Row label="Arme personnalisée">Cliquez sur le bouton violet <strong>Arme personnalisée</strong> pour saisir librement le nom d'une arme inventée ou issue d'un supplément non inclus dans la liste. Les autres champs restent modifiables manuellement.</Row>
          <Tip>Les armes personnalisées créées ici apparaissent dans le sélecteur d'arme de l'onglet Dons (section Personnalisées), ce qui permet d'y associer des dons comme Arme de prédilection.</Tip>
        </Section>

        <Section titre="🗡️ Onglet Équipement — arc composite et munitions">
          <p>Chaque arme a une <strong>rangée principale</strong> (Nom, Dégâts, Crit, Type, +Mag, Qté) et une <strong>sous-rangée optionnelle</strong> pour les arcs et arbalètes.</p>
          <Row label="+Mag (arme)">Bonus d'enchantement magique de l'arme elle-même. S'ajoute à l'attaque ET aux dégâts.</Row>

          <p className="font-semibold text-stone-400 mt-3">Arc composite</p>
          <Row label="Côte Force">Bonus de Force maximal que l'arc peut transmettre aux dégâts. Ce n'est <strong>pas</strong> un bonus magique — un arc composite +3 (côte Force +3, sans magie) ne coûte que ~400 po. N'affecte pas le jet d'attaque.</Row>
          <Row label="Exemple">Pour un arc long composite (Force +3) : entrez <strong>Côte Force = 3</strong> et <strong>+Mag = 0</strong>. Si votre FOR mod est +5, seul +3 s'ajoute aux dégâts. Pour un arc magique en plus, entrez aussi +Mag.</Row>
          <Tip>La fiche affiche automatiquement <span className="font-mono text-stone-300">(Force +3)</span> après le nom quand une côte est renseignée, et <span className="font-mono text-stone-300">+2</span> en suffixe pour un bonus magique.</Tip>

          <p className="font-semibold text-stone-400 mt-3">Munitions magiques (flèches, bolts)</p>
          <Row label="Munitions +Mag">Bonus d'altération des flèches ou carreaux utilisés. S'ajoute à l'attaque ET aux dégâts. Pas besoin de créer une arme séparée pour les flèches. ⚠ <strong>Il ne se cumule pas avec le bonus de l'arc</strong> : la fiche garde le meilleur des deux et barre l'autre, comme le livre l'impose.</Row>
          <Row label="Exemple">Flèches +2 sur un arc +1 → entrez <strong>Munitions +Mag = 2</strong>. Le détail affichera <span className="font-mono text-stone-300">munitions magiques +2</span>, et l'<span className="font-mono text-stone-300">arme magique +1</span> barrée en dessous : « ne se cumule pas, les munitions +2 l'emportent ». Le total d'altération est <strong>+2</strong>.</Row>
        </Section>

        <Section titre="🗡️ Onglet Équipement — objets magiques, bonus et charges">
          <p>La section <strong className="text-amber-200">Objets magiques</strong> porte deux champs qui vont de pair : <strong>Bonus</strong> (le nombre) et <strong>Bonus de</strong> (la sorte de bonus). Et un champ <strong>Charges</strong> pour les bâtons, baguettes et autres objets à charges.</p>
          <Row label="Bonus de — le champ qui décide">Un « +2 » ne dit pas tout seul où il s'applique. Choisissez <strong>parade</strong> pour un anneau de protection, <strong>armure</strong> pour des bracelets d'armure, <strong>armure naturelle</strong> pour une amulette, et <strong>« — pas de CA »</strong> pour tout le reste : des gants de Dextérité +2 (le +2 va à la <em>Dextérité</em>, saisie dans l'onglet Caractéristiques), un bandeau d'Intelligence, une cape de résistance (jets de sauvegarde), des flèches +1. « Pas de CA » est le cas le plus fréquent, et c'est la valeur par défaut.</Row>
          <Row label="Deux bonus du même type ne se cumulent pas">Règle du PHB 3.5 : un anneau de protection +2 et une cape de parade +1 donnent <strong>+2</strong>. La fiche garde le meilleur, affiche l'autre <strong>barré</strong> et nomme celui qui l'emporte. Un bonus d'<strong>armure</strong> d'objet ne se cumule pas non plus avec l'armure portée. Seuls <strong>esquive</strong> et <strong>divers</strong> se cumulent avec tout.</Row>
          <Row label="⚠ Attention aux champs de l'onglet Combat">Les champs <strong>naturelle</strong>, <strong>déflexion</strong> et <strong>divers</strong> entrent dans le même arbitrage que les objets. Si la parade d'un anneau est saisie <em>à la fois</em> dans « déflexion » et sur l'objet, le Grimoire ne la compte qu'une fois — et le panneau de CA dit laquelle des deux il a retenue.</Row>
          <Row label="Charges = 0">L'objet n'a pas de charges (anneaux, capes, bottes, etc.). Aucun compteur n'apparaîtra sur la fiche joueur.</Row>
          <Row label="Charges > 0">Un compteur interactif apparaît sur la fiche joueur, permettant de déduire une charge à chaque utilisation.</Row>
          <Tip>Exemple : un Bâton de soin avec 15 charges restantes → entrez 15 dans Charges. Vous verrez <span className="font-mono text-purple-300 text-xs">15/15 ch. ▶</span> sur la fiche.</Tip>

          <p className="mt-4 font-semibold text-stone-400">Trésor — les 6 monnaies</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
            {[['PP', 'Pièces de Platine', '= 10 PO'], ['PO', "Pièces d'Or", 'référence'], ['PE', "Pièces d'Électrum", '= 5 PA'], ['PA', "Pièces d'Argent", '= 1/10 PO'], ['PC', 'Pièces de Cuivre', '= 1/100 PO'], ['PM', 'Pièces de Mithral', 'monnaie de prestige']].map(([abr, nom, val]) => (
              <div key={abr} className="bg-stone-800/50 rounded p-2">
                <div className="text-amber-300 font-bold text-sm">{abr}</div>
                <div className="text-stone-300 text-xs">{nom}</div>
                <div className="text-stone-600 text-xs">{val}</div>
              </div>
            ))}
          </div>

          <p className="mt-4 font-semibold text-stone-400">Trésor — les gemmes</p>
          <p>Sous les six monnaies, la sous-section <strong className="text-amber-200">Gemmes</strong> permet d&apos;inscrire les pierres précieuses du trésor, une ligne par gemme.</p>
          <Row label="Gemme">Le nom de la pierre — <em>Rubis</em>, <em>Améthyste</em>, <em>Diamant brut</em>… Une ligne vide est simplement ignorée à la sauvegarde.</Row>
          <Row label="Qté">Le nombre de pierres <strong>identiques</strong> sur cette ligne. Trois rubis de même valeur tiennent sur une seule ligne : Qté = 3.</Row>
          <Row label="Valeur">La valeur d&apos;<strong>une seule</strong> pierre, pas du lot. Le total fait la multiplication à votre place.</Row>
          <Row label="Unité">L&apos;unité monétaire de cette valeur : PP, PO, PE, PA, PC ou PM. Une gemme peut donc valoir 25 PO comme 100 PP.</Row>
          <Row label="Note">Champ libre : taille, provenance, gravure, la personne qui l&apos;a trouvée…</Row>
          <Tip>Sous la liste, le <strong>total du trésor en gemmes</strong> est converti en pièces d&apos;or (1 PP = 10 PO, 1 PE = 0,5 PO, 1 PA = 0,1 PO, 1 PC = 0,01 PO). Le <strong>mithral n&apos;a pas de taux de change</strong> dans le Grimoire : les valeurs en PM sont affichées à part plutôt que converties avec un taux inventé.</Tip>
        </Section>

        <Section titre="💰 Le formulaire remplace, le butin ajoute">
          <p>Deux gestes très différents, qu&apos;il vaut mieux ne pas confondre.</p>
          <Row label="Ce formulaire — remplacer">Enregistrer <strong>réécrit</strong> l&apos;équipement du personnage tel qu&apos;il est affiché à l&apos;écran : armes, armures, objets magiques, potions, monnaie et gemmes sont <strong>remplacés</strong> par le contenu des champs. C&apos;est ce qu&apos;il faut pour bâtir une fiche, monter un niveau, corriger une valeur ou <strong>retirer</strong> quelque chose.</Row>
          <Row label="📜 Les parchemins ne sont pas ici">Les parchemins ont leur <strong>propre section sur la fiche</strong> depuis le 25 octobre 2026, et ils ne passent <strong>pas</strong> par ce formulaire : enregistrer une modification ne les touche pas, ni pour les remplacer, ni pour les effacer. On les inscrit et on les retire depuis la fiche, avec <span className="bg-stone-800 border border-stone-700 text-stone-400 px-1.5 py-0.5 rounded text-xs">➕ Ajouter un parchemin</span>. La raison : un parchemin se définit par <strong>le sort qu&apos;il porte</strong> — il se choisit dans la Bibliothèque des 1221 sorts, pas dans une ligne d&apos;équipement.</Row>
          <Row label="Le bouton 💰 Butin — ajouter">Sur la fiche du personnage, en haut de la section Combat, le bouton <span className="bg-amber-900/50 border border-amber-700/70 text-amber-200 px-1.5 py-0.5 rounded text-xs">💰 Butin</span> ouvre un panneau à onglets (Monnaie · Gemmes · Potions · Parchemins · Objets magiques · Armes · Armures) qui <strong>ajoute</strong> à ce qui existe déjà, sans passer par ce formulaire. C&apos;est l&apos;outil de la table : on trouve un trésor, on l&apos;encaisse en trois secondes et on continue à jouer.</Row>
          <Row label="Ce qui se cumule">La monnaie s&apos;additionne à la bourse; un lot de gemmes identiques, une potion déjà en poche et une pile d&apos;armes identiques voient leur quantité augmenter au lieu de créer une deuxième ligne. Chaque objet magique, lui, reste distinct.</Row>
          <Row label="Ce que le butin ne fait pas">Il n&apos;écrit <strong>jamais</strong> de bonus de CA : un objet ramassé va au sac. Quand le personnage le portera vraiment, revenez ici, dans <strong>Objets magiques</strong>, pour renseigner son <strong>Bonus</strong> et sa sorte (<strong>Bonus de</strong>). Il ne retire rien non plus — c&apos;est le rôle de ce formulaire.</Row>
          <Row label="La saisie fait foi">Ce que vous tapez dans une ligne d&apos;équipement est ce qui est enregistré — pour les potions (effet), les armes (dégâts, critique, type, portée), les armures (type, bonus CA, max DEX, malus) et les objets magiques (type, bonus, description). Corriger une valeur ici corrige la <strong>référence partagée du Grimoire</strong> : tous les personnages qui portent le même objet voient la correction. Un champ laissé <strong>vide</strong> ne détruit rien — l&apos;ancienne valeur de la référence est conservée. <strong>Une seule exception</strong> : <strong>Bonus de</strong>, où « — pas de CA » est une réponse et non une absence de réponse. Le remettre sur « pas de CA » retire bien le bonus de la classe d&apos;armure.</Row>
          <Row label="Ligne sans nom = refusée">Une ligne d&apos;équipement (arme, armure, objet, potion, gemme) ou de compagnon dont le champ <strong>Nom</strong> est vide bloque l&apos;enregistrement, avec un message clair. Le texte pâle dans le champ (« Potion de soins », « Épée longue »…) n&apos;est qu&apos;un exemple, pas une valeur : écrivez le nom, ou retirez la ligne avec ✕. Plus rien ne se perd en silence.</Row>
          <Row label="🧪 Potions — le nom se cherche">Dès deux lettres tapées dans le champ <strong>Nom</strong> d&apos;une potion, le Grimoire propose les potions qui correspondent — chacune avec son effet, pour reconnaître la bonne d&apos;un coup d&apos;œil. La recherche pardonne les majuscules, les accents, le singulier/pluriel et les coquilles proches (« posion gran » trouve quand même sa potion), et reconnaît même les vieux noms de table (« grand soin » propose <em>Potion de soins importants</em>). Le catalogue inclut <strong>les potions officielles du Guide du Maître</strong> (sorts de niveau 1 à 3, avec effet, durée et prix). Choisir une suggestion remplit le nom, l&apos;effet et les gorgées depuis la fiche existante — aucun doublon créé; la touche <strong>Entrée</strong> choisit la première suggestion au lieu d&apos;envoyer le formulaire. Inventer une <strong>potion maison</strong> reste tout aussi simple : si rien ne correspond, la ligne <span className="text-emerald-300">➕ Créer « … » comme nouvelle potion</span> le dit noir sur blanc, et votre création rejoint le Grimoire à l&apos;enregistrement.</Row>
          <Row label="Sauvegarde tout-ou-rien">L&apos;enregistrement du personnage est <strong>atomique</strong> : si la connexion casse en plein milieu, rien n&apos;est modifié — la fiche reste exactement comme avant. Il suffit de réessayer.</Row>
          <Tip>Tout ajout par le butin est visible ici à la modification suivante : le panneau écrit dans les mêmes tables que ce formulaire. Attention à l&apos;inverse, en revanche — si vous ouvrez ce formulaire, que quelqu&apos;un encaisse un butin, puis que vous enregistrez, votre écran (plus ancien) écrase l&apos;ajout. Rechargez la page de modification avant d&apos;enregistrer si la partie a continué entre-temps.</Tip>
        </Section>

        <Section titre="💾 Sauvegarder">
          <Row label="Bouton Enregistrer">Disponible en haut <em>et</em> en bas du formulaire. Un seul clic suffit — le formulaire vous redirige automatiquement vers la fiche du personnage après la sauvegarde.</Row>
          <Row label="Validation">Le nom du personnage est le seul champ obligatoire. Tous les autres champs sont optionnels.</Row>
          <Row label="Annuler">Cliquez sur <strong>← Grimoire</strong> en haut à gauche pour revenir à la liste sans sauvegarder.</Row>
          <Tip>Les données sont sauvegardées dans une base PostgreSQL (Neon) — elles sont persistantes et accessibles depuis n'importe quel appareil.</Tip>
        </Section>

        <Section titre="⚔️✨ Onglet Identité — multi-classes">
          <p>Un personnage peut appartenir à plusieurs classes simultanément. Dans la section <strong className="text-amber-200">Classes &amp; Niveaux</strong> :</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Chaque ligne représente une classe avec son niveau.</li>
            <li>Le bouton <strong>+ Ajouter une classe</strong> ajoute une nouvelle entrée.</li>
            <li>Le bouton <strong>✕</strong> (rouge) retire une classe — disponible uniquement si ≥ 2 classes.</li>
            <li>Le <strong>niveau total</strong> affiché est la somme de tous les niveaux de classe.</li>
          </ul>
          <Row label="BBA automatique">Le BBA est recalculé en additionnant la contribution de chaque classe selon sa progression (élevée / moyenne / faible).</Row>
          <Row label="Sauvegardes automatiques">Chaque classe contribue séparément à Vigueur, Réflexes et Volonté selon ses bons jets.</Row>
          <Row label="Sorts multi-classes">L'onglet Sorts ✨ apparaît dès qu'au moins une classe est lanceuse de sorts. Si plusieurs classes lancent des sorts (ex. Prêtre/Magicien), des boutons permettent de basculer entre elles : chaque sort choisi est <strong>attribué à la classe active</strong> et chaque classe a son propre grimoire, ses propres emplacements et sa propre liste sur la fiche.</Row>
          <Row label="Compétences de classe">Dans l'onglet Compétences, une compétence est traitée comme <em>compétence de classe</em> (rang max = niveau total + 3) dès qu'elle l'est pour <strong>au moins une</strong> de vos classes. Exemple : après avoir ajouté Magicien, <em>Connaissances (mystères)</em> et <em>Concentration</em> deviennent compétences de classe pour tout le personnage.</Row>

          <p className="font-semibold text-stone-400 mt-4">Progression des XP en D&D 3.5</p>
          <p>Un personnage multi-classé n'a <strong>qu'un seul total d'XP</strong>, partagé entre toutes ses classes. Les seuils de niveau sont basés sur le <em>niveau total</em> du personnage (somme de tous ses niveaux). Quand le seuil est atteint, le joueur choisit dans quelle classe placer le nouveau niveau.</p>
          <p className="mt-1">En cours de partie, ajoutez l&apos;XP reçue directement depuis la fiche (bouton <strong>⭐ Ajouter de l&apos;XP</strong> sous la barre de progression — voir le Guide du joueur). Le champ <strong>XP</strong> de ce formulaire sert à <em>remplacer</em> le total, par exemple pour corriger une erreur de saisie. La fiche affiche automatiquement les options de prochain niveau, par exemple :</p>
          <div className="bg-stone-800/50 rounded p-2 mt-1 font-mono text-xs text-stone-400">
            → Fighter 4 ou Wizard 3
          </div>
          <p className="mt-2">Quand le seuil est franchi, la fiche propose la montée directement : bouton <strong>🎉 Niveau N atteint — 🆙 Monter de niveau</strong> sous la barre de progression. Le joueur choisit sa classe, lance son dé de vie et inscrit les PV gagnés — le niveau et les PV se mettent à jour, le reste suit (BBA, sauvegardes, emplacements de sorts). Revenez ensuite dans ce formulaire pour les <strong>points de compétence</strong>, un éventuel <strong>don</strong> (niveaux 3, 6, 9…) ou le <strong>+1 de caractéristique</strong> (niveaux 4, 8, 12…). Pour prendre une <strong>nouvelle classe</strong> (multi-classage), passez par <strong>+ Ajouter une classe</strong> ici même.</p>

          <p className="font-semibold text-stone-400 mt-4">Pénalité d'XP multi-classes</p>
          <p>Si l'écart entre vos niveaux de classe dépasse 1 (en ignorant la classe préférée raciale), vous perdez <strong>20 % des XP gagnés par classe en retard</strong>. Ce calcul s'effectue automatiquement dans cet onglet.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs mt-1">
            <li>Écart de 0 ou 1 niveau entre les classes → <strong>aucune pénalité</strong>.</li>
            <li>Écart ≥ 2 niveaux → <strong>−20 %</strong> par classe concernée (max −40 %).</li>
            <li>La classe préférée raciale est <strong>entièrement ignorée</strong> dans ce calcul.</li>
          </ul>

          <p className="font-semibold text-stone-500 text-xs mt-3">Humains et Demi-Elfes — classe préférée automatique</p>
          <p className="text-xs">Ces races choisissent librement leur classe préférée. Le système désigne automatiquement la <strong>classe la plus haute comme préférée</strong>, ce qui est le choix optimal. Conséquence importante : un Guerrier 6 qui ajoute Magicien 1 n'a <strong>aucune pénalité</strong> — le Guerrier est exempté du calcul, et le Magicien n'a pas d'autre classe non-préférée à laquelle se comparer.</p>
          <p className="text-xs mt-1 text-stone-500">La pénalité n'apparaît pour un humain que si deux classes secondaires (toutes deux derrière la classe principale) présentent un écart entre elles — ex. Guerrier 6 / Magicien 3 / Roublard 1 : Magicien et Roublard sont non-préférés, Roublard est 2 niveaux derrière Magicien → −20 %.</p>
          <Tip>Le message vert <strong>✓ Pas de pénalité XP · Classe préférée : Guerrier (auto — la plus haute)</strong> s'affiche pour confirmer quelle classe est exemptée. S'il devient orange ⚠, avancez la classe en retard au prochain niveau.</Tip>
        </Section>

        <Section titre="🏛 Classes de prestige">
          <p>Le menu des classes contient maintenant <strong className="text-amber-200">98 classes de prestige</strong> : Guide du Maître (15 — Archimage, Assassin, Chevalier noir, Théurge mystique…), Codex Divin (24), Codex Profane (19), Les Maîtres de la Nature (18), Manuel des Joueurs de Faerûn (18 + 2 classes <strong className="text-violet-300">épiques</strong>) et Les Royaumes Oubliés (2 — Adepte des ombres, Voleur de guilde). Elles apparaissent dans le groupe <strong>« Classes de prestige »</strong> du sélecteur, avec leur livre d'origine entre parenthèses.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
            <li>Une classe de prestige se <strong>superpose toujours à une classe de base</strong> : ajoutez-la comme classe supplémentaire (ex. Magicien 7 / Incantatrixe 3).</li>
            <li>Dès qu'une classe de prestige est sélectionnée, un <strong className="text-violet-300">encadré violet 🏛</strong> affiche ses conditions d'accès, son maximum de niveaux, sa progression de sorts et un résumé de ses pouvoirs, avec la page du livre pour les détails complets.</li>
            <li>Le BBA, les sauvegardes, le dé de vie et les compétences de classe sont calculés automatiquement, comme pour les classes de base.</li>
          </ul>
          <Row label="Progression de sorts (+1 niveau de lanceur)">Beaucoup de classes de prestige font progresser les sorts d'une classe de base existante. Le système ajoute automatiquement ces niveaux au calcul des emplacements : un Prêtre 7 / Disciple divin 3 prépare ses sorts comme un Prêtre 10. Les progressions partielles (ex. « un niveau sur deux ») sont respectées selon la table du livre.</Row>
          <Row label="Classes à sorts propres">Certaines classes (Prêtre déicide, Croisé divin, Accord sublime, Arcanamach suellois…) ont leur <em>propre</em> table de sorts : consultez la page du livre indiquée dans l'encadré et gérez ces sorts avec « Ajouter un sort personnalisé » sur la fiche.</Row>
          <Tip>Les conditions d'accès (BBA minimal, rangs de compétences, dons requis) relèvent du Maître de jeu — le système les affiche mais ne les bloque pas.</Tip>
          <Row label="Jeu épique (niveau 21+)">Le Manuel des Joueurs de Faerûn (p.127-138) ajoute le <strong>jeu épique</strong> : deux classes de prestige réservées aux personnages de niveau 21+ (<strong>Arcaniste nétherisse</strong> et <strong>Hiérophante magefeu</strong>), la progression des niveaux 11-20 de huit classes MJF à 10 niveaux (indiquée « Épique » dans leur résumé : dons épiques réguliers, pouvoirs qui continuent de croître, niveau de lanceur +1/niveau mais quota de sorts figé), <strong>11 dons épiques</strong> (onglet Dons, mention « Don épique ») et <strong>7 sorts épiques</strong> lancés par test d'Art de la magie (mention « Sort épique » au catalogue). Règle épique : au-delà du niveau 20, le BBA et les sauvegardes de classe cessent de progresser — on gagne +1 de bonus épique à l'attaque et aux sauvegardes tous les 2 niveaux, à ajuster manuellement sur la fiche. Côté <strong>XP</strong>, il n'y a <strong>aucun plafond</strong> : la fiche affiche le seuil du prochain niveau au-delà du 20 comme en deçà (niv. 21 = 210 000, niv. 25 = 300 000, niv. 30 = 435 000 — <em>Epic Level Handbook</em>, table 1-2, p. 7), et la formule se prolonge indéfiniment ensuite.</Row>
        </Section>

        <Section titre="📐 Rang maximum de compétence">
          <p>Dans l'onglet Compétences, chaque rang dispose d'un maximum légal selon les règles D&D 3.5 :</p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-stone-800/50 rounded p-3">
              <div className="text-amber-300 font-semibold text-sm">Compétence de classe <span className="text-amber-600">●</span></div>
              <div className="font-mono text-stone-300 mt-1">Rang max = niveau total + 3</div>
              <div className="text-stone-500 text-xs mt-1">Ex. Guerrier niv.3 → max 6 rangs</div>
            </div>
            <div className="bg-stone-800/50 rounded p-3">
              <div className="text-stone-300 font-semibold text-sm">Compétence hors-classe <span className="text-stone-600">○</span></div>
              <div className="font-mono text-stone-300 mt-1">Rang max = (niveau total + 3) / 2</div>
              <div className="text-stone-500 text-xs mt-1">Ex. Guerrier niv.3 → max 3 rangs</div>
            </div>
          </div>
          <p className="mt-2">Le champ Rangs affiche <span className="font-mono text-stone-400">/N</span> (ex. /7) pour rappeler visuellement le maximum. L'input refuse silencieusement toute valeur dépassant le plafond.</p>
          <Tip>Une compétence est considérée <em>de classe</em> dès qu'elle l'est pour <strong>au moins une</strong> de vos classes. En multi-classes, la liste des compétences de classe s'élargit automatiquement.</Tip>
          <Tip>Les listes de compétences de classe des <strong>onze classes de base</strong> ont été relevées au Manuel et corrigées : le barbare n&apos;a ni Détection ni Déplacement silencieux, le prêtre et le paladin n&apos;ont ni Détection ni Perception auditive, le magicien n&apos;a pas Fouille, le rôdeur n&apos;a ni Acrobaties ni Équilibre ni Art de la magie. À l&apos;inverse, <strong>Artisanat</strong> et <strong>Profession</strong> sont compétences de classe pour presque toutes les classes, le moine et le roublard ont <strong>Représentation</strong>, et le barde a Escalade, Natation et Saut. Au total, 19 statuts en trop ont été retirés et 16 oubliés ajoutés. Les <strong>rangs déjà saisis ne sont jamais effacés</strong> : le plafond ne joue qu&apos;à la saisie.</Tip>
          <Tip>Les <strong>points de compétence par niveau</strong> du <strong>druide</strong> et du <strong>moine</strong> étaient à 2 au lieu de <strong>4</strong> : corrigés. Un druide ou un moine en création dispose donc du double de points qu&apos;auparavant — (4 + mod. d&apos;Int) × 4 au niveau 1.</Tip>
          <Tip><strong>Connaissance de la magie</strong> n&apos;est plus proposée : fusionnée dans <strong>Art de la magie</strong> le 8 octobre 2026 sur décision du Maître de jeu, parce que c&apos;était la même compétence sous un ancien nom de table. Les rangs des sept personnages concernés ont suivi — et pour les cinq qui portaient déjà les deux lignes, le <strong>plus élevé des deux chiffres</strong> a été conservé.</Tip>
          <Tip>Chaque compétence porte un <strong>📖</strong> sur la fiche de personnage : il ouvre sa règle complète à la Grande Bibliothèque — DD de chaque tâche, action nécessaire, nouvelles tentatives, synergies et test inné. Le nouveau <strong>rayon Compétences</strong> les réunit toutes les 36.</Tip>
        </Section>

        <Section titre="🆕 Nouvelles références — l'avertissement">
          <p>Quand vous tapez à la main un nom de compétence, de don, d'arme, d'objet ou de divinité, le Grimoire cherche d'abord une entrée existante. La recherche <strong>ignore la casse, les accents et les espaces en trop</strong> : <em>equitation</em>, <em>Équitation</em> et <em>Équitation&nbsp;&nbsp;</em> désignent la même compétence et ne créent pas trois entrées.</p>
          <p className="mt-2">Si aucune entrée ne correspond, elle est créée — mais <strong>plus en silence</strong> : après la sauvegarde, un bandeau liste les références nouvellement créées et vous laisse revenir les corriger avant de quitter le formulaire.</p>
          <Tip>La ponctuation, elle, compte&nbsp;: <em>Connaissances (mystères)</em> et <em>Connaissances (nature)</em> restent deux compétences distinctes, tout comme <em>Artisanat (armes)</em> et <em>Artisanat (armures)</em>. Si le bandeau signale une création que vous n'attendiez pas, c'est presque toujours une variante d'un nom qui existe déjà : corrigez-la plutôt que de la garder.</Tip>
        </Section>

        <Section titre="📚 La Grande Bibliothèque — vérifier une référence avant de la saisir">
          <p>Avant de taper le nom d'un sort, d'une arme, d'un objet magique ou d'un don, <strong className="text-amber-200">La Grande Bibliothèque</strong> (depuis la page d'accueil) permet de retrouver l'orthographe officielle et la fiche complète de chaque référence du Grimoire — sorts par école ou par classe (magie profane, divine, ou une classe précise) et triables par niveau, objets magiques par type, potions avec leur effet.</p>
          <Row label="⚔️ Les armes du Manuel">Le rayon Armes porte les <strong>78 entrées</strong> de la table 7-5 : nom officiel VF, prix, dégâts (taille M et taille P), zone de critique, facteur de portée, poids, type de dégâts et le <strong>texte des règles du Manuel</strong> — les <strong>78 fiches</strong> le portent, les six qui gardaient encore une note abrégée comprises. Le filtre sépare les armes <em>courantes</em>, <em>de guerre</em> et <em>exotiques</em> — regardez-y avant de choisir une arme, c&apos;est cette catégorie qui dit si votre personnage a besoin du don <em>Maniement d&apos;une arme de guerre</em> ou <em>d&apos;une arme exotique</em>.</Row>
          <Tip>Saisir le nom exact tel qu'il apparaît dans la Bibliothèque évite de créer une variante en double — le bandeau des nouvelles références reste votre filet, mais autant viser juste du premier coup.</Tip>
          <Tip>Au rayon Armes, les dégâts affichés sont ceux de l&apos;arme nue. Sur une fiche de personnage, c&apos;est normal d&apos;y ajouter le bonus magique et le modificateur de Force — le Grimoire fait ce calcul pour vous dans la section Armes.</Tip>
          <Row label="📖 Les livres sources, consultables en entier">Le rayon <strong>📖 Livres</strong> de la Grande Bibliothèque contient les quatre volumes de l&apos;<strong>Encyclopedia Magica</strong>, avec un lecteur et le téléchargement. ⚠ Ils sont <strong>en anglais</strong>, et ce sont des recueils d&apos;<strong>AD&amp;D 2<sup>e</sup> édition</strong> : un objet qu&apos;on y trouve n&apos;est pas une entrée de la 3.5. Plusieurs pièces de la campagne en viennent — le <em>Carquois de flèches</em> de Cormac, <em>Catspaw</em>, la <em>Baguette d&apos;inertie</em> — et c&apos;est pourquoi aucun relevé dans les livres de la 3<sup>e</sup> édition ne les trouvait. Quand vous saisissez une de ces pièces, c&apos;est le MJ qui en donne l&apos;effet. La <strong>recherche</strong> fonctionne dans les quatre volumes (celle du volume 3 a été refaite le 10 octobre 2026).</Row>
          <Row label="📖 Du nom décoré à l&apos;arme du Manuel">Les lignes d&apos;équipement portent souvent un nom décoré — bonus magique, mode d&apos;attaque, quantité de munitions : « Dague +2 (mêlée) », « Longbow +3, rapid shot », « Arbalète légère (20 carreaux) ». Chacune est rattachée à l&apos;entrée du catalogue qu&apos;elle désigne, et le <strong>📖</strong> affiché à côté du nom sur la fiche ouvre les règles officielles. Le rattachement a été établi <strong>nom par nom</strong>, à la main : un nom anglais ou une coquille (<em>Batlleaxe</em> → <em>Hache d&apos;armes</em>, <em>Bastard sword</em> → <em>Épée bâtarde</em>) est reconnu, et quand un nom seul reste ambigu, c&apos;est le <strong>dé de dégâts</strong> qui tranche — jamais le total, qui inclut le modificateur de Force du porteur.</Row>
          <Tip>Rien n&apos;est deviné. Une ligne trop imprécise pour être identifiée — « Arc » sans dégâts, « Arbalette +1 (20 carreaux) » — reste sans 📖 plutôt que de pointer vers la mauvaise arme. En nommant une arme dans l&apos;orthographe du rayon Armes, vous lui donnez son lien du premier coup.</Tip>
          <Row label="Quand le dé tranche contre le nom">Dix lignes ont demandé un arbitrage, et le <strong>dé</strong> l&apos;a emporté sur le nom à chaque fois : « Hache de guerre +1 (focus) » fait <strong>1d8</strong> — c&apos;est la <em>hache d&apos;armes</em> (arme de guerre), pas la <em>hache de guerre naine</em> qui fait 1d10 et demande le maniement d&apos;une arme exotique. « Arbalette de ___ » fait 1d4 : l&apos;<em>arbalète de poing</em>. « Fléchettes » fait 1d4 chez un moine sans arbalète : le <em>Dard</em>. Le reste de l&apos;inventaire du personnage, sa classe et sa race servent de contrôle — un rattachement seulement « probable » fabriquerait une illégalité de personnage.</Row>
          <Row label="🔮 Les objets magiques du Guide du Maître">Le rayon Objets magiques porte <strong>674 entrées de référence</strong> — les 467 objets du chapitre 7 du <strong>Guide du Maître</strong> et 204 pièces des suppléments relevés — toutes avec leur aura, leur niveau de lanceur, leur prix et le texte de leurs règles. Cherchez-y l&apos;orthographe officielle avant de nommer un objet : « Gants de Dextérité +2 » existe au catalogue, « Gants de dextérité » sans bonus crée une ligne de plus que personne ne pourra chiffrer.</Row>
          <Tip>Une entrée marquée <strong>🗃️</strong> n&apos;est pas une règle du livre mais une ligne venue des anciennes fiches — « 75 flèches », « Catspaw », un parchemin écrit par le Maître de jeu. Sa fiche le dit à la rubrique <em>Provenance</em>. En saisissant un objet, préférez le nom d&apos;une entrée sans 🗃️ : c&apos;est celle qui porte les règles.</Tip>
          <Tip>Le <strong>bonus est une donnée, pas une décoration</strong> : la série du Guide du Maître va du +1 au +5 et chaque modèle a son prix (l&apos;anneau de protection : 2 000, 8 000, 18 000, 32 000 et 50 000 po). Nommer l&apos;objet avec son bonus — « Anneau de protection +3 » — donne une fiche utilisable à la table; sans lui, le modèle reste à deviner.</Tip>
          <Tip><strong>Deux écritures du même objet font deux lignes</strong>, et le Grimoire ne peut pas les deviner identiques. Trois paires ont été fusionnées le 9 octobre 2026 sur décision du Maître de jeu — <em>Anneau de jade +2</em> / <em>Anneau de jade</em>, <em>Anneaux protection +2</em> / <em>Anneau de protection +2</em>, <em>Gants de dextérité</em> / <em>Gantelets de dextérité +2</em> — et c&apos;est à chaque fois la ligne <strong>portant le bonus</strong> qui a été conservée. Avant de taper un nom d&apos;objet, vérifiez au rayon s&apos;il n&apos;y existe pas déjà sous une autre orthographe.</Tip>
          <Tip>Le détour ne coûte rien : la fiche de référence ouverte par un <strong>📖</strong> porte un bouton <strong>← Retour à [nom du personnage]</strong>, en haut et en bas. On vérifie une règle et on revient d&apos;un clic, sans perdre sa place.</Tip>
          <Tip>Les sorts du Manuel des Joueurs affichent maintenant leur fiche complète (portée, durée, jet de sauvegarde, texte des règles) : de quoi vérifier qu'un sort convient au personnage avant de l'inscrire à sa liste.</Tip>
        </Section>

        <Section titre="⚔️ Malus d'armure sur les compétences">

          <p>Certaines armures imposent un <strong>malus de compétence</strong> (Armor Check Penalty) qui s'applique automatiquement sur la fiche joueur aux compétences physiques suivantes :</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['Acrobaties', 'Discrétion', 'Déplacement silencieux', 'Escalade', 'Évasion', 'Natation', 'Saut', 'Escamotage'].map(c => (
              <span key={c} className="bg-stone-800 border border-stone-700 text-stone-300 text-xs px-2 py-0.5 rounded">{c}</span>
            ))}
          </div>
          <p className="mt-2">Sur la fiche, le total de la compétence apparaît en <span className="text-red-400">rouge</span> et un indicateur <span className="text-red-500 font-mono">−N⚔</span> précise le malus appliqué. Les armures se cumulent si plusieurs sont portées.</p>
          <Tip>La valeur Malus compétences de chaque armure est affichée dans le bloc armure portée sur la fiche. Le risque d'échec arcanique (%) est aussi visible pour les lanceurs de sorts arcaniques (Magicien, Ensorceleur, Barde).</Tip>
        </Section>

        <Section titre="🎓 Capacités de classe — affichage automatique">
          <p>La fiche joueur affiche automatiquement les <strong>capacités de classe acquises</strong> jusqu'au niveau actuel du personnage. Ces capacités sont listées dans la section <em>Capacités de classe</em> sous les compétences et dons.</p>
          <p className="mt-2">Exemples de capacités affichées automatiquement :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
            {[
              ['Barbare', 'Rage, Déplacement accéléré, Résistance au danger…'],
              ['Roublard', 'Attaque sournoise, Chercher les pièges, Esquive totale…'],
              ['Paladin', 'Imposition des mains, Détection du mal, Monture spéciale…'],
              ['Moine', 'Attaque à mains nues, Défense sans armure, Corps de diamant…'],
              ['Druide', 'Forme sauvage, Empathie sauvage, Compagnon animal…'],
              ['Prêtre', 'Renvoi des morts-vivants, Domaines, Sorts spontanés…'],
            ].map(([classe, caps]) => (
              <div key={classe} className="bg-stone-800/40 rounded px-3 py-2 text-xs">
                <span className="text-amber-300 font-medium">{classe}</span>
                <span className="text-stone-500 ml-2">{caps}</span>
              </div>
            ))}
          </div>
          <Tip>Le niveau indiqué (niv.X) sur chaque capacité correspond au niveau de classe requis pour l'acquérir. En multi-classes, les capacités de chaque classe sont affichées séparément.</Tip>
        </Section>

        <Section titre="🖼️ Photo de portrait">
          <Row label="Comment ajouter">Depuis la fiche joueur, cliquez sur le portrait ou la silhouette grise. Collez l'URL d'une image (JPG, PNG, WebP).</Row>
          <Row label="Format affiché">Portrait 2:3, ancré en haut pour toujours montrer le visage.</Row>
          <Row label="Dans le PDF">La photo est affichée dans l'en-tête de la feuille imprimée (95×130 px, à droite).</Row>
        </Section>

      </main>
    </div>
  )
}
