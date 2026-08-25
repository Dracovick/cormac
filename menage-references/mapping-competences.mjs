import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const env = fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8')
const sql = neon(env.match(/DATABASE_URL=(.+)/)[1].trim())

// S = sûr / mécanique   A = demande arbitrage d'André   G = garder tel quel
// [id, cible, lot]
export const MAP = [
  [35,'Acrobaties','G'],[102,'Acrobaties','S'],[88,'Acrobaties','S'],
  [17,'Artisanat (alchimie)','A'],[42,'Artisanat (alchimie)','A'],
  [153,'Dressage','A'],[100,'Dressage','A'],[166,'Dressage','A'],[120,'Dressage','A'],[143,'Dressage','S'],[98,'Dressage','G'],
  [66,'Estimation','S'],[149,'Estimation','S'],[111,'Estimation','G'],
  [18,'Artisanat','G'],[148,'Artisanat','S'],[188,'Artisanat','A'],
  [51,'Artisanat (armes)','G'],
  [36,'Artisanat (pièges)','G'],[187,'Artisanat (pièges)','S'],
  [186,'Artisanat (tissage)','G'],[177,'Artisanat (tissage)','S'],
  [123,'Artisanat (flèches)','S'],[101,'Artisanat (flèches)','S'],
  [84,'Artisanat (serrurerie)','S'],
  [190,'Évasion','S'],[69,'Évasion','S'],[57,'Évasion','G'],
  [163,'?','A'],
  [67,'Équilibre','S'],[56,'Équilibre','G'],
  [37,'Bluff','G'],
  [142,'Escalade','S'],[79,'Escalade','S'],[5,'Escalade','G'],
  [15,'Concentration','G'],
  [164,'Art de la magie','S'],[40,'Art de la magie','S'],[22,'Art de la magie','S'],[129,'Art de la magie','S'],
  [109,'Art de la magie','S'],[99,'Art de la magie','S'],[48,'Art de la magie','S'],[94,'Art de la magie','S'],
  [20,'Art de la magie','A'],[13,'Art de la magie','A'],
  [50,'Connaissances (dragons)','S'],[19,'Connaissances (dragons)','A'],
  [10,'Connaissances (mystères)','S'],[171,'Connaissances (mystères)','S'],[144,'Connaissances (mystères)','S'],
  [135,'Connaissances (mystères)','S'],[77,'Connaissances (mystères)','S'],[43,'Connaissances (mystères)','S'],
  [12,'Connaissances (histoire)','S'],[140,'Connaissances (histoire)','S'],
  [30,'Connaissances (nature)','S'],[118,'Connaissances (nature)','S'],[97,'Connaissances (nature)','S'],
  [155,'Connaissances (nature)','S'],[158,'Connaissances (nature)','S'],
  [11,'Connaissances (plans)','S'],[21,'Connaissances (plans)','S'],[105,'Connaissances (plans)','S'],[45,'Connaissances (plans)','S'],
  [181,'Connaissances (religion)','S'],[172,'Connaissances (religion)','S'],[85,'Connaissances (religion)','S'],
  [93,'Connaissances (religion)','S'],[126,'Connaissances (religion)','S'],[65,'Connaissances (religion)','A'],
  [121,'Connaissances (exploration souterraine)','S'],
  [151,'Connaissances (noblesse et royauté)','S'],
  [150,'Connaissances (folklore local)','S'],[1,'Connaissances (folklore local)','A'],
  [132,'Connaissances (astronomie)','A'],
  [122,'?','A'],
  [162,'Connaissances (monstres)','A'],[173,'Connaissances (monstres)','A'],[23,'Connaissances (monstres)','A'],
  [130,'Connaissances (monstres)','A'],[104,'Connaissances (monstres)','A'],[44,'Connaissances (monstres)','A'],
  [125,'Connaissances (commerce)','A'],
  [131,'Décryptage','A'],
  [137,'Connaissances (Radiance)','A'],
  [52,'Contrefaçon','G'],[145,'Contrefaçon','S'],
  [39,'Crochetage','G'],[73,'Crochetage','S'],[127,'Crochetage','S'],
  [68,'Décryptage','S'],[14,'Décryptage','S'],[53,'Décryptage','G'],
  [141,'Diplomatie','S'],[3,'Diplomatie','G'],
  [31,'Discrétion','G'],[87,'Discrétion','S'],[160,'Discrétion','A'],
  [117,'Représentation','A'],
  [54,'Déguisement','G'],
  [82,'Déplacement silencieux','S'],[184,'Déplacement silencieux','S'],[72,'Déplacement silencieux','S'],[33,'Déplacement silencieux','G'],
  [110,'Désamorçage/sabotage','S'],[55,'Désamorçage/sabotage','S'],[170,'Désamorçage/sabotage','S'],
  [176,'Désamorçage/sabotage','S'],[38,'Désamorçage/sabotage','S'],
  [2,'Détection','G'],[180,'Détection','S'],[49,'Détection','S'],[91,'Détection','S'],[16,'Détection','S'],
  [60,'Détection','A'],
  [81,'Perception auditive','S'],[46,'Perception auditive','S'],[89,'Perception auditive','S'],
  [32,'Perception auditive','S'],[157,'Perception auditive','S'],[119,'Perception auditive','S'],[6,'Perception auditive','G'],
  [185,'Équitation','S'],[161,'Équitation','S'],[63,'Équitation','S'],[4,'Équitation','G'],
  [189,'Équitation','A'],[24,'Équitation (dragon)','A'],
  [34,'Fouille','G'],[179,'Fouille','S'],[47,'Fouille','S'],[90,'Fouille','S'],[7,'Fouille','S'],
  [70,'Renseignements','S'],
  [64,'Premiers secours','S'],[136,'Premiers secours','S'],[41,'Premiers secours','S'],[191,'Premiers secours','G'],
  [92,'Premiers secours','A'],[182,'Premiers secours','A'],[169,'Premiers secours','A'],
  [183,'Connaissances (architecture et ingénierie)','A'],
  [138,'Intimidation','S'],[175,'Intimidation','S'],
  [154,'Survie','A'],[116,'Survie','A'],[96,'Survie','A'],[124,'Survie','A'],
  [62,'Survie','S'],[128,'Survie','S'],[9,'Survie','G'],
  [115,'?','A'],
  [71,'Saut','S'],[80,'Saut','S'],[8,'Saut','G'],
  [112,'Langue','A'],[61,'Langue','A'],
  [113,'Maîtrise des cordes','S'],[58,'Maîtrise des cordes','S'],[76,'Maîtrise des cordes','S'],
  [167,'Représentation (flûte)','S'],[152,'Représentation (danse)','S'],[147,'Représentation (art oratoire)','S'],
  [168,'Profession (charpentier)','S'],[174,'Profession','S'],
  [103,'Profession (jardinier)','S'],[108,'Profession (poterie)','S'],
  [133,'Profession (apothicaire)','S'],[26,'Profession (apothicaire)','S'],
  [159,'Profession (herboriste)','S'],[134,'Profession (danseur)','A'],
  [83,'Natation','S'],[156,'Natation','S'],[25,'Natation','G'],
  [74,'Escamotage','S'],[59,'Escamotage','S'],
  [86,'?','A'],
  [165,'Psychologie','G'],[146,'Psychologie','S'],
  [27,'Scrutation','A'],[106,'Scrutation','A'],[95,'Scrutation','A'],
  [107,'?','A'],[178,'?','A'],[28,'?','A'],[29,'?','A'],
  [75,'Utilisation d\'objets magiques','S'],[139,'Utilisation d\'objets magiques','S'],
  [78,'Utilisation d\'objets magiques','G'],[114,'Utilisation d\'objets magiques','S'],
]

