/* SAUVEGARDE DES MÉDIAS DU BLOB VERCEL — Grimoire Cormac (dracovick.com).

   ⛔ POURQUOI CE PROGRAMME EXISTE. Relevé du 12 novembre 2026 : la base de Cormac ne stocke
   que des URL. Les fichiers — portraits de personnages, photos de partie, PDF des livres —
   vivent au Blob Vercel, et AUCUNE sauvegarde ne les touchait. Le Blob perdu, l'archive
   nocturne de la base restait parfaitement intacte avec 17 adresses pointant vers du vide.
   Les portraits ont été rapatriés à la main ce soir-là; ce programme rend l'opération
   récurrente, parce qu'une copie faite une fois ne couvre pas la prochaine image téléversée.

   ⚠️⚠️ LA LEÇON CENTRALE, payée le 12 novembre 2026 : le Blob contenait 24 fichiers quand la
   base n'en référençait que 17. ⛔ NE JAMAIS DÉDUIRE LE CONTENU DU BLOB DE CELUI DE LA BASE.
   On LISTE le Blob, et on se sert de la base seulement pour dire, de chaque fichier trouvé,
   à quelle fiche il appartient.

   ⛔ CE N'EST PAS UNE SYNCHRONISATION. Un fichier disparu du Blob est CONSERVÉ ici : c'est
   précisément le sinistre qu'on veut couvrir. Rien n'est jamais supprimé localement, et une
   copie locale n'est jamais écrasée en silence par un contenu différent — l'ancienne est
   mise de côté sous « <nom>.remplace-<horodatage> ». Une sauvegarde qui suit les suppressions
   de la source n'est pas une sauvegarde, c'est un miroir.

   ---- Ce que produit le programme ----
   Dans CHACUNE des deux destinations (NAS et OneDrive) :
     blob-medias\<chemin du Blob>      miroir exact des chemins du Blob (portraits\, parties\…)
     _INDEX-BLOB-CORMAC.txt            empreinte + taille + date de dépôt de chaque fichier
     _MANIFESTE-BLOB-CORMAC.txt        le lien qui manque : quelle table référence quel fichier
     _ETAT-BLOB-CORMAC.txt             verdict lisible, dernière ligne « RESULTAT=OK »

   ⭐ LE MANIFESTE EST LA PIÈCE QUI SAUVE. Les noms de fichiers sont des horodatages
   (« 1791819539478.png ») : sans le manifeste, 20 images rapatriées ne se rattachent à
   aucune fiche et la restauration est une devinette.

   ---- Comment la base est interrogée ----
   ⭐ Les colonnes porteuses d'URL sont DÉCOUVERTES dans les catalogues, jamais codées en dur
   (même principe que sauvegarde-base.mjs) : toute colonne textuelle de toute table est
   examinée. Le jour où une table de plus stocke une URL de Blob, le manifeste la trouve sans
   qu'on y pense. Une liste de trois colonnes écrite à la main aurait vieilli en silence.

   ---- Les PDF des livres ----
   Les 4 volumes de l'Encyclopedia Magica (209 Mo) ne sont PAS rapatriés par défaut : ils
   existent déjà dans « X:\Claude-Tools\cormac\Livres de jeu en PDF\ ».
   ⚠️ RÉSERVE À CONNAÎTRE : cette copie est sur le NAS, et le NAS est au domicile. Les PDF
   n'ont donc AUCUNE copie hors du domicile — contrairement à la base, qui va aussi dans
   OneDrive. Forcer leur rapatriement : CORMAC_BLOB_AVEC_PDF=1 (pèse ~209 Mo par destination).

   Usage :
     node scripts/sauvegarde-blob.mjs            → sauvegarde réelle
     node scripts/sauvegarde-blob.mjs --essai    → tout sauf l'écriture des copies
*/
import { existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync,
         createWriteStream, createReadStream, copyFileSync, renameSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, dirname, posix } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { neon } from "@neondatabase/serverless";
import { list } from "@vercel/blob";

const ESSAI = process.argv.includes("--essai");
const AVEC_PDF = process.env.CORMAC_BLOB_AVEC_PDF === "1";
const SOUS_DOSSIER = "blob-medias";
const INDEX = "_INDEX-BLOB-CORMAC.txt";
const MANIFESTE = "_MANIFESTE-BLOB-CORMAC.txt";
const ETAT = "_ETAT-BLOB-CORMAC.txt";
const MOTIF_BLOB = "%public.blob.vercel-storage.com%";

