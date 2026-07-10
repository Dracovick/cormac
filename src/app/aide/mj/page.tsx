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

// ─── Table 2-6 du Guide du Maître 3.5 (p.38) : PX par monstre vaincu ─────────
// null = pas de valeur proposée (FP inférieur (*) ou supérieur (**) de 8+ au niveau).
// Ligne = niveau du personnage (1-3 fusionnés comme dans le livre), colonnes = FP 1 à 20.
const TABLE_PX: { niveau: string; px: (number | null)[] }[] = [
  { niveau: '1-3', px: [300, 600, 900, 1350, 1800, 2700, 3600, 5400, 7200, 10800, null, null, null, null, null, null, null, null, null, null] },
  { niveau: '4',   px: [300, 600, 800, 1200, 1600, 2400, 3200, 4800, 6400, 9600, 12800, null, null, null, null, null, null, null, null, null] },
  { niveau: '5',   px: [300, 500, 750, 1000, 1500, 2250, 3000, 4500, 6000, 9000, 12000, 18000, null, null, null, null, null, null, null, null] },
  { niveau: '6',   px: [300, 450, 600, 900, 1200, 1800, 2700, 3600, 5400, 7200, 10800, 14400, 21600, null, null, null, null, null, null, null] },
  { niveau: '7',   px: [263, 350, 525, 700, 1050, 1400, 2100, 3150, 4200, 6300, 8400, 12600, 16800, 25200, null, null, null, null, null, null] },
  { niveau: '8',   px: [200, 300, 450, 600, 800, 1200, 1600, 2400, 3600, 4800, 7200, 9600, 14400, 19200, 28800, null, null, null, null, null] },
  { niveau: '9',   px: [null, 225, 338, 450, 675, 900, 1350, 1800, 2700, 4050, 5400, 8100, 10800, 16200, 21600, 32400, null, null, null, null] },
  { niveau: '10',  px: [null, null, 250, 375, 500, 750, 1000, 1500, 2000, 3000, 4500, 6000, 9000, 12000, 18000, 24000, 36000, null, null, null] },
  { niveau: '11',  px: [null, null, null, 275, 413, 550, 825, 1100, 1650, 2200, 3300, 4950, 6600, 9900, 13200, 19800, 26400, 39600, null, null] },
  { niveau: '12',  px: [null, null, null, null, 300, 450, 600, 900, 1200, 1800, 2400, 3600, 5400, 7200, 10800, 14400, 21600, 28800, 43200, null] },
  { niveau: '13',  px: [null, null, null, null, null, 325, 488, 650, 975, 1300, 1950, 2600, 3900, 5850, 7800, 11700, 15600, 23400, 31200, 46800] },
  { niveau: '14',  px: [null, null, null, null, null, null, 350, 525, 700, 1050, 1400, 2100, 2800, 4200, 6300, 8400, 12600, 16800, 25200, 33600] },
  { niveau: '15',  px: [null, null, null, null, null, null, null, 375, 563, 750, 1125, 1500, 2250, 3000, 4500, 6750, 9000, 13500, 18000, 27000] },
  { niveau: '16',  px: [null, null, null, null, null, null, null, null, 400, 600, 800, 1200, 1600, 2400, 3200, 4800, 7200, 9600, 14400, 19200] },
  { niveau: '17',  px: [null, null, null, null, null, null, null, null, null, 425, 638, 850, 1275, 1700, 2550, 3400, 5100, 7650, 10200, 15300] },
  { niveau: '18',  px: [null, null, null, null, null, null, null, null, null, null, 450, 675, 900, 1350, 1800, 2700, 3600, 5400, 8100, 10800] },
  { niveau: '19',  px: [null, null, null, null, null, null, null, null, null, null, null, 475, 713, 950, 1425, 1900, 2850, 3800, 5700, 8550] },
  { niveau: '20',  px: [null, null, null, null, null, null, null, null, null, null, null, null, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000] },
]

// La diagonale (FP = niveau du groupe) est la valeur moyenne d'une rencontre :
// c'est elle qui est en gras dans le livre.
function estDiagonale(niveau: string, fp: number): boolean {
  if (niveau === '1-3') return fp <= 3
  return parseInt(niveau, 10) === fp
}