// ── Enrichissement avec les chiffres réels ──────────────────────────────────
const rows = await sql`
  select s.id, s.nom, count(cs.id)::int liens, count(distinct cs.personnage_id)::int perso
  from skills s left join character_skills cs on cs.skill_id=s.id group by s.id`
const info = new Map(rows.map(r => [r.id, r]))

const groupes = new Map()
for (const [id, cible, lot] of MAP) {
  const r = info.get(id)
  if (!r) { console.log('!! id introuvable', id); continue }
  if (!groupes.has(cible)) groupes.set(cible, { membres: [], lots: new Set() })
  const g = groupes.get(cible)
  g.membres.push({ id, nom: r.nom, liens: r.liens, perso: r.perso, lot })
  g.lots.add(lot)
}

const couverts = new Set(MAP.map(m => m[0]))
const nonMappes = rows.filter(r => !couverts.has(r.id))

const out = []
const say = (...a) => { const s = a.join(' '); out.push(s); console.log(s) }

say('=== COUVERTURE ===')
say('compétences en base :', rows.length, '| mappées :', couverts.size, '| non mappées :', nonMappes.length)
say('groupes cibles      :', groupes.size)
if (nonMappes.length) say('NON MAPPÉES:', JSON.stringify(nonMappes.map(r=>`${r.id}:${r.nom}(${r.perso}p)`)))

