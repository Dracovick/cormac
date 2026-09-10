/**
 * Krugg Coeur-Flamboyant (id 82) — completer la fiche a partir du scan papier.
 * 2026-08-28.  Mandat : COMPLETER le 82, ne rien creer d autre.
 *
 * ⛔⛔ NE TOUCHE PAS : pv_max, pv_actuels, les jets de sauvegarde, xp, deplacement.
 *     Andre a regle lui-meme les PV et les sauvegardes de base le 2026-08-28 05:46 UTC.
 *
 * Principe Grimdar : PREFERER L ECHEC A L ECRITURE APPROXIMATIVE.
 * Toute precondition non verifiee arrete le script AVANT la premiere ecriture.
 */
import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)[1].trim())
const ID = 82
const APPLIQUER = process.argv.includes('--appliquer')

const ecarts = []
const ok = (c, msg) => { if (!c) ecarts.push(msg); return c }
const one = async (q, p = []) => (await sql.query(q, p))[0]

// ─────────────────────────────────────────────────────────────────────────────
// 1. PRECONDITIONS — l etat lu doit etre EXACTEMENT celui de l instantane
// ─────────────────────────────────────────────────────────────────────────────
const cs = await one('select * from character_combat_stats where personnage_id=$1', [ID])
const st = await one('select * from character_saving_throws where personnage_id=$1', [ID])
const ch = await one('select * from characters where id=$1', [ID])
const cur = await one('select * from character_currency where personnage_id=$1', [ID])
const arm = await sql.query('select * from character_armor where personnage_id=$1', [ID])
const sk31 = await sql.query('select * from character_skills where personnage_id=$1 and skill_id=31', [ID])
const w159 = await one('select * from weapons where id=159')
const cw159 = await one('select * from character_weapons where personnage_id=$1 and arme_id=159', [ID])
const nbMi = (await one('select count(*)::int n, coalesce(max(id),0)::int m from magic_items')).n
const maxMi = (await one('select coalesce(max(id),0)::int m from magic_items')).m

// ── VALEURS D ANDRE : elles doivent etre celles-la, et on ne les ecrit jamais ──
ok(cs.pv_max === 52, `pv_max attendu 52, lu ${cs.pv_max} — Andre a rechange les PV, ARRET`)
ok(cs.pv_actuels === 47, `pv_actuels attendu 47, lu ${cs.pv_actuels} — Andre a rechange les PV, ARRET`)
ok(st.reflexes_base === 2 && st.vigueur_base === 5 && st.volonte_base === 5,
  `sauvegardes de base attendues 2/5/5, lues ${st.reflexes_base}/${st.vigueur_base}/${st.volonte_base} — ARRET`)
ok(ch.xp === 19500, `xp attendu 19500, lu ${ch.xp} — ARRET`)
ok(cs.deplacement === 10, `deplacement attendu 10, lu ${cs.deplacement} — ARRET`)

// ── CE QU ON S APPRETE A CHANGER : doit etre encore a sa valeur d origine ──
ok(cs.ca_divers === 2, `ca_divers attendu 2, lu ${cs.ca_divers} — deja modifie, ARRET`)
ok(cs.domaine1 === null && cs.domaine2 === null, `domaines attendus null, lus ${cs.domaine1}/${cs.domaine2} — ARRET`)
ok(Number(cur.po) === 0, `po attendu 0, lu ${cur.po} — ARRET`)
ok(arm.length === 0, `character_armor attendu vide, ${arm.length} ligne(s) — ARRET`)
ok(sk31.length === 0, `Discretion (skill 31) deja presente — ARRET`)
ok(w159.critique_min === 20, `weapons 159 critique_min attendu 20, lu ${w159.critique_min} — ARRET`)
ok(cw159 && cw159.bonus_magique === 0, `character_weapons 159 bonus_magique attendu 0, lu ${cw159?.bonus_magique} — ARRET`)
ok(nbMi === 274 && maxMi === 274, `magic_items attendu 274 lignes / max 274, lu ${nbMi} / ${maxMi} — ARRET`)

// ── Les armes 157/158/159 n appartiennent qu a Krugg (pas de catalogue partage) ──
const proprios = await sql.query(
  'select distinct personnage_id from character_weapons where arme_id in (157,158,159)')
ok(proprios.length === 1 && proprios[0].personnage_id === ID,
  `les armes 157/158/159 sont partagees avec ${JSON.stringify(proprios)} — ARRET`)

