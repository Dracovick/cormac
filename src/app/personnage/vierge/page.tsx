/**
 * FICHE DE PERSONNAGE VIERGE — à imprimer et remplir au crayon.
 *
 * Un seul gabarit, pas onze. Le sélecteur de classe et de niveau ne remplit
 * aucune valeur de personnage : il calibre les REPÈRES que la classe impose
 * (dé de vie, bons jets de sauvegarde, attaque de base, plafond de rangs,
 * nombre de dons, niveaux de sort de la classe, compétences de classe).
 * Sans sélection, la feuille est entièrement générique et sert à n'importe
 * quel personnage — y compris un multiclassé, qu'aucun gabarit par classe
 * ne saurait couvrir.
 *
 * ⚠ Les chiffres imprimés viennent des MÊMES modules de règles que la fiche
 * réelle (classes.ts, rules.ts, skills.ts) : une table corrigée corrige les
 * deux documents. Rien n'est recopié à la main ici.
 *
 * Les styles de tableau sont volontairement calqués sur
 * src/app/personnage/[id]/imprimer/page.tsx plutôt qu'extraits dans un module
 * commun : cette feuille-là est validée en production et imprimée par les
 * joueurs, on ne la refactorise pas pour en ajouter une autre.
 */

import Link from 'next/link'
import {
  CLASSES_DND35,
  getClasseInfo,
  nombreDonsAttendus,
  type ClasseInfo,
} from '@/lib/dnd35/classes'
import { getBab, getSave, xpPourNiveau, formatMod } from '@/lib/dnd35/rules'
import { COMPETENCES_DND35 } from '@/lib/dnd35/skills'
import { PrintButton } from '@/components/fiche/PrintButton'

const TABLE = { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '4px' }
const PAGE = { pageBreakAfter: 'always' as const, padding: '0', marginBottom: '0' }
/** Menu de la barre de réglages. Le fond et la couleur du texte sont déclarés
 *  explicitement : un `border-radius` fait abandonner à Chrome l'apparence
 *  native du widget, le fond retombe à `transparent`, et le champ disparaît
 *  dans la barre sombre qui le porte. Même palette que le reste du Grimoire
 *  (stone-800 sur stone-900, texte stone-100). `color-scheme: dark` fait suivre
 *  la flèche et la liste déroulante native, qui ne se stylent pas en CSS. */
const SELECT = {
  padding: '4px 6px',
  borderRadius: '6px',
  background: '#292524',
  color: '#f5f5f4',
  border: '1px solid #57534e',
  fontSize: '13px',
  colorScheme: 'dark' as const,
}

/** Case à remplir : bordure noire, fond blanc, rien dedans. */
function cell(style?: React.CSSProperties, key?: string | number) {
  return <td key={key} style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '8pt', height: '17px', ...style }} />
}

/** Étiquette de case, en petites capitales sur fond gris — comme la fiche réelle. */
function head(content: React.ReactNode, style?: React.CSSProperties, key?: string | number) {
  return (
    <td key={key} style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '7pt', fontWeight: 'bold', textTransform: 'uppercase', background: '#eee', ...style }}>
      {content}
    </td>
  )
}

/** Valeur calibrée : imprimée en gris foncé pour qu'on la distingue de l'encre du joueur. */
function fixed(content: React.ReactNode, style?: React.CSSProperties) {
  return (
    <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '9pt', textAlign: 'center', color: '#444', ...style }}>
      {content}
    </td>
  )
}

function BandeNoire({ children, colSpan }: { children: React.ReactNode; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ background: '#000', color: '#fff', fontWeight: 'bold', fontSize: '9pt', padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {children}
      </td>
    </tr>
  )
}

/** Une rangée de cases à cocher — un emplacement de sort par case. */
function Cases({ nombre }: { nombre: number }) {
  if (nombre <= 0) return <span style={{ color: '#aaa', fontSize: '7pt' }}>—</span>
  return (
    <span style={{ display: 'inline-flex', gap: '2px', flexWrap: 'wrap' }}>
      {Array.from({ length: nombre }).map((_, i) => (
        <span key={i} style={{ display: 'inline-block', width: '9px', height: '9px', border: '1px solid #555' }} />
      ))}
    </span>
  )
}

const NIVEAUX = Array.from({ length: 20 }, (_, i) => i + 1)

/**
 * Dons de bonus propres à une classe, HORS ceux que `nombreDonsAttendus` compte
 * (guerrier et don racial d'humain). Relevé sur le SRD 3.5 VF le 24 octobre 2026
 * — colonne « Spécial » des tables de classes.
 *
 * Ces dons sont à liste imposée : ils ne s'ajoutent pas au décompte des lignes
 * numérotées, qui vaut pour les dons choisis librement. Le papier les NOMME pour
 * que le joueur ne les oublie pas.
 */
/** Niveaux auxquels tout personnage gagne un don (Manuel des Joueurs, table 3–2). */
const NIVEAUX_DE_DON = [1, 3, 6, 9, 12, 15, 18]

const DONS_BONUS_DE_CLASSE: Record<string, string> = {
  Magicien: 'Écriture de parchemins au niveau 1, puis un don supplémentaire aux niveaux 5, 10, 15 et 20 — obligatoirement de métamagie, de création d\'objet, ou Maîtrise des sorts.',
  Moine: 'Un don supplémentaire aux niveaux 1, 2 et 6, à choisir dans la liste imposée de la classe.',
  Rôdeur: 'Endurance au niveau 3, et un style de combat au niveau 2 (puis sa science au 6 et sa maîtrise au 11).',
}

/**
 * Feuille de sorts — le même bloc sert la page de sorts de la fiche et chaque
 * copie du mode « feuilles seulement ». Déclarée hors du rendu : un composant
 * créé pendant le rendu perd son état à chaque frappe dans les menus.
 */
