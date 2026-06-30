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
          <Row label="CA Armure / Bouclier">Entrez le bonus d'armure et de bouclier séparément. Le modificateur de DEX est ajouté automatiquement.</Row>
          <Row label="PV actuels">Peut différer des PV max si le personnage a subi des dégâts. Utilisez la fiche joueur pour les ajuster en temps réel.</Row>
          <Row label="Déplacement">En mètres. Laissez vide pour utiliser la valeur raciale par défaut (9 m pour la plupart des races).</Row>
          <Row label="Jets de sauvegarde">Les bases sont calculées automatiquement. Entrez un bonus magique si le personnage porte des objets qui les améliorent.</Row>
        </Section>

        <Section titre="🧙 Onglet Sorts — grimoire et préparations">
          <p>L'onglet Sorts ✨ fonctionne différemment selon le type de lanceur de sorts.</p>

          <p className="font-semibold text-stone-400 mt-2">Lanceurs divins — Prêtre, Druide, Paladin, Rôdeur</p>
          <p>Aucune saisie n'est nécessaire dans cet onglet. Ces classes ont accès à toute leur liste de sorts automatiquement selon leur niveau — la fiche les affiche directement lors de la prière. Vous pouvez ignorer l'onglet Sorts lors de la création ou modification du personnage.</p>
          <Tip>Un Prêtre de niveau 5 aura automatiquement accès à tous les sorts de prêtre de niveau 0 à 3 via le bouton 🙏 Prier sur sa fiche, sans configuration préalable.</Tip>

          <p className="font-semibold text-stone-400 mt-3">Magicien — grimoire</p>
          <p>L'onglet affiche la liste complète des sorts de magicien. Cliquez sur un sort pour l'ajouter au grimoire du personnage. Seuls les sorts dans le grimoire sont disponibles lors de l'étude.</p>
          <Row label="Ajouter un sort">Cliquez sur le nom du sort dans la liste. Il apparaît dans le grimoire avec une préparation de 0.</Row>
          <Row label="Retirer un sort">Cliquez sur le sort dans le grimoire pour le retirer.</Row>

          <p className="font-semibold text-stone-400 mt-3">Ensorceleur / Barde — sorts connus</p>
          <p>Ces lanceurs spontanés ne préparent pas de sorts mais connaissent un nombre limité de sorts permanents. Ajoutez ici les sorts connus du personnage — ils seront disponibles sur la fiche sans nécessiter de préparation quotidienne.</p>

          <Row label="Emplacements par jour">Le tableau en haut de l'onglet affiche les emplacements disponibles par niveau de sort selon le niveau de classe.</Row>

          <p className="font-semibold text-stone-400 mt-3">Sorts personnalisés — homebrew et magie de campagne</p>
          <p>Pour tous les lanceurs de sorts, un bouton <span className="bg-stone-800 border border-stone-700 text-amber-400/80 px-1.5 py-0.5 rounded text-xs font-mono">+ Ajouter un sort personnalisé</span> est disponible directement sur la <strong>fiche joueur</strong> (pas dans ce formulaire). Il permet d'ajouter n'importe quel sort inventé, issu d'un supplément ou béni par une divinité de campagne.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-1">
            <li>Les sorts personnalisés sont marqués d'une étoile <span className="text-amber-700 font-bold">★</span> dans la liste et dans la modale de prière.</li>
            <li>Pour les <strong>divins</strong>, ils persistent entre les prières et s'intègrent automatiquement au panneau de prière chaque jour.</li>
            <li>Un bouton <span className="text-stone-400 font-mono text-xs">✕</span> permet de les supprimer depuis la fiche joueur.</li>
          </ul>
          <Tip>La gestion des préparations quotidiennes (qui lance quoi aujourd'hui) se fait directement sur la fiche joueur via les boutons 🙏 Prier ou 📖 Étudier — pas dans ce formulaire.</Tip>
        </Section>

        <Section titre="🎯 Onglet Dons — sélecteur par catégorie">
          <p>L'onglet Dons affiche une liste filtrée selon les classes du personnage, organisée en catégories.</p>
          <Row label="Onglets de catégories">Seules les catégories pertinentes pour vos classes apparaissent — ex. un Guerrier voit <strong>Combat / Tir / Général</strong>, un Magicien voit <strong>Magie / Métamagie / Général</strong>, un Guerrier/Magicien voit les deux groupes réunis.</Row>
          <Row label="Ajouter un don">Cliquez sur le don dans la liste. Il est ajouté immédiatement à la liste du personnage. Les dons déjà sélectionnés s'affichent grisés avec une ✓.</Row>
          <Row label="Dons ciblant une arme">Pour <strong>Arme de prédilection</strong>, <strong>Spécialisation martiale</strong>, <strong>Acuité martiale</strong> et leurs variantes, un sélecteur d'arme s'ouvre après le clic. Il liste toutes les armes SRD (groupées par catégorie) et les armes personnalisées du personnage.</Row>
          <Row label="Don hors liste">Un champ de saisie libre en bas de l'onglet permet d'ajouter n'importe quel don non présent dans la liste (suppléments, homebrew, etc.).</Row>
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
            <li>Le bouton <strong>+ Ajouter une classe</strong> ajoute une nouvelle entrée (commence à Guerrier niv. 1).</li>
            <li>Le bouton <strong>✕</strong> (rouge) retire une classe — disponible uniquement si ≥ 2 classes.</li>
            <li>Le <strong>niveau total</strong> affiché est la somme de tous les niveaux.</li>
          </ul>
          <Row label="BBA automatique">Le BBA est recalculé en additionnant la contribution de chaque classe selon sa progression (élevée / moyenne / faible).</Row>
          <Row label="Sauvegardes automatiques">Chaque classe contribue séparément à Vigueur, Réflexes et Volonté.</Row>
          <Row label="Sorts multi-classes">L'onglet Sorts ✨ apparaît dès qu'au moins une classe est lanceuse de sorts. Si plusieurs classes peuvent lancer des sorts, des onglets de sélection permettent de naviguer entre les grimoires.</Row>

          <p className="font-semibold text-stone-400 mt-3">Pénalité d'XP</p>
          <p>Si la règle de pénalité d'XP s'applique (classes avec écart de niveau ≥ 2), un avertissement rouge s'affiche automatiquement dans l'onglet Identité avec le pourcentage de pénalité calculé.</p>
          <Tip>La classe préférée de la race est automatiquement exclue du calcul de pénalité (ex. Guerrier pour un Nain).</Tip>
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