// ── Les references a rattacher existent bien, au nom exact ──
const a5 = await one('select * from armor where id=5')
ok(a5?.nom === 'Plaque complète', `armor 5 attendu « Plaque complète », lu « ${a5?.nom} » — ARRET`)
ok(a5?.bonus_armure === 8, `armor 5 bonus_armure attendu 8, lu ${a5?.bonus_armure} — ARRET`)
const s31 = await one('select * from skills where id=31')
ok(s31?.nom === 'Discrétion', `skills 31 attendu « Discrétion », lu « ${s31?.nom} » — ARRET`)
const mi12 = await one('select * from magic_items where id=12')
ok(mi12?.nom === 'Anneau de protection +1' && mi12?.bonus === 1,
  `magic_items 12 attendu « Anneau de protection +1 » bonus 1, lu « ${mi12?.nom} » bonus ${mi12?.bonus} — ARRET`)

// ── Les deux objets a CREER ne doivent exister sous AUCUNE graphie ──
// (findOrCreateByNom compare avec eq() : sensible casse+accents. On cherche large.)
const NOUVEAUX = [
  { nom: 'Amulette de charisme +2', motif: '%charisme%' },
  { nom: 'Parchemin de protection contre le mal', motif: '%protection%mal%' },
]
for (const n of NOUVEAUX) {
  const d = await sql.query(
    `select id,nom from magic_items where unaccent(lower(nom)) like unaccent(lower($1))
      or unaccent(lower(nom)) = unaccent(lower($2))`, [n.motif, n.nom])
    .catch(() => sql.query('select id,nom from magic_items where lower(nom) like lower($1)', [n.motif]))
  ok(d.length === 0, `« ${n.nom} » : ${d.length} entree(s) proche(s) deja en base ${JSON.stringify(d)} — ARRET`)
}

if (ecarts.length) {
  console.error('\n⛔ ARRET — aucune ecriture. Preconditions non verifiees :')
  for (const e of ecarts) console.error('   • ' + e)
  process.exit(1)
}
console.log('✅ Toutes les preconditions sont verifiees (PV 52/47 et sauvegardes 2/5/5 intacts).')

if (!APPLIQUER) { console.log('\n(simulation — relancer avec --appliquer pour ecrire)'); process.exit(0) }

// ─────────────────────────────────────────────────────────────────────────────
// 2. ECRITURES
// ─────────────────────────────────────────────────────────────────────────────
const journal = []
const fait = (t, d) => { journal.push(`   ${t.padEnd(24)} ${d}`); }

// 2.1 — Armure : Plaque complète (armor 5) + bonus magique +1  → CA armure 9
await sql.query(
  'insert into character_armor (personnage_id, armure_id, bonus_magique, est_portee) values ($1,5,1,1)', [ID])
fait('character_armor', 'INSERT armure 5 « Plaque complète » +1, portee')

// 2.2 — CA par la vraie voie : le +2 « divers » est remplace par
//       l enchantement de l armure (+1) et l anneau de protection (+1).
//       ⛔ ca_arme (8) n est lu par AUCUN calcul de CA : on le laisse tel quel.
await sql.query('update character_combat_stats set ca_divers = 0 where personnage_id = $1', [ID])
fait('character_combat_stats', 'ca_divers 2 → 0')

// 2.3 — Domaines divins (fiche manuscrite : « FORCE p169 », « CHANCE p 167 »)
await sql.query(
  'update character_combat_stats set domaine1 = $2, domaine2 = $3 where personnage_id = $1',
  [ID, 'Force', 'Chance'])
fait('character_combat_stats', "domaine1 null → « Force », domaine2 null → « Chance »")

// 2.4 — Monnaie : 1013 po imprimes + 347 manuscrits = 1360 po
await sql.query('update character_currency set po = 1360 where personnage_id = $1', [ID])
fait('character_currency', 'po 0.00 → 1360.00')

// 2.5 — Discretion : 0 rang investi, +5 en divers (gants « crocs silencieux »).
//       Le budget de la fiche (« Total investis 10 ») est deja epuise par les
//       quatre competences imprimees : le 5 de la fiche est un bonus d objet.
await sql.query(
  'insert into character_skills (personnage_id, skill_id, rangs_investis, modif_divers) values ($1,31,0,5)', [ID])
fait('character_skills', 'INSERT Discrétion (31) — 0 rang, divers +5')

// 2.6 — Epee a deux mains : critique 19-20 (weapons 159, propre a Krugg) et +1 magique
await sql.query('update weapons set critique_min = 19 where id = 159')
fait('weapons (159)', 'critique_min 20 → 19  (crit 19-20)')
await sql.query(
  'update character_weapons set bonus_magique = 1 where personnage_id = $1 and arme_id = 159', [ID])
fait('character_weapons', 'arme 159 bonus_magique 0 → 1')

// 2.7 — Deux objets magiques a creer.
//       ⚠️ bonus = NULL sur les deux : la CA affichee somme magic_items.bonus.
//          Un bonus non nul sur une amulette de CHARISME gonflerait la CA a tort.
const nouvAmu = await one(
  `insert into magic_items (nom, type, emplacement, bonus, prix, description, charges_max)
   values ('Amulette de charisme +2', 'Amulette', 'Cou', NULL, 4000,
     '+2 de bonus de renforcement au Charisme. N''apporte aucun bonus à la CA.', NULL)
   returning id, nom`)
