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
          <Link href={retour} className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-300 text-sm transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            {labelRetour}
          </Link>
          <Link href="/aide/creation" className="text-stone-500 hover:text-amber-300 text-xs transition-colors">
            Aide — Création / Modification →
          </Link>
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
          <Tip>Les PV sont sauvegardés automatiquement en base de données. Si vous rechargez la page, votre valeur actuelle est conservée.</Tip>
        </Section>

        <Section titre="📜 Journal de partie — la chronique s'écrit toute seule">
          <p>Chaque action posée sur la fiche laisse automatiquement une trace dans le <strong className="text-amber-200">journal de partie</strong> : dégâts et soins, sorts lancés, potions bues, charges d'objets, effets retirés, préparation des sorts après un repos… <strong>Vous n'avez rien à faire de plus</strong> — jouez normalement avec les boutons de la fiche.</p>
          <Row label="Consulter le journal">Cliquez <span className="bg-stone-800 border border-stone-600 text-stone-300 px-1.5 py-0.5 rounded text-xs">📜 Journal</span> en haut de la section Combat. Un panneau s'ouvre avec la chronologie : une ligne par action, avec l'heure, <strong>la plus récente en haut</strong>, regroupées par journée de jeu (une soirée qui déborde après minuit reste dans la même journée).</Row>
          <Row label="Noter une attaque">Au bout de chaque arme, le bouton <span className="bg-amber-900/40 border border-amber-800/40 text-amber-400 px-1.5 py-0.5 rounded text-xs font-mono">⚔ attaque</span> note votre attaque au journal : choisissez <span className="text-green-400">✓ touché</span> ou <span className="text-red-400">✗ raté</span>, entrez les dégâts infligés (optionnel), puis <strong>OK</strong> ou <kbd className="bg-stone-700 px-1 rounded">Entrée</kbd>.</Row>
          <Row label="Rounds de combat">Les marqueurs de round sont <strong>gérés par le Maître de jeu</strong> depuis la page <span className="font-mono text-stone-300">/partie</span> : <span className="bg-red-900/40 text-red-300 px-1.5 py-0.5 rounded text-xs">⚔ Combat !</span> (début, round 1), <span className="bg-amber-900/40 text-amber-300 px-1.5 py-0.5 rounded text-xs">▶ Round suivant</span> et <span className="bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded text-xs">🕊 Fin</span> (fin du <em>combat</em>, pas de la partie — le jeu libre reprend, le prochain « Combat ! » repartira au round 1). Ces marqueurs sont partagés par toute la table : ils apparaissent dans le journal de chaque fiche.</Row>
          <Row label="Effacer une entrée">Survolez une ligne et cliquez <span className="font-mono text-stone-500">✕</span>. Cela efface la trace au journal mais <strong>n'annule pas l'action</strong> (les PV dépensés le restent).</Row>
          <Row label="Vue du Maître de jeu">La page <span className="font-mono text-stone-300">/partie</span> (lien au bas du panneau ou sur l'accueil) fusionne les journaux de <strong>tous les personnages</strong> de la soirée : le MJ y suit la partie round par round, et peut masquer un personnage d'un clic sur sa pastille. Les personnages présents sont détectés automatiquement — aucune configuration. Sur la journée courante, la page est <strong>en direct</strong> (pastille verte) : elle se met à jour toute seule toutes les 5 secondes (en pause pendant que le MJ rédige une note), et un <strong>tableau de bord des PV du groupe</strong> (barres de vie cliquables) montre l'état de chacun en un coup d'œil.</Row>
          <Row label="Bilan de combat">Quand le MJ clique <span className="bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded text-xs">🕊 Fin</span>, un <strong>🏆 bilan automatique</strong> s'inscrit dans la chronique : nombre de rounds, dégâts infligés (touchés/ratés), dégâts subis et sorts lancés par chaque personnage depuis le « ⚔ Combat ! ». De quoi couronner le héros de la mêlée.</Row>
          <Row label="Notes du MJ">Sur <span className="font-mono text-stone-300">/partie</span>, le champ <span className="bg-stone-800 border border-stone-600 text-stone-400 px-1.5 py-0.5 rounded text-xs">📝 Noter</span> permet au Maître de jeu de consigner les moments mémorables (« Cormac rate son jet et embrasse le mur »), indices et décisions. Les notes sont <strong>multilignes</strong> — parfait pour le résumé de fin de partie qui prépare la prochaine soirée : <kbd className="bg-stone-700 px-1 rounded">Entrée</kbd> fait un saut de ligne, <kbd className="bg-stone-700 px-1 rounded">Ctrl+Entrée</kbd> publie (jusqu'à 4000 caractères). Ces notes, surlignées en ambre, apparaissent dans la chronologie de la table <strong>et</strong> dans le journal de chaque fiche. Le MJ peut aussi effacer n'importe quelle entrée depuis sa vue (✕ au survol).</Row>
          <Tip>Le journal est une chronique, pas un moteur de règles : il raconte ce qui s'est passé pour que la table puisse s'y référer (« il te restait combien de PV déjà ? ») et reprendre une partie interrompue des semaines plus tard.</Tip>
        </Section>

        <Section titre="🛡️ Sorts actifs — CA et caractéristiques">
          <p>Certains sorts modifient temporairement la <strong>classe d'armure</strong> — <strong className="text-amber-200">Armure de mage</strong> (+4), <strong className="text-amber-200">Bouclier</strong> (+4), <strong className="text-amber-200">Bouclier de la foi</strong>, etc. — ou une <strong>caractéristique</strong> — <strong className="text-amber-200">Force de taureau</strong> (+4 FOR), <strong className="text-amber-200">Grâce du chat</strong> (+4 DEX), <strong className="text-amber-200">Endurance de l'ours</strong> (+4 CON)… Comme le temps de jeu ne correspond pas au temps réel, c'est <strong>vous</strong> qui décidez quand l'effet commence et quand il prend fin.</p>
          <Row label="Activer un effet">Lancez simplement le sort avec son bouton <span className="bg-amber-900/40 border border-amber-800/40 text-amber-400 px-1.5 py-0.5 rounded text-xs font-mono">préparé ▶</span> dans la section Sorts. L'effet s'active automatiquement : une étiquette violette apparaît dans la section Combat et le sort porte le badge <span className="bg-violet-900/40 border border-violet-700 text-violet-300 px-1.5 py-0.5 rounded text-xs">🛡 actif</span>. Seuls les sorts que vous avez <strong>préparés</strong> (étudiés ou priés) peuvent donc être lancés. Pour Bouclier de la foi et Peau d'écorce, le bonus est calculé selon votre niveau de lanceur.</Row>
          <Row label="Effet sur la fiche">Un sort de CA recalcule la classe d'armure (détail <span className="font-mono text-stone-400">· sorts +N</span>). Un sort de caractéristique se propage <strong>partout</strong> : le badge de la caractéristique passe en violet avec la mention <span className="text-violet-400">+4 sort ✨</span>, et le modificateur met à jour la CA (DEX, limitée par l'armure), l'initiative, les attaques, les jets de sauvegarde et les compétences concernées.</Row>
          <Row label="Effets visuels sur le portrait">Certains sorts transforment le portrait du personnage : <strong className="text-amber-200">Lumière</strong> et <strong className="text-amber-200">Lumière du jour</strong> <span className="bg-yellow-900/30 border border-yellow-600/70 text-yellow-200 px-1.5 py-0.5 rounded text-xs">☀</span> l'entourent d'un halo doré, <strong className="text-amber-200">Bouclier de feu</strong> <span className="bg-orange-950/40 border border-orange-600/70 text-orange-200 px-1.5 py-0.5 rounded text-xs">🔥</span> de flammes, <strong className="text-amber-200">Peau de pierre</strong> <span className="bg-stone-700/50 border border-stone-400/60 text-stone-200 px-1.5 py-0.5 rounded text-xs">🗿</span> le pétrifie en gris, et <strong className="text-amber-200">Invisibilité</strong> <span className="bg-stone-800/40 border border-dashed border-stone-500 text-stone-400 px-1.5 py-0.5 rounded text-xs">👻</span> le rend presque transparent. Les effets se combinent si plusieurs sorts sont actifs.</Row>
          <Row label="Sorts sur soi-même (suivi)">Tous les autres sorts à durée que l'on peut lancer sur soi-même — <strong className="text-amber-200">Vol</strong>, <strong className="text-amber-200">Image miroir</strong>, <strong className="text-amber-200">Sanctuaire</strong>, <strong className="text-amber-200">Résistance aux énergies</strong>, <strong className="text-amber-200">Liberté de mouvement</strong>, <strong className="text-amber-200">Faveur divine</strong>… — apparaissent en <span className="bg-sky-950/40 border border-sky-800/70 text-sky-200 px-1.5 py-0.5 rounded text-xs">bleu ◈</span> dans Sorts actifs. Survolez l'étiquette pour revoir l'effet et la durée du sort. <strong className="text-amber-200">Repli expéditif</strong> augmente même le Déplacement affiché de +9 m.</Row>
          <Row label="Retirer un effet">Quand le sort prend fin dans le jeu, cliquez le <span className="font-mono text-stone-500">✕</span> sur l'étiquette violette (ou dorée) dans la section Combat. Tout revient instantanément à la normale.</Row>
          <Row label="Règles de cumul (PHB 3.5)">Les bonus de <strong>même type</strong> ne se cumulent pas — seul le meilleur s'applique : une Armure de mage ne se cumule pas avec une armure portée, deux sorts d'amélioration de la même caractéristique ne s'additionnent pas. Seuls les bonus d'<strong>esquive</strong> (ex. Hâte) se cumulent avec tout. Un effet rendu inopérant reste affiché en gris avec <span className="font-mono">⊘</span>.</Row>
          <Tip>Endurance de l'ours augmente la Constitution et la Vigueur, mais les PV ne sont pas modifiés automatiquement : ajoutez vous-même +2 PV par niveau avec le bouton ✚ (et retirez-les à la fin du sort). Les effets actifs survivent au rechargement de la page mais n'apparaissent pas sur la fiche PDF imprimée.</Tip>
        </Section>

        <Section titre="✨ Sorts — préparer et dépenser">
          <p>La section <strong className="text-amber-200">Sorts</strong> est visible dès qu'un personnage est lanceur de sorts, même si aucun sort n'est encore préparé pour la journée.</p>

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

          <p className="font-semibold text-stone-400 mt-3">Lanceurs profanes — Magicien</p>
          <p>Le Magicien ne connaît que les sorts de son <strong>grimoire</strong>, ajoutés manuellement dans l'onglet Sorts du formulaire. Chaque matin, il choisit parmi ces sorts ceux qu'il prépare avec <span className="bg-stone-800 border border-stone-700 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono">📖 Étudier</span>.</p>

          <p className="font-semibold text-stone-400 mt-3">Lanceurs spontanés — Ensorceleur, Barde</p>
          <p>L'Ensorceleur et le Barde connaissent un nombre limité de sorts (ajoutés dans le formulaire) et les lancent spontanément, <strong>sans préparation quotidienne</strong>. Leur bouton s'appelle <span className="bg-stone-800 border border-stone-700 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono">✨ Repos</span> (et non 📖 Étudier) : la modale rappelle qu'ils peuvent lancer n'importe quel sort connu tant qu'il reste des emplacements du niveau correspondant.</p>
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
          <Tip>Pour réapprovisionner une potion (achat ou fabrication), allez dans <strong>Modifier</strong> → onglet <strong>Équipement</strong> et ajustez le nombre de charges.</Tip>
        </Section>

        <Section titre="🔮 Objets magiques — dépenser des charges">
          <p>Les bâtons, baguettes et autres objets à charges affichent un bouton violet avec le nombre de charges restantes.</p>
          <Row label="Activer l'objet">Cliquez le bouton <span className="bg-purple-900/30 text-purple-300 border border-purple-800/40 px-1.5 py-0.5 rounded text-xs font-mono">15/50 ch. ▶</span>. Une charge est déduite.</Row>
          <Row label="Barre de progression">La barre sous le bouton passe du <span className="text-purple-400">violet</span> à l'<span className="text-amber-400">ambre</span> puis au <span className="text-red-400">rouge</span> à mesure que les charges s'épuisent.</Row>
          <Row label="Objet épuisé">Quand les charges tombent à 0, le bouton est remplacé par <span className="text-stone-600 italic">épuisé (0/50)</span>.</Row>
          <Tip>Pour recharger un objet, allez dans <strong>Modifier</strong> → onglet <strong>Équipement</strong> et modifiez le champ <strong>Charges</strong> de l'objet (0 = pas de charges).</Tip>
        </Section>

        <Section titre="🧬 Traits raciaux">
          <p>Juste avant les notes, la section <strong className="text-amber-200">Traits raciaux</strong> liste automatiquement les capacités spéciales de la race du personnage (vision nocturne, immunités, bonus raciaux, etc.).</p>
          <Row label="Contenu automatique">Les traits sont chargés depuis la base de données selon la race — aucune saisie manuelle n'est nécessaire.</Row>
          <Tip>Si vous modifiez la race dans <strong>Modifier</strong> → onglet <strong>Identité</strong>, les traits raciaux se mettent à jour automatiquement à la prochaine visite de la fiche.</Tip>
        </Section>

        <Section titre="📝 Notes du joueur — édition directe">
          <p>La section <strong className="text-amber-200">Notes du joueur</strong> en bas de la fiche est modifiable directement pendant la partie, sans passer par le formulaire de modification.</p>
          <Row label="Modifier les notes">Cliquez n'importe où dans la zone de notes. Un champ de texte apparaît avec les boutons <strong>Enregistrer</strong> et <strong>Annuler</strong>.</Row>
          <Row label="Sauvegarder">Cliquez <strong>Enregistrer</strong> ou appuyez sur <kbd className="bg-stone-700 px-1 rounded">Ctrl+Entrée</kbd>. Les notes sont mises à jour immédiatement en base de données.</Row>
          <Row label="Annuler">Cliquez <strong>Annuler</strong> pour revenir au texte précédent sans sauvegarder.</Row>
          <Tip>Idéal pour noter des informations pendant la session : PNJ rencontrés, lieux explorés, décisions importantes de l'équipe.</Tip>
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
          <p>Si le personnage a choisi ses deux domaines dans le formulaire (<strong>Modifier</strong> → onglet <strong>Combat</strong>), une section <strong className="text-amber-200">Domaines divins</strong> apparaît sur la fiche, entre les capacités de classe et l'armure.</p>
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
        </Section>

        <Section titre="📊 Progression en XP">
          <p>La barre de progression d'XP en haut de la fiche indique votre avancement vers le prochain niveau. Le seuil est calculé automatiquement selon les règles D&D 3.5.</p>
          <Row label="Mettre à jour les XP">Allez dans <strong>Modifier</strong> → onglet <strong>Identité</strong> → champ <strong>XP</strong>.</Row>

          <p className="font-semibold text-stone-400 mt-3">Seuils de niveau en D&D 3.5</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 mt-1 text-xs text-center">
            {[
              ['Niv. 2','1 000'],['Niv. 3','3 000'],['Niv. 4','6 000'],['Niv. 5','10 000'],
              ['Niv. 6','15 000'],['Niv. 7','21 000'],['Niv. 8','28 000'],['Niv. 9','36 000'],
              ['Niv. 10','45 000'],['Niv. 15','105 000'],['Niv. 20','190 000'],
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
          <Row label="Compétences">Une compétence est traitée comme compétence de classe dès qu'elle l'est pour <em>au moins une</em> de vos classes. Exemple : un Guerrier 6 / Magicien 1 traite <em>Connaissance (arcanes)</em> et <em>Concentration</em> comme compétences de classe — rang max = niveau total + 3.</Row>

          <p className="font-semibold text-stone-400 mt-4">Progression des XP — un seul total partagé</p>
          <p>En D&D 3.5, <strong>tous les niveaux de toutes les classes partagent un unique total d'XP</strong>. Il n'y a pas d'XP séparés par classe. Les seuils du tableau ci-dessus s'appliquent au <em>niveau total</em> du personnage (somme de tous ses niveaux de classe).</p>
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