function TablePx({ colonnes }: { colonnes: [number, number] }) {
  const fps = Array.from({ length: colonnes[1] - colonnes[0] + 1 }, (_, i) => colonnes[0] + i)
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="text-xs font-mono border-collapse min-w-full">
        <thead>
          <tr className="text-stone-500">
            <th className="text-left pr-2 py-1 font-sans font-semibold sticky left-0 bg-stone-900">Niv.</th>
            {fps.map(fp => <th key={fp} className="text-right px-1.5 py-1">FP {fp}</th>)}
          </tr>
        </thead>
        <tbody>
          {TABLE_PX.map(ligne => (
            <tr key={ligne.niveau} className="border-t border-stone-800/60">
              <td className="text-stone-400 pr-2 py-0.5 font-sans font-semibold sticky left-0 bg-stone-900">{ligne.niveau}</td>
              {fps.map(fp => {
                const v = ligne.px[fp - 1]
                return (
                  <td key={fp} className={`text-right px-1.5 py-0.5 ${v == null ? 'text-stone-700' : estDiagonale(ligne.niveau, fp) ? 'text-amber-300 font-bold' : 'text-stone-300'}`}>
                    {v == null ? '—' : v.toLocaleString('fr-CA')}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function AideMJ({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams
  const retour = from === '/partie' ? '/partie' : '/'
  const labelRetour = from === '/partie' ? '← Journal de partie' : '← Grimoire D&D 3e édition'
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-900/40 py-6 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <Link href={retour} className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-300 active:text-amber-300 text-sm transition-colors px-3 -mx-3 min-h-[44px] rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            {labelRetour}
          </Link>
          <Link href="/aide/joueur" className="text-stone-500 hover:text-amber-300 text-xs transition-colors">
            Aide — Guide du joueur →
          </Link>
        </div>
        <div className="max-w-3xl mx-auto mt-4">
          <h1 className="text-3xl font-bold text-amber-300">Guide du Maître de jeu</h1>
          <p className="text-stone-500 text-sm mt-1">Les règles du Guide du Maître 3.5, résumées — et la façon de les appliquer dans le Grimoire</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

        <div className="text-stone-500 text-xs uppercase tracking-widest mb-3">Chapitre 1</div>

        <Section titre="⭐ Les points d'expérience — le principe (GM p.36)">
          <p>Les points d'expérience quantifient les exploits des personnages : plus les monstres sont dangereux, plus les aventuriers gagnent de PX. Les personnages <strong>se partagent les PX conquis de haute lutte</strong> et gagnent un niveau chaque fois que leur total atteint un certain seuil.</p>
          <p>Chaque monstre du <em>Manuel des Monstres</em> est associé à un <strong className="text-amber-200">facteur de puissance (FP)</strong> qui, comparé au niveau moyen du groupe, indique directement le nombre de PX qu'il rapporte.</p>
          <Row label="Quand les donner ?">À la <strong>fin de la séance</strong> pour que les joueurs puissent monter de niveau s'ils ont assez accumulé — ou au <strong>début de la séance suivante</strong>, ce qui vous laisse le temps de les calculer tranquillement entre deux parties.</Row>
          <Row label="Qui y a droit ?">Seuls les personnages qui <strong>prennent part à la rencontre</strong>. Un personnage mort avant la rencontre ne gagne rien, même s'il est ramené à la vie ensuite (idem pour un personnage endormi ou hors de combat pendant toute la rencontre).</Row>
          <Row label="Créatures convoquées">Aucun PX pour les créatures convoquées par l'adversaire : ce pouvoir est déjà inclus dans le FP du convocateur.</Row>
          <Tip>C'est vous qui décidez quand la tâche proposée par la rencontre est accomplie : l'ennemi terrassé, bien sûr, mais aussi le minotaure endormi contourné sans bruit, si le but était d'entrer dans la salle qu'il gardait.</Tip>
        </Section>

        <Section titre="📐 La procédure officielle en 6 étapes (GM p.37)">
          <ol className="list-decimal list-inside space-y-1.5 pl-1">
            <li><strong>Calculez le niveau</strong> de chaque personnage (sans oublier le niveau global équivalent si l'un d'eux est d'une race inhabituelle).</li>
            <li><strong>Déterminez le FP</strong> de chaque monstre vaincu.</li>
            <li><strong>Consultez la table</strong> ci-dessous : ligne du niveau du personnage, colonne du FP du monstre.</li>
            <li><strong>Divisez</strong> le résultat par le <strong>nombre de membres du groupe</strong>.</li>
            <li><strong>Additionnez</strong> les PX ainsi obtenus pour tous les monstres vaincus.</li>
            <li><strong>Répétez</strong> le processus pour chaque personnage.</li>
          </ol>
          <div className="bg-stone-800/50 rounded-lg px-4 py-3 text-xs space-y-1">
            <p className="font-semibold text-stone-300">Exemple du livre — groupe de 5 contre deux monstres de FP 2 et un de FP 3 :</p>
            <p>Le personnage de <strong>niveau 3</strong> gagne 600 PX par monstre de FP 2 et 900 PX pour celui de FP 3, soit 2 100 PX ÷ 5 = <strong className="text-amber-300">420 PX</strong>. Les personnages de <strong>niveau 4</strong> gagnent (600 + 600 + 800) ÷ 5 = <strong className="text-amber-300">400 PX</strong>, et celui de <strong>niveau 5</strong> (500 + 500 + 750) ÷ 5 = <strong className="text-amber-300">350 PX</strong>.</p>
          </div>
          <p className="text-xs text-stone-400">Notez que chacun divise par le nombre de membres <em>du groupe entier</em>, mais lit la table à <em>son</em> niveau : les personnages de bas niveau reçoivent un peu plus que les hauts niveaux pour la même rencontre.</p>
        </Section>

        <Section titre="📊 Table 2-6 : PX par monstre vaincu (GM p.38)">
          <p className="text-xs">Valeur pour <strong>un</strong> monstre, à diviser par le nombre de membres du groupe. En <strong className="text-amber-300">ambre gras</strong>, la diagonale FP = niveau : la valeur moyenne d'une rencontre équilibrée.</p>
          <TablePx colonnes={[1, 10]} />
          <TablePx colonnes={[11, 20]} />
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-stone-400">
            <li><strong>—</strong> : la table ne propose pas de valeur quand le FP s'écarte de 8 ou plus du niveau du personnage. Trop faible : la rencontre ne devrait rien rapporter (ou presque). Trop fort : il se passe quelque chose d'étrange — réfléchissez bien au nombre de PX mérité.</li>
            <li><strong>FP inférieur à 1</strong> : calculez comme si le monstre avait un FP de 1, puis divisez par deux (ex. un orque isolé, FP 1/2).</li>
            <li><strong>FP supérieur à 20</strong> : doublez les PX d'une créature dont le FP est inférieur de 2 points (un FP 21 rapporte deux fois plus qu'un FP 19, un FP 23 deux fois plus qu'un FP 21, etc.).</li>
          </ul>
        </Section>

        <Section titre="⚖️ Ajuster la difficulté… avec discernement (GM p.39)">
          <p>Si les circonstances rendent une rencontre vraiment plus facile ou plus difficile que son FP ne l'indique (des orques qui bombardent depuis des deltaplanes ne valent pas des orques à pied !), modifiez les PX en conséquence :</p>
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse w-full max-w-md">
              <thead>
                <tr className="text-stone-500 text-left"><th className="py-1 pr-3 font-semibold">Circonstances</th><th className="py-1 pr-3 font-semibold">Calcul des PX</th><th className="py-1 font-semibold">Niveau de difficulté</th></tr>
              </thead>
              <tbody className="text-stone-300">
                <tr className="border-t border-stone-800/60"><td className="py-1 pr-3">Deux fois moins difficile</td><td className="pr-3 font-mono">× 1/2</td><td>−2 au ND</td></tr>
                <tr className="border-t border-stone-800/60"><td className="py-1 pr-3">Sensiblement moins difficile</td><td className="pr-3 font-mono">× 2/3</td><td>−1 au ND</td></tr>
                <tr className="border-t border-stone-800/60"><td className="py-1 pr-3">Sensiblement plus difficile</td><td className="pr-3 font-mono">× 3/2</td><td>+1 au ND</td></tr>
                <tr className="border-t border-stone-800/60"><td className="py-1 pr-3">Deux fois plus difficile</td><td className="pr-3 font-mono">× 2</td><td>+2 au ND</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs">Une retouche plus fine (±10 %) est aussi possible sans changer le ND. Et gardez ces conseils du livre en tête :</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
            <li>Ce sont les PX qui déterminent la progression de la campagne : <strong>ni trop avare, ni trop généreux</strong>.</li>
            <li>La plupart des rencontres n'ont <strong>pas besoin</strong> d'être modifiées — ne vous perdez pas dans les détails.</li>
            <li>Des <strong>jets de dés calamiteux</strong> ou de mauvais choix des joueurs ne justifient pas un bonus de PX : une rencontre difficile par malchance ne rapporte pas davantage.</li>
            <li>Chaque rencontre s'évalue <strong>indépendamment</strong> — pas de PX gonflés parce que le groupe était affaibli par le combat précédent.</li>
            <li>Le <strong>bon sens prime sur la table</strong> : une rencontre si facile qu'elle n'oblige pas les personnages à puiser dans leurs ressources ne devrait rien rapporter (32 orques contre un groupe de niveau 9 ne valent pas un ND 9 !). À l'inverse, un combat réellement dangereux conclu vite grâce à une chance insolente vaut tous les PX de la table.</li>
          </ul>
        </Section>

        <Section titre="⚡ Option : la méthode simplifiée (GM p.39)">
          <p>Au lieu de calculer, accordez environ <strong className="text-amber-200">75 PX × niveau du groupe</strong> à chaque personnage pour une rencontre équilibrée. Rencontre plus dangereuse : 100, voire 150 PX par niveau. Plus facile : 25 ou 50 PX par niveau.</p>
          <p className="text-xs">Variante « à la séance » : environ 300 PX × niveau du groupe par personnage et par séance, modulés selon la difficulté de la soirée. Simple et prévisible — mais le livre avertit que cela pénalise les joueurs entreprenants, qui gagneraient toujours le même nombre de PX quoi qu'ils fassent.</p>
          <Tip>Repère utile : le système est calibré pour qu'environ <strong>13,33 rencontres</strong> de ND égal au niveau du groupe fassent gagner un niveau.</Tip>
        </Section>

        <Section titre="🧩 Les PX hors combat (GM p.39-41)">
          <Row label="Pièges">Un piège rapporte ses PX (selon son FP) à qui y est <strong>confronté</strong> : désamorcé, contourné, ou tout simplement survécu à ses dégâts. Aucun PX si les personnages l'ignorent et ne le déclenchent pas.</Row>
          <Row label="Énigmes et diplomatie">Résoudre une énigme, convaincre un PNJ, échapper à un adversaire trop puissant : comptez un <strong>FP égal au niveau du groupe</strong> si l'échec expose à un risque sérieux — moins (voire rien) si la rencontre ne présente aucune difficulté réelle. Ne récompensez que ce qui est mérité.</Row>
          <Row label="Objectif de mission">Atteindre l'objectif final de l'aventure peut rapporter une récompense liée à l'histoire : <strong>plus que n'importe quelle rencontre de l'aventure, mais moins que toutes combinées</strong>. Aucun FP à calculer — c'est vous, et vous seul, qui la déterminez. Un objectif facile ne doit pas rapporter grand-chose.</Row>
          <Row label="Objectifs personnels">Le paladin qui accomplit sa vengeance jurée, la quête de l'objet qui sauvera le village natal… Les personnages qui mènent à bien un but personnel louable méritent une récompense à la hauteur de leur persévérance. (« Je souhaite devenir plus puissant » ne compte pas !)</Row>
          <Row label="Interprétation">Le barde qui compose un poème sur la campagne, le personnage qui tombe amoureux au détriment de sa disponibilité… Ces récompenses sont à votre entière discrétion; le livre suggère de ne pas dépasser <strong>50 PX × niveau, par aventure et par personnage</strong>, pour ne pas déséquilibrer la campagne.</Row>
          <Tip>Deux façons d'intégrer les PX d'histoire : tout convertir en récompenses liées à l'aventure (tuer les monstres ne rapporte alors rien en soi), ou — plus simple — attribution normale à <strong>moitié de PX</strong> pour les monstres, le reste en PX d'aventure. N'additionnez pas les deux à taux plein, sauf pour accélérer volontairement la progression.</Tip>
        </Section>

        <Section titre="💀 Les PX, la mort et la dépense (GM p.41)">
          <Row label="Mort en combat">Un personnage a droit à sa <strong>part normale</strong> de PX dès qu'il prend part à une rencontre, même s'il y est tué. S'il est ramené à la vie, ces PX lui sont attribués <em>après</em> la perte de niveau due à son retour.</Row>
          <Row label="Retour à la vie">Toute créature rappelée à la vie perd <strong>1 niveau d'expérience</strong> (ses PX tombent à mi-chemin entre son nouveau niveau et le suivant), sauf avec <em>résurrection suprême</em>. Un personnage de niveau 1 perd 2 points de Constitution à la place.</Row>
          <Row label="Dépense de PX">Les personnages ne perdent des PX que pour <strong>lancer certains sorts</strong> (souhait, miracle…) ou <strong>fabriquer des objets magiques</strong>. Le livre est formel : n'utilisez <strong>jamais</strong> le retrait de PX comme punition — discutez plutôt avec le joueur fautif.</Row>
        </Section>

        <Section titre="🎲 Dans le Grimoire : le bouton ⭐ Distribuer l'XP">
          <p>Une fois le total de la rencontre (ou de la soirée) établi avec les règles ci-dessus, la page <span className="font-mono text-stone-300">/partie</span> fait le reste :</p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1">
            <li>Cliquez <span className="bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded text-xs">⭐ Distribuer l&apos;XP</span> (ligne « Récompense », sous les boutons de combat).</li>
            <li>Entrez le <strong>total d'XP de la rencontre</strong> — le Grimoire le répartit également entre les personnages cochés. Les personnages <strong>actifs de la journée</strong> sont pré-cochés; ajoutez les autres (joueurs sur papier, fiche non touchée) via le menu « + Ajouter un personnage ».</li>
            <li>La <strong>pénalité multi-classes est déduite automatiquement</strong> (−20 % par classe en retard de 2+ niveaux sur la plus haute, classe de prédilection raciale exempte — badge rouge <span className="text-red-400 font-mono">−20 %</span> sur les personnages concernés).</li>
            <li>Ajustez chaque part à la main au besoin : récompense d'interprétation, objectif personnel, personnage absent d'un combat… (Attention : modifier le total ou cocher/décocher recalcule toutes les parts.)</li>
            <li>Confirmez : l'XP s'ajoute sur chaque fiche et une entrée <span className="text-yellow-300">⭐</span> s'inscrit dans la chronique — avec <strong>🎉 si un seuil de niveau est franchi</strong>.</li>
          </ol>
          <Row label="Passage de niveau">Le Grimoire signale le seuil franchi mais ne monte pas le personnage : le joueur choisit sa classe avec vous, puis met sa fiche à jour via <strong>Modifier</strong>. La barre d'XP en haut de chaque fiche montre la progression vers le prochain seuil.</Row>
          <Row label="Division par le groupe">La répartition égale du Grimoire correspond à l'étape 4 de la procédure officielle pour un groupe de même niveau. Si vos personnages ont des niveaux très différents, calculez les parts individuelles avec la Table 2-6 et inscrivez-les à la main — chaque champ reste libre.</Row>
          <Tip>Le total que vous entrez est bien le <strong>total de la rencontre</strong> (la somme des valeurs de la table pour tous les monstres), pas la part individuelle : c'est le Grimoire qui divise.</Tip>
        </Section>

        <p className="text-stone-600 text-xs text-center mt-8 mb-2">
          Résumé du Guide du Maître D&D 3.5 (chapitre 2, « Les récompenses », p.36-41) — © Wizards of the Coast.
          D'autres chapitres s'ajouteront au fil des besoins de la table.
        </p>
      </main>
    </div>
  )
}
