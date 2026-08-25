import { neon } from '@neondatabase/serverless'
import fs from 'fs'
const sql = neon(fs.readFileSync('X:/Claude-Tools/cormac/.env.local', 'utf8').match(/DATABASE_URL=(.+)/)![1].trim())

/**
 * TYPE A — MECANIQUE uniquement : anglais/francais, casse, accent, faute de frappe,
 * singulier/pluriel, abreviation evidente. Aucun jugement de jeu.
 * Chaque groupe : cible (id conserve), sources (ids absorbes), motif.
 */
export const FUSIONS: Array<{ cible: number; cibleNom: string; sources: number[]; motif: string }> = [
  { cible: 17, cibleNom: 'Alchimie', sources: [42], motif: 'anglais -> francais (Alchemy)' },
  { cible: 166, cibleNom: 'Empathie avec les animaux', sources: [153, 100, 120],
    motif: 'anglais (Animal Empathy), casse (Empathie Animaux), faute de frappe (Emphatie)' },
  { cible: 96, cibleNom: "Sens de l'orientation", sources: [154, 116, 124],
    motif: 'anglais (Intuit Direction), abreviations (Orientation, Sens orientation)' },
  { cible: 162, cibleNom: 'Connaissance des monstres', sources: [130, 23, 173, 104, 44],
    motif: 'pluriel, casse, anglais (Knowledge Monsters / Knowledge-monsters)' },
  { cible: 27, cibleNom: 'Scrutation', sources: [106, 95], motif: 'anglais (Scry) et anglais glose (Scry (scrutation))' },
  { cible: 61, cibleNom: 'Langage secret', sources: [112], motif: 'abreviation (Lang secret)' },
]

/** TYPE A — renommages de pure graphie, sans fusion. */
export const RENOMMAGES: Array<{ id: number; de: string; vers: string; motif: string }> = [
  { id: 19, de: 'Connaissance Dragons', vers: 'Connaissances (dragons)', motif: 'casse et mise en forme' },
  { id: 134, de: 'Profession danseur', vers: 'Profession (danseur)', motif: 'specialite entre parentheses, comme les 8 autres Profession' },
]

/** TYPE A — scories : aucun personnage, aucun rang. */
export const SCORIES: number[] = [50]  // « Connaissances (dragons) », 0 lien

async function main() {
  console.log('=== CONTROLE DU PLAN (lecture seule) ===')
  let stop = 0

  // les entrees existent-elles et portent-elles le nom attendu ?
  const tous = await sql`select id, nom from skills` as { id: number; nom: string }[]
  const nomDe = new Map(tous.map(r => [r.id, r.nom]))
  for (const f of FUSIONS) {
    if (nomDe.get(f.cible) !== f.cibleNom) { console.log(`  ⛔ cible ${f.cible} porte « ${nomDe.get(f.cible)} », attendu « ${f.cibleNom} »`); stop++ }
    for (const s of f.sources) if (!nomDe.has(s)) { console.log(`  ⛔ source ${s} introuvable`); stop++ }
  }
  for (const r of RENOMMAGES) if (nomDe.get(r.id) !== r.de) { console.log(`  ⛔ ${r.id} porte « ${nomDe.get(r.id)} », attendu « ${r.de} »`); stop++ }
  for (const s of SCORIES) {
    const n = (await sql.query(`select count(*)::int n from character_skills where skill_id = $1`, [s]))[0].n
    if (n > 0) { console.log(`  ⛔ la scorie ${s} porte ${n} lien(s) — ne pas supprimer`); stop++ }
  }
  // conflit de nom pour les renommages
  for (const r of RENOMMAGES) {
    const c = tous.find(x => x.nom === r.vers && x.id !== r.id)
    if (c && !SCORIES.includes(c.id)) { console.log(`  ⛔ « ${r.vers} » deja porte par ${c.id}`); stop++ }
  }
  if (!stop) console.log('  ✓ toutes les entrees du plan sont conformes')

  console.log('\n=== COLLISIONS — regle : LE RANG LE PLUS ELEVE SURVIT ===')
  const collisions: Array<{ cible: string; perso: string; pid: number; garde: number; perdu: number; detail: string }> = []
  for (const f of FUSIONS) {
    const ids = [f.cible, ...f.sources]
    const r = await sql.query(
      `select cs.personnage_id p, c.nom pnom, cs.skill_id sid, s.nom snom,
              coalesce(cs.rangs_investis,0) rg, coalesce(cs.modif_divers,0) dv
       from character_skills cs join characters c on c.id=cs.personnage_id join skills s on s.id=cs.skill_id
       where cs.skill_id = any($1) order by cs.personnage_id, cs.rangs_investis desc`, [ids]) as
      { p: number; pnom: string; sid: number; snom: string; rg: number; dv: number }[]
    const par = new Map<number, typeof r>()
    for (const x of r) { if (!par.has(x.p)) par.set(x.p, [] as never); par.get(x.p)!.push(x) }
    for (const [pid, lignes] of par) {
      if (lignes.length < 2) continue
      const tri = [...lignes].sort((a, b) => (b.rg - a.rg) || (b.dv - a.dv))
      collisions.push({
        cible: f.cibleNom, perso: tri[0].pnom, pid,
        garde: tri[0].rg, perdu: tri[1].rg,
        detail: tri.map(x => `« ${x.snom} » ${x.rg} rangs${x.dv ? '+' + x.dv + ' div' : ''}`).join('  contre  '),
      })
    }
  }
  if (!collisions.length) console.log('  aucune collision')
  for (const c of collisions)
    console.log(`  ${c.cible}\n     perso ${c.pid} ${c.perso} : ${c.detail}\n     -> on garde ${c.garde} rangs`)
  console.log(`\n  ${collisions.length} collision(s)`)

  console.log('\n=== VOLUME ===')
  const nb = FUSIONS.reduce((s, f) => s + f.sources.length, 0)
  console.log(`  ${FUSIONS.length} groupes, ${nb} entrees absorbees, ${RENOMMAGES.length} renommages, ${SCORIES.length} scorie(s)`)
  console.log(`  skills : 104 -> ${104 - nb - SCORIES.length}`)
  if (stop) { console.log('\n⛔ PLAN REFUSE'); process.exit(1) }
}
if (process.argv[1]?.includes('ch2-plan')) await main()