// collisions : même personnage sur >1 membre d'un groupe
say('\n=== COLLISIONS DE LIAISON PAR GROUPE ===')
let nbColl = 0
for (const [cible, g] of groupes) {
  if (g.membres.length < 2) continue
  const ids = g.membres.map(m => m.id)
  const r = await sql.query(
    `select cs.personnage_id, c.nom, count(*)::int n, array_agg(cs.skill_id) ids,
            array_agg(cs.rangs_investis) rangs, array_agg(cs.modif_divers) divers
     from character_skills cs join characters c on c.id=cs.personnage_id
     where cs.skill_id = any($1) group by cs.personnage_id, c.nom having count(*)>1`, [ids])
  if (r.length) {
    nbColl += r.length
    say(`  ${cible} :`)
    for (const x of r) say(`     perso ${x.personnage_id} ${x.nom} — ${x.n} liens, skill_ids ${JSON.stringify(x.ids)}, rangs ${JSON.stringify(x.rangs)}, divers ${JSON.stringify(x.divers)}`)
  }
}
say('total collisions:', nbColl)

// chiffrage par lot
let sSrc = 0, aSrc = 0, gSrc = 0, sLiens = 0, aLiens = 0
for (const [, g] of groupes) for (const m of g.membres) {
  if (m.lot === 'S') { sSrc++; sLiens += m.liens }
  else if (m.lot === 'A') { aSrc++; aLiens += m.liens }
  else gSrc++
}
say('\n=== CHIFFRAGE ===')
say('entrées lot SÛR      :', sSrc, `(${sLiens} liens)`)
say('entrées lot ARBITRAGE:', aSrc, `(${aLiens} liens)`)
say('entrées gardées telles quelles:', gSrc)
say('cibles distinctes    :', groupes.size)

// détail des groupes
say('\n=== GROUPES ===')
const tri = [...groupes.entries()].sort((a,b)=>a[0].localeCompare(b[0],'fr'))
for (const [cible, g] of tri) {
  const tot = g.membres.reduce((s,m)=>s+m.liens,0)
  say(`\n▸ ${cible}  [${[...g.lots].join('/')}]  ${g.membres.length} entrée(s), ${tot} liens`)
  for (const m of g.membres.sort((a,b)=>b.liens-a.liens))
    say(`    ${m.lot}  id=${m.id}  « ${m.nom} »  ${m.liens} liens / ${m.perso} perso`)
}

fs.writeFileSync('C:/Users/draco/AppData/Local/Temp/claude/X--/9f03f3f3-1018-4673-b7a8-210b565e5e39/scratchpad/mapping.txt', out.join('\n'))
fs.writeFileSync('C:/Users/draco/AppData/Local/Temp/claude/X--/9f03f3f3-1018-4673-b7a8-210b565e5e39/scratchpad/mapping.json',
  JSON.stringify([...groupes.entries()].map(([c,g])=>({cible:c,lots:[...g.lots],membres:g.membres})), null, 1))
