import Link from 'next/link'

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="bg-stone-900/60 border border-stone-800 rounded-xl p-6 mb-4">
      <h2 className="text-amber-400 font-bold text-lg mb-4 flex items-center gap-2">{titre}</h2>
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 font-semibold text-stone-400 w-40">{label}</span>
      <span>{children}</span>
    </div>
  )
}

export default async function AideJoueur({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams
  const retour = from?.startsWith('/personnage/') ? from : '/'
  const labelRetour = from?.startsWith('/personnage/') ? '← Retour à la fiche' : '← Grimoire D&D 3e édition'
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
          <div className="flex flex-col items-end gap-1">
            <Link href="/aide/creation" className="text-stone-500 hover:text-amber-300 text-xs transition-colors">
              Aide — Création / Modification →
            </Link>
            <Link href="/aide/mj" className="text-stone-500 hover:text-amber-300 text-xs transition-colors">
              Aide — Maître de jeu →
            </Link>
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-4">
          <h1 className="text-3xl font-bold text-amber-300">Guide du joueur</h1>
          <p className="text-stone-500 text-sm mt-1">Comment utiliser la fiche de personnage pendant une séance de jeu</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

        <Section titre="🗡️ Armes — bonus automatiques d'attaque et de dégâts">
          <p>La section <strong className="text-amber-200">Armes</strong> calcule automatiquement les totaux d'attaque et de dégâts en tenant compte de vos caractéristiques, de votre magie et de vos dons. Une ligne de détail affiche la décomposition complète.</p>
          <Row label="Total d'attaque">BAB + modificateur (FOR mêlée / DEX distance) + bonus magique de l'arme + bonus munitions + bonus de dons.</Row>
          <Row label="Total de dégâts">Dés de base + bonus magique de l'arme + bonus munitions + FOR (mêlée ou arc composite, plafonné à la côte) + bonus de dons.</Row>

          <p className="font-semibold text-stone-400 mt-2">Arc composite — règles spéciales</p>
          <p>Un arc composite n'est <strong>pas</strong> un arc magique par défaut. Le <span className="text-amber-300 font-mono">+N</span> dans son nom est la <strong>côte de Force</strong> : elle plafonne le bonus FOR ajouté aux dégâts.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
            <li>Si votre FOR mod ≤ côte → vous ajoutez votre FOR réel aux dégâts.</li>
            <li>Si votre FOR mod &gt; côte → le bonus dégâts est plafonné à la côte.</li>
            <li>La côte n'affecte <strong>pas</strong> le jet d'attaque (qui utilise DEX comme toute arme à distance).</li>
          </ul>
          <p className="mt-1 text-xs">Sur la fiche, l'arc s'affiche <span className="font-mono text-stone-300">Arc long composite (Force +3)</span> pour distinguer côte et magie. Un arc à la fois composite ET magique s'afficherait <span className="font-mono text-stone-300">Arc long composite (Force +3) +2</span>.</p>

          <p className="font-semibold text-stone-400 mt-2">Flèches et munitions magiques</p>
          <p>Les flèches magiques (flèches +1, +2, etc.) s'ajoutent <strong>à la fois à l'attaque et aux dégâts</strong>. Elles apparaissent dans le détail sous l'étiquette <span className="font-mono text-stone-300">fl.</span>. Il n'est pas nécessaire de créer une entrée d'arme séparée pour les flèches — le champ <strong>Munitions +Mag</strong> dans le formulaire suffit.</p>

          <p className="font-semibold text-stone-400 mt-2">Dons reconnus automatiquement</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
            <div className="bg-stone-800/50 rounded px-3 py-2 text-xs"><span className="text-amber-300 font-medium">Arme de prédilection (arme)</span><br/>+1 à l'attaque avec l'arme indiquée</div>
            <div className="bg-stone-800/50 rounded px-3 py-2 text-xs"><span className="text-amber-300 font-medium">Maîtrise martiale supérieure (arme)</span><br/>+1 attaque supplémentaire</div>
            <div className="bg-stone-800/50 rounded px-3 py-2 text-xs"><span className="text-amber-300 font-medium">Spécialisation martiale (arme)</span><br/>+2 aux dégâts avec l'arme indiquée</div>
            <div className="bg-stone-800/50 rounded px-3 py-2 text-xs"><span className="text-amber-300 font-medium">Spécialisation martiale supérieure (arme)</span><br/>+2 dégâts supplémentaires</div>
            <div className="bg-stone-800/50 rounded px-3 py-2 text-xs sm:col-span-2"><span className="text-amber-300 font-medium">Tir à bout portant</span><br/>+1 attaque et dégâts pour toutes les armes à distance, à portée ≤9m (affiché avec * dans le détail)</div>
          </div>
          <Tip>Pour qu'un don s'applique à une arme précise, son nom dans la liste des dons doit inclure le nom exact de l'arme entre parenthèses — ex. <span className="font-mono">Arme de prédilection (arc long composite)</span>. La casse et les accents sont ignorés.</Tip>
        </Section>

        <Section titre="🔍 « Pourquoi +7 ? » — le détail de chaque chiffre">
          <p>Chaque grand chiffre de la fiche est <strong>touchable</strong> : un panneau s'ouvre et montre la <strong>décomposition complète du calcul</strong>, ligne par ligne, selon les règles 3.5. Vous lancez votre vrai d20 — la fiche vous dit exactement quoi additionner, et surtout <em>pourquoi</em>.</p>
          <Row label="Classe d'armure">10 de base + armure + bouclier + DEX (plafonnée par l'armure, avec la valeur réelle en note) + armure naturelle + déflexion + divers + objets magiques (nommés un à un) + chaque sort actif par son nom.</Row>
          <Row label="Initiative">Modificateur de DEX + dons + bonus divers. <strong>Science de l'initiative (+4) est comptée automatiquement</strong> dès que le don figure sur la fiche — n'entrez pas son bonus dans « divers », qui ne sert plus qu'aux objets (ex. un heaume).</Row>
          <Row label="Jets de sauvegarde">Base des classes + caractéristique (DEX pour Réflexes, CON pour Vigueur, SAG pour Volonté) + dons + bonus magique. <strong>Vigueur surhumaine, Réflexes surhumains et Volonté de fer (+2) sont comptés automatiquement</strong>, chacun sur sa propre ligne.</Row>
          <Row label="Dons comptés tout seuls">La fiche reconnaît les dons à bonus permanent et les additionne elle-même : Science de l'initiative (+4), les trois dons de sauvegarde (+2), Vigilance (+2 Détection et Perception auditive), Robustesse (+3 sur la plage de PV attendus). Esquive (+1) et Mobilité (+4) apparaissent dans le panneau de CA <em>entre parenthèses</em> : ils sont conditionnels — c'est vous qui les ajoutez à la table quand la condition s'applique, la fiche ne les met jamais dans le total.</Row>
          <Row label="Attaques">Bonus de base (BAB) + FOR en mêlée ou DEX à distance. Quand le BAB atteint 6, une note rappelle la règle des attaques multiples (chacune à −5 de la précédente).</Row>
          <Row label="Armes — attaque">Touchez le <span className="text-amber-300 font-mono text-xs">+9/+5</span> d'une arme : BAB (avec la règle des attaques multiples en note — la séquence vient du BAB seul, tous les bonus s'appliquent à chaque attaque) + FOR ou DEX + arme magique + munitions magiques + dons (Arme de prédilection, Tir à bout portant…).</Row>
          <Row label="Armes — dégâts">Touchez les dégâts : dé de l'arme + FOR (plafonnée par la côte de Force sur un arc composite, absente sur les autres armes à distance) + magie + dons. Les bonus conditionnels (Tir à bout portant à 9 m ou moins) portent leur condition en note.</Row>
          <Row label="Compétences">Touchez le total d'une compétence : rangs investis + caractéristique + dons (ex. Vigilance) + divers + malus d'armure s'il s'applique.</Row>
          <Row label="Fermer le panneau">Touchez n'importe où ailleurs, ou appuyez sur <kbd className="bg-stone-700 px-1 rounded">Échap</kbd>.</Row>
          <Tip>Un liséré doré apparaît au survol des chiffres décomposables. Le panneau n'est pas un lanceur de dés : il explique le modificateur, le d20 reste dans votre main. C'est aussi la meilleure façon d'apprendre les règles — chaque ligne du calcul vient du Manuel des Joueurs.</Tip>
        </Section>

        <Section titre="⚔️ Points de vie — suivi en temps réel">
          <p>Le bloc <strong className="text-amber-200">PV</strong> dans la section Combat affiche vos points de vie actuels sur vos points maximum (ex. <span className="font-mono text-green-400">18 / 26</span>) ainsi qu'une barre de couleur :</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><span className="text-green-400 font-semibold">Vert</span> — plus de 50 % des PV</li>
            <li><span className="text-amber-400 font-semibold">Jaune</span> — entre 25 % et 50 %</li>
            <li><span className="text-red-400 font-semibold">Rouge</span> — moins de 25 %</li>
          </ul>
          <Row label="Recevoir des dégâts">Cliquez <span className="bg-red-900/40 text-red-300 px-1.5 py-0.5 rounded text-xs font-mono">⚔ −</span>, entrez le nombre de points perdus, puis appuyez sur <kbd className="bg-stone-700 px-1 rounded">Entrée</kbd> ou cliquez <strong>OK</strong>.</Row>
          <Row label="Recevoir des soins">Cliquez <span className="bg-green-900/40 text-green-300 px-1.5 py-0.5 rounded text-xs font-mono">✚ +</span>, entrez le nombre de points récupérés, puis validez.</Row>
          <Row label="Annuler la saisie">Appuyez sur <kbd className="bg-stone-700 px-1 rounded">Échap</kbd> ou cliquez <span className="font-mono text-stone-500">✕</span>.</Row>

          <p className="font-semibold text-stone-400 mt-3">PV négatifs — mourant et mort (règle 3.5)</p>
          <p>Les PV peuvent descendre <strong>sous zéro</strong>, jusqu'à −10. Entre <span className="font-mono text-red-400">−1</span> et <span className="font-mono text-red-400">−9</span>, le personnage est <span className="text-red-500 font-semibold">🩸 mourant</span> : il perd 1 PV par round tant qu'il n'est pas <strong>stabilisé</strong> (jet de stabilisation, Premiers secours DD 15 ou soins magiques). À <span className="font-mono text-red-400">−10</span>, il est <span className="text-red-500 font-semibold">☠ mort</span>. Le Grimoire affiche l'état sous la barre de vie — c'est au Maître de jeu de trancher, et au prêtre de soigner !</p>

          <p className="font-semibold text-stone-400 mt-3">🌙 Nuit de repos — guérison naturelle</p>
          <p>Le bouton <span className="bg-stone-800 border border-stone-600 text-stone-300 px-1.5 py-0.5 rounded text-xs">🌙 Nuit de repos</span> en haut de la section Combat applique une nuit de sommeil (8 heures) selon la règle 3.5 : le personnage récupère <strong>1 PV par niveau</strong> (toutes classes confondues — un Prêtre 7 / Disciple divin 3 récupère 10 PV). L'action est <strong>journalisée</strong> dans la chronique. Deux nuits de repos = deux clics.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-1 text-xs">
            <li><strong>PV au maximum</strong> : la nuit est quand même notée au journal — le repos compte pour préparer les sorts.</li>
            <li><strong>PV négatifs</strong> : <strong>aucune guérison naturelle</strong> — le personnage doit d'abord être stabilisé et soigné. La nuit est notée au journal, mais les PV ne bougent pas.</li>
            <li>Les <strong>effets de sorts actifs</strong> ne sont pas retirés automatiquement (temps de jeu ≠ temps réel) — utilisez le ✕ de chaque étiquette.</li>
          </ul>
          <Tip>Le magicien doit dormir 8 heures <em>avant</em> d'étudier son grimoire : cliquez 🌙 Nuit de repos, puis 📖 Étudier. Le prêtre, lui, prie à heure fixe (l'aube en général) — aucun repos requis : son bouton 🙏 Prier reste indépendant. Les PV sont sauvegardés automatiquement en base de données.</Tip>
        </Section>

        <Section titre="📜 Journal de partie — la chronique s'écrit toute seule">
          <p>Chaque action posée sur la fiche laisse automatiquement une trace dans le <strong className="text-amber-200">journal de partie</strong> : dégâts et soins, sorts lancés, potions bues, charges d'objets, effets retirés, nuits de repos, préparation des sorts… <strong>Vous n'avez rien à faire de plus</strong> — jouez normalement avec les boutons de la fiche.</p>
          <Row label="Consulter le journal">Cliquez <span className="bg-stone-800 border border-stone-600 text-stone-300 px-1.5 py-0.5 rounded text-xs">📜 Journal</span> en haut de la section Combat. Un panneau s'ouvre avec la chronologie : une ligne par action, avec l'heure, <strong>la plus récente en haut</strong>, regroupées par journée de jeu (une soirée qui déborde après minuit reste dans la même journée).</Row>
          <Row label="Noter une attaque">Au bout de chaque arme, le bouton <span className="bg-amber-900/40 border border-amber-800/40 text-amber-400 px-1.5 py-0.5 rounded text-xs font-mono">⚔ attaque</span> note votre attaque au journal : choisissez <span className="text-green-400">✓ touché</span> ou <span className="text-red-400">✗ raté</span>, entrez les dégâts infligés (optionnel), puis <strong>OK</strong> ou <kbd className="bg-stone-700 px-1 rounded">Entrée</kbd>.</Row>
          <Row label="Rounds de combat">Les combats sont <strong>menés par le Maître de jeu</strong> depuis la page <span className="font-mono text-stone-300">/partie</span> : il lance le combat avec l&apos;<strong>ordre d&apos;initiative</strong> (chacun lance son vrai d20, il entre les résultats — le modificateur de votre fiche s&apos;ajoute tout seul), fait avancer les tours, et clôt avec <span className="bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded text-xs">🕊 Fin du combat</span> (fin du <em>combat</em>, pas de la partie — le jeu libre reprend). Début, rounds et fin s&apos;inscrivent dans le journal de chaque fiche.</Row>
          <Row label="🎲 Bandeau d'initiative">Pendant un combat où votre personnage figure, un <strong>bandeau en haut de votre fiche</strong> montre le round, à qui c&apos;est le tour et dans combien de tours vient le vôtre — puis <strong>« 🎲 C&apos;est ton tour ! »</strong> le moment venu. Préparez votre action en le voyant approcher ! Le bandeau se met à jour tout seul et disparaît à la fin du combat.</Row>
          <Row label="✏️ Note d'aventure">En haut du panneau du journal, l'icône <span className="bg-stone-800 border border-stone-600 px-1.5 py-0.5 rounded text-xs">✏️</span> ouvre une zone de texte : notez un indice, un PNJ rencontré, une décision du groupe. La note est <strong>datée, horodatée et signée du nom de votre personnage</strong>, puis <strong>partagée avec toute la table</strong> : elle apparaît, surlignée en ambre, dans le journal de chaque fiche, dans la vue du MJ et dans les faits saillants des parties précédentes. <kbd className="bg-stone-700 px-1 rounded">Ctrl+Entrée</kbd> publie (jusqu'à 4000 caractères). Vous pouvez effacer <strong>vos propres notes</strong> avec le ✕ — pas celles des autres personnages (le MJ, lui, peut tout effacer depuis sa vue).</Row>
          <Row label="📷 Photo de la table">Le Maître de jeu peut ajouter une <strong>photo de la map</strong> au journal (souvent en fin de partie, pour garder la position du groupe). Elle apparaît dans la chronologie de votre fiche comme dans sa vue — touchez-la pour l'ouvrir en grand. Seul le MJ peut l'effacer.</Row>
          <Row label="Effacer une entrée">Touchez le <span className="font-mono text-stone-500">✕</span> au bout de la ligne, puis confirmez. Cela efface la trace au journal mais <strong>n'annule pas l'action</strong> (les PV dépensés le restent). Le ✕ n'apparaît que sur vos propres entrées et les marqueurs de table.</Row>
          <Row label="Vue du Maître de jeu">La page <span className="font-mono text-stone-300">/partie</span> (lien au bas du panneau ou sur l'accueil) fusionne les journaux de <strong>tous les personnages</strong> de la soirée : le MJ y suit la partie round par round, et peut masquer un personnage d'un clic sur sa pastille. Les personnages présents sont détectés automatiquement — aucune configuration. Sur la journée courante, la page est <strong>en direct</strong> (pastille verte) : elle se met à jour toute seule toutes les 5 secondes (en pause pendant que le MJ rédige une note), et un <strong>tableau de bord des PV du groupe</strong> (barres de vie cliquables) montre l'état de chacun en un coup d'œil.</Row>
          <Row label="Bilan de combat">Quand le MJ clique <span className="bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded text-xs">🕊 Fin du combat</span>, un <strong>🏆 bilan automatique</strong> s'inscrit dans la chronique : nombre de rounds, dégâts infligés (touchés/ratés), dégâts subis et sorts lancés par chaque personnage depuis le début du combat. De quoi couronner le héros de la mêlée.</Row>
          <Row label="Distribution d'XP">Sur <span className="font-mono text-stone-300">/partie</span>, le bouton <span className="bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded text-xs">⭐ Distribuer l&apos;XP</span> permet au Maître de jeu de récompenser le groupe : il entre le <strong>total d&apos;XP de la rencontre</strong>, et la part de chacun est calculée automatiquement — répartition égale entre les personnages cochés, <strong>pénalité multi-classes déduite</strong> (−20 % par classe en retard, selon la règle 3.5). Chaque part reste <strong>ajustable à la main</strong> (bonus de jeu d&apos;acteur, joueur absent…), et un personnage qui n&apos;a pas touché à sa fiche de la soirée peut être ajouté à la liste. À la confirmation, l&apos;XP s&apos;ajoute directement sur chaque fiche et une entrée <span className="text-yellow-300">⭐</span> s&apos;inscrit dans la chronique — avec un <strong>🎉 si un seuil de niveau est franchi</strong> (le passage de niveau lui-même reste à faire avec le MJ via le formulaire de modification).</Row>
          <Row label="Notes du MJ">Sur <span className="font-mono text-stone-300">/partie</span>, le champ <span className="bg-stone-800 border border-stone-600 text-stone-400 px-1.5 py-0.5 rounded text-xs">📝 Noter</span> permet au Maître de jeu de consigner les moments mémorables (« Cormac rate son jet et embrasse le mur »), indices et décisions. Les notes sont <strong>multilignes</strong> — parfait pour le résumé de fin de partie qui prépare la prochaine soirée : <kbd className="bg-stone-700 px-1 rounded">Entrée</kbd> fait un saut de ligne, <kbd className="bg-stone-700 px-1 rounded">Ctrl+Entrée</kbd> publie (jusqu'à 4000 caractères). Ces notes, surlignées en ambre, apparaissent dans la chronologie de la table <strong>et</strong> dans le journal de chaque fiche. Le MJ peut aussi effacer n'importe quelle entrée depuis sa vue (✕ au bout de chaque ligne).</Row>
          <Tip>Le journal est une chronique, pas un moteur de règles : il raconte ce qui s'est passé pour que la table puisse s'y référer (« il te restait combien de PV déjà ? ») et reprendre une partie interrompue des semaines plus tard.</Tip>
        </Section>

        <Section titre="💰 Butin — encaisser un trésor en pleine partie">
          <p>Le coffre du gobelin s&apos;ouvre, et personne n&apos;a envie de quitter la fiche pour aller <em>modifier le personnage</em>. Le bouton <span className="bg-amber-900/50 border border-amber-700/70 text-amber-200 px-1.5 py-0.5 rounded text-xs">💰 Butin</span>, en haut de la section Combat entre 🌙 Nuit de repos et 📜 Journal, ouvre un panneau à onglets qui <strong>ajoute</strong> ce qu&apos;on vient de trouver — sans rien remplacer, sans recharger le formulaire de création.</p>
          <Row label="Cinq onglets">🪙 <strong>Monnaie</strong> · 💎 <strong>Gemmes</strong> · 🧪 <strong>Potions</strong> · 🔮 <strong>Objets magiques</strong> · 🗡️ <strong>Armes</strong>. Un seul endroit à retenir en partie : tout le butin passe par ce bouton.</Row>
          <Row label="Au clavier">Le curseur est <strong>déjà dans le premier champ</strong> à l&apos;ouverture (et à chaque changement d&apos;onglet). <kbd className="bg-stone-700 px-1 rounded">Entrée</kbd> ajoute, <kbd className="bg-stone-700 px-1 rounded">Échap</kbd> ferme.</Row>
          <Row label="Le panneau reste ouvert">On vide rarement un coffre en un seul objet : après un ajout, le panneau <strong>reste ouvert</strong>, les champs se vident et une confirmation verte s&apos;affiche. On enchaîne les trouvailles sans un clic de plus.</Row>
          <Row label="La note de provenance">Le champ <strong>Note — d&apos;où vient ce trésor ?</strong> (« coffre du gobelin ») est <strong>conservé d&apos;un ajout à l&apos;autre</strong> : tout ce qui sort du même coffre porte la même provenance sans qu&apos;on la retape. Elle part au journal avec chaque ligne.</Row>
          <Row label="Tout va au journal">Chaque ajout s&apos;inscrit automatiquement dans la chronique avec l&apos;icône <span className="text-amber-200">💰</span> — <span className="italic text-stone-400">« Reçoit Rubis étoilé ×2 (50 p.o. pièce) — coffre du gobelin »</span>. Des mois plus tard, on retrouve <strong>quand et où</strong> chaque trésor a été trouvé.</Row>

          <p className="font-semibold text-stone-400 mt-3">Ce que fait chaque onglet</p>
          <Row label="🪙 Monnaie">Le montant s&apos;<strong>ajoute</strong> à la bourse — c&apos;est toute la différence avec le formulaire, qui remplace le total. 250 PO trouvées sur une bourse de 30 PO donnent 280 PO. Les six monnaies sont offertes, mithral compris.</Row>
          <Row label="💎 Gemmes">Nom, quantité, valeur <strong>de chaque pierre</strong>, unité. Un lot identique (même nom, même valeur, même unité) <strong>se cumule</strong> au lieu de créer une deuxième ligne : trois perles de plus sur un lot de deux affichent <span className="font-mono text-stone-300">×5</span>. La casse et les accents n&apos;empêchent pas le regroupement.</Row>
          <Row label="🧪 Potions">Le champ <strong>Nom</strong> cherche dans le Grimoire au fil de la frappe : dès deux lettres, les potions correspondantes s&apos;affichent avec leur effet, coquilles et pluriels pardonnés — et les vieux noms de table sont reconnus (« grand soin » propose <em>Potion de soins importants</em>). Le catalogue contient aussi <strong>toutes les potions officielles du Guide du Maître</strong> (sorts de niveau 1 à 3, avec effet, durée et prix) : « invisibilité », « vol », « forme gazeuse »… la bonne fiole est déjà là. Choisir une suggestion remplit nom, effet et doses d&apos;un coup; une potion déjà en poche voit simplement ses doses augmenter — pas de deuxième ligne. La touche <strong>Entrée</strong> choisit la première suggestion au lieu d&apos;envoyer le formulaire — plus de potion à moitié tapée créée par accident. Rien ne correspond? La ligne <span className="text-emerald-300">➕ Créer « … » comme nouvelle potion</span> ajoute votre <strong>potion maison</strong> au Grimoire, en toute connaissance de cause.</Row>
          <Row label="🔮 Objets magiques">Nom, emplacement et charges. Chaque objet reste une ligne distincte : deux anneaux de protection sont deux objets. La note apparaît en italique ambre sous l&apos;objet, sur la fiche.</Row>
          <Row label="🗡️ Armes">Nom, dégâts, bonus magique et quantité. Une pile identique (même arme, même bonus) se cumule — commode pour les flèches et les dagues de lancer.</Row>

          <p className="font-semibold text-stone-400 mt-3">Deux précautions à connaître</p>
          <Row label="Un objet ramassé va au sac">Un objet magique ajouté par le butin <strong>ne touche pas à la classe d&apos;armure</strong> : on l&apos;a trouvé, on ne le porte pas encore. Quand il sera équipé, déclarez son bonus dans <strong>Modifier → Équipement</strong> et la CA suivra. <em>Exception</em> : si un objet du <strong>même nom</strong> existe déjà avec un bonus de CA, le Grimoire réutilise cette description et vous en avertit — le bonus compte alors immédiatement.</Row>
          <Row label="Les noms sont partagés">Les armes, potions et objets magiques sont décrits <strong>par leur nom</strong>, description commune à toutes les fiches. Si vous entrez des dégâts qui contredisent une arme déjà connue, le Grimoire <strong>garde la description existante</strong> et vous le dit en ambre (⚠) plutôt que de modifier l&apos;arme des autres personnages. Corrigez au besoin dans <strong>Modifier → Équipement</strong>.</Row>
          <Tip>Le butin <em>ajoute</em>, le formulaire <em>remplace</em> : pour <strong>retirer</strong> un objet, corriger une valeur ou dépenser de l&apos;argent, passez par <strong>Modifier</strong>. Le butin, lui, est fait pour être utilisé d&apos;une main pendant que l&apos;autre tient les dés — champs assez grands pour le téléphone, et aucun zoom intempestif sur iPhone.</Tip>
        </Section>

        <Section titre="🛡️ Sorts actifs — CA et caractéristiques">
          <p>Certains sorts modifient temporairement la <strong>classe d'armure</strong> — <strong className="text-amber-200">Armure de mage</strong> (+4), <strong className="text-amber-200">Bouclier</strong> (+4), <strong className="text-amber-200">Bouclier de la foi</strong>, etc. — ou une <strong>caractéristique</strong> — <strong className="text-amber-200">Force de taureau</strong> (+4 FOR), <strong className="text-amber-200">Grâce féline</strong> (+4 DEX), <strong className="text-amber-200">Endurance de l'ours</strong> (+4 CON)… Comme le temps de jeu ne correspond pas au temps réel, c'est <strong>vous</strong> qui décidez quand l'effet commence et quand il prend fin.</p>
          <Row label="Activer un effet">Lancez simplement le sort avec son bouton <span className="bg-amber-900/40 border border-amber-800/40 text-amber-400 px-1.5 py-0.5 rounded text-xs font-mono">préparé ▶</span> dans la section Sorts. L'effet s'active automatiquement : une étiquette violette apparaît dans la section Combat et le sort porte le badge <span className="bg-violet-900/40 border border-violet-700 text-violet-300 px-1.5 py-0.5 rounded text-xs">🛡 actif</span>. Seuls les sorts que vous avez <strong>préparés</strong> (étudiés ou priés) peuvent donc être lancés. Pour Bouclier de la foi et Peau d'écorce, le bonus est calculé selon votre niveau de lanceur.</Row>
          <Row label="Effet sur la fiche">Un sort de CA recalcule la classe d'armure (détail <span className="font-mono text-stone-400">· sorts +N</span>). Un sort de caractéristique se propage <strong>partout</strong> : le badge de la caractéristique passe en violet avec la mention <span className="text-violet-400">+4 sort ✨</span>, et le modificateur met à jour la CA (DEX, limitée par l'armure), l'initiative, les attaques, les jets de sauvegarde et les compétences concernées.</Row>
          <Row label="Effets visuels sur le portrait">Certains sorts transforment le portrait du personnage : <strong className="text-amber-200">Lumière</strong> et <strong className="text-amber-200">Lumière du jour</strong> <span className="bg-yellow-900/30 border border-yellow-600/70 text-yellow-200 px-1.5 py-0.5 rounded text-xs">☀</span> l'entourent d'un halo doré, <strong className="text-amber-200">Bouclier de feu</strong> <span className="bg-orange-950/40 border border-orange-600/70 text-orange-200 px-1.5 py-0.5 rounded text-xs">🔥</span> de flammes, <strong className="text-amber-200">Peau de pierre</strong> <span className="bg-stone-700/50 border border-stone-400/60 text-stone-200 px-1.5 py-0.5 rounded text-xs">🗿</span> le pétrifie en gris, et <strong className="text-amber-200">Invisibilité</strong> <span className="bg-stone-800/40 border border-dashed border-stone-500 text-stone-400 px-1.5 py-0.5 rounded text-xs">👻</span> le rend presque transparent. Les effets se combinent si plusieurs sorts sont actifs.</Row>
          <Row label="Sorts sur soi-même (suivi)">Tous les autres sorts à durée que l'on peut lancer sur soi-même — <strong className="text-amber-200">Vol</strong>, <strong className="text-amber-200">Image miroir</strong>, <strong className="text-amber-200">Sanctuaire</strong>, <strong className="text-amber-200">Résistance aux énergies destructives</strong>, <strong className="text-amber-200">Liberté de mouvement</strong>, <strong className="text-amber-200">Faveur divine</strong>… — apparaissent en <span className="bg-sky-950/40 border border-sky-800/70 text-sky-200 px-1.5 py-0.5 rounded text-xs">bleu ◈</span> dans Sorts actifs. Survolez l'étiquette pour revoir l'effet et la durée du sort. <strong className="text-amber-200">Repli expéditif</strong> augmente même le Déplacement affiché de +9 m.</Row>
          <Row label="Retirer un effet">Quand le sort prend fin dans le jeu, cliquez le <span className="font-mono text-stone-500">✕</span> sur l'étiquette violette (ou dorée) dans la section Combat. Tout revient instantanément à la normale.</Row>
          <Row label="Règles de cumul (PHB 3.5)">Les bonus de <strong>même type</strong> ne se cumulent pas — seul le meilleur s'applique : une Armure de mage ne se cumule pas avec une armure portée, deux sorts d'amélioration de la même caractéristique ne s'additionnent pas. Seuls les bonus d'<strong>esquive</strong> (ex. Hâte) se cumulent avec tout. Un effet rendu inopérant reste affiché en gris avec <span className="font-mono">⊘</span>.</Row>
          <Tip>Endurance de l'ours augmente la Constitution et la Vigueur, mais les PV ne sont pas modifiés automatiquement : ajoutez vous-même +2 PV par niveau avec le bouton ✚ (et retirez-les à la fin du sort). Les effets actifs survivent au rechargement de la page mais n'apparaissent pas sur la fiche PDF imprimée.</Tip>
        </Section>

        <Section titre="✨ Sorts — préparer et dépenser">
          <p>La section <strong className="text-amber-200">Sorts</strong> est visible dès qu'un personnage est lanceur de sorts, même si aucun sort n'est encore préparé pour la journée.</p>

          <p className="font-semibold text-stone-400 mt-3">Le livre 📖 — lire la définition d'un sort</p>
          <p>Chaque sort porte un petit livre <span className="text-stone-500">📖</span> à côté de son nom. Cliquez-le : la définition du sort se déplie juste en dessous, avec ses <strong>composantes · portée · durée</strong>. Cliquez de nouveau (le livre est alors <span className="text-amber-400">doré</span>) et elle se referme. Les définitions restent ainsi <strong>fermées par défaut</strong> : la liste des sorts tient à l'écran.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-1">
            <li>Le livre apparaît aux <strong>quatre endroits</strong> où vous voyez des sorts : la section Sorts de la fiche, le panneau <strong>🙏 Prier</strong>, le panneau <strong>📖 Étudier</strong> et l'onglet Sorts du formulaire de modification.</li>
            <li>Dans les <strong>panneaux de préparation</strong>, une seule définition reste ouverte à la fois : ouvrir un sort referme le précédent, pour que la liste ne s'allonge pas indéfiniment.</li>
            <li>Un sort <strong>sans définition connue</strong> n'affiche aucun livre — c'est normal, et c'est le cas des sorts personnalisés, qui ont leur propre description éditable.</li>
            <li>La loupe 🔍 reste à côté du livre : elle cherche le sort sur le web, tandis que le livre montre la définition déjà enregistrée dans le Grimoire.</li>
          </ul>

          <p className="font-semibold text-stone-400 mt-3">Le DD — annoncer le jet de sauvegarde sans calculer</p>
          <p>Chaque sort de la fiche affiche son <span className="text-cyan-600 font-medium">DD</span> (degré de difficulté du jet de sauvegarde), calculé automatiquement : <strong>10 + niveau du sort + modificateur de votre caractéristique d'incantation</strong> — INT pour le magicien, SAG pour le prêtre, le druide, le paladin et le rôdeur, CHA pour l'ensorceleur et le barde. Les sorts de domaine du prêtre affichent aussi le leur.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-1">
            <li>Vous lancez Boule de feu ? La ligne du sort dit <span className="text-cyan-600 font-mono text-xs">DD 17</span> : annoncez « Réflexes, DD 17 » et la cible lance <strong>son</strong> d20 — aucun calcul en pleine partie.</li>
            <li>Survolez le DD pour voir le détail du calcul et, si le Grimoire la connaît, la <strong>nature du jet</strong> (Volonté annule, Réflexes 1/2 dégâts…). Quand elle est connue, elle apparaît aussi dans la définition du sort (📖) sous l'étiquette <span className="font-mono text-xs">JS :</span>.</li>
            <li>Certains sorts n'appellent <strong>aucun jet de sauvegarde</strong> (Projectile magique, les soins sur un allié…) : quand la fiche du sort le dit, le Grimoire <strong>n'affiche pas de DD</strong>. Si un DD apparaît sur un sort dont la fiche n'est pas encore relevée (le champ JS est vide), l'infobulle le précise — fiez-vous à la description du sort.</li>
            <li>Le DD suit vos <strong>sorts actifs</strong> : un Renard rusé (+4 INT) augmente le DD de tous les sorts du magicien pendant sa durée.</li>
          </ul>

          <p className="font-semibold text-stone-400 mt-3">Le compteur d'emplacements — voir d'un coup d'œil ce qu'il vous reste</p>
          <p>En haut de la section Sorts, une rangée de pastilles affiche, <strong>pour chaque niveau de sort</strong>, le nombre de sorts encore préparés sur le nombre d'emplacements de la journée : <span className="bg-amber-900/30 border border-amber-800/40 text-amber-300 px-2 py-0.5 rounded-full text-xs font-mono">Niv. 3 3/3</span>. Plus besoin d'ouvrir le panneau de prière pour savoir où vous en êtes.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-1">
            <li>Le compteur <strong>se met à jour tout seul</strong> dès que vous lancez un sort : vous lancez Boule de feu, la pastille passe de <span className="text-amber-300 font-mono">3/3</span> à <span className="text-amber-300 font-mono">2/3</span>.</li>
            <li>Un sort <strong>préparé deux fois</strong> compte pour 2 emplacements, pas pour 1.</li>
            <li>Une pastille <strong className="text-stone-500">grise</strong> signale un niveau entièrement épuisé — plus rien de préparé à ce niveau.</li>
            <li>Une pastille <strong className="text-violet-300">violette</strong> signale un dépassement du nombre de base : c'est normal si votre personnage a une caractéristique de lancement élevée (sorts bonus) ou un emplacement de domaine.</li>
            <li>En <strong>multi-classes</strong>, chaque section de sorts a son propre compteur : le Prêtre et le Magicien ne partagent jamais leurs emplacements.</li>
            <li>Pour un <strong>lanceur spontané</strong> (Ensorceleur, Barde), la rangée s'intitule « Emplacements restants » : elle indique combien d'emplacements de chaque niveau il vous reste pour la journée.</li>
          </ul>
          <Tip>Le compteur affiche les emplacements <strong>de base</strong> de votre classe et de votre niveau. Il n'ajoute ni les sorts bonus de haute Intelligence / Sagesse / Charisme, ni l'emplacement de domaine du prêtre — ces deux-là restent à gérer vous-même, exactement comme dans le panneau 🙏 Prier. C'est pourquoi un dépassement s'affiche en violet plutôt qu'en erreur.</Tip>

          <p className="font-semibold text-stone-400 mt-3">Multi-classes lanceur — une section par classe</p>
          <p>Un personnage avec plusieurs classes lanceuses (ex. Prêtre/Magicien) a <strong>une section de sorts par classe</strong> (« Sorts — Prêtre 5 », « Sorts — Magicien 3 »), chacune avec son propre bouton 🙏 Prier / 📖 Étudier et ses propres emplacements. Chaque sort appartient à une classe précise — préparer ses sorts de Prêtre ne touche jamais au grimoire de Magicien.</p>
          <p className="mt-1">Si le personnage a une <strong>classe de prestige</strong> à progression de sorts (ex. Disciple divin), ses niveaux s'ajoutent automatiquement au calcul des emplacements de la classe de base : un Prêtre 7 / Disciple divin 3 prie comme un Prêtre 10.</p>

          <p className="font-semibold text-stone-400 mt-3">Lanceurs divins — Prêtre, Druide, Paladin, Rôdeur</p>
          <p>Les lanceurs divins ont accès à <strong>toute leur liste de sorts</strong> jusqu'au niveau maximum qu'ils peuvent lancer — pas besoin d'apprendre ou d'acquérir des sorts individuellement. C'est lors de la <strong>prière quotidienne</strong> qu'ils choisissent lesquels préparer pour la journée.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-1">
            <li>Cliquez <span className="bg-stone-800 border border-stone-700 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono">🙏 Prier</span> pour ouvrir le panneau de prière.</li>
            <li>Tous les sorts accessibles à votre niveau s'affichent, groupés par niveau de sort.</li>
            <li>Utilisez <strong>+</strong> / <strong>−</strong> pour répartir vos emplacements entre les sorts de votre choix. Le même sort peut occuper plusieurs emplacements (ex. Soins légers ×3).</li>
            <li>Cliquez <strong>Confirmer</strong> — les sorts de la veille sont remplacés par les préparations du jour.</li>
          </ul>
          <Tip>Un Prêtre niveau 5 voit automatiquement tous les sorts de prêtre du niveau 0 au niveau 3, sans aucune configuration préalable. La liste s'étend à mesure qu'il monte de niveau.</Tip>
          <Tip>Le catalogue contient maintenant les listes <strong>complètes</strong> du <strong>paladin (45 sorts)</strong> et du <strong>rôdeur (51 sorts)</strong> du Manuel des Joueurs 3.5, relevées page par page. Ces deux classes n&apos;ont <strong>pas d&apos;oraisons</strong> et se limitent aux niveaux de sort 1 à 4 : elles ne lancent leur premier sort qu&apos;au <strong>niveau 4 de classe</strong>. Un Paladin 6 voit donc ses sorts de niveau 1, un Rôdeur 8 ses sorts de niveau 1 et 2. Chaque sort porte son livre 📖 : cliquez-le pour lire composantes, portée et durée sans quitter la fiche.</Tip>
          <Tip>Une correction à connaître si vous jouez un rôdeur : <strong>Soins légers</strong> est un sort de <strong>niveau 2</strong>, pas de niveau 1. Le Grimoire le classait à tort au niveau 1 ; le chapitre des sorts du Manuel imprime « Rôd 2 », et toute la série suit le même décalage — soins légers, modérés et importants valent <strong>2, 3 et 4</strong> pour le rôdeur, un cran de plus que pour le prêtre et le paladin. Si votre rôdeur avait préparé Soins légers dans un emplacement de niveau 1, la prochaine prière le placera au niveau 2.</Tip>

          <Tip>La liste du <strong>druide (169 sorts)</strong> est à son tour <strong>complète</strong>, du niveau 0 au niveau 9 : c&apos;est la <strong>septième et dernière</strong> classe du Manuel des Joueurs 3.5 à être relevée page par page. Le Grimoire porte désormais les sept listes entières. Le druide prépare ses sorts comme le prêtre et voit automatiquement tous ceux de son niveau. Sa liste recoupe beaucoup celle du prêtre et du rôdeur : sur les 169 sorts, <strong>126</strong> figuraient déjà au catalogue et <strong>43</strong> ont dû être créés — dont <em>Baie nourricière</em>, <em>Flammes</em>, <em>Appel de la foudre</em>, <em>Germes de feu</em>, <em>Voie végétale</em>, <em>Mort rampante</em>, <em>Cyclone</em>, <em>Grand tertre</em> et <em>Nuée d&apos;élémentaires</em>. Chaque sort porte son livre 📖 : cliquez-le pour lire composantes, portée et durée sans quitter la fiche.</Tip>
          <Tip>Deux corrections à connaître si vous jouez un druide : <strong>Peau de pierre</strong> est un sort de druide de niveau <strong>5</strong> (le Grimoire le classait au niveau 6) et <strong>Régénération</strong> un sort de niveau <strong>9</strong> (il était classé au niveau 7). Le chapitre des sorts du Manuel imprime « Dru 9, Guérison 7, Prê 7 » ; c&apos;est lui qui fait foi. Si votre druide avait préparé ces sorts au mauvais niveau, la prochaine prière les replacera au bon endroit.</Tip>

          <p className="font-semibold text-stone-400 mt-3">Lanceurs profanes — Magicien</p>
          <p>Le Magicien ne connaît que les sorts de son <strong>grimoire</strong>, ajoutés manuellement dans l'onglet Sorts du formulaire. Chaque matin, il choisit parmi ces sorts ceux qu'il prépare avec <span className="bg-stone-800 border border-stone-700 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono">📖 Étudier</span>.</p>
          <Tip>Le catalogue proposé contient maintenant les <strong>377 sorts d&apos;ensorceleur/magicien</strong> du Manuel des Joueurs 3.5, du niveau 0 au niveau 9 — la liste entière du livre, relevée page par page. Le magicien et l&apos;ensorceleur <strong>partagent la même liste</strong> en 3.5 : un sort y est au même niveau pour les deux. Seules <strong>Mémorisation de Rary</strong> et <strong>Remémoration de Mordenkainen</strong> font exception, réservées au magicien parce qu&apos;elles agissent sur des sorts préparés. Chaque sort porte son livre 📖 : cliquez-le pour voir composantes, portée et durée sans quitter la fiche.</Tip>

          <p className="font-semibold text-stone-400 mt-3">Lanceurs spontanés — Ensorceleur, Barde</p>
          <p>L'Ensorceleur et le Barde connaissent un nombre limité de sorts (ajoutés dans le formulaire) et les lancent spontanément, <strong>sans préparation quotidienne</strong>. Leur bouton s'appelle <span className="bg-stone-800 border border-stone-700 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono">✨ Repos</span> (et non 📖 Étudier) : la modale rappelle qu'ils peuvent lancer n'importe quel sort connu tant qu'il reste des emplacements du niveau correspondant.</p>
          <Tip>Le catalogue contient maintenant la liste <strong>complète</strong> du <strong>barde (164 sorts)</strong> du Manuel des Joueurs 3.5, du niveau 0 au niveau 6, relevée page par page. Le barde possède bien des <strong>sorts de niveau 0</strong> (tours de magie), mais il n&apos;obtient son premier emplacement qu&apos;au <strong>niveau 2 de classe</strong> : un Barde 1 ne lance encore rien. Sa liste recoupe très largement celle de l&apos;ensorceleur/magicien — sur les 164 sorts, seuls <strong>12</strong> lui sont propres, dont <em>Bagou</em>, <em>Convocation d&apos;instrument</em>, <em>Chant de discorde</em> et <em>Résonance</em>. Chaque sort porte son livre 📖 : cliquez-le pour lire composantes, portée et durée sans quitter la fiche.</Tip>
          <Tip>Deux corrections à connaître si vous jouez un barde : <strong>Soins modérés</strong> est un sort de barde de niveau <strong>2</strong> (le Grimoire le classait au niveau 3) et <strong>Dissipation de la magie</strong> un sort de niveau <strong>3</strong> (il était classé au niveau 4). Le chapitre des sorts du Manuel imprime « Bard 2 » et « Bard 3 » ; c&apos;est lui qui fait foi. Si votre barde avait noté ces sorts au mauvais niveau, la prochaine ouverture de la fiche les affichera au bon endroit.</Tip>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-1 text-xs">
            <li>Utilisez les compteurs <strong>+</strong> / <strong>−</strong> pour suivre les emplacements dépensés dans la journée.</li>
            <li>Après une nuit de repos, cliquez <strong>Tout effacer</strong> puis <strong>Confirmer</strong> pour repartir à zéro.</li>
          </ul>

          <p className="font-semibold text-stone-400 mt-3">Sorts personnalisés — homebrew et magie de campagne</p>
          <p>Chaque lanceur peut posséder des sorts inventés, bénis par sa divinité ou issus d'un supplément non inclus dans la liste officielle. Cliquez sur <span className="bg-stone-800 border border-stone-700 text-amber-400/80 px-1.5 py-0.5 rounded text-xs font-mono">+ Ajouter un sort personnalisé</span> en bas de la section Sorts.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-1">
            <li>Entrez le <strong>nom</strong> du sort, son <strong>école</strong> et son <strong>niveau</strong>.</li>
            <li>Le sort apparaît sur la fiche avec une étoile dorée <span className="text-amber-700 font-bold">★</span> pour le distinguer des sorts officiels.</li>
            <li>Pour les <strong>lanceurs divins</strong>, le sort personnalisé est automatiquement intégré dans le panneau de prière — il survit à la prière quotidienne et reste toujours disponible.</li>
            <li>Pour les <strong>Magiciens et lanceurs spontanés</strong>, le sort est ajouté directement au grimoire ou à la liste des sorts connus.</li>
            <li>Un bouton <span className="text-stone-400 font-mono text-xs">✕</span> permet de retirer un sort personnalisé à tout moment.</li>
            <li>À la place de la loupe 🔍, chaque sort custom affiche sa propre <strong>description éditable</strong> directement sur la fiche.</li>
          </ul>
          <Row label="Ajouter une description">Cliquez sur le texte gris <em>«&nbsp;+ Ajouter une description…&nbsp;»</em> sous le nom du sort. Un champ de texte s'ouvre pour décrire les effets, la portée, la durée, etc.</Row>
          <Row label="Modifier la description">Cliquez directement sur le texte de la description existante — elle passe en mode édition.</Row>
          <Row label="Sauvegarder">Cliquez <strong>Enregistrer</strong> ou appuyez sur <kbd className="bg-stone-700 px-1 rounded">Ctrl+Entrée</kbd>. La description est sauvegardée immédiatement.</Row>
          <Row label="Annuler">Appuyez sur <kbd className="bg-stone-700 px-1 rounded">Échap</kbd> ou cliquez <strong>Annuler</strong> pour revenir sans modification.</Row>
          <Tip>Le sort personnalisé d'un Prêtre apparaît dans la modale de prière à côté des sorts officiels — vous pouvez décider de le préparer ou non chaque jour, comme n'importe quel autre sort.</Tip>

          <p className="font-semibold text-stone-400 mt-3">Lancer un sort pendant la partie</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><span className="bg-amber-900/40 text-amber-400 px-1.5 py-0.5 rounded text-xs font-mono">préparé ▶</span> — sort préparé une fois</li>
            <li><span className="bg-amber-900/40 text-amber-400 px-1.5 py-0.5 rounded text-xs font-mono">préparé ×2 ▶</span> — sort préparé deux fois (deux emplacements)</li>
          </ul>
          <Row label="Lancer un sort">Cliquez le bouton du sort. Le compteur diminue de 1. Quand il atteint 0, le sort passe en <span className="text-stone-600 italic">épuisé</span> (grisé) jusqu'à la prochaine prière ou période de repos.</Row>
          <Tip>Après un repos, rouvrez le panneau 🙏 Prier / 📖 Étudier pour reconfigurer vos préparations du jour.</Tip>
        </Section>

        <Section titre="🧪 Potions — consommer une gorgée">
          <p>Dans la section <strong className="text-amber-200">Potions</strong>, le nombre de gorgées restantes est un bouton vert cliquable.</p>
          <Row label="Boire une gorgée">Cliquez directement sur le nombre affiché en vert. Il diminue de 1.</Row>
          <Row label="Potion épuisée">Quand il ne reste plus de gorgées, la case affiche <span className="text-stone-600 italic">épuisée</span>.</Row>
          <Row label="➕ Ajouter une potion">Le bouton <span className="bg-stone-800 border border-stone-700 text-stone-400 px-1.5 py-0.5 rounded text-xs">➕ Ajouter une potion</span>, dans l&apos;en-tête de la section Potions, ouvre directement le panneau d&apos;ajout — sans passer par la page Modifier. Le champ Nom cherche dans le Grimoire au fil de la frappe (coquilles pardonnées) et la ligne ➕ Créer permet toujours une potion maison. La section reste visible même quand vous n&apos;avez aucune potion, justement pour ce bouton.</Row>
          <Row label="✕ Jeter une potion">Le petit <span className="text-red-400">✕</span> à droite de chaque ligne retire la potion de la fiche (fiole donnée, perdue, vendue, ou fiole vide à nettoyer). Une confirmation s&apos;affiche d&apos;abord — rien n&apos;est bu, et le geste laisse sa trace au 📜 journal.</Row>
          <Tip>Même résultat par <span className="bg-amber-900/50 border border-amber-700/70 text-amber-200 px-1.5 py-0.5 rounded text-xs">💰 Butin</span> → onglet 🧪 Potions : les doses s&apos;additionnent à ce que vous avez déjà. Pour réapprovisionner autrement (achat, fabrication) ou corriger une quantité, allez dans <strong>Modifier</strong> → onglet <strong>Équipement</strong>.</Tip>
        </Section>

        <Section titre="🔮 Objets magiques — dépenser des charges">
          <p>Les bâtons, baguettes et autres objets à charges affichent un bouton violet avec le nombre de charges restantes.</p>
          <Row label="Activer l'objet">Cliquez le bouton <span className="bg-purple-900/30 text-purple-300 border border-purple-800/40 px-1.5 py-0.5 rounded text-xs font-mono">15/50 ch. ▶</span>. Une charge est déduite.</Row>
          <Row label="Barre de progression">La barre sous le bouton passe du <span className="text-purple-400">violet</span> à l'<span className="text-amber-400">ambre</span> puis au <span className="text-red-400">rouge</span> à mesure que les charges s'épuisent.</Row>
          <Row label="Objet épuisé">Quand les charges tombent à 0, le bouton est remplacé par <span className="text-stone-600 italic">épuisé (0/50)</span>.</Row>
          <Tip>Un objet magique trouvé en partie s&apos;ajoute par <span className="bg-amber-900/50 border border-amber-700/70 text-amber-200 px-1.5 py-0.5 rounded text-xs">💰 Butin</span> → onglet 🔮 Objets magiques. Pour recharger un objet ou déclarer son bonus de CA une fois équipé, allez dans <strong>Modifier</strong> → onglet <strong>Équipement</strong> et modifiez le champ <strong>Charges</strong> de l&apos;objet (0 = pas de charges).</Tip>
        </Section>

        <Section titre="💎 Trésor — gemmes">
          <p>La section <strong className="text-amber-200">Trésor &amp; Compagnons</strong> affiche vos pièces de monnaie et, juste en dessous, la liste de vos <strong className="text-amber-200">gemmes</strong>.</p>
          <Row label="Ce qu'on y lit">Le nom de la gemme, la quantité (<span className="font-mono text-stone-300">×3</span> si vous en avez plusieurs identiques), la note s'il y en a une, et la valeur <strong>de chaque pierre</strong> dans son unité — 25 p.o., 100 p.p., etc.</Row>
          <Row label="Total">Une ligne <strong>Total</strong> à droite additionne tout le lot converti en <strong>pièces d'or</strong> : 1 p.p. = 10 p.o., 1 p.e. = 0,5 p.o., 1 p.a. = 0,1 p.o., 1 p.c. = 0,01 p.o.</Row>
          <Row label="Mithral">Les p.m. n'ont pas de taux de change dans le Grimoire (monnaie de prestige) : elles sont affichées <em>à part</em> du total en or, jamais converties au hasard.</Row>
          <Tip>Pour <strong>ajouter</strong> une gemme en pleine partie, utilisez <span className="bg-amber-900/50 border border-amber-700/70 text-amber-200 px-1.5 py-0.5 rounded text-xs">💰 Butin</span> → onglet 💎 Gemmes : c&apos;est deux champs et une touche Entrée. Pour <strong>retirer</strong> une gemme ou corriger une valeur, passez par <strong>Modifier</strong> → onglet <strong>Équipement</strong> → section <strong>Trésor</strong>. Les gemmes apparaissent aussi sur la <strong>fiche imprimable</strong>, dans la case Trésors.</Tip>
        </Section>

        <Section titre="🧬 Traits raciaux">
          <p>Juste avant les notes, la section <strong className="text-amber-200">Traits raciaux</strong> liste automatiquement les capacités spéciales de la race du personnage (vision nocturne, immunités, bonus raciaux, etc.).</p>
          <Row label="Contenu automatique">Les traits sont chargés depuis la base de données selon la race — aucune saisie manuelle n'est nécessaire.</Row>
          <Tip>Si vous modifiez la race dans <strong>Modifier</strong> → onglet <strong>Identité</strong>, les traits raciaux se mettent à jour automatiquement à la prochaine visite de la fiche.</Tip>
        </Section>

        <Section titre="📝 Note générale — édition directe">
          <p>La section <strong className="text-amber-200">Note générale</strong> en bas de la fiche est modifiable directement pendant la partie, sans passer par le formulaire de modification. C&apos;est le bloc-notes <strong>personnel et permanent</strong> du personnage : contacts, dettes, objectifs à long terme — ce qui doit rester sous la main d&apos;une partie à l&apos;autre. Pour consigner un événement de la soirée, utilisez plutôt la <strong>✏️ note d&apos;aventure</strong> du journal (voir la section 📜 Journal de partie) : elle est datée et partagée avec la table.</p>
          <Row label="Modifier la note">Cliquez n'importe où dans la zone de notes. Un champ de texte apparaît avec les boutons <strong>Enregistrer</strong> et <strong>Annuler</strong>.</Row>
          <Row label="Sauvegarder">Cliquez <strong>Enregistrer</strong> ou appuyez sur <kbd className="bg-stone-700 px-1 rounded">Ctrl+Entrée</kbd>. La note est mise à jour immédiatement en base de données.</Row>
          <Row label="Annuler">Cliquez <strong>Annuler</strong> pour revenir au texte précédent sans sauvegarder.</Row>
          <Tip>Note générale = ce qui suit le personnage (contacts, promesses, butin à partager). Note d'aventure ✏️ = ce qui s'est passé ce soir-là, dans la chronique de la partie.</Tip>
        </Section>

        <Section titre="🖼️ Portrait du personnage">
          <Row label="Changer la photo">Cliquez sur le portrait (ou la silhouette grise si aucune photo). Une fenêtre s'ouvre pour coller l'URL d'une image.</Row>
          <Row label="Format conseillé">L'image est affichée en format portrait (2:3) avec le haut de l'image toujours visible — le visage est donc toujours préservé.</Row>
          <Row label="Dans le PDF">La photo apparaît dans l'en-tête lors de l'impression.</Row>
        </Section>

        <Section titre="🎯 Dons — descriptions automatiques">
          <p>Dans la section <strong className="text-amber-200">Dons</strong> de la fiche, chaque don affiche automatiquement une ligne descriptive en <span className="text-amber-400">ambre</span> résumant son effet mécanique.</p>
          <Row label="Dons système">Les dons enregistrés en base de données (Tir à bout portant, Robustesse, etc.) affichent leur description officielle.</Row>
          <Row label="Dons d'arme">Les dons ciblant une arme spécifique (ex. <span className="font-mono text-stone-300">Arme de prédilection (Arc long composite)</span>) génèrent automatiquement une phrase complète : <span className="text-amber-400 text-xs">+1 aux jets d'attaque avec Arc Long Composite</span>.</Row>
          <Row label="Dons non reconnus">Si un don n'a ni description en base ni pattern reconnu, seul le nom s'affiche — utilisez l'icône 🔍 pour trouver sa description en ligne.</Row>
          <Tip>Les descriptions sont générées à partir du nom exact du don. Le sélecteur de dons dans le formulaire de modification garantit un formatage correct.</Tip>
        </Section>

        <Section titre="🔍 Référence D&D 3.5">
          <p>À côté de certains éléments (compétences, dons, sorts, objets magiques), une icône discrète <span className="text-stone-400">🔍</span> est disponible.</p>
          <Row label="Cliquer dessus">Ouvre une recherche Google ciblée sur <strong>regles-donjons-dragons.com</strong>, le site de référence des règles D&D 3.5 en français. S'ouvre dans un nouvel onglet.</Row>
        </Section>

        <Section titre="📚 La Grande Bibliothèque — consulter tout le savoir du Grimoire">
          <p>Depuis la page d'accueil, <strong className="text-amber-200">La Grande Bibliothèque</strong> ouvre la consultation libre de tous les catalogues du Grimoire : sorts, potions, objets magiques (bâtons, baguettes, anneaux, reliques…), armes, armures et dons — chacun avec sa fiche descriptive.</p>
          <Row label="Recherche globale">La barre du haut fouille tous les rayons d'un coup, avec la même tolérance que le champ potions : accents ignorés, pluriels et coquilles pardonnés, vieux noms de table reconnus (« forme gazeuse » trouve la Potion d'état gazeux).</Row>
          <Row label="Rayons et filtres">Sans recherche, on feuillette rayon par rayon — les sorts se filtrent par école <strong>et par classe</strong> (🜏 Magie profane, ✠ Magie divine, ou une classe précise : Druide, Paladin, Prêtre…), les objets magiques par type. Les deux filtres de sorts se combinent : « Évocation » + « Magie divine » montre les évocations des lanceurs divins.</Row>
          <Tip>Le filtre par classe ne montre que les sorts dont les niveaux de classe sont relevés au Grimoire; ceux des suppléments pas encore dépouillés sont momentanément masqués (un compteur l'indique à côté du filtre).</Tip>
          <Row label="Trier par niveau">Au rayon Sorts, le bouton <strong>🔢 Trier par niveau</strong> remplace l'ordre alphabétique par un classement du niveau 0 au niveau 9, avec un en-tête par niveau. Combiné au filtre de classe, le niveau affiché est celui de la classe choisie : « Prêtre » + tri par niveau donne la liste de sorts du prêtre dans l'ordre de sa progression. Recliquer revient à l'alphabétique.</Row>
          <Row label="Liens croisés">La fiche d'une potion pointe vers le sort qu'elle embouteille, et la fiche d'un sort liste ses potions.</Row>
          <Row label="Lecture seule">La Bibliothèque ne modifie rien : elle n'ajoute rien aux fiches de personnages et ne touche pas à l'inventaire. Pour acquérir un objet, passez par 💰 Butin ou ➕ Ajouter une potion sur la fiche.</Row>
          <Row label="Fiches de sorts complètes">Tous les sorts du <strong>Manuel des Joueurs</strong> portent désormais leur fiche entière : école, composantes, temps d'incantation, portée, cible ou zone d'effet, durée, jet de sauvegarde, résistance à la magie, et le texte des règles du sort — de quoi arbitrer à la table sans ouvrir le livre. Les tableaux et les mots en italique du livre sont rendus tels quels.</Row>
          <Row label="Suppléments relevés">Quatre suppléments portent maintenant leur fiche complète comme le Manuel : <strong>Codex Divin</strong>, <strong>Codex Profane</strong>, <strong>Les Maîtres de la Nature</strong> et le <strong>Manuel des Joueurs de Faerûn</strong>.</Row>
          <Row label="Sorts décrits par renvoi">Un livre écrit souvent « ce sort fonctionne sur le même principe que X, si ce n'est que… » sans réimprimer portée ni durée. Ces fiches reçoivent le bloc technique du sort de référence, et une ligne en bas de la fiche dit d'où vient la valeur.</Row>
          <Row label="Noms doublés par le livre">Un même sort porte parfois deux noms (la liste de classe dit « Téléportation suprême », la fiche dit « Téléportation sans erreur » ; le Manuel des Joueurs de Faerûn titre « Maître des morts-vivants » là où le Grimoire dit « Élu des morts-vivants »). Les deux noms trouvent le sort dans la recherche.</Row>
          <Row label="⚔️ Rayon Armes — le catalogue du Manuel">Les <strong>78 entrées</strong> de la table 7-5 du <strong>Manuel des Joueurs</strong> y sont au complet, avec prix, dégâts, zone de critique, facteur de portée, poids, type de dégâts et le texte des règles : armes courantes, de guerre et exotiques, plus les munitions. Le filtre <strong>Toutes les catégories</strong> sépare <em>Arme courante</em>, <em>Arme de guerre</em>, <em>Arme exotique</em> et <em>Munition</em> — c&apos;est ce qui décide du don de maniement dont votre personnage a besoin.</Row>
          <Tip>Le rayon ne montre que le catalogue de référence. Les armes inscrites sur les fiches de personnages (« Épée longue +3 », « Dague lancée »…) restent sur leurs fiches et n&apos;encombrent pas la Bibliothèque. Les dégâts du catalogue sont ceux de l&apos;arme nue, pour une créature de taille M — sans bonus magique ni modificateur de Force; la fiche indique aussi les dégâts en taille P.</Tip>
          <Tip>Quelques fiches restent incomplètes : surtout les sorts de <strong>Magie de Faerûn</strong>, de <strong>L'Outreterre</strong>, des <strong>Seigneurs des Ténèbres</strong>, de <strong>Races de Faerûn</strong> et de <strong>L'Inaccessible Orient</strong>, dont le Grimoire n'a pas encore les livres. Les dons, armes et objets magiques suivront. Le relevé se poursuit, la Bibliothèque s'enrichit au fur et à mesure.</Tip>
          <Tip>Quand le livre se contredit lui-même sur une règle, la fiche reproduit les deux mentions et le signale par une <em>note du copiste</em> — l'arbitrage reste au MJ.</Tip>
        </Section>

        <Section titre="🛡️ Armure — CA, malus et déplacement automatiques">
          <p>Toutes les règles liées aux armures portées sont calculées automatiquement depuis la liste d'équipement du personnage.</p>
          <Row label="CA automatique">Le bonus CA de chaque armure s'additionne au modificateur de DEX (plafonné par le Max DEX de l'armure), plus naturelle/déflexion/divers/magique. Retirez une armure de l'équipement et la CA recalcule immédiatement.</Row>
          <Row label="Malus compétences">Si vous portez une armure avec Malus compétences (ex. Armure de cuir cloutée −1), les compétences concernées s'affichent en <span className="text-red-400">rouge</span> avec un indicateur <span className="text-red-500 font-mono">−N⚔</span>. Le malus est déduit du total automatiquement.</Row>
          <Row label="Déplacement réduit">En armure lourde, le déplacement passe automatiquement de 9 m à 6 m (ou de 6 m à 4 m). La cellule Déplacement l'indique avec la mention <em>«&nbsp;réduit armure&nbsp;»</em> en sous-titre.</Row>
          <Row label="Risque d'échec arcanique">Si vous portez de l'armure et avez des sorts arcaniques (Magicien, Ensorceleur ou Barde), une alerte rouge s'affiche en haut de la section Sorts avec le pourcentage d'échec cumulé de toutes les armures portées.</Row>
        </Section>

        <Section titre="📊 PV attendus — indicateur de santé de niveau">
          <p>Dans la section Combat, une ligne discrète indique la <strong>plage de PV attendus</strong> pour votre niveau et votre dé de vie, avec votre modificateur de Constitution :</p>
          <div className="bg-stone-800/50 rounded p-3 font-mono text-xs text-stone-400 mt-1">
            PV attendus niv.3 (d10+1/niv.) : <span className="text-stone-300">9–33</span>
          </div>
          <p className="mt-2">La plage va du <strong>minimum</strong> (toujours tirer 1 sur chaque dé) au <strong>maximum théorique</strong> (toujours tirer le maximum). Si vos PV actuels se trouvent hors de cette plage, un avertissement s'affiche.</p>
          <Tip>Cette information est indicative — les règles D&D 3.5 permettent de prendre le max au niveau 1 (selon variante) ou la moyenne. La plage aide à repérer une erreur de saisie.</Tip>
        </Section>

        <Section titre="🎓 Capacités de classe — section dédiée">
          <p>Une section <strong className="text-amber-200">Capacités de classe</strong> s'affiche automatiquement entre les Dons et les Armures, listant toutes les capacités spéciales acquises jusqu'au niveau actuel du personnage.</p>
          <p className="mt-2">Chaque capacité est présentée avec :</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
            <li>Le <strong>nom</strong> de la capacité en ambre</li>
            <li>Le <strong>niveau d'acquisition</strong> (niv.X)</li>
            <li>En multi-classes, la <strong>classe d'origine</strong></li>
            <li>Un <strong>résumé mécanique</strong> de l'effet</li>
          </ul>
          <Tip>En montant de niveau (puis en sauvegardant la modification), les nouvelles capacités apparaissent automatiquement sur la fiche.</Tip>
        </Section>

        <Section titre="⛪ Domaines divins — Prêtre et Druide">
          <p>Si le personnage a choisi ses deux domaines dans le formulaire (<strong>Modifier</strong> → onglet <strong>Combat</strong>), une section <strong className="text-amber-200">Domaines divins</strong> apparaît sur la fiche, entre les capacités de classe et l'armure — et sur la <strong>feuille imprimée</strong>, à la suite du tableau des sorts.</p>
          <p className="mt-2">Pour chaque domaine, la fiche affiche :</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Le <strong>pouvoir de domaine</strong> — capacité spéciale accordée en permanence (ex. domaine Guérison : sorts de soins lancés à +1 niveau effectif).</li>
            <li>Les <strong>9 sorts de domaine</strong>, un par niveau de sort (niv. 1 à 9).</li>
          </ul>
          <Tip>Règle D&D 3.5 : le prêtre dispose d'<strong>un emplacement de domaine bonus par niveau de sort</strong>, dans lequel il ne peut préparer qu'un sort de l'un de ses deux domaines. Gérez cet emplacement bonus mentalement lors de la prière — le panneau 🙏 Prier compte les emplacements normaux.</Tip>
          <Tip>Sorts propres aux dieux de Faerûn : les sorts marqués « <strong>Sort d&apos;initié (Initié de X)</strong> » dans le panneau 🙏 Prier sont réservés aux personnages possédant le <strong>don d&apos;initié</strong> correspondant (ex. Initié de Mystra). Ne les préparez que si votre personnage a ce don — un seul don d&apos;initié par personnage.</Tip>
        </Section>

        <Section titre="🎒 Encombrement — charge portée">
          <p>Dans la section Combat, une ligne indique le <strong>poids total porté</strong> (armes + armures) et la catégorie de charge correspondante selon la Force du personnage :</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs text-center">
            <div className="bg-green-900/30 border border-green-800/40 rounded p-2">
              <div className="text-green-400 font-bold">Légère</div>
              <div className="text-stone-500 mt-0.5">Aucun malus</div>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-800/40 rounded p-2">
              <div className="text-yellow-400 font-bold">Moyenne</div>
              <div className="text-stone-500 mt-0.5">Max DEX +3, malus −3</div>
            </div>
            <div className="bg-orange-900/30 border border-orange-800/40 rounded p-2">
              <div className="text-orange-400 font-bold">Lourde</div>
              <div className="text-stone-500 mt-0.5">Max DEX +1, malus −6, pas de course</div>
            </div>
            <div className="bg-red-900/30 border border-red-800/40 rounded p-2">
              <div className="text-red-400 font-bold">Surchargé</div>
              <div className="text-stone-500 mt-0.5">Peut seulement pousser/traîner</div>
            </div>
          </div>
          <p className="mt-2">Les trois seuils (légère / moyenne / lourde) sont affichés à côté du badge — ils dépendent uniquement du score de <strong>Force</strong>, selon la table officielle du PHB 3.5 (p.162).</p>
          <Tip>Le calcul ne compte que les armes et armures de l'équipement. Le petit matériel (sac, corde, rations…) n'est pas suivi — ajoutez mentalement ~10-20 lbs si votre MJ est pointilleux.</Tip>
        </Section>

        <Section titre="⚠️ Prérequis de dons — vérification automatique">
          <p>Chaque don de la section <strong className="text-amber-200">Dons</strong> est vérifié contre ses prérequis D&D 3.5. Si un prérequis n'est pas satisfait, un avertissement <span className="text-red-400 font-mono text-xs">⚠</span> rouge apparaît à droite du don avec la liste de ce qui manque.</p>
          <p className="mt-2">Trois types de prérequis sont vérifiés :</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>BBA minimum</strong> — ex. Tir rapide exige BBA +6.</li>
            <li><strong>Caractéristique minimum</strong> — ex. Attaque en puissance exige FOR 13, Expertise de combat exige INT 13.</li>
            <li><strong>Autres dons</strong> — ex. Mobilité exige Esquive ; Tourbillon exige toute la chaîne Combat défensif → Expertise → Mobilité → Attaque en vol.</li>
          </ul>
          <Tip>L'avertissement est purement informatif — le don reste actif sur la fiche. Il sert à repérer un oubli (don pris trop tôt, don prérequis retiré par erreur) à corriger avec votre MJ.</Tip>
        </Section>

        <Section titre="🖨️ Exporter en PDF">
          <Row label="Bouton PDF">En haut à droite de la fiche, cliquez <strong>PDF</strong> pour ouvrir la page d'impression.</Row>
          <Row label="Imprimer">Utilisez la fonction d'impression du navigateur (<kbd className="bg-stone-700 px-1 rounded">Ctrl+P</kbd>). Le format est configuré pour du papier <strong>Letter (8,5" × 11")</strong> avec marges ¾".</Row>
          <Tip>Dans les options d'impression, activez <strong>«&nbsp;Imprimer les arrière-plans&nbsp;»</strong> pour conserver les couleurs et les cadres.</Tip>
          <Row label="Compétences imprimées">La fiche imprime <strong>toutes</strong> vos compétences, y compris celles qui n’existent pas dans le manuel : compétences maison comme <em>Magie divine</em>, et spécialités libres comme <em>Artisanat (tissage)</em> ou <em>Profession (apothicaire)</em>. Seules les lignes à zéro rang et sans modificateur sont omises.</Row>
          <Tip>Pour les compétences du manuel, la caractéristique et la case <em>compétence de classe</em> viennent de la table officielle. Pour une compétence maison, la caractéristique est celle enregistrée sur la fiche, et la case de classe reste vide.</Tip>
          <Row label="Emplacements de sorts imprimés">Le tableau des sorts imprime la même rangée d'emplacements que la fiche à l'écran (<em>Or. 3/4 · niv.1 4/4 · niv.2 3/3</em>…), classe lanceuse par classe lanceuse. Attention : cette rangée est <strong>figée à l'instant de l'impression</strong> — elle photographie vos préparations du moment. Si vous imprimez juste après la prière du matin, elle vous donne le compte exact de la journée; en cours de partie, fiez-vous plutôt à l'écran, qui lui se met à jour à chaque sort lancé.</Row>
          <Row label="Domaines imprimés">Si votre prêtre ou druide a choisi ses domaines, la feuille imprimée reprend la section <strong>Domaines divins</strong> de l'écran : le pouvoir de chaque domaine et ses 9 sorts, à la suite du tableau des sorts. Le rappel de l'emplacement de domaine (+1 sort de domaine par niveau de sort, à gérer à la main) est imprimé sous le tableau.</Row>
        </Section>

        <Section titre="📊 Progression en XP">
          <p>La barre de progression d'XP en haut de la fiche indique votre avancement vers le prochain niveau. Le seuil est calculé automatiquement selon les règles D&D 3.5, à partir de votre <strong>niveau total</strong> (somme de tous vos niveaux de classe).</p>
          <Row label="Jeu épique — aucun plafond">Il n'existe <strong>aucun niveau maximum</strong> en D&D 3.5. La fiche affiche le seuil du prochain niveau <em>au-delà du niveau 20</em> comme en deçà : un Magicien 16 / Cryptomancière 8 (niveau total 24) voit « Prochain niveau : 300 000 XP ». Les seuils 21 à 30 sont ceux du <em>Epic Level Handbook</em> (table 1-2, p. 7); au-delà, la même formule se prolonge indéfiniment — le livre l'autorise explicitement (encadré « No Limits », p. 6).</Row>
          <Row label="Ajouter l'XP reçue">Sous la barre de progression, le bouton <strong>⭐ Ajouter de l&apos;XP</strong> ouvre un petit champ : inscrivez le montant que le MJ vous annonce et confirmez. L&apos;aperçu montre le nouveau total avant d&apos;ajouter — et 🎉 si un seuil de niveau est franchi. L&apos;ajout s&apos;inscrit automatiquement au <strong>journal 📜</strong>, comme la distribution faite par le MJ.</Row>
          <Row label="Corriger le total">Pour <em>remplacer</em> le total (erreur de saisie) plutôt que d&apos;ajouter : <strong>Modifier</strong> → onglet <strong>Identité</strong> → champ <strong>XP</strong>.</Row>
          <Row label="🆙 Monter de niveau">Quand votre total d&apos;XP franchit le seuil, un bouton <strong>🎉 Niveau N atteint — 🆙 Monter de niveau</strong> apparaît sous la barre de progression. Choisissez votre classe (avec l&apos;accord du MJ si vous êtes multi-classé), <strong>lancez votre vrai dé de vie</strong> à la table, ajoutez votre modificateur de Constitution (minimum 1 PV) et inscrivez le résultat : le niveau monte, les PV gagnés s&apos;ajoutent au maximum <em>et</em> aux PV actuels, et la montée s&apos;inscrit au journal 📜. Le BAB suit automatiquement — même s&apos;il avait été saisi à la main dans le formulaire, il augmente du bon montant selon la progression de la classe choisie — ainsi que les sauvegardes, les emplacements de sorts et les capacités de classe — mais les <strong>points de compétence</strong>, le <strong>don</strong> (niveaux 3, 6, 9…) et le <strong>+1 de caractéristique</strong> (niveaux 4, 8, 12…) restent des choix à inscrire via ✏️ Modifier. L&apos;app ne lance aucun dé : le jet de dé de vie reste sur la table.</Row>

          <p className="font-semibold text-stone-400 mt-3">Seuils de niveau en D&D 3.5</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 mt-1 text-xs text-center">
            {[
              ['Niv. 2','1 000'],['Niv. 3','3 000'],['Niv. 4','6 000'],['Niv. 5','10 000'],
              ['Niv. 6','15 000'],['Niv. 7','21 000'],['Niv. 8','28 000'],['Niv. 9','36 000'],
              ['Niv. 10','45 000'],['Niv. 15','105 000'],['Niv. 20','190 000'],
              ['Niv. 21','210 000'],['Niv. 24','276 000'],['Niv. 25','300 000'],['Niv. 30','435 000'],
            ].map(([niv, xp]) => (
              <div key={niv} className="bg-stone-800/50 rounded p-1.5">
                <div className="text-amber-500 font-bold">{niv}</div>
                <div className="text-stone-400">{xp} XP</div>
              </div>
            ))}
          </div>
        </Section>

        <Section titre="⚔️✨ Multi-classes — règles de jeu">
          <p>Un personnage multi-classé possède des niveaux dans plusieurs classes. Voici comment les mécaniques s'appliquent sur la fiche.</p>
          <Row label="BBA (Base d'Attaque)">Le BBA total est la <strong>somme</strong> des BBA de chaque classe, calculés séparément selon leur progression (élevée / moyenne / faible).</Row>
          <Row label="Jets de sauvegarde">Chaque classe contribue indépendamment selon sa liste de bons jets. Résultat : les jets d'un multi-classe sont toujours ≥ chacune des classes seules.</Row>
          <Row label="Points de vie">Chaque niveau de chaque classe ajoute son propre dé de vie. La fiche cumule le total en créant le personnage.</Row>
          <Row label="Compétences">Une compétence est traitée comme compétence de classe dès qu'elle l'est pour <em>au moins une</em> de vos classes. Exemple : un Guerrier 6 / Magicien 1 traite <em>Connaissances (mystères)</em> et <em>Concentration</em> comme compétences de classe — rang max = niveau total + 3.</Row>

          <p className="font-semibold text-stone-400 mt-4">Progression des XP — un seul total partagé</p>
          <p>En D&D 3.5, <strong>tous les niveaux de toutes les classes partagent un unique total d'XP</strong>. Il n'y a pas d'XP séparés par classe. Les seuils du tableau ci-dessus s'appliquent au <em>niveau total</em> du personnage (somme de tous ses niveaux de classe).</p>
          <Tip>La formule officielle est <span className="font-mono text-stone-300">500 × niveau × (niveau − 1)</span>. Elle donne les seuils du Manuel des Joueurs pour les niveaux 1 à 20 et ceux du <em>Epic Level Handbook</em> pour les niveaux 21 à 30, sans rupture — c'est elle que le site applique, à tous les niveaux.</Tip>
          <p className="mt-2">Lorsque votre total d'XP franchit un seuil, vous gagnez <strong>un niveau dans la classe de votre choix</strong>. La fiche affiche vos options directement :</p>
          <div className="bg-stone-800/50 rounded p-3 mt-2 font-mono text-xs">
            <span className="text-amber-400">12 000 XP</span>
            <span className="text-stone-500"> · Prochain niveau : 15 000 XP</span>
            <br/>
            <span className="text-stone-600">→ Fighter 4 ou Wizard 3</span>
          </div>
          <p className="mt-2 text-xs text-stone-500">Ici, le personnage peut choisir de monter Fighter à 4 <em>ou</em> Wizard à 3 — c'est le même seuil de 15 000 XP dans les deux cas. Le choix est stratégique, pas mécanique.</p>
          <Tip>La ligne <span className="font-mono text-stone-300">→ Classe X ou Classe Y</span> n'apparaît que pour les multi-classés. Un personnage mono-classe voit uniquement le seuil d'XP.</Tip>

          <p className="font-semibold text-stone-400 mt-4">Pénalité d'XP multi-classes</p>
          <p>Si l'écart entre vos classes dépasse 1 niveau (en excluant votre classe préférée raciale), vous subissez une pénalité sur chaque XP gagné :</p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-1">
            <li><strong>−20 %</strong> d'XP par classe ayant un écart ≥ 2 niveaux avec la classe la plus haute.</li>
            <li>Maximum : <strong>−40 %</strong> si deux classes ou plus sont en retard.</li>
            <li>La <strong>classe préférée raciale</strong> est entièrement ignorée dans ce calcul.</li>
          </ul>

          <p className="font-semibold text-stone-500 text-xs mt-3">Classe préférée des Humains et Demi-Elfes</p>
          <p className="text-xs">Ces races ont une classe préférée « au choix » — le joueur désigne librement n'importe quelle classe. Le système <strong>désigne automatiquement la classe la plus haute comme préférée</strong>, ce qui est le choix optimal dans presque tous les cas. Résultat : un Guerrier 6 / Magicien 1 humain n'a <strong>aucune pénalité</strong> — le Guerrier est exempté, seul le Magicien compterait, et il n'y a pas d'autre classe non-préférée pour créer un écart.</p>

          <p className="font-semibold text-stone-500 text-xs mt-3">Exemple concret</p>
          <p className="text-xs">Un Nain Fighter 4 / Wizard 2 / Roublard 1 : Fighter est sa classe préférée (ignorée). Parmi les autres : Wizard 2 et Roublard 1. La classe la plus haute non-préférée est Wizard 2. Roublard est 1 niveau en dessous — <strong>pas de pénalité</strong> (écart = 1).</p>

          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            {[
              ['Humain · Demi-Elfe','Au choix — auto : classe la plus haute'],
              ['Elfe','Magicien'],
              ['Nain','Guerrier'],
              ['Halfelin','Roublard'],
              ['Gnome','Barde'],
              ['Demi-Orque','Barbare'],
            ].map(([race, classe]) => (
              <div key={race} className="bg-stone-800/50 rounded px-3 py-1.5">
                <span className="text-amber-400 font-medium">{race}</span>
                <span className="text-stone-400"> → {classe}</span>
              </div>
            ))}
          </div>
          <Tip>Le formulaire de modification affiche automatiquement un message vert ✓ ou orange ⚠ avec la classe préférée effective et le pourcentage de pénalité calculé en temps réel.</Tip>
        </Section>

      </main>
    </div>
  )
}