/* ⚠️ « LISIBLE » N'EST PAS « BON ». parties/1790915608447.jpg fait 762 octets : c'est un JPEG
   parfaitement valide, et c'est un envoi raté — une image quasi vide. Les octets magiques le
   déclarent conforme, la taille annoncée concorde, aucun contrôle de forme ne le voit passer.

   ⛔ MAIS ON NE LE REFUSE PAS, et c'est délibéré : une sauvegarde copie la source telle
   qu'elle est. Refuser un fichier parce qu'on le juge laid creuse un trou dans la copie et
   fait mentir le compte. On le COPIE et on le SIGNALE — au manifeste, au journal, à l'état.

   Seuil CALIBRÉ sur la distribution réelle, jamais recopié d'un autre volume (le plancher
   d'ABG vaut 1 Mo, taillé pour une archive SQL de 14 Mo : ici il hurlerait sur un portrait
   de 61 Ko). Mesure du 2026-11-12 sur les 20 non-PDF — `node scripts/draco-sonde-tailles-blob.mjs` :
       min = 762 o   puis 46 245 o   puis 61 108 o   médiane 2 291 096 o
   Le second plus petit fichier pèse 60 fois le suspect : tout seuil entre 1 Ko et 40 Ko rend
   le même verdict. C'est l'ÉCART qui tranche, pas la valeur choisie — d'où 4 Ko, loin des
   deux bords. ⚠️ Les PDF en sont exclus : un PDF court est un PDF, pas un accident. */
const SEUIL_QUASI_VIDE = 4096;

/* ⚠️ Chemins en UNC, jamais « X: » : un lecteur mappé est un objet de SESSION, et une tâche
   planifiée qui tourne sans session ouverte ne voit aucun X:. Même règle et mêmes variables
   d'environnement que sauvegarde-base.mjs, pour qu'un déplacement du partage se règle en un
   seul endroit — le lanceur. */
const DESTINATIONS = [
  {
    nom: "NAS",
    chemin: (process.env.CORMAC_SAUVEGARDE_NAS || "").trim() ||
      "\\\\AS5404T-EBEF\\Web\\Claude-Tools\\Cormac-Sauvegardes",
  },
  {
    nom: "OneDrive",
    chemin: (process.env.CORMAC_SAUVEGARDE_ONEDRIVE || "").trim() ||
      "C:\\Users\\draco\\OneDrive\\Documents\\Cormac-Sauvegardes",
  },
];

const journal = [];
const dire = (m) => { console.log(m); journal.push(m); };

/* Journal défini AVANT toute opération risquée : un plantage précoce (.env.local absent,
   Blob injoignable) doit quand même laisser une trace sur le NAS. */
function ecrireJournal() {
  const ligne = `\n===== ${horodatageMontreal(true)} — sauvegarde-blob =====\n` + journal.join("\n") + "\n";
  const dossier = "C:\\Users\\draco\\.claude\\logs";
  try {
    if (existsSync(dossier)) {
      const f = join(dossier, "sauvegarde-blob-cormac.log");
      writeFileSync(f, (existsSync(f) ? readFileSync(f, "utf8") : "") + ligne, "utf8");
    }
  } catch { /* le journal ne doit jamais faire échouer la sauvegarde */ }
}

/* Verdict en dernière ligne de sortie, en plus du code de sortie : c'est le contrat que le
   lanceur PowerShell lit, et son ABSENCE est elle-même un échec. */
let conclu = false;
function conclure() {
  if (conclu) return;
  conclu = true;
  ecrireJournal();
  console.log((process.exitCode ? "RESULTAT=ECHEC" : "RESULTAT=OK") + (ESSAI ? " (essai)" : ""));
}
process.on("exit", conclure);
/* En module ESM, une erreur sous top-level await devient un rejet non géré : sans ce filet,
   le programme meurt sans verdict et le lanceur n'a rien à lire. */
process.on("unhandledRejection", (e) => {
  console.error(`⛔ ARRÊT SUR ERREUR : ${e instanceof Error ? e.stack : String(e)}`);
  process.exitCode = 1;
  process.exit();
});

/* ⛔ VERROU D'EXCLUSION, même mécanisme que sauvegarde-base.mjs : deux passages simultanés
   écriraient le même fichier en même temps et déposeraient une image tronquée en annonçant OK. */
const VERROU = join(tmpdir(), "cormac-sauvegarde-blob.verrou");
const VERROU_PERIME_MS = 90 * 60 * 1000;
/* EPERM = le processus existe mais appartient à quelqu'un d'autre : vivant quand même. */
const processusVivant = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };
function prendreVerrou() {
  if (existsSync(VERROU)) {
    try {
      const { pid, ts } = JSON.parse(readFileSync(VERROU, "utf8"));
      const vieux = Date.now() - ts > VERROU_PERIME_MS;
      if (processusVivant(pid) && !vieux) {
        console.error(`⛔ Un autre passage est en cours (pid ${pid}) — rien n'est fait.`);
        process.exitCode = 1;
        process.exit();
      }
      dire(`⚠️ verrou abandonné repris (pid ${pid}${vieux ? ", périmé" : ""})`);
    } catch { dire("⚠️ verrou illisible — repris"); }
  }
  writeFileSync(VERROU, JSON.stringify({ pid: process.pid, ts: Date.now() }), "utf8");
}
function rendreVerrou() { try { if (existsSync(VERROU)) unlinkSync(VERROU); } catch {} }
process.on("exit", rendreVerrou);

/* Horodatage de Montréal, pas d'UTC : à 1 h du matin l'écart change la date affichée. */
function horodatageMontreal(avecSecondes = false) {
  const p = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "America/Montreal", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(new Date()).reduce((a, x) => (a[x.type] = x.value, a), {});
  const h = p.hour === "24" ? "00" : p.hour;
  return avecSecondes
    ? `${p.year}-${p.month}-${p.day} ${h}:${p.minute}:${p.second}`
    : `${p.year}-${p.month}-${p.day}-${h}h${p.minute}`;
}