fait('magic_items', `INSERT id ${nouvAmu.id} « ${nouvAmu.nom} » (bonus NULL)`)

const nouvParch = await one(
  `insert into magic_items (nom, type, emplacement, bonus, prix, description, charges_max)
   values ('Parchemin de protection contre le mal', 'Parchemin', NULL, NULL, 25,
     '+2 de bonus de parade à la CA et +2 de résistance aux jets de sauvegarde contre les créatures mauvaises ; bloque le contrôle mental et repousse les créatures convoquées. Durée 1 min/niveau. Usage unique. Fiche papier : « Parchemin protec mal — +2 CA et sauvegarde — 25 po ».', 1)
   returning id, nom`)
fait('magic_items', `INSERT id ${nouvParch.id} « ${nouvParch.nom} » (bonus NULL, 1 charge)`)

// 2.8 — Rattachement des objets magiques
//       Effet continu → charges_restantes NULL (sinon un bouton de depense apparait).
//       Parchemin → 1 charge.
await sql.query(
  'insert into character_magic_items (personnage_id, objet_id, emplacement, charges_restantes) values ($1,12,$2,NULL)',
  [ID, 'Doigt'])
fait('character_magic_items', 'INSERT objet 12 « Anneau de protection +1 » (charges NULL)')
await sql.query(
  'insert into character_magic_items (personnage_id, objet_id, emplacement, charges_restantes) values ($1,$2,$3,NULL)',
  [ID, nouvAmu.id, 'Cou'])
fait('character_magic_items', `INSERT objet ${nouvAmu.id} « Amulette de charisme +2 » (charges NULL)`)
await sql.query(
  'insert into character_magic_items (personnage_id, objet_id, charges_restantes) values ($1,$2,1)',
  [ID, nouvParch.id])
fait('character_magic_items', `INSERT objet ${nouvParch.id} « Parchemin de protection contre le mal » (1 charge)`)

// 2.9 — Notes : tout ce qui est incertain, illisible, ou hors mandat.
const NOTE_EQUIP = `Relevé de la fiche papier « Krugg le malchanceux » (scan du 2026-08-27, 4 pages).
Ces éléments N'ONT PAS été saisis comme objets : lecture incertaine, ou hors du mandat.

── OBJETS MAGIQUES IMPRIMÉS, NON RATTACHÉS ──
• Cape de résistance +1 (1000 po). Son effet EST déjà sur la fiche : le +1 aux trois
  jets de sauvegarde figure dans les colonnes « magique » (Réflexes, Vigueur, Volonté).
  L'objet lui-même n'a pas été rattaché : la ligne magic_items nº 10 « Cape de résistance +1 »
  porte un bonus = 1 qui est additionné à la CA à tort (une cape de résistance ne donne
  rien à la CA). La rattacher ferait passer la CA de Krugg de 20 à 21, et corriger la
  ligne déplacerait aussi la CA d'Elbereth, qui la porte également.
• Parchemin sanctuaire — « évite d'être attaqué » — 25 po.
• 2 Potions de soin modéré (2d8+3) — 600 po — RAYÉES sur la fiche.
• Potion de charisme (1d4+1 pendant 3 heures) — 300 po — RAYÉE.
• Potion d'endurance (1d4+1 pendant trois heures) — 300 po — RAYÉE.

── MENTIONS MANUSCRITES — LECTURE INCERTAINE, RIEN N'A ÉTÉ INVENTÉ ──
• « Gants de cuir (crocs silencieux) — +5 Discrétion, +5 Crochetage ». C'est de là que
  vient le +5 porté en modificateur divers sur la compétence Discrétion.
• « Bâton de tourment de Crétia : bâton +1 (arme magique) ; 1×/jour cause Fear DD 13 ;
  +2 au jet de domination ».
• « Épée [mot illisible] longue +2, avec charge perso 3× semaine ».
• « 1 parchemin protection c. la mort (N14 ?) » — le nombre entre parenthèses est incertain.
• « 1 parchemin langage animal + [illisible] » — encre très pâle, fin de ligne illisible.
• « 1 potion soins 3d8 ».
• « bâton : combat magique (combat nº 1 intro) ».
• « 1 potion grands soins 3d8 » — RAYÉE.

── TRÉSORS ──
• 1 collier à 500 po.

── ÉQUIPEMENT ORDINAIRE (manuscrit) ──
Sac à dos, couverture, corde, gourde, briquet, 4 rations sèches, 3 bourses de cuir, lampe.

Poids total porté indiqué au bas de la page : 45,36 kg (charge légère).`

