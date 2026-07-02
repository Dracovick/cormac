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
          <Link href={retour} className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-300 text-sm transition-colors">
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
          <Tip>Un bouton <strong>⚡ Recommencer</strong> flottant en haut à droite permet de revenir au formulaire de sélection sans perdre votre travail.</Tip>
        </Section>

        <Section titre="📋 Les onglets du formulaire">
          <p>Le formulaire est divisé en 8 onglets. La barre d'onglets est accessible en tout temps en haut de l'écran.</p>
          <div className="grid gap-2 mt-2">
            <Row label={<Onglet label="Identité" /> as any}>Nom, surnom, race, classe, niveau, alignement, divinité, clan, XP, photo, joueur.</Row>
            <Row label={<Onglet label="Caractéristiques" /> as any}>Les 6 scores (FOR, DEX, CON, INT, SAG, CHA) avec leur valeur de base et leur bonus magique. Les modificateurs et totaux sont calculés automatiquement.</Row>
            <Row label={<Onglet label="Combat" /> as any}>PV max et actuels, CA (armure, bouclier, naturelle, déflexion, divers), initiative, déplacement, karma, BBA. Le BBA est calculé automatiquement depuis la classe et le niveau — laissez à 0 pour le calcul auto.</Row>
            <Row label={<Onglet label="Compétences" /> as any}>Liste complète des compétences D&D 3.5. Entrez les <strong>rangs investis</strong> et un éventuel modificateur divers. Le total (rangs + carac + divers) s'affiche automatiquement.</Row>
            <Row label={<Onglet label="Dons" /> as any}>Sélecteur de dons filtré par classe, organisé par catégorie (Combat, Tir, Magie, etc.). Inclut un champ de saisie libre pour les dons hors liste.</Row>
            <Row label={<Onglet label="Équipement" /> as any}>Armes, armures, objets magiques (avec charges), potions, trésor et langues.</Row>
            <Row label={<Onglet label="Sorts ✨" /> as any}>Visible uniquement pour les classes lanceuses de sorts. Sélection par niveau de sort.</Row>
            <Row label={<Onglet label="Notes" /> as any}>Texte libre pour l'historique, les traits de personnalité ou toute autre information.</Row>
          </div>
          <Tip>L'onglet <strong>Sorts ✨</strong> n'apparaît que si la classe sélectionnée est un lanceur de sorts.</Tip>
        </Section>

        <Section titre="⚔️ Onglet Combat — détails">
          <Row label="BBA (Bonus de Base à l'Attaque)">Laissez à <strong>0</strong> pour que le système le calcule automatiquement selon votre classe et niveau D&D 3.5. Saisissez une valeur pour forcer manuellement.</Row>
          <Row label="CA — calcul automatique">La Classe d'Armure est calculée automatiquement depuis les armures dans l'onglet Équipement. La formule appliquée : <span className="font-mono text-stone-300">10 + armures (bonus + magique) + mod DEX (plafonné par max DEX) + naturelle + déflexion + divers</span>. Il n'y a plus de champs manuels Armure/Bouclier.</Row>
          <Row label="Max DEX de l'armure">Si une armure portée limite le bonus de DEX (ex. Chemise de mailles : Max DEX +6), le modificateur de DEX positif est automatiquement plafonné. Un modificateur négatif s'applique toujours en entier.</Row>
          <Row label="PV actuels">Peut différer des PV max si le personnage a subi des dégâts. Utilisez la fiche joueur pour les ajuster en temps réel.</Row>
          <Row label="Déplacement">En mètres. Laissez vide pour utiliser la valeur par défaut (9 m). Si le personnage porte une armure lourde, la fiche réduit automatiquement le déplacement à 6 m.</Row>
          <Row label="Jets de sauvegarde">Les bases sont calculées automatiquement. Entrez un bonus magique si le personnage porte des objets qui les améliorent.</Row>
          <Row label="Domaines divins">Si le personnage a la classe <strong>Prêtre</strong> ou <strong>Druide</strong>, une carte <em>Domaines divins</em> apparaît dans cet onglet avec deux menus déroulants : les 23 domaines du PHB 3.5 (Air, Animal, Guérison, Guerre, Magie, Mort, Protection, Voyage…) <strong>plus les 34 domaines des Royaumes Oubliés</strong> (Araignées, Charme, Drows, Elfes, Lune, Nains, Noblesse, Obscurité, Océan, Runes, Tempête, Temps…). Les domaines choisis s'affichent ensuite sur la fiche avec leur pouvoir et leurs 9 sorts de domaine.</Row>
        </Section>

        <Section titre="🧙 Onglet Sorts — grimoire et préparations">
          <p>L'onglet Sorts ✨ fonctionne différemment selon le type de lanceur de sorts.</p>
          <Tip>Le catalogue inclut maintenant les <strong>38 sorts des Royaumes Oubliés</strong> (Incinérateur d'Aganazzar, Nuée de boules de neige de Snilloc, Griffes d'ombres, Splendeur de l'aigle…). Les sorts réservés aux domaines de Faerûn (Araignées, Lune, Obscurité…) portent la mention « Sort de domaine » dans leur description.</Tip>

          <p className="font-semibold text-stone-400 mt-2">Lanceurs divins — Prêtre, Druide, Paladin, Rôdeur</p>
          <p>Aucune saisie n'est nécessaire dans cet onglet. Ces classes ont accès à toute leur liste de sorts automatiquement selon leur niveau — la fiche les affiche directement lors de la prière. Vous pouvez ignorer l'onglet Sorts lors de la création ou modification du personnage.</p>
          <Tip>Un Prêtre de niveau 5 aura automatiquement accès à tous les sorts de prêtre de niveau 0 à 3 via le bouton 🙏 Prier sur sa fiche, sans configuration préalable.</Tip>

          <p className="font-semibold text-stone-400 mt-3">Magicien — grimoire</p>
          <p>L'onglet affiche la liste complète des sorts de magicien. Cliquez sur un sort pour l'ajouter au grimoire du personnage. Seuls les sorts dans le grimoire sont disponibles lors de l'étude.</p>
          <Row label="Ajouter un sort">Cliquez sur le nom du sort dans la liste. Il apparaît dans le grimoire avec une préparation de 0.</Row>
          <Row label="Retirer un sort">Cliquez sur le sort dans le grimoire pour le retirer.</Row>

          <p className="font-semibold text-stone-400 mt-3">Ensorceleur / Barde — sorts connus</p>
          <p>Ces lanceurs spontanés ne préparent pas de sorts mais connaissent un nombre limité de sorts permanents. Ajoutez ici les sorts connus du personnage — ils seront disponibles sur la fiche sans nécessiter de préparation quotidienne. Sur la fiche, leur bouton s'appelle <strong>✨ Repos</strong> (au lieu de 📖 Étudier) et sert uniquement à suivre les emplacements dépensés dans la journée.</p>

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
          <Row label="Onglets de catégories">Seules les catégories pertinentes pour vos classes apparaissent — ex. un Guerrier voit <strong>Combat / Tir / Général</strong>, un Magicien voit <strong>Magie / Métamagie / Général</strong>, un Guerrier/Magicien voit les deux groupes réunis.</Row>
          <Row label="Ajouter un don">Cliquez sur le don dans la liste. Il est ajouté immédiatement à la liste du personnage. Les dons déjà sélectionnés s'affichent grisés avec une ✓.</Row>
          <Row label="Dons ciblant une arme">Pour <strong>Arme de prédilection</strong>, <strong>Spécialisation martiale</strong>, <strong>Acuité martiale</strong> et leurs variantes, un sélecteur d'arme s'ouvre après le clic. Il liste toutes les armes SRD (groupées par catégorie) et les armes personnalisées du personnage.</Row>
          <Row label="Don hors liste">Un champ de saisie libre en bas de l'onglet permet d'ajouter n'importe quel don non présent dans la liste (suppléments, homebrew, etc.).</Row>
          <Row label="Prérequis vérifiés">Les dons majeurs ont leurs prérequis D&D 3.5 encodés (BBA minimum, caractéristique minimum, dons requis). Sur la <strong>fiche joueur</strong>, un avertissement <span className="text-red-400 font-mono">⚠</span> rouge signale tout don dont les prérequis ne sont pas satisfaits, avec le détail de ce qui manque.</Row>
          <Tip>Les dons d'arme (ex. Arme de prédilection) peuvent être pris plusieurs fois avec des armes différentes — ils ne se grisent donc pas après sélection.</Tip>
        </Section>

        <Section titre="🗡️ Onglet Équipement — sélecteur d'armes">
          <p>Le champ <strong>Nom</strong> de chaque arme est un menu déroulant contenant les 69 armes du SRD D&D 3.5, groupées par catégorie (Armes courantes / Armes de guerre / Armes exotiques).</p>
          <Row label="Sélectionner une arme">Choisissez une arme dans le menu déroulant. Les champs <strong>Dégâts</strong>, <strong>Critique</strong> et <strong>Type</strong> se remplissent automatiquement selon les statistiques officielles D&D 3.5.</Row>
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
          <Row label="Munitions +Mag">Bonus d'enchantement des flèches ou carreaux utilisés. S'ajoute à l'attaque ET aux dégâts, cumulable avec le bonus de l'arc. Pas besoin de créer une arme séparée pour les flèches.</Row>
          <Row label="Exemple">Flèches +2 → entrez <strong>Munitions +Mag = 2</strong>. Le détail affichera <span className="font-mono text-stone-300">fl. +2</span> dans la décomposition.</Row>
        </Section>

        <Section titre="🗡️ Onglet Équipement — objets magiques et charges">
          <p>La section <strong className="text-amber-200">Objets magiques</strong> contient un champ <strong>Charges</strong> pour les bâtons, baguettes et autres objets à charges.</p>
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
          <Row label="Sorts multi-classes">L'onglet Sorts ✨ apparaît dès qu'au moins une classe est lanceuse de sorts.</Row>
          <Row label="Compétences de classe">Dans l'onglet Compétences, une compétence est traitée comme <em>compétence de classe</em> (rang max = niveau total + 3) dès qu'elle l'est pour <strong>au moins une</strong> de vos classes. Exemple : après avoir ajouté Magicien, <em>Connaissance (arcanes)</em> et <em>Concentration</em> deviennent compétences de classe pour tout le personnage.</Row>

          <p className="font-semibold text-stone-400 mt-4">Progression des XP en D&D 3.5</p>
          <p>Un personnage multi-classé n'a <strong>qu'un seul total d'XP</strong>, partagé entre toutes ses classes. Les seuils de niveau sont basés sur le <em>niveau total</em> du personnage (somme de tous ses niveaux). Quand le seuil est atteint, le joueur choisit dans quelle classe placer le nouveau niveau.</p>
          <p className="mt-1">Lors de chaque session de jeu, mettez à jour l'<strong>XP total</strong> dans ce formulaire. La fiche affiche automatiquement les options de prochain niveau, par exemple :</p>
          <div className="bg-stone-800/50 rounded p-2 mt-1 font-mono text-xs text-stone-400">
            → Fighter 4 ou Wizard 3
          </div>

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
        </Section>

        <Section titre="⚔️ Malus d'armure sur les compétences">
          <p>Certaines armures imposent un <strong>malus de compétence</strong> (Armor Check Penalty) qui s'applique automatiquement sur la fiche joueur aux compétences physiques suivantes :</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['Acrobaties', 'Discrétion', 'Déplacement silencieux', 'Escalade', 'Évasion', 'Natation', 'Saut', 'Tour de passe-passe'].map(c => (
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