prendreVerrou();
dire(`Sauvegarde des médias du Blob — ${horodatageMontreal(true)} (heure de Montréal)`);
if (ESSAI) dire("MODE ESSAI — rien ne sera écrit dans les destinations.");

/* ---------- 0. Les deux secrets ----------
   ⚠️ .env.local est résolu par rapport à CE fichier et non au répertoire courant : une tâche
   planifiée démarre où elle veut.
   ⚠️ BLOB_READ_WRITE_TOKEN est entre GUILLEMETS dans ce fichier, contrairement à DATABASE_URL.
   Les laisser fait répondre « Access denied » — un refus qui accuse le jeton et non sa mise
   en forme. D'où le même dépouillement des guillemets sur les deux. */
const cheminEnv = new URL("../.env.local", import.meta.url);
if (!existsSync(cheminEnv)) {
  console.error("⛔ .env.local introuvable à côté du dépôt — ni la base ni le Blob ne sont joignables.");
  process.exitCode = 1;
  process.exit();
}
const env = readFileSync(cheminEnv, "utf8");
const lireCle = (nom) => {
  const t = env.match(new RegExp(`^${nom}\\s*=\\s*"?([^"\\r\\n]+)"?`, "m"));
  return t ? t[1].trim() : null;
};
const urlBase = lireCle("DATABASE_URL");
const jetonBlob = lireCle("BLOB_READ_WRITE_TOKEN");
for (const [nom, v] of [["DATABASE_URL", urlBase], ["BLOB_READ_WRITE_TOKEN", jetonBlob]]) {
  if (!v) {
    console.error(`⛔ ${nom} absent de .env.local.`);
    process.exitCode = 1;
    process.exit();
  }
}
const sql = neon(urlBase);

/* ---------- 1. LISTER LE BLOB ----------
   ⛔ C'est l'étape qui ne peut pas être remplacée par une lecture de la base. Pagination
   obligatoire : list() ne rend pas tout d'un coup au-delà de 1 000 entrées. */
const fichiersBlob = [];
{
  let cursor;
  let pages = 0;
  do {
    const r = await list({ token: jetonBlob, cursor, limit: 1000 });
    for (const b of r.blobs) fichiersBlob.push(b);
    cursor = r.hasMore ? r.cursor : undefined;
    pages++;
  } while (cursor && pages < 100);
  if (pages >= 100) dire("⚠️ 100 pages de listage atteintes — la pagination a été interrompue, le relevé est INCOMPLET.");
}
const octetsBlob = fichiersBlob.reduce((a, b) => a + (b.size || 0), 0);
dire(`\nBlob : ${fichiersBlob.length} fichier(s), ${(octetsBlob / 1e6).toFixed(1)} Mo`);
{
  const parPrefixe = new Map();
  for (const b of fichiersBlob) {
    const p = b.pathname.includes("/") ? b.pathname.split("/")[0] : "(racine)";
    parPrefixe.set(p, (parPrefixe.get(p) || 0) + 1);
  }
  dire("  " + [...parPrefixe].map(([p, n]) => `${p} ${n}`).join(" · "));
}

/* ⛔ AGRÉGAT NUL : un listage qui rend zéro fichier sur un Blob qui en portait 24 accuse
   l'instrument (jeton révoqué, réseau, API changée) et non la réalité. On refuse d'écrire
   un manifeste vide par-dessus le bon — ce serait détruire la seule pièce qui relie les
   fichiers aux fiches. */
if (fichiersBlob.length === 0) {
  console.error("⛔ Le Blob rend ZÉRO fichier. Jeton, réseau ou API — rien n'est écrit.");
  process.exitCode = 1;
  process.exit();
}

/* ---------- 2. Ce que la base RÉFÉRENCE, découvert dans les catalogues ----------
   Toute colonne textuelle de toute table est examinée. Les types sont castés en text : une
   URL peut dormir dans un jsonb (une note, un objet de campagne) aussi bien que dans un
   varchar. */
const colonnes = await sql`
  SELECT c.table_name, c.column_name
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema AND t.table_name = c.table_name
  WHERE c.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.data_type IN ('text', 'character varying', 'character', 'json', 'jsonb')
  ORDER BY c.table_name, c.ordinal_position
`;
const parTable = new Map();
for (const { table_name, column_name } of colonnes) {
  if (!parTable.has(table_name)) parTable.set(table_name, []);
  parTable.get(table_name).push(column_name);
}
dire(`\nBase : ${colonnes.length} colonne(s) textuelle(s) examinée(s) dans ${parTable.size} table(s).`);

/* Une requête par table (et non une par colonne) : le pilote HTTP de Neon ouvre une connexion
   par appel, et 200 appels coûteraient plus que 46. */