function FeuilleSorts({ titreCalibrage, info, niveauxDeSort, classeNom, spontane }: {
  titreCalibrage: string
  info: ClasseInfo | undefined
  /** Niveaux de sort que la classe atteint en carrière — 0 (oraisons) à niveauMaxSorts. */
  niveauxDeSort: number[]
  classeNom: string
  spontane: boolean
}) {
  // Une feuille de sorts doit tenir sur UNE page, sinon « 3 copies » en imprime
  // six. Calibré par mesure sur la production (Chrome, letter, marges 0,6 po,
  // 24 octobre 2026) : sans grille d'emplacements, 34 lignes passent; avec une
  // grille de 10 niveaux, 26 est le seuil et 28 déborde. Chaque niveau de sort
  // coûte donc un peu moins d'une ligne — d'où le retrait d'une ligne par
  // niveau, avec de la marge sous le seuil mesuré pour absorber les écarts de
  // police entre Chrome et une imprimante réelle.
  const lignes = Math.max(20, 32 - niveauxDeSort.length)
  return (
    <>
      <table style={TABLE}>
        <thead>
          <tr style={{ background: '#000', color: '#fff' }}>
            <td colSpan={7} style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              ✦ Sorts — {titreCalibrage}
            </td>
          </tr>
          <tr>
            <td colSpan={7} style={{ border: '1px solid #ccc', padding: '3px 6px', fontSize: '7.5pt', background: '#f5f5f5' }}>
              {/* Deux lignes explicites : en flux libre, « mod. SAG » se coupait en fin de
                  ligne, et le nowrap qui le réparait collait le rappel du DD au niveau
                  de sort maximal. Une ligne par propos, chacune insécable. */}
              <div><b>Personnage :</b> ______________________________{'  '}<b>Jour de jeu :</b> ______________</div>
              {info && (info.caracteristiqueSorts || info.niveauMaxSorts) && (
                <div style={{ marginTop: '2px' }}>
                  {info.caracteristiqueSorts && (
                    <>
                      <span style={{ whiteSpace: 'nowrap' }}><b>Carac. de sorts :</b> {info.caracteristiqueSorts.toUpperCase()}</span>
                      {'  ·  '}
                      <span style={{ whiteSpace: 'nowrap' }}><b>DD :</b> 10 + niveau du sort + mod. {info.caracteristiqueSorts.slice(0, 3).toUpperCase()}</span>
                    </>
                  )}
                  {info.niveauMaxSorts && (
                    <>
                      {info.caracteristiqueSorts ? '  ·  ' : ''}
                      <span style={{ whiteSpace: 'nowrap' }}><b>Niveau de sort max. :</b> {info.niveauMaxSorts}</span>
                    </>
                  )}
                </div>
              )}
            </td>
          </tr>
          {niveauxDeSort.length > 0 && (
            <tr>
              <td colSpan={7} style={{ border: '1px solid #ccc', padding: '3px 6px', fontSize: '8pt', background: '#fafafa' }}>
                <div style={{ fontWeight: 'bold', fontSize: '7pt', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Emplacements du jour — inscrire le quota, cocher en lançant
                </div>
                {niveauxDeSort.map(n => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.75 }}>
                    <span style={{ width: '56px', fontSize: '7.5pt', fontWeight: 'bold' }}>
                      {n === 0 ? 'Oraisons' : `Niveau ${n}`}
                    </span>
                    <span style={{ display: 'inline-block', width: '26px', borderBottom: '1px solid #666', height: '11px' }} />
                    <Cases nombre={8} />
                  </div>
                ))}
                <div style={{ fontSize: '6.5pt', color: '#777', fontStyle: 'italic', marginTop: '2px' }}>
                  ⚠ Le quota n&apos;est pas imprimé : il se reporte de la <b>Table&nbsp;: le {classeNom.toLowerCase()}</b>
                  {' '}du Manuel des Joueurs, parce que les tables d&apos;emplacements du Grimoire divergent du manuel
                  et que la décision du MJ est en attente. Les niveaux de sort non encore accessibles se rayent.
                  {' '}S&apos;ajoutent à la main : le bonus de caractéristique élevée
                  {classeNom === 'Prêtre' && ', et l\'emplacement de domaine (+1 par niveau de sort ≥ 1)'}.
                  {spontane && ` ${classeNom} lance spontanément : son nombre de sorts CONNUS suit une table distincte du manuel.`}
                </div>
              </td>
            </tr>
          )}
          <tr>
            {head('Niv.', { width: '6%', textAlign: 'center' })}
            {head('Sort', { width: '32%' })}
            {head('École', { width: '16%' })}
            {head('Portée', { width: '12%' })}
            {head('Durée', { width: '14%' })}
            {head('DD', { width: '7%', textAlign: 'center' })}
            {head('Préparé', { width: '13%', textAlign: 'center' })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: lignes }).map((_, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              {cell({ height: '18px' })}
              {cell()}
              {cell()}
              {cell()}
              {cell()}
              {cell()}
              <td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>
                <Cases nombre={4} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: '6.5pt', color: '#666', fontStyle: 'italic' }}>
        Colonne « Préparé » : une case par emplacement occupé par ce sort — on la noircit en le lançant.
      </div>
    </>
  )
}