const NOTE_ECARTS = `Écarts relevés entre la fiche papier (scan du 2026-08-27) et le Grimoire.
Aucune de ces valeurs n'a été « corrigée » d'office.

── ⚠️ DOMAINES : « Force » est enregistré mais NE S'AFFICHE PAS ──
La fiche manuscrite porte « DOMAINE : FORCE p169 » et « CHANCE p 167 », avec les pouvoirs
notés à la main : « Chance (167) 1×/J peut relancer un dé » et « Force (169) 1×/J Force
augmentée à son niveau pour 1 round ». Les deux ont été saisis tels quels.
« Chance » s'affiche correctement. « Force » ne s'affiche pas : la liste des domaines du
Grimoire ne contient aucune entrée « Force ». Elle contient « Renforcement », qui occupe la
place du domaine de la Force mais annonce un pouvoir faux (« +1 bonus de force » au lieu de
« Force augmentée au niveau du prêtre ») et une liste de sorts qui n'est pas celle du domaine
de la Force du Manuel des Joueurs p. 169. « Renforcement » n'a donc PAS été écrit : il aurait
affiché de faux sorts de domaine au joueur.
⛔ Tant que « Force » n'est pas ajouté à la liste des domaines, ouvrir « Modifier » puis
enregistrer Krugg EFFACERA cette valeur : le menu déroulant ne la trouve pas et la remet à vide.

── SAUVEGARDES : la fiche papier et la base ne disent pas la même chose ──
Fiche papier, jets de base : Réflexes 3, Vigueur 7, Volonté 8 → totaux 4 / 9 / 12.
Base au 2026-08-28 : Réflexes 2, Vigueur 5, Volonté 5 → totaux 3 / 7 / 9.
2 / 5 / 5 est la progression normale d'un prêtre de niveau 6. Les valeurs de la base
n'ont pas été touchées.

── ARMES : les deux dagues ──
La fiche papier donne un critique de 19-20 aux TROIS armes (dague frappée, dague lancée,
épée à deux mains), ce qui est aussi la valeur du Manuel des Joueurs 3.5 pour la dague et
pour l'épée à deux mains. Seule l'épée à deux mains a été corrigée (critique 19-20, +1
magique). Les deux dagues restent à un critique de 20 dans la base.
La fiche indique aussi des dégâts « 2d6 +5 » pour l'épée, corrigés à la main par un chiffre
illisible (7 ?). Les dégâts n'ont pas été modifiés : ils restent « 2d6 ».

── COMPÉTENCES : budget de rangs ──
La fiche indique « Total investis 10 », et les quatre compétences imprimées
(Concentration 1, Connaissances religion 2, Diplomatie 5, Premiers secours 2) en consomment
déjà 10. Discrétion a donc été saisie à 0 rang investi, son 5 venant entièrement du
modificateur divers (les gants « crocs silencieux »). Avec la plaque complète, le malus
d'armure de −6 s'applique et la fiche affiche Discrétion à −1.

── AUTRES ──
• Poids : la fiche porte « 110 » dans la case POIDS, sans unité. Non saisi.
• XP : la case « XP acquise » de la fiche est VIDE ; « Prochain niv. » indique 21000.
  La base porte 19500 — non touché.
• « Amulette de protection +3 » (magic_items nº 71) est rattachée à Krugg dans la base mais
  ne figure PAS sur la fiche papier. Elle n'a pas été retirée. Son bonus est NULL : elle
  n'influence pas la CA.
• Déplacement : la fiche papier indique 10 m. La plaque complète le ramène à 6 m.
  L'écran affiche 6 m (calculé d'après l'armure) ; la page d'impression affiche 10 m
  (valeur brute de la colonne). Écart connu, non corrigé.
• La colonne ca_arme vaut 8 et n'entre dans AUCUN calcul de CA affichée, ni à l'écran ni
  à l'impression. Elle a été laissée telle quelle.
• Sorts par jour notés à la main : N0 = 5 ; N1 = 4+1 ; N2 = 4+1 ; N3 = 3+1. Non saisis.`

await sql.query('insert into character_notes (personnage_id, titre, contenu) values ($1,$2,$3)',
  [ID, 'Fiche papier — équipement non saisi (2026-08-28)', NOTE_EQUIP])
fait('character_notes', 'INSERT « Fiche papier — équipement non saisi »')
await sql.query('insert into character_notes (personnage_id, titre, contenu) values ($1,$2,$3)',
  [ID, 'Fiche papier — écarts avec le Grimoire (2026-08-28)', NOTE_ECARTS])
fait('character_notes', 'INSERT « Fiche papier — écarts avec le Grimoire »')

console.log('\n=== ECRITURES ===')
for (const l of journal) console.log(l)
console.log('\nIds des references creees : ' + nouvAmu.id + ', ' + nouvParch.id)
