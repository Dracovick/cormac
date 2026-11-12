import { FEATS_DND35 } from '../src/lib/dnd35/feats'
import { chercherFloue } from '../src/lib/recherche-floue'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, "'").replace(/\s+/g, ' ').trim()

console.log('FEATS_DND35:', FEATS_DND35.length)

// 1 — jumelles (noms identiques a la casse/accents pres)
const vus = new Map<string, string[]>()
for (const f of FEATS_DND35) vus.set(norm(f.nom), [...(vus.get(norm(f.nom)) ?? []), f.nom])
const jumelles = [...vus.entries()].filter(([, v]) => v.length > 1)
console.log('1) jumelles:', jumelles.length, jumelles.map(([, v]) => JSON.stringify(v)).join(' '))

// 2 — prerequis qui nomment un don inexistant. TEMOIN inclus dans le test :
//     le faux prerequis ci-dessous DOIT ressortir, sinon le controle ne voit rien.
const noms = new Set(FEATS_DND35.map(f => norm(f.nom)))
const aPart = (r: string) => /^BBA\+\d+$/.test(r) || /^(FOR|DEX|CON|INT|SAG|CHA)\d+$/.test(r)
const temoin = { nom: '≪TEMOIN≫', categorie: 'Général' as const, description: 't', prerequis: ['Don Qui N Existe Pas'] }
const aTester = [...FEATS_DND35, temoin]
const orphelins: string[] = []
for (const f of aTester) {
  for (const r of f.prerequis ?? []) {
    if (aPart(r)) continue
    const reqNom = r.replace(/\s*\(.*?\)$/, '').trim()
    if (!noms.has(norm(reqNom))) orphelins.push(`${f.nom} → « ${r} »`)
  }
}
const temoinVu = orphelins.some(o => o.startsWith('≪TEMOIN≫'))
console.log('2) temoin detecte:', temoinVu ? 'OUI (le controle voit)' : 'NON — CONTROLE AVEUGLE')
const reels = orphelins.filter(o => !o.startsWith('≪TEMOIN≫'))
console.log('   prerequis orphelins reels:', reels.length)
reels.slice(0, 40).forEach(o => console.log('   ', o))

// 3 — la recherche trouve-t-elle ce qu'André cherchait ?
const essais = ['extention d effet', 'extension d\'effet', 'empower', 'empower spell', 'sort puissant',
                'quintessence', 'maximize', 'preparation de potion', 'brew potion', 'scribe scroll',
                'ecriture de parchemin', 'island of blade', 'creation de baton']
console.log('3) essais de recherche (1re reponse):')
for (const e of essais) {
  const r = chercherFloue(e, FEATS_DND35, f => f.nom, 3, f => f.alias ?? [])
  console.log('   ' + e.padEnd(26), '→', r.length ? r.map(x => x.nom).join(' | ') : '(rien)')
}

// 4 — categories presentes
const cats = new Map<string, number>()
for (const f of FEATS_DND35) cats.set(f.categorie, (cats.get(f.categorie) ?? 0) + 1)
console.log('4) categories:', [...cats.entries()].map(([k, v]) => k + '=' + v).join(', '))