/**
 * Les réglages passent par l'adresse — `?classe=Pr%C3%AAtre&niveau=5`,
 * `?mode=sorts&copies=4` — et la barre de réglages est un simple formulaire GET.
 *
 * ⚠ Volontairement un composant SERVEUR, sans état React. Une première version
 * lisait les réglages avec `useSearchParams` : la frontière Suspense que cela
 * impose vide le rendu serveur, et la page n'arrivait plus qu'à travers
 * JavaScript — 10 Ko de HTML au lieu de 114. Sur un document à imprimer, c'est
 * inacceptable : un navigateur lent, un onglet restauré ou une impression
 * déclenchée trop tôt produisaient une feuille blanche. Ici tout le gabarit
 * arrive déjà rendu du serveur, et le seul script de la page est le bouton
 * d'impression.
 */
export default async function FicheViergePage({ searchParams }: {
  searchParams: Promise<{ classe?: string; niveau?: string; race?: string; mode?: string; copies?: string }>
}) {
  const sp = await searchParams
  const classeNom = CLASSES_DND35.some(c => c.nom === sp.classe) ? sp.classe! : ''
  const niveauDemande = Number(sp.niveau)
  const niveauStr = Number.isInteger(niveauDemande) && niveauDemande >= 1 && niveauDemande <= 20
    ? String(niveauDemande) : ''
  const race = sp.race === 'Humain' || sp.race === 'Autre' ? sp.race : ''
  const mode: 'fiche' | 'sorts' = sp.mode === 'sorts' ? 'sorts' : 'fiche'
  const copiesDemandees = Number(sp.copies)
  const copies = Number.isInteger(copiesDemandees) && copiesDemandees >= 1 && copiesDemandees <= 6
    ? copiesDemandees : 2

  const info = classeNom ? getClasseInfo(classeNom) : undefined
  const niveau = niveauStr ? Number(niveauStr) : 0
  // Calibré = on sait assez pour imprimer des repères chiffrés. Une classe sans
  // niveau ne donne que ce qui ne dépend pas du niveau (dé de vie, bons jets,
  // compétences de classe) ; les colonnes chiffrées restent vides.
  const calibre = Boolean(info) && niveau > 0

  const bbaBase = info && calibre ? getBab(info.bab, niveau) : null
  const bonVig = info?.bonsSauvegardes.includes('vigueur') ?? false
  const bonRef = info?.bonsSauvegardes.includes('reflexes') ?? false
  const bonVol = info?.bonsSauvegardes.includes('volonte') ?? false
  const dons = calibre ? nombreDonsAttendus(classeNom, niveau, race || null) : null
  const plafondClasse = calibre ? niveau + 3 : null
  const plafondHorsClasse = plafondClasse !== null ? Math.floor(plafondClasse / 2) : null

  const estLanceur = info?.lanceurSorts ?? false
  // Sans classe choisie, on imprime quand même la feuille de sorts : le MJ ne
  // sait pas encore à qui elle servira.
  const afficheSorts = !info || estLanceur
  // ⛔ On n'imprime PAS le quota d'emplacements par jour. Les tables du Grimoire
  // (SLOTS_FULL_9 et compagnes, classes.ts) divergent du Manuel des Joueurs —
  // relevé contre le SRD 3.5 VF le 24 octobre 2026 : la table des lanceurs
  // complets accorde un niveau de sort un niveau trop tôt, et elle sert aussi
  // le prêtre, le druide et l'ensorceleur, qui ont chacun la leur. Le défaut est
  // signalé au MJ et attend son arbitrage. Sur un écran, un quota faux est un
  // chiffre; sur une feuille de sorts qu'on garde toute la soirée, il devient la
  // règle appliquée à la table. On imprime donc les NIVEAUX de sort de la classe
  // — information sûre, qui ne dépend d'aucune des tables litigieuses — et on
  // laisse le joueur reporter son quota du manuel.
  const niveauxDeSort = info?.lanceurSorts
    ? (() => {
        const max = info.niveauMaxSorts ?? 9
        // Le paladin et le rôdeur n'ont pas d'oraisons : leur table démarre au 1er.
        const debut = classeNom === 'Paladin' || classeNom === 'Rôdeur' ? 1 : 0
        return Array.from({ length: max - debut + 1 }, (_, i) => debut + i)
      })()
    : []
  // Spontané : l'ensorceleur et le barde ne préparent pas. Leur nombre de sorts
  // CONNUS suit une autre table, que le Grimoire ne porte pas — on ne l'invente
  // pas sur le papier, on dit où le prendre.
  const spontane = classeNom === 'Ensorceleur' || classeNom === 'Barde'

  const titreCalibrage = calibre
    ? `${classeNom} ${niveau}${race ? ` · ${race}` : ''}`
    : info
      ? `${classeNom} — niveau non précisé`
      : 'Générique — toutes classes'

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#000', background: '#fff', maxWidth: '216mm', margin: '0 auto', padding: '0 10px' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          @page { size: letter; margin: 0.6in; }
        }
        @media screen {
          body { background: #888; }
        }
        /* La liste déroulante ouverte est peinte par le système : on lui donne
           la même palette, sinon elle retombe au blanc de l'OS. */
        .no-print select option { background: #292524; color: #f5f5f4; }
        .no-print select:focus { outline: none; border-color: #d97706; }
      `}</style>

      {/* ══ Barre de réglages — jamais imprimée ══ */}
      <div className="no-print" style={{ background: '#1c1917', padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', position: 'sticky', top: 0, zIndex: 10 }}>
        {/* Formulaire GET : les réglages voyagent dans l'adresse, aucun état
            client, et la page reste entièrement rendue par le serveur. */}
        <form method="get" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#a8a29e', fontSize: '14px', textDecoration: 'none' }}>← Accueil</Link>
          <span style={{ color: '#57534e' }}>|</span>

          <label style={{ color: '#d6d3d1', fontSize: '13px' }}>
            Document{' '}
            <select name="mode" defaultValue={mode} style={SELECT}>
              <option value="fiche">Fiche de personnage</option>
              <option value="sorts">Feuilles de sorts seulement</option>
            </select>
          </label>

          <label style={{ color: '#d6d3d1', fontSize: '13px' }}>
            Classe{' '}
            <select name="classe" defaultValue={classeNom} style={SELECT}>
              <option value="">— Générique —</option>
              {CLASSES_DND35.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
            </select>
          </label>

          <label style={{ color: '#d6d3d1', fontSize: '13px' }}>
            Niveau{' '}
            <select name="niveau" defaultValue={niveauStr} style={SELECT}>
              <option value="">—</option>
              {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          <label style={{ color: '#d6d3d1', fontSize: '13px' }}>
            Race{' '}
            <select name="race" defaultValue={race} style={SELECT}>
              <option value="">—</option>
              <option value="Humain">Humain (+1 don)</option>
              <option value="Autre">Autre</option>
            </select>
          </label>

          {/* Toujours présent : le champ doit survivre à un passage en mode
              « sorts », sinon le nombre de copies se perd à chaque soumission. */}
          <label style={{ color: '#d6d3d1', fontSize: '13px' }}>
            Copies{' '}
            <select name="copies" defaultValue={String(copies)} style={SELECT}>
              {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          <button type="submit" style={{ background: '#78350f', color: '#fde68a', border: '1px solid #92400e', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Appliquer
          </button>

          <PrintButton
            nomFichier={[
              mode === 'sorts' ? 'feuilles-de-sorts' : 'fiche-vierge',
              classeNom || 'generique',
              niveauStr,
            ].filter(Boolean).join('-')}
          />
        </form>
        <div style={{ color: '#a8a29e', fontSize: '12px', marginTop: '8px', lineHeight: 1.5 }}>
          {calibre
            ? `Calibré pour ${titreCalibrage} : dé de vie d${info!.de}, attaque de base ${formatMod(bbaBase!)}, plafond de rangs ${plafondClasse}, ${dons!.total} don${dons!.total > 1 ? 's' : ''}${estLanceur ? ', feuille de sorts aux niveaux de la classe' : ''}. Aucune valeur de personnage n'est remplie.`
            : info
              ? 'Classe choisie sans niveau : seuls les repères indépendants du niveau sont imprimés (dé de vie, bons jets, compétences de classe). Choisis un niveau pour les colonnes chiffrées.'
              : 'Feuille entièrement générique — rien n\'est présumé. Choisis une classe pour que les repères se calibrent.'}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODE « FEUILLES DE SORTS SEULEMENT »
      ══════════════════════════════════════════════════════════════════════ */}
      {mode === 'sorts' && Array.from({ length: copies }).map((_, i) => (
        <div key={i} style={i < copies - 1 ? PAGE : { padding: 0 }}>
          <FeuilleSorts titreCalibrage={titreCalibrage} info={info} niveauxDeSort={niveauxDeSort} classeNom={classeNom} spontane={spontane} />
        </div>
      ))}

      {mode === 'fiche' && (
        <>
          {/* ══════════════════════════════════════════════════════════════════
              PAGE 1 — Identité, caractéristiques, combat, armes
          ══════════════════════════════════════════════════════════════════ */}
          <div style={PAGE}>
            {/* En-tête */}
            <table style={{ ...TABLE, marginBottom: '0' }}>
              <tbody>
                <tr>
                  {cell({ width: '30%', height: '24px' })}
                  {cell({ width: '14%' })}
                  {cell({ width: '8%' })}
                  {cell({ width: '12%' })}
                  {cell({ width: '10%' })}
                  <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', width: '18%', fontFamily: 'serif', fontWeight: 'bold', fontSize: '11pt', color: '#8B0000', letterSpacing: '0.05em' }}>
                    ⚔ D&amp;D 3e Éd.
                  </td>
                </tr>
                <tr>
                  {head('Nom du personnage')}
                  {head('Race')}
                  {head('Sexe')}
                  {head('Déplacement')}
                  {head('Karma')}
                  {head('Fiche vierge', { textAlign: 'center', fontSize: '6pt' })}
                </tr>
                <tr>
                  {cell({ width: '12%' })}{cell({ width: '14%' })}{cell({ width: '8%' })}
                  {cell({ width: '10%' })}{cell({ width: '10%' })}{cell({ width: '12%' })}
                  {cell({ width: '12%' })}{cell({ width: '10%' })}
                </tr>
                <tr>
                  {head('Alignement')}{head('Dieu / Clan')}{head('Taille')}{head('Grandeur')}
                  {head('Poids')}{head('Yeux')}{head('Cheveux')}{head('Âge')}
                </tr>
                <tr>
                  <td colSpan={3} style={{ border: '1px solid #000', height: '19px' }} />
                  <td colSpan={2} style={{ border: '1px solid #000' }} />
                  <td colSpan={3} style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '7pt', color: '#666', textAlign: 'center' }}>
                    {calibre ? `Il faut ${xpPourNiveau(niveau).toLocaleString('fr-FR')} XP pour le niveau ${niveau}` : ''}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '7pt', fontWeight: 'bold', textTransform: 'uppercase', background: '#eee' }}>Joueur</td>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '7pt', fontWeight: 'bold', textTransform: 'uppercase', background: '#eee' }}>Points d&apos;expérience</td>
                  <td colSpan={3} style={{ border: '1px solid #000', background: '#eee' }} />
                </tr>
              </tbody>
            </table>

            {/* Mode d'emploi — une feuille vierge doit dire comment on la remplit */}
            <table style={{ ...TABLE, marginBottom: '0', marginTop: '2px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '6.5pt', background: '#eee', lineHeight: 1.45 }}>
                    <strong style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>Feuille vierge — {titreCalibrage}</strong>
                    {' — les chiffres en gris sont des repères imposés par la classe et le niveau; tout le reste est à remplir. '}
                    {calibre
                      ? <>Dé de vie <b>d{info!.de}</b> par niveau (+ mod. CON à chaque dé). Plafond de rangs : <b>{plafondClasse}</b> pour une compétence de classe, <b>{plafondHorsClasse}</b> sinon. {dons!.total} don{dons!.total > 1 ? 's' : ''} au total{dons!.bonusClasse > 0 || dons!.racial > 0 ? ` (${dons!.normaux} de progression${dons!.bonusClasse ? ` + ${dons!.bonusClasse} de guerrier` : ''}${dons!.racial ? ' + 1 d\'humain' : ''})` : ''}.</>
                      : <>Choisis une classe et un niveau sur l&apos;écran avant d&apos;imprimer et les repères apparaîtront : dé de vie, attaque de base, bons jets de sauvegarde, plafond de rangs, nombre de dons, niveaux de sort de la classe.</>}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Caractéristiques + Classe / PV / CA */}
            <table style={{ ...TABLE, marginBottom: '0' }}>
              <tbody>
                <tr>
                  {/* Les six caractéristiques */}
                  <td style={{ border: '1px solid #000', padding: '2px', width: '24%', verticalAlign: 'top' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {head('Caract.', { width: '42%' })}
                          {head('Score', { width: '20%', textAlign: 'center' })}
                          {head('Mod.', { width: '19%', textAlign: 'center' })}
                          {head('Tmp', { width: '19%', textAlign: 'center' })}
                        </tr>
                      </thead>
                      <tbody>
                        {['FOR — Force', 'DEX — Dextérité', 'CON — Constitution', 'INT — Intelligence', 'SAG — Sagesse', 'CHA — Charisme'].map(lbl => (
                          <tr key={lbl}>
                            <td style={{ border: '1px solid #ccc', padding: '2px 4px', fontSize: '7pt', fontWeight: 'bold', background: '#222', color: '#fff' }}>{lbl}</td>
                            <td style={{ border: '1px solid #ccc', height: '21px' }} />
                            <td style={{ border: '1px solid #ccc' }} />
                            <td style={{ border: '1px solid #ccc', background: '#f5f5f5' }} />
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '6pt', color: '#666', lineHeight: 1.4 }}>
                            Mod. = (score − 10) ÷ 2, arrondi à l&apos;inférieur. Bonus de race compris dans le score.
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </td>

                  <td style={{ border: '1px solid #000', padding: '2px', verticalAlign: 'top' }}>
                    {/* Classe */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3px' }}>
                      <thead>
                        <tr>
                          {head('')}
                          {head('Classe')}
                          {head('Niv.', { textAlign: 'center' })}
                          {head('Dés vie', { textAlign: 'center' })}
                          {head('Bonus attaque base', { textAlign: 'center' })}
                          {head('XP acquise', { textAlign: 'center' })}
                          {head('Prochain niv.', { textAlign: 'center' })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {head('Principale', { fontSize: '6.5pt', background: '#fff', textTransform: 'none' })}
                          {info ? fixed(classeNom, { fontWeight: 'bold', textAlign: 'left' }) : cell()}
                          {calibre ? fixed(niveau, { fontWeight: 'bold', fontSize: '11pt' }) : cell()}
                          {info ? fixed(`d${info.de}`) : cell()}
                          {bbaBase !== null ? fixed(formatMod(bbaBase)) : cell()}
                          {cell()}
                          {calibre ? fixed(xpPourNiveau(niveau + 1).toLocaleString('fr-FR'), { fontSize: '8pt' }) : cell()}
                        </tr>
                        <tr>
                          {head('Multi / prestige', { fontSize: '6.5pt', background: '#fff', textTransform: 'none' })}
                          {cell()}{cell()}{cell()}{cell()}{cell()}{cell()}
                        </tr>
                        <tr>
                          {head('Multi / prestige', { fontSize: '6.5pt', background: '#fff', textTransform: 'none' })}
                          {cell()}{cell()}{cell()}{cell()}{cell()}{cell()}
                        </tr>
                      </tbody>
                    </table>

                    {/* PV + Initiative */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3px' }}>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', background: '#000', color: '#fff', width: '14%' }}>PV<br /><span style={{ fontSize: '7pt' }}>Pts vie</span></td>
                          <td style={{ border: '1px solid #000', width: '12%', height: '30px' }} />
                          <td style={{ border: '1px solid #000', padding: '2px 6px', width: '30%', background: '#f5f5f5', fontSize: '6.5pt', color: '#666', verticalAlign: 'bottom' }}>
                            PV actuels : ____________{info && <><br />{niveau > 1 ? `${niveau} dés de d${info.de}` : `1 dé de d${info.de}`} + (mod. CON × {niveau || 'niv.'})</>}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', background: '#000', color: '#fff', width: '16%', textAlign: 'center' }}>INITIATIVE<br /><span style={{ fontSize: '7pt' }}>Modificateur</span></td>
                          <td style={{ border: '1px solid #000', width: '8%' }} />
                          <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555', fontSize: '9pt' }}>=</td>
                          <td style={{ border: '1px solid #000', width: '8%' }} />
                          <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555', fontSize: '9pt' }}>+</td>
                          <td style={{ border: '1px solid #000', background: '#f5f5f5', width: '10%' }} />
                        </tr>
                        <tr>
                          <td colSpan={3} />
                          <td style={{ border: '1px solid #aaa', padding: '1px 4px', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Modif. DEX</td>
                          <td /><td />
                          <td style={{ border: '1px solid #aaa', padding: '1px 4px', fontSize: '6pt', color: '#888', textAlign: 'center' }}>DEX</td>
                          <td />
                          <td style={{ border: '1px solid #aaa', padding: '1px 4px', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Divers</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* CA */}
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td rowSpan={2} style={{ border: '1px solid #000', fontWeight: 'bold', fontSize: '9pt', background: '#000', color: '#fff', textAlign: 'center', padding: '4px', width: '8%' }}>CA<br /><span style={{ fontSize: '7pt' }}>Armure</span></td>
                          <td rowSpan={2} style={{ border: '1px solid #000', width: '9%', height: '34px' }} />
                          <td style={{ border: '1px solid #000', textAlign: 'center', fontSize: '9pt' }}>=</td>
                          <td style={{ border: '1px solid #000', textAlign: 'center', fontSize: '10pt', fontWeight: 'bold', color: '#444' }}>10</td>
                          <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                          <td style={{ border: '1px solid #000', width: '7%' }} />
                          <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                          <td style={{ border: '1px solid #000', width: '7%' }} />
                          <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                          <td style={{ border: '1px solid #000', width: '7%' }} />
                          <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                          <td style={{ border: '1px solid #000', width: '7%' }} />
                          <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                          <td style={{ border: '1px solid #000', width: '7%' }} />
                          <td rowSpan={2} style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '7pt', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '4px' }}>TYPE D&apos;ARMURE</div>
                            <div style={{ borderBottom: '1px solid #999', height: '13px' }} />
                            <div style={{ fontSize: '6pt', color: '#888', marginTop: '2px' }}>Max. DEX de l&apos;armure : ______</div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #aaa', fontSize: '6pt', color: '#888', textAlign: 'center' }} />
                          <td style={{ border: '1px solid #aaa', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Base</td>
                          <td />
                          <td style={{ border: '1px solid #aaa', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Armure</td>
                          <td />
                          <td style={{ border: '1px solid #aaa', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Parade</td>
                          <td />
                          <td style={{ border: '1px solid #aaa', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Mod.DEX</td>
                          <td />
                          <td style={{ border: '1px solid #aaa', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Taille</td>
                          <td />
                          <td style={{ border: '1px solid #aaa', fontSize: '6pt', color: '#888', textAlign: 'center' }}>Natur. / divers</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Jets de sauvegarde */}
            <table style={{ ...TABLE, marginBottom: '0' }}>
              <thead>
                <BandeNoire colSpan={10}>Jets de sauvegarde</BandeNoire>
                <tr>
                  {['', 'Total', '=', 'Jet de base', '+', 'Caract.', '+', 'Magique', '+', 'Divers'].map((h, i) => (
                    <td key={i} style={{ border: '1px solid #000', padding: '1px 3px', fontSize: '6pt', fontWeight: 'bold', background: '#eee', textAlign: 'center', textTransform: 'uppercase' }}>{h}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  ['Réflexes (DEX)', bonRef],
                  ['Vigueur (CON)', bonVig],
                  ['Volonté (SAG)', bonVol],
                ] as [string, boolean][]).map(([label, bon]) => (
                  <tr key={label}>
                    <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '8pt', fontWeight: 'bold', background: '#222', color: '#fff', width: '24%' }}>
                      {label}{info && bon && <span style={{ color: '#fbbf24' }}> ✦ bon</span>}
                    </td>
                    <td style={{ border: '1px solid #000', width: '8%', height: '21px' }} />
                    <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555', fontSize: '8pt' }}>=</td>
                    {calibre ? fixed(formatMod(getSave(bon, niveau)), { fontWeight: 'bold' }) : cell({ textAlign: 'center' })}
                    <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555', fontSize: '8pt' }}>+</td>
                    {cell({ width: '9%' })}
                    <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555', fontSize: '8pt' }}>+</td>
                    {cell({ width: '9%' })}
                    <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555', fontSize: '8pt' }}>+</td>
                    {cell({ width: '9%', background: '#f5f5f5' })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={10} style={{ border: '1px solid #000', padding: '2px 6px', fontSize: '6.5pt', color: '#666' }}>
                    {info
                      ? <>Jets de base de la classe {classeNom}{calibre ? ` au niveau ${niveau}` : ''} — bons jets marqués ✦. Caract. : Réflexes = DEX, Vigueur = CON, Volonté = SAG.</>
                      : <>Bon jet : +2 au niveau 1, puis +1 tous les deux niveaux. Jet faible : +1 tous les trois niveaux.</>}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Bonus d'attaque */}
            <table style={{ ...TABLE, marginBottom: '0' }}>
              <thead>
                <BandeNoire colSpan={10}>Bonus d&apos;attaque</BandeNoire>
                <tr>
                  {['', 'Bonus total', '=', 'Attaque base', '+', 'Caract.', '+', 'Taille', '+', 'Divers'].map((h, i) => (
                    <td key={i} style={{ border: '1px solid #000', padding: '1px 3px', fontSize: '6pt', fontWeight: 'bold', background: '#eee', textAlign: 'center', textTransform: 'uppercase' }}>{h}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['Corps à corps (FOR)', 'Projectiles (DEX)'].map(label => (
                  <tr key={label}>
                    <td style={{ border: '1px solid #000', padding: '2px 4px', fontSize: '8pt', fontWeight: 'bold', background: '#222', color: '#fff', width: '24%' }}>{label}</td>
                    <td style={{ border: '1px solid #000', width: '8%', height: '21px' }} />
                    <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>=</td>
                    {bbaBase !== null ? fixed(formatMod(bbaBase), { fontWeight: 'bold' }) : cell({ textAlign: 'center' })}
                    <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                    {cell({ width: '9%' })}
                    <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                    {cell({ width: '9%', background: '#f5f5f5' })}
                    <td style={{ border: '1px solid #000', textAlign: 'center', color: '#555' }}>+</td>
                    {cell({ width: '9%', background: '#f5f5f5' })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Langues */}
            <table style={{ ...TABLE, marginBottom: '0' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', fontWeight: 'bold', background: '#000', color: '#fff', padding: '2px 6px', fontSize: '9pt', textTransform: 'uppercase', width: '12%' }}>Langues</td>
                  <td style={{ border: '1px solid #000', height: '21px' }} />
                </tr>
              </tbody>
            </table>

            {/* Armes */}
            <table style={{ ...TABLE, marginTop: '4px' }}>
              <thead>
                <tr style={{ background: '#000', color: '#fff' }}>
                  <td style={{ border: '1px solid #000', padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', width: '30%' }}>Armes</td>
                  {['Bonus Att.', 'Dégâts', 'Critique', 'Portée', 'Type', 'Grandeur'].map(h => (
                    <td key={h} style={{ border: '1px solid #000', padding: '2px 6px', fontWeight: 'bold', fontSize: '8pt', textAlign: 'center', color: '#fff', background: '#000' }}>{h}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    {Array.from({ length: 7 }).map((__, j) => cell({ height: '19px' }, j))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              PAGE 2 — Compétences + Dons + Notes
          ══════════════════════════════════════════════════════════════════ */}
          <div style={PAGE}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  {/* Les 36 compétences de la table 4–2 */}
                  <td style={{ verticalAlign: 'top', width: '62%', paddingRight: '4px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#000', color: '#fff' }}>
                          <td colSpan={7} style={{ padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase' }}>Compétences</td>
                        </tr>
                        <tr>
                          {head('Compétence', { width: '42%', fontSize: '6pt' })}
                          {head('Cl.', { width: '5%', textAlign: 'center', fontSize: '6pt' })}
                          {head('Car.', { width: '8%', textAlign: 'center', fontSize: '6pt' })}
                          {head('Total', { width: '11%', textAlign: 'center', fontSize: '6pt' })}
                          {head('Mod.Car.', { width: '11%', textAlign: 'center', fontSize: '6pt' })}
                          {head('Rangs', { width: '11%', textAlign: 'center', fontSize: '6pt' })}
                          {head('Divers', { width: '12%', textAlign: 'center', fontSize: '6pt' })}
                        </tr>
                      </thead>
                      <tbody>
                        {COMPETENCES_DND35.map((c, i) => {
                          const estClasse = classeNom ? c.classesCompetence.includes(classeNom) : false
                          return (
                            <tr key={c.nom} style={{ background: i % 2 === 0 ? '#fff' : '#f7f7f7' }}>
                              <td style={{ border: '1px solid #ddd', padding: '0 3px', fontSize: '6.5pt', lineHeight: 1.25, height: '14px' }}>
                                {c.nom}{c.formationRequise && <span style={{ color: '#999' }}> *</span>}
                              </td>
                              <td style={{ border: '1px solid #ddd', textAlign: 'center', fontSize: '7pt' }}>{classeNom ? (estClasse ? '■' : '□') : '□'}</td>
                              <td style={{ border: '1px solid #ddd', textAlign: 'center', fontSize: '6pt', color: '#555' }}>{c.caracteristique}</td>
                              <td style={{ border: '1px solid #ddd' }} />
                              <td style={{ border: '1px solid #ddd' }} />
                              <td style={{ border: '1px solid #ddd' }} />
                              <td style={{ border: '1px solid #ddd' }} />
                            </tr>
                          )
                        })}
                        {/* Lignes libres : spécialités d'Artisanat, de Profession, de
                            Représentation et compétences maison du MJ. */}
                        {Array.from({ length: 5 }).map((_, i) => (
                          <tr key={`libre-${i}`} style={{ background: (COMPETENCES_DND35.length + i) % 2 === 0 ? '#fff' : '#f7f7f7' }}>
                            {Array.from({ length: 7 }).map((__, j) => (
                              <td key={j} style={{ border: '1px solid #ddd', height: '14px' }} />
                            ))}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={7} style={{ border: '1px solid #000', padding: '2px 6px', fontSize: '6.5pt', background: '#eee', lineHeight: 1.4 }}>
                            <b>Cl.</b> ■ = compétence de classe (1 rang = 1 point) · □ = hors classe (1 rang = 2 points).
                            {' '}<b>*</b> = formation requise : sans rang, l&apos;action est impossible.
                            {classeNom === 'Prêtre' && <> Deux domaines ajoutent des compétences de classe : <b>Faune</b> ou <b>Flore</b> → Connaissances (nature), <b>Connaissance</b> → toutes les Connaissances, <b>Voyage</b> → Survie, <b>Duperie</b> → Bluff, Déguisement et Discrétion.</>}
                            {calibre
                              ? <> Plafond : <b>{plafondClasse}</b> rangs de classe, <b>{plafondHorsClasse}</b> hors classe. Points à dépenser : <b>({info!.competencesParNiveau} + mod. INT) × 4</b> au niveau 1, puis <b>{info!.competencesParNiveau} + mod. INT</b> par niveau (minimum 1).</>
                              : <> Plafond : niveau + 3 rangs pour une compétence de classe, la moitié hors classe.</>}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </td>

                  {/* Dons */}
                  <td style={{ verticalAlign: 'top', width: '38%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#000', color: '#fff' }}>
                          <td colSpan={2} style={{ padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase' }}>
                            Dons et pouvoirs{dons ? ` — ${dons.total}` : ''}
                          </td>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Autant de lignes numérotées que de dons dus, puis des lignes
                            libres pour les pouvoirs de classe (rage, don de la nature…). */}
                        {Array.from({ length: dons ? dons.total : 8 }).map((_, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? '#f7f7f7' : '#fff' }}>
                            <td style={{ border: '1px solid #ddd', padding: '0 3px', fontSize: '6pt', color: '#999', width: '12%', textAlign: 'center' }}>{dons ? i + 1 : ''}</td>
                            <td style={{ border: '1px solid #ddd', height: '18px' }} />
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={2} style={{ border: '1px solid #000', padding: '2px 6px', fontSize: '6.5pt', fontWeight: 'bold', textTransform: 'uppercase', background: '#eee' }}>
                            Pouvoirs de classe et aptitudes raciales
                          </td>
                        </tr>
                        {Array.from({ length: dons ? Math.max(6, 20 - dons.total) : 12 }).map((_, i) => (
                          <tr key={`p-${i}`} style={{ background: i % 2 === 0 ? '#fff' : '#f7f7f7' }}>
                            <td colSpan={2} style={{ border: '1px solid #ddd', height: '18px' }} />
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2} style={{ border: '1px solid #000', padding: '2px 6px', fontSize: '6.5pt', color: '#666', lineHeight: 1.4 }}>
                            {dons
                              ? <>{dons.normaux} don{dons.normaux > 1 ? 's' : ''} de progression (niveau{dons.normaux > 1 ? 'x' : ''} {NIVEAUX_DE_DON.filter(n => n <= niveau).join(', ')}){dons.bonusClasse ? `, ${dons.bonusClasse} don${dons.bonusClasse > 1 ? 's' : ''} de bonus du guerrier` : ''}{dons.racial ? ', 1 don racial d\'humain' : ''}.{DONS_BONUS_DE_CLASSE[classeNom] && <><br /><b>En plus, hors de ce compte :</b> {DONS_BONUS_DE_CLASSE[classeNom]}</>}</>
                              : <>Un don au niveau 1, puis un de plus aux niveaux 3, 6, 9, 12, 15 et 18. Le guerrier et l&apos;humain en ont davantage.</>}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              PAGE 3 — Monnaie, équipement, objets magiques, notes
          ══════════════════════════════════════════════════════════════════ */}
          <div style={afficheSorts ? PAGE : { padding: 0 }}>
            <table style={{ ...TABLE, marginBottom: '4px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', width: '40%', verticalAlign: 'top' }}>
                    <div style={{ background: '#000', color: '#fff', fontWeight: 'bold', fontSize: '9pt', padding: '2px 6px', textTransform: 'uppercase' }}>Pièces de monnaie</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {[['p.p.', 'platine'], ['p.o.', 'or'], ['p.e.', 'électrum'], ['p.a.', 'argent'], ['p.c.', 'cuivre']].map(([abbr, nom]) => (
                          <tr key={abbr}>
                            <td style={{ border: '1px solid #ddd', padding: '1px 6px', fontSize: '7.5pt', fontWeight: 'bold', width: '22%' }}>{abbr}</td>
                            <td style={{ border: '1px solid #ddd', padding: '1px 6px', fontSize: '6.5pt', color: '#777', width: '28%' }}>{nom}</td>
                            <td style={{ border: '1px solid #ddd', height: '16px' }} />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                  <td style={{ border: '1px solid #000', width: '60%', verticalAlign: 'top' }}>
                    <div style={{ background: '#000', color: '#fff', fontWeight: 'bold', fontSize: '9pt', padding: '2px 6px', textTransform: 'uppercase' }}>Trésors — gemmes et objets d&apos;art</div>
                    <div style={{ padding: '4px 6px' }}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{ borderBottom: '1px dotted #999', height: '15px' }} />
                      ))}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Équipements */}
            <table style={{ ...TABLE, marginBottom: '4px' }}>
              <thead>
                <tr style={{ background: '#000', color: '#fff' }}>
                  <td style={{ padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', width: '55%' }}>Équipements</td>
                  <td style={{ padding: '2px 6px', fontSize: '8pt', textAlign: 'center' }}>Localisation</td>
                  <td style={{ padding: '2px 6px', fontSize: '8pt', textAlign: 'center' }}>Valeur (po)</td>
                  <td style={{ padding: '2px 6px', fontSize: '8pt', textAlign: 'center' }}>Poids (kg)</td>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 16 }).map((_, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f7f7f7' }}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} style={{ border: '1px solid #ddd', height: '17px' }} />
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ border: '1px solid #000', padding: '2px 6px', fontSize: '6.5pt', color: '#666' }}>
                    Charge maximale : voir la table d&apos;encombrement selon la Force. Au-delà de la charge légère, l&apos;armure limite la DEX et le déplacement.
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Objets magiques */}
            <table style={TABLE}>
              <thead>
                <tr style={{ background: '#000', color: '#fff' }}>
                  <td colSpan={3} style={{ padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase' }}>Objets magiques et potions</td>
                </tr>
                <tr>
                  {head('Objet', { width: '36%' })}
                  {head('Effet / bonus', { width: '38%' })}
                  {head('Emplacement · charges', { width: '26%' })}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f7f7f7' }}>
                    {Array.from({ length: 3 }).map((__, j) => (
                      <td key={j} style={{ border: '1px solid #ddd', height: '18px' }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Notes */}
            <table style={TABLE}>
              <thead>
                <tr style={{ background: '#000', color: '#fff' }}>
                  <td style={{ padding: '2px 6px', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase' }}>Notes, compagnons et histoire</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} style={{ borderBottom: '1px dotted #999', height: '16px' }} />
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              PAGE SORTS — lanceurs seulement (ou feuille générique)
          ══════════════════════════════════════════════════════════════════ */}
          {afficheSorts && (
            <div style={{ padding: 0 }}>
              <FeuilleSorts titreCalibrage={titreCalibrage} info={info} niveauxDeSort={niveauxDeSort} classeNom={classeNom} spontane={spontane} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