const references = new Map();   // pathname → Set("table")
let urlsVues = 0;
let tablesLues = 0;
const tablesEnEchec = [];
const guillemeter = (s) => `"${String(s).replace(/"/g, '""')}"`;
for (const [table, cols] of parTable) {
  const branches = cols.map((c) =>
    `SELECT ${guillemeter(c)}::text AS v FROM ${guillemeter(table)} WHERE ${guillemeter(c)}::text LIKE '${MOTIF_BLOB}'`);
  let lignes;
  try {
    /* ⚠️ sql.query(texte) et NON sql(texte) : depuis @neondatabase/serverless 1.x, la forme
       appelée refuse une chaîne et n'accepte plus qu'un littéral balisé. L'essai du
       12 novembre 2026 a fait échouer les 38 tables d'un coup avec ce seul mot. */
    lignes = await sql.query(branches.join(" UNION ALL "));
  } catch (e) {
    /* Une table illisible est nommée, pas avalée : le manifeste dirait sinon « non référencé »
       d'un fichier parfaitement référencé — l'erreur la plus trompeuse possible ici. */
    dire(`  ⚠️ ${table} : non interrogeable (${e instanceof Error ? e.message : String(e)})`);
    tablesEnEchec.push(table);
    continue;
  }
  tablesLues++;
  for (const { v } of lignes) {
    if (!v) continue;
    urlsVues++;
    /* Un même champ peut porter plusieurs URL (une note, un jsonb). On les extrait toutes. */
    for (const m of String(v).matchAll(/https?:\/\/[^\s"'<>)\\]+public\.blob\.vercel-storage\.com\/([^\s"'<>)\\?]+)/g)) {
      const chemin = decodeURIComponent(m[1]);
      if (!references.has(chemin)) references.set(chemin, new Set());
      references.get(chemin).add(table);
    }
  }
}
dire(`  ${tablesLues} table(s) lue(s) · ${urlsVues} champ(s) porteur(s) d'URL · ${references.size} chemin(s) distinct(s) référencé(s)`);

/* ⛔⛔ LE GARDE-FOU QUE J'AVAIS OUBLIÉ, et c'est l'essai du 12 novembre 2026 qui l'a montré :
   les 38 tables ont échoué d'un coup (sql(texte) refusé par le pilote 1.x), le programme a
   déclaré les 24 fichiers « orphelins », a écrit un manifeste disant qu'aucune table ne
   référence rien — et a annoncé RESULTAT=OK. Un manifeste INCOMPLET est pire qu'un manifeste
   vieux d'un jour : c'est la seule pièce qui relie les images aux fiches, et celui-là aurait
   écrasé le bon en affirmant le contraire de la vérité.
   Règle : le manifeste est écrit COMPLET ou pas écrit du tout. Le rapatriement des fichiers,
   lui, continue — c'est le cœur du travail et il ne dépend pas de la base. */
const manifesteFiable = tablesEnEchec.length === 0 && tablesLues > 0;
if (!manifesteFiable) {
  dire(`\n⛔ MANIFESTE NON RÉÉCRIT : ${tablesEnEchec.length} table(s) sur ${parTable.size} n'ont pas pu être interrogées.`);
  dire("   Le manifeste existant est CONSERVÉ tel quel — un manifeste partiel affirmerait à tort");
  dire("   que des fichiers ne sont référencés par personne. Les médias, eux, sont rapatriés.");
  process.exitCode = 1;
}

/* ---------- 3. Qui est quoi ----------
   Trois états, et le troisième est celui qui justifie ce programme. */
const estPdf = (b) => b.pathname.toLowerCase().endsWith(".pdf");
const aRapatrier = fichiersBlob.filter((b) => AVEC_PDF || !estPdf(b));
/* ⛔ « Orphelin » est un VERDICT sur la base, pas sur le Blob : il ne veut rien dire si la base
   n'a pas été lue en entier. Sans ce garde, l'essai annonçait 24 orphelins sur 24 fichiers. */
const orphelins = manifesteFiable ? fichiersBlob.filter((b) => !references.has(b.pathname)) : [];
const referencesSansFichier = manifesteFiable
  ? [...references.keys()].filter((p) => !fichiersBlob.some((b) => b.pathname === p))
  : [];
/* Voir SEUIL_QUASI_VIDE : on copie, on signale, on ne refuse pas. */
const estQuasiVide = (b) => !estPdf(b) && (b.size || 0) < SEUIL_QUASI_VIDE;
const quasiVides = fichiersBlob.filter(estQuasiVide);
if (orphelins.length > 0) dire(`  ⚠️ ${orphelins.length} fichier(s) sur le Blob que la base ne référence plus — rapatrié(s) quand même, un orphelin peut être une photo qu'on croit avoir`);
if (quasiVides.length > 0) {
  /* ⛔ À dire haut : le fichier est au Blob, il sera dans la copie, et il est probablement
     vide de contenu utile. Ce n'est pas la sauvegarde qui a échoué — c'est le téléversement
     d'origine, et personne ne le saura si ce programme se contente de compter des octets. */
  dire(`  ⚠️ ${quasiVides.length} fichier(s) sous ${SEUIL_QUASI_VIDE} octets — forme valide, contenu probablement vide (envoi raté à l'origine) :`);
  for (const b of quasiVides) {
    const refs = references.get(b.pathname);
    dire(`       ${b.pathname} — ${b.size} o${refs ? ` · référencé par ${[...refs].sort().join(", ")}` : " · plus référencé"}`);
  }
  dire("       → copié(s) quand même : une sauvegarde reproduit la source. À retéléverser côté app.");
}
if (referencesSansFichier.length > 0) {
  /* ⛔ Le cas grave, et il ne doit pas être enterré dans une ligne de journal : la base
     montre une image qui n'existe plus au Blob. La fiche affichera un cadre vide. */
  dire(`  ⛔ ${referencesSansFichier.length} URL référencée(s) par la base et ABSENTE(S) du Blob :`);
  for (const p of referencesSansFichier) dire(`       ${p} (${[...references.get(p)].join(", ")})`);
}

/* ---------- 4. Index local : ce qu'on a déjà, pour ne pas retélécharger 200 Mo par nuit ----
   Clé = chemin du Blob. On compare taille ET date de dépôt : le Blob n'expose aucune
   empreinte, donc c'est le seul couple disponible. Une même adresse réécrite avec un
   contenu différent change de date de dépôt. */
function lireIndex(dossier) {
  const carte = new Map();
  const f = join(dossier, INDEX);
  if (!existsSync(f)) return carte;
  for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
    const [chemin, sha, taille, depose] = l.split("\t");
    if (chemin && sha) carte.set(chemin, { sha, taille: Number(taille), depose });
  }
  return carte;
}
function ecrireIndex(dossier, carte) {
  const lignes = [...carte].sort((a, b) => a[0].localeCompare(b[0]))
    .map(([c, v]) => `${c}\t${v.sha}\t${v.taille}\t${v.depose}`);
  writeFileSync(join(dossier, INDEX), lignes.join("\n") + "\n", "utf8");
}

const empreinteFichier = (chemin) => new Promise((res, rej) => {
  const h = createHash("sha256");
  createReadStream(chemin).on("data", (d) => h.update(d)).on("end", () => res(h.digest("hex"))).on("error", rej);
});

/* ⛔ Un fichier téléchargé n'est pas forcément une image : une erreur du CDN rend du HTML
   avec un code 200 dans certains montages. On lit les octets magiques, pas l'extension. */
function formeReconnue(chemin) {
  const t = readFileSync(chemin).subarray(0, 12);
  if (t.length < 4) return null;
  if (t[0] === 0x89 && t[1] === 0x50 && t[2] === 0x4e && t[3] === 0x47) return "PNG";
  if (t[0] === 0xff && t[1] === 0xd8 && t[2] === 0xff) return "JPEG";
  if (t[0] === 0x47 && t[1] === 0x49 && t[2] === 0x46) return "GIF";
  if (t.subarray(0, 4).toString("latin1") === "RIFF" && t.subarray(8, 12).toString("latin1") === "WEBP") return "WEBP";
  if (t.subarray(0, 4).toString("latin1") === "%PDF") return "PDF";
  return null;
}

/* ---------- 5. Téléchargement dans un dossier temporaire ----------
   On écrit d'abord ici, on contrôle, et seulement ensuite on dépose aux deux endroits. Un
   fichier contrôlé une fois et copié deux fois, c'est la règle de sauvegarde-base.mjs. */
const dossierTmp = join(tmpdir(), `cormac-blob-${process.pid}`);
mkdirSync(dossierTmp, { recursive: true });
const indexNas = lireIndex(DESTINATIONS[0].chemin);

const aDeposer = [];     // { blob, tmp, sha, forme }
let dejaLa = 0, refuses = 0;
for (const b of aRapatrier) {
  const deposeIso = new Date(b.uploadedAt).toISOString();
  const connu = indexNas.get(b.pathname);
  const copieNas = join(DESTINATIONS[0].chemin, SOUS_DOSSIER, ...b.pathname.split("/"));
  if (connu && connu.taille === b.size && connu.depose === deposeIso && existsSync(copieNas)) { dejaLa++; continue; }

  const tmp = join(dossierTmp, b.pathname.replace(/[\\/]/g, "__"));
  try {
    /* Cache-buster ET en-tête : un fichier remplacé au même chemin reste servi un mois par le
       CDN (max-age=2592000). Une sauvegarde qui récupère l'ancienne version du fichier ment
       sans jamais le dire. */
    const u = new URL(b.downloadUrl || b.url);
    u.searchParams.set("_sv", String(new Date(b.uploadedAt).getTime()));
    const r = await fetch(u, { headers: { "cache-control": "no-cache", pragma: "no-cache" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    await pipeline(Readable.fromWeb(r.body), createWriteStream(tmp));
  } catch (e) {
    dire(`  ❌ ${b.pathname} : téléchargement impossible (${e instanceof Error ? e.message : String(e)})`);
    refuses++;
    continue;
  }
  const taille = statSync(tmp).size;
  if (taille === 0) { dire(`  ❌ ${b.pathname} : 0 octet reçu`); refuses++; continue; }
  if (taille !== b.size) {
    /* Une taille différente de celle annoncée = transfert tronqué ou contenu changé en cours
       de route. On refuse : déposer un fichier tronqué est pire que ne rien déposer. */
    dire(`  ❌ ${b.pathname} : ${taille} octets reçus pour ${b.size} annoncés — refusé`);
    refuses++;
    continue;
  }
  const forme = formeReconnue(tmp);
  if (!forme) { dire(`  ❌ ${b.pathname} : contenu non reconnu (ni image ni PDF) — refusé`); refuses++; continue; }
  aDeposer.push({ blob: b, tmp, sha: await empreinteFichier(tmp), forme, deposeIso, taille });
}
dire(`\nÀ rapatrier : ${aDeposer.length} · déjà présent(s) et inchangé(s) : ${dejaLa} · refusé(s) : ${refuses}`);
if (!AVEC_PDF) {
  const pdf = fichiersBlob.filter(estPdf);
  if (pdf.length > 0) dire(`  (${pdf.length} PDF non rapatriés — ${(pdf.reduce((a, b) => a + b.size, 0) / 1e6).toFixed(0)} Mo, voir la réserve en tête de ce programme)`);
}

/* ---------- 6. Le manifeste ---------- */
function construireManifeste() {
  const l = [];
  l.push("MANIFESTE DES FICHIERS DU BLOB VERCEL — Grimoire Cormac");
  l.push("=".repeat(56));
  l.push("");
  l.push(`Relevé le ${horodatageMontreal(true)} (heure de Montréal) par sauvegarde-blob.mjs.`);
  l.push("Écrit automatiquement — ne pas modifier à la main.");
  l.push("");
  l.push("POURQUOI CE FICHIER. La base ne stocke que des URL, et les noms de fichiers sont des");
  l.push("horodatages qui ne disent pas à quelle fiche ils appartiennent. Si le Blob disparaît,");
  l.push("ce manifeste est la seule pièce qui relie les images rapatriées aux personnages.");
  l.push("");
  l.push(`Blob : ${fichiersBlob.length} fichier(s), ${(octetsBlob / 1e6).toFixed(1)} Mo.`);
  l.push(`Base : ${references.size} chemin(s) référencé(s) dans ${parTable.size} table(s) examinée(s).`);
  l.push("Les fichiers rapatriés sont sous .\\" + SOUS_DOSSIER + "\\, en miroir exact des chemins du Blob.");
  if (!AVEC_PDF) {
    l.push("⚠️ Les PDF ne sont pas rapatriés ici : ils vivent dans X:\\Claude-Tools\\cormac\\Livres de jeu en PDF\\");
    l.push("   — donc au domicile seulement, sans copie hors site, contrairement à la base.");
  }
  l.push("");
  l.push("chemin du Blob\ttable(s) qui le référencent\tétat\toctets\tdéposé au Blob\tURL");
  l.push("-".repeat(100));
  for (const b of [...fichiersBlob].sort((a, z) => a.pathname.localeCompare(z.pathname))) {
    const refs = references.get(b.pathname);
    let etat = !refs
      ? "ORPHELIN — plus référencé par la base"
      : (estPdf(b) && !AVEC_PDF) ? "PDF — non rapatrié (déjà sur le NAS)" : "rapatrié";
    /* Le manifeste est ce qu'on lira en restaurant : il doit dire laquelle des images
       rapatriées ne vaut rien, sinon on remettra un cadre vide en croyant restaurer. */
    if (estQuasiVide(b)) etat += ` ⚠️ QUASI VIDE (${b.size} o — envoi raté, à retéléverser)`;
    l.push([b.pathname, refs ? [...refs].sort().join(", ") : "(aucune)", etat,
            b.size, new Date(b.uploadedAt).toISOString(), b.url].join("\t"));
  }
  if (referencesSansFichier.length > 0) {
    l.push("");
    l.push("⛔ RÉFÉRENCÉES PAR LA BASE, ABSENTES DU BLOB — la fiche affiche un cadre vide");
    l.push("-".repeat(78));
    for (const p of referencesSansFichier.sort()) l.push(`${p}\t${[...references.get(p)].sort().join(", ")}`);
  }
  l.push("");
  return l.join("\r\n");
}

/* ⛔⛔ DÉFAUT TROUVÉ PAR L'ÉPREUVE PAR MUTATION, le 2026-11-12 — épreuve 8 de
   draco-eprouve-sauvegarde-blob.mjs. Ce verdict vivait DANS la branche du mode réel, plus bas.
   En « --essai », la branche n'est pas exécutée : le programme a refusé les 20 fichiers un par
   un, l'a écrit à l'écran, puis a annoncé « RESULTAT=OK (essai) ». Or l'essai est précisément
   ce qu'on lance pour se rassurer avant de planifier — il rassurait à tort.
   ⭐ La leçon générale : un verdict placé dans une branche ne juge que cette branche. Il monte
   ici, hors de toute branche, pour qu'« essai » et « réel » rendent le même jugement. */
if (refuses > 0) process.exitCode = 1;

/* ---------- 7. Dépôt ---------- */
if (ESSAI) {
  dire(manifesteFiable
    ? "\nESSAI — rien n'est copié. Manifeste qui AURAIT été écrit :"
    : "\nESSAI — rien n'est copié, et le manifeste n'aurait PAS été réécrit (base incomplète). Extrait de ce qu'il aurait dit :");
  dire(construireManifeste().split("\r\n").slice(0, 18).map((x) => "  | " + x).join("\n"));
  dire("  | …");
} else {
  const manifeste = construireManifeste();
  const inventaire = new Map();
  let echecs = 0;
  for (const d of DESTINATIONS) {
    try {
      /* ⛔ On ne CRÉE pas une destination absente : sur un partage hors ligne, mkdir
         fabriquerait un dossier local d'aspect plausible et les sauvegardes y tomberaient
         sans que personne aille les chercher là. Absent = échec. Le sous-dossier du miroir,
         lui, est bien créé : il est À L'INTÉRIEUR d'une destination déjà prouvée. */
      if (!existsSync(d.chemin)) throw new Error(`dossier introuvable : ${d.chemin}`);
      const racine = join(d.chemin, SOUS_DOSSIER);
      mkdirSync(racine, { recursive: true });
      const index = lireIndex(d.chemin);
      let deposes = 0, misDeCote = 0;

      for (const { blob, tmp, sha, deposeIso, taille } of aDeposer) {
        const cible = join(racine, ...blob.pathname.split("/"));
        mkdirSync(dirname(cible), { recursive: true });
        /* ⛔ JAMAIS ÉCRASER UNE COPIE DE SAUVEGARDE PAR UN CONTENU DIFFÉRENT. Le Blob réutilise
           des chemins (les noms sont des horodatages, sans suffixe aléatoire) : un même chemin
           peut porter demain une autre image. L'ancienne est mise de côté, pas perdue. */
        if (existsSync(cible)) {
          const ancienne = await empreinteFichier(cible);
          if (ancienne !== sha) {
            renameSync(cible, `${cible}.remplace-${horodatageMontreal()}`);
            misDeCote++;
          }
        }
        copyFileSync(tmp, cible);
        /* Relire la copie déposée : sur un lecteur réseau ou un dossier synchronisé, une
           écriture peut se terminer sans que le fichier soit complet. */
        const verif = await empreinteFichier(cible);
        if (verif !== sha) { dire(`  ❌ ${d.nom} : ${blob.pathname} — empreinte différente après copie`); echecs++; continue; }
        index.set(blob.pathname, { sha, taille, depose: deposeIso });
        deposes++;
      }

      if (manifesteFiable) writeFileSync(join(d.chemin, MANIFESTE), manifeste, "utf8");
      ecrireIndex(d.chemin, index);

      /* ---------- Intégrité de TOUT le miroir ----------
         La relecture ci-dessus protège l'ÉCRITURE, pas la CONSERVATION : sans ce balayage,
         une image déposée en octobre ne rencontrerait plus jamais un contrôle de sa vie.
         Lecture seule — rien n'est supprimé ni renommé, on nomme et on laisse décider. */
      const presents = [];
      (function parcourir(dossier, prefixe) {
        for (const e of readdirSync(dossier, { withFileTypes: true })) {
          if (e.isDirectory()) parcourir(join(dossier, e.name), prefixe ? posix.join(prefixe, e.name) : e.name);
          else if (!e.name.includes(".remplace-")) presents.push(prefixe ? posix.join(prefixe, e.name) : e.name);
        }
      })(racine, "");
      const alterees = [], sansReference = [];
      const empreintes = new Map();
      for (const p of presents) {
        const sha = await empreinteFichier(join(racine, ...p.split("/")));
        empreintes.set(p, sha);
        const attendue = index.get(p);
        if (!attendue) sansReference.push(p);
        else if (attendue.sha !== sha) alterees.push(p);
      }
      inventaire.set(d.nom, { fichiers: new Set(presents), empreintes });
      dire(`  ✔ ${d.nom} : ${deposes} déposé(s)${misDeCote > 0 ? `, ${misDeCote} ancienne(s) version(s) mise(s) de côté` : ""} · ${presents.length} fichier(s) au miroir, relu(s) un par un`);
      if (alterees.length > 0) {
        dire(`    ⛔ ALTÉRÉ(S) depuis le dépôt — les octets ne correspondent plus à l'empreinte enregistrée :`);
        for (const p of alterees) dire(`         ${p}`);
      }
      if (sansReference.length > 0) dire(`    ⚠️ ${sansReference.length} fichier(s) sans empreinte enregistrée — antérieur(s) à cet index ou déposé(s) hors de ce programme`);
      /* ⛔ Un fichier conservé ici et disparu du Blob est le SUCCÈS de ce programme, pas un
         défaut : c'est exactement ce qu'on voulait pouvoir dire. */
      const disparus = presents.filter((p) => !fichiersBlob.some((b) => b.pathname === p));
      if (disparus.length > 0) dire(`    ⭐ ${disparus.length} fichier(s) conservé(s) ici alors qu'ils ont QUITTÉ le Blob — c'est le but de cette sauvegarde`);
    } catch (e) {
      dire(`  ❌ ${d.nom} : ${e instanceof Error ? e.message : String(e)}`);
      echecs++;
    }
  }

  /* ---------- Les deux copies portent-elles la MÊME chose ? ----------
     Deux copies parfaitement lisibles et DIVERGENTES passeraient entre toutes les mailles :
     chaque côté se compare à son propre index et se déclare sain. */
  if (inventaire.size === 2) {
    const [[nomA, A], [nomB, B]] = [...inventaire];
    const divergents = [], absents = [];
    for (const [f, sha] of A.empreintes) {
      if (!B.fichiers.has(f)) absents.push(`${f} — sur ${nomA}, absent de ${nomB}`);
      else if (B.empreintes.get(f) !== sha) divergents.push(f);
    }
    for (const f of B.empreintes.keys()) if (!A.fichiers.has(f)) absents.push(`${f} — sur ${nomB}, absent de ${nomA}`);
    const paires = [...A.empreintes.keys()].filter((f) => B.empreintes.has(f)).length;
    if (divergents.length === 0 && absents.length === 0) {
      /* Un contrôle qui réduit sa couverture doit le dire DANS son verdict : « 18 paires »
         sous « 20 fichiers » se lit « tout est recoupé ». */
      const ecartes = new Set([...A.fichiers, ...B.fichiers]).size - paires;
      dire(`  ✔ recoupement ${nomA} ↔ ${nomB} : ${paires} paire(s) comparée(s)${ecartes > 0 ? ` (${ecartes} écarté(s))` : ""}, les deux copies portent la même chose`);
    } else {
      if (divergents.length > 0) {
        dire(`  ⛔ RECOUPEMENT : ${divergents.length} fichier(s) présent(s) des deux côtés mais DIFFÉRENT(S) :`);
        for (const f of divergents) dire(`       ${f}`);
        echecs++;
      }
      for (const m of absents) dire(`  ⚠️ recoupement : ${m}`);
    }
  }

  if (refuses > 0) process.exitCode = 1;
  if (echecs >= DESTINATIONS.length) {
    console.error("⛔ AUCUNE destination n'a reçu les médias.");
    process.exitCode = 1;
  } else if (echecs > 0) {
    console.error(`⚠️ ${echecs} destination(s) en échec — les médias n'existent qu'en un exemplaire.`);
    process.exitCode = 1;
  } else {
    dire(`\n✅ Médias du Blob sauvegardés aux deux emplacements (${aDeposer.length} nouveau(x), ${dejaLa} inchangé(s)).`);
  }

  /* ---------- Le verdict lisible, à côté des fichiers ---------- */
  const etat = [
    "ETAT DE LA SAUVEGARDE DES MEDIAS — Blob Vercel du Grimoire Cormac",
    "=".repeat(65),
    "",
    `  ${process.exitCode ? "PROBLEME" : "OK"}`,
    "",
    `Derniere execution : ${horodatageMontreal(true)} (heure de Montreal)`,
    `Blob               : ${fichiersBlob.length} fichier(s), ${(octetsBlob / 1e6).toFixed(1)} Mo`,
    `Rapatries ce coup  : ${aDeposer.length} · inchanges : ${dejaLa} · refuses : ${refuses}`,
    manifesteFiable
      ? `Orphelins          : ${orphelins.length} (sur le Blob, plus references par la base)`
      : `Orphelins          : NON MESURABLE — ${tablesEnEchec.length} table(s) non interrogeable(s)`,
    manifesteFiable
      ? `Refs sans fichier  : ${referencesSansFichier.length} (la base montre une image absente du Blob)`
      : "Refs sans fichier  : NON MESURABLE — voir le journal",
    `Quasi vides        : ${quasiVides.length} (forme valide sous ${SEUIL_QUASI_VIDE} o — copie(s) quand meme, a retelever)`,
    ...(quasiVides.length > 0
      ? quasiVides.map((b) => `                     ${b.pathname} (${b.size} o)`)
      : []),
    "",
    manifesteFiable
      ? `Manifeste : .\\${MANIFESTE} — relie chaque fichier a la table qui le reference.`
      : `Manifeste : .\\${MANIFESTE} — NON REECRIT ce coup-ci, l'ancien est conserve.`,
    `Miroir    : .\\${SOUS_DOSSIER}\\ — chemins du Blob reproduits tels quels.`,
    "",
    "Journal complet : C:\\Users\\draco\\.claude\\logs\\sauvegarde-blob-cormac.log",
    "",
    `RESULTAT=${process.exitCode ? "ECHEC" : "OK"}`,
    "",
    "(Ecrit automatiquement par sauvegarde-blob.mjs — ne pas modifier a la main.)",
    "⚠️ Rien ne surveille l'age de ce fichier depuis ce programme : c'est le role de",
    "   Controle-FraicheurSauvegardes.ps1. Lire la date ci-dessus, pas seulement le mot.",
    "",
  ].join("\r\n");
  for (const d of DESTINATIONS) {
    try { if (existsSync(d.chemin)) writeFileSync(join(d.chemin, ETAT), etat, "utf8"); } catch {}
  }
}

/* Ménage du temporaire — sans jamais faire échouer la sauvegarde pour autant. */
try { for (const f of readdirSync(dossierTmp)) unlinkSync(join(dossierTmp, f)); } catch {}
