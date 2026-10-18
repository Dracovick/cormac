/* Sauvegarde complète de la base de DRACOVICK.COM (le Grimoire Cormac) vers le NAS ET OneDrive.
   Demande d'André du 18 octobre 2026, après un relevé qui a montré que cette base — 44 tables,
   7 455 enregistrements, dont 71 personnages, 110 entrées de journal de partie et 40 notes —
   n'était sauvegardée NULLE PART. Le catalogue (1 221 sorts, 742 objets) se réimporte des
   livres; les parties d'André, elles, n'existent qu'une fois.

   ⛔ TROISIÈME COPIE ADAPTÉE du même programme (ABG 2 sept. 2026 → Filon 27 sept. → ici).
   La dette est connue et s'alourdit : tout correctif apporté à l'un doit être reporté dans
   les deux autres. À fusionner en un seul fichier paramétré — chantier signalé à André le
   18 octobre 2026, délibérément pas fait le soir où il fallait d'abord protéger la base.
   Onze valeurs changent — préfixe, deux destinations et leurs variables, nom du verrou,
   nom de l'index d'empreintes, seuil de taille — et RIEN d'autre :
   les tables, les colonnes et le schéma sont découverts dans les catalogues à chaque passage,
   donc le même programme s'adapte seul aux deux schémas.
   ⚠️ DETTE ASSUMÉE : deux exemplaires du même programme. Tout correctif apporté ici doit être
   reporté dans l'autre, et l'inverse. À fusionner en un seul fichier paramétré le jour où on
   retouchera celui d'ABG — pas avant, pour ne pas risquer la sauvegarde d'un client en
   réorganisant du code qui fonctionne.

   Usage :
     node scripts/sauvegarde-base.mjs            → sauvegarde réelle
     node scripts/sauvegarde-base.mjs --essai    → tout sauf l'écriture des copies et la purge

   ---- Ce que produit le script ----
   Un fichier « cormac-base-AAAA-MM-JJ-HHhMM.sql.gz » AUTOPORTANT — schéma ET données —,
   restaurable par n'importe quel client PostgreSQL sur une base VIDE, déposé dans DEUX
   emplacements : le NAS et OneDrive. Le fichier est écrit UNE
   fois puis copié, et l'empreinte SHA-256 des deux copies est comparée à celle de l'original —
   une copie réseau tronquée est le genre de panne qui ne se voit qu'au moment de restaurer.

   ---- Pourquoi du SQL généré ici et pas pg_dump ----
   pg_dump n'est pas installé sur le poste (vérifié le 2 sept.). Les littéraux sont produits
   par PostgreSQL lui-même via quote_nullable(colonne::text) : il connaît ses types mieux que
   n'importe quel formatage écrit à la main — jsonb, text[], numeric, timestamptz compris.

   ---- Les pièges traités ----
   ⚠️ Les 5 colonnes GÉNÉRÉES (societe_sa, nom_sa, code_normalise…) sont exclues des INSERT :
      PostgreSQL refuse qu'on écrive dedans, la restauration échouerait à la première ligne.
   ⚠️ L'ordre des tables suit un tri topologique des clés étrangères, calculé à chaque
      exécution : si le schéma gagne une table demain, l'ordre reste juste sans qu'on y pense.
   ⚠️ Les 15 séquences sont repositionnées par setval en fin de fichier. Sans ça, la première
      commande saisie après une restauration entrerait en collision avec un id existant.
   ⚠️ Lecture par blocs de 2 000 lignes : le pilote HTTP de Neon ne ramène pas 73 124 lignes
      porteuses de jsonb en une seule réponse.
   ⚠️ Horodatage au fuseau de Montréal — en UTC, une sauvegarde de 1 h du matin porterait la
      date du lendemain.

   ⛔ Ce sont les données personnelles d'André — ses personnages, ses parties, ses notes de
      campagne. Les deux destinations lui appartiennent. OneDrive est le seul des deux qui soit hors du domicile :
      le NAS et le poste brûlent ensemble. */
import { createWriteStream, existsSync, readdirSync, statSync, unlinkSync, copyFileSync, readFileSync, writeFileSync, createReadStream } from "node:fs";
import { createGzip, createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const ESSAI = process.argv.includes("--essai");
const JOURS_CONSERVATION = 30;
const BLOC = 2000;
const PREFIXE = "cormac-base-";

/* ⚠️ Chemins en UNC, jamais « X: ». Un lecteur mappé est un objet de SESSION : une tâche
   planifiée qui s'exécute sans session ouverte ne voit aucun X:, et la sauvegarde échouerait
   toutes les nuits sans témoin. Chemins UNC vérifiés accessibles par Scotty le 2 sept. 2026.
   Chaque destination reste surchargeable par variable d'environnement : un déplacement du
   partage se règle dans le lanceur, pas dans ce fichier. */
const DESTINATIONS = [
  {
    nom: "NAS",
    variable: "CORMAC_SAUVEGARDE_NAS",
    chemin: (process.env.CORMAC_SAUVEGARDE_NAS || "").trim() ||
      "\\\\AS5404T-EBEF\\Web\\Claude-Tools\\Cormac-Sauvegardes",
  },
  {
    nom: "OneDrive",
    variable: "CORMAC_SAUVEGARDE_ONEDRIVE",
    chemin: (process.env.CORMAC_SAUVEGARDE_ONEDRIVE || "").trim() ||
      "C:\\Users\\draco\\OneDrive\\Documents\\Cormac-Sauvegardes",
  },
];

const journal = [];
const dire = (m) => { console.log(m); journal.push(m); };

/* Journal : c'est lui qu'on relira quand une sauvegarde nocturne aura échoué sans témoin.
   Défini AVANT toute opération risquée pour qu'un plantage précoce (Neon injoignable,
   .env.local absent) laisse quand même une trace sur le NAS. */
function ecrireJournal() {
  try {
    /* La PREMIÈRE destination disponible, pas forcément le NAS : le jour où le partage est
       hors ligne est précisément celui où on veut retrouver une trace de l’échec quelque part. */
    const dossierJournal = (DESTINATIONS.find((d) => existsSync(d.chemin)) || {}).chemin;
    if (!dossierJournal) return;
    /* ⭐ L'entête déclare QUELLE VERSION du script a tourné. Trois portes mènent ici — le
       planificateur, le lanceur, un appel direct — et aucune source extérieure ne les voit
       toutes : `LastRunTime` n'en voit qu'une, le journal du lanceur deux. Plutôt que de faire
       comparer deux sources hétérogènes, le script déclare lui-même son empreinte : « la
       version en place a-t-elle déjà tourné ? » devient une égalité de chaînes, pas une
       comparaison d'horodatages venus de deux fichiers différents. */
    let signature = "inconnue";
    try {
      const moi = new URL(import.meta.url);
      const octets = readFileSync(moi);
      signature = `${createHash("sha256").update(octets).digest("hex").slice(0, 16)} (modifié le ${statSync(moi).mtime.toISOString()})`;
    } catch { }
    const ligne = `\n===== ${new Date().toISOString()} =====\nVersion du script : ${signature}\n${journal.join("\n")}\n`;
    const fichierJournal = join(dossierJournal, "journal-sauvegardes.txt");
    const ancien = existsSync(fichierJournal) ? readFileSync(fichierJournal, "utf8") : "";
    /* Le journal ne grossit pas indéfiniment : on garde les 200 derniers milliers de
       caractères, largement de quoi couvrir plusieurs mois de nuits. */
    writeFileSync(fichierJournal, (ancien + ligne).slice(-200_000));
  } catch { /* le journal ne doit jamais faire échouer une sauvegarde réussie */ }
}

/* Verdict lisible en dernière ligne de sortie, en plus du code de sortie. Le lanceur peut
   s'appuyer sur l'un ou l'autre ; l'ABSENCE de cette ligne est elle-même un échec. */
let verdictEcrit = false;
function conclure() {
  if (verdictEcrit) return;
  verdictEcrit = true;
  /* Un essai est marqué comme tel : le journal sert au suivi des nuits réelles, il ne
     doit pas laisser croire qu’une copie a été déposée. */
  const verdict = (process.exitCode ? "RESULTAT=ECHEC" : "RESULTAT=OK") + (ESSAI ? " (essai)" : "");
  journal.push(verdict);
  ecrireJournal();
  console.log(verdict);
}
process.on("exit", conclure);

/* Filet : en module ESM, une erreur sous top-level await devient un rejet non géré. Sans ce
   handler, elle sortirait sans laisser une ligne dans le journal — exactement l'échec muet
   qu'on cherche à rendre visible. */
for (const evenement of ["unhandledRejection", "uncaughtException"]) {
  process.on(evenement, (e) => {
    dire(`⛔ ARRÊT SUR ERREUR : ${e instanceof Error ? (e.stack || e.message) : String(e)}`);
    console.error(e);
    process.exitCode = 1;
    conclure();
    process.exit(1);
  });
}

/* ⛔ VERROU D'EXCLUSION. Le 18 septembre 2026, deux lancements à 17 secondes d'écart — une
   tâche déclenchée à la main et un appel direct du lanceur — ont écrit dans le même fichier
   temporaire et déposé une archive ILLISIBLE aux deux emplacements, en annonçant RESULTAT=OK.
   Le préfixe PID du temporaire empêche cette collision-là; ce verrou empêche la course
   elle-même, y compris sur le journal, dont les blocs étaient sortis désordonnés.
   ⚠️ Un verrou coincé serait PIRE que le mal — il tuerait la sauvegarde nocturne en silence.
   D'où les deux issues de secours : processus disparu, ou verrou plus vieux que la limite. */
const VERROU = join(tmpdir(), "cormac-sauvegarde.verrou");
const VERROU_PERIME_MS = 90 * 60 * 1000;
let verrouTenu = false;

/* EPERM = le processus existe mais appartient à quelqu'un d'autre : vivant quand même. */
const processusVivant = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };

function rendreVerrou() {
  if (!verrouTenu) return;
  verrouTenu = false;
  /* Ne retirer QUE son propre verrou : si le nôtre a été jugé périmé et repris par un autre,
     l'effacer à l'aveugle laisserait ce dernier sans protection. */
  try { if (readFileSync(VERROU, "utf8").trim() === String(process.pid)) unlinkSync(VERROU); } catch { }
}
process.on("exit", rendreVerrou);

function prendreVerrou() {
  for (let tentative = 0; tentative < 2; tentative++) {
    try {
      writeFileSync(VERROU, String(process.pid), { flag: "wx" });   // wx = création atomique
      verrouTenu = true;
      return;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      let pid = NaN, ageS = 0;
      try {
        pid = Number(readFileSync(VERROU, "utf8").trim());
        ageS = Math.round((Date.now() - statSync(VERROU).mtimeMs) / 1000);
      } catch { break; }   /* verrou disparu entre-temps : on retente */
      if (Number.isInteger(pid) && processusVivant(pid) && ageS * 1000 < VERROU_PERIME_MS) {
        dire(`⛔ Une autre sauvegarde est DÉJÀ en cours (PID ${pid}, depuis ${ageS} s). Rien n'a été fait.`);
        process.exitCode = 1;
        conclure();
        process.exit(1);
      }
      dire(`⚠️ Verrou périmé repris : PID ${pid} posé il y a ${ageS} s, ce processus n'existe plus.`);
      try { unlinkSync(VERROU); } catch { }
    }
  }
}
prendreVerrou();

/* .env.local est résolu par rapport à CE fichier et non au répertoire courant : le cwd
   d'une tâche planifiée n'est pas garanti. */
const cheminEnv = new URL("../.env.local", import.meta.url);
let env;
try {
  env = readFileSync(cheminEnv, "utf8");
} catch (e) {
  dire(`⛔ .env.local illisible (${cheminEnv.pathname}) : ${e.message}`);
  throw e;
}
const trouve = env.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
if (!trouve) { dire("⛔ DATABASE_URL absent de .env.local."); throw new Error("DATABASE_URL absent de .env.local"); }
const sql = neon(trouve[1]);

for (const d of DESTINATIONS) {
  dire(`Destination ${d.nom} : ${d.chemin}${process.env[d.variable] ? ` (via ${d.variable})` : ""}`);
}

/* Horodatage de Montréal, pas d'UTC : à 1 h du matin l'écart change la date du fichier. */
function horodatageMontreal() {
  const p = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "America/Montreal", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const v = (t) => p.find((x) => x.type === t).value;
  return `${v("year")}-${v("month")}-${v("day")}-${v("hour")}h${v("minute")}`;
}

/* ---------- 1. Structure ---------- */
const colonnes = await sql`
  SELECT table_name, column_name, ordinal_position
  FROM information_schema.columns
  WHERE table_schema = 'public' AND is_generated = 'NEVER'
    AND table_name IN (SELECT table_name FROM information_schema.tables
                       WHERE table_schema = 'public' AND table_type = 'BASE TABLE')
  ORDER BY table_name, ordinal_position`;

const parTable = new Map();
for (const c of colonnes) {
  if (!parTable.has(c.table_name)) parTable.set(c.table_name, []);
  parTable.get(c.table_name).push(c.column_name);
}

const liens = await sql`
  SELECT tc.table_name AS enfant, ccu.table_name AS parent
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
  GROUP BY 1, 2`;

/* Tri topologique : un parent est toujours écrit avant ses enfants. Les auto-références
   (une table qui se pointe elle-même) sont ignorées, elles ne contraignent pas l'ordre. */
function ordonner(tables, aretes) {
  const restantes = new Set(tables);
  const ordre = [];
  const parents = new Map(tables.map((t) => [t, new Set()]));
  for (const l of aretes) {
    if (l.enfant !== l.parent && parents.has(l.enfant) && restantes.has(l.parent)) {
      parents.get(l.enfant).add(l.parent);
    }
  }
  while (restantes.size > 0) {
    const prets = [...restantes].filter((t) => [...parents.get(t)].every((p) => !restantes.has(p)));
    if (prets.length === 0) { ordre.push(...[...restantes].sort()); break; } // cycle : ordre alphabétique
    prets.sort();
    for (const t of prets) { ordre.push(t); restantes.delete(t); }
  }
  return ordre;
}

const tables = ordonner([...parTable.keys()], liens);
dire(`Tables (${tables.length}), dans l'ordre des dépendances : ${tables.join(", ")}`);

/* ---------- 1.bis Le schéma, lu des catalogues ----------
   ⛔ CONDITION POSÉE PAR ANDRÉ le 26 septembre 2026 : « la sauvegarde des données ne doit
   jamais dépendre du DDL — dégrader en criant, jamais mourir en silence ». D'où cette
   enveloppe : si la lecture des catalogues échoue, le fichier de données sort quand même,
   il DIT lui-même qu'il lui manque son schéma, et le verdict global passe en ECHEC.
   ⚠️ Conséquence à connaître : le lanceur ne déclenche la vérification par rechargement que
   si aucun problème n'a été relevé. Un schéma manquant suspend donc aussi cette épreuve —
   c'est voulu, on n'éprouve pas une sauvegarde qu'on sait déjà incomplète. */
let ddl = null;
try {
  /* ⛔ Import DYNAMIQUE, et c'est le cœur de la garantie. En tête de fichier, il ferait
     dépendre le chargement même du script de ce module : absent, illisible ou fautif, node
     mourrait avant d'avoir écrit une ligne et il n'y aurait AUCUNE sauvegarde cette nuit-là.
     Ici, l'échec tombe dans le catch juste en dessous, et les données sortent quand même. */
  const { ddlPublic } = await import("./ddl-public.mjs");
  ddl = await ddlPublic(sql);
  dire(`Schéma embarqué : ${ddl.compte.tables} tables, ${ddl.compte.sequences} séquences, ` +
       `${ddl.compte.contraintes} contraintes, ${ddl.compte.index} index — ` +
       `${ddl.avant.length} instructions avant les données, ${ddl.apres.length} après`);
} catch (e) {
  dire(`⛔ SCHÉMA NON EMBARQUÉ : ${e.message}`);
  dire("⛔ Le fichier de données est déposé quand même, mais il NE SE RESTAURE PAS seul.");
  process.exitCode = 1;
}

/* ---------- 2. Génération du SQL ---------- */
const comptes = {};
async function* lignesSql() {
  yield `-- Sauvegarde Cormac (dracovick.com) — ${new Date().toISOString()}\n`;
  /* ⛔ Cette phrase renvoyait à `scripts/schema.sql` jusqu'au 26 septembre 2026. Elle était
     devenue fausse deux fois : ce fichier-là avait dérivé (2 tables et 3 colonnes de retard)
     et il n'était même plus exécutable. Un fichier de sauvegarde qui donne une consigne de
     restauration périmée est pire qu'un fichier muet. */
  if (ddl) {
    yield `-- Fichier AUTOPORTANT : schéma et données. Sur une base VIDE :\n`;
    yield `--   psql "<URL>" -f ce-fichier.sql\n`;
  } else {
    yield `-- ⛔ SCHÉMA ABSENT : la lecture des catalogues a échoué pendant cet export.\n`;
    yield `--    Ce fichier porte les DONNÉES SEULES et NE SE RESTAURE PAS sur une base vide.\n`;
    yield `--    Il lui faut un schéma pris ailleurs — une sauvegarde plus ancienne, par exemple.\n`;
  }
  yield `-- ⚠️ Les colonnes générées sont volontairement absentes des INSERT : PostgreSQL les recalcule.\n`;
  yield `BEGIN;\n`;
  /* ⭐ Le schéma AVANT les données, les contraintes APRÈS : c'est l'ordre de pg_dump, et il
     n'est pas décoratif. Un CHECK posé \`NOT VALID\` tolère l'historique déjà en place mais
     refuse toute écriture neuve — posé avant le chargement, il rendrait la sauvegarde
     irrestaurable. Mesuré le 26 septembre 2026 sur \`commandes_annulation_datee\`. */
  if (ddl) {
    yield `-- >>> SCHEMA (avant les données)\n`;
    for (const instruction of ddl.avant) yield instruction + ";\n";
    yield `-- <<< SCHEMA\n`;
  }

  for (const table of tables) {
    const cols = parTable.get(table);
    const [{ n }] = await sql.query(`SELECT COUNT(*)::int AS n FROM "${table}"`);
    comptes[table] = n;
    dire(`  ${table} : ${n.toLocaleString("fr-CA")} lignes`);
    if (n === 0) continue;

    const listeCols = cols.map((c) => `"${c}"`).join(", ");
    /* quote_nullable(col::text) délègue à PostgreSQL le littéral de CHAQUE type — c'est lui
       qui sait sérialiser un jsonb, un text[] ou un numeric sans perte. */
    /* ⚠️ Séparateur ` || ','::text || ` et non `, ` : avec une virgule, PostgreSQL comprend
       autant de COLONNES distinctes au lieu d'une seule chaîne concaténée. Attrapé à l'essai —
       le fichier faisait 41 Ko pour 115 498 lignes, ce que le contrôle de taille a signalé. */
    const expr = cols.map((c) => `quote_nullable("${c}"::text)`).join(" || ','::text || ");

    for (let debut = 0; debut < n; debut += BLOC) {
      const lignes = await sql.query(
        `SELECT 'INSERT INTO "${table}" (${listeCols}) VALUES (' || ${expr} || ');' AS ligne
         FROM "${table}" ORDER BY 1 LIMIT ${BLOC} OFFSET ${debut}`
      );
      yield lignes.map((l) => l.ligne).join("\n") + "\n";
    }
  }

  if (ddl) {
    yield `-- >>> CONTRAINTES ET INDEX (après les données)\n`;
    for (const instruction of ddl.apres) yield instruction + ";\n";
    yield `-- <<< CONTRAINTES ET INDEX\n`;
  }

  /* Les séquences en dernier : après les données, elles repartent au bon numéro. */
  const sequences = await sql`SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema='public' ORDER BY 1`;
  yield `-- Séquences\n`;
  for (const s of sequences) {
    const table = s.sequence_name.replace(/_id_seq$/, "");
    if (parTable.has(table)) {
      yield `SELECT setval('${s.sequence_name}', COALESCE((SELECT MAX(id) FROM "${table}"), 1), true);\n`;
    }
  }
  yield `COMMIT;\n`;
}

const nomFichier = `${PREFIXE}${horodatageMontreal()}.sql.gz`;
/* ⛔ Le nom temporaire PORTE LE PID. Il ne le portait pas, et le 18 septembre 2026 un
   lancement à la main a croisé un rattrapage du planificateur : deux processus, même minute,
   donc même chemin dans %TEMP%. Les deux flux gzip se sont entrelacés, et le fichier déposé
   aux DEUX destinations était illisible (erreur CRC) — avec « empreinte vérifiée » partout,
   parce que l'empreinte prouve la fidélité de la COPIE, jamais la validité du contenu. */
const temporaire = join(tmpdir(), `${process.pid}-${nomFichier}`);
dire(`\nÉcriture de ${nomFichier}…`);
await pipeline(Readable.from(lignesSql()), createGzip({ level: 9 }), createWriteStream(temporaire));

/* ⛔ RELIRE EN DÉCOMPRESSANT avant de copier quoi que ce soit. La vérification par
   rechargement ne passe qu'une fois par semaine : sans ce contrôle-ci, un fichier corrompu
   peut dormir six jours aux deux endroits en se présentant comme une sauvegarde valide.
   En flux, sans charger les 64 Mo en mémoire. */
let octetsLus = 0;
try {
  await pipeline(createReadStream(temporaire), createGunzip(), async function* (flux) {
    for await (const bloc of flux) octetsLus += bloc.length;
  });
} catch (e) {
  try { unlinkSync(temporaire); } catch { }
  throw new Error(`le fichier comprimé est illisible, rien n'a été déposé : ${e instanceof Error ? e.message : String(e)}`);
}
dire(`Relu en décompressant : ${(octetsLus / 1024 / 1024).toFixed(1)} Mo — le fichier est lisible`);

const taille = statSync(temporaire).size;
const empreinte = await new Promise((resolve, reject) => {
  const h = createHash("sha256");
  createReadStream(temporaire).on("data", (d) => h.update(d)).on("end", () => resolve(h.digest("hex"))).on("error", reject);
});
const totalLignes = Object.values(comptes).reduce((a, b) => a + b, 0);
/* « enregistrements » et non « lignes » : depuis que le fichier porte son schéma, le nombre
   de lignes du fichier (174 501) n'est plus celui des données (173 707). Un compte dont le
   nom ne dit pas ce qu'il mesure finit toujours par être comparé à la mauvaise chose. */
dire(`Fichier : ${(taille / 1024 / 1024).toFixed(1)} Mo comprimés — ${totalLignes.toLocaleString("fr-CA")} enregistrements`);
dire(`SHA-256 : ${empreinte}`);

/* ⚠️ L'EXPORT N'EST PAS ATOMIQUE. Le pilote HTTP de Neon ouvre une transaction par requête :
   les tables sont lues l'une après l'autre, sans instantané commun. Une commande créée
   PENDANT l'export peut donc laisser son en-tête sans ses lignes — et la restauration
   échouerait alors sur la clé étrangère, c'est-à-dire au pire moment possible. À 1 h du matin
   le risque est nul; il devient réel le jour où la tâche rattrape en pleine journée pendant
   que quelqu'un saisit. On ne l'empêche pas ici — il faudrait le pilote WebSocket et une
   transaction REPEATABLE READ maintenue — mais on le DÉTECTE : recompter et comparer aux
   comptes pris pendant la lecture coûte 15 COUNT et transforme une panne muette en signal. */
dire("\nLa base a-t-elle bougé pendant l'export ?");
let bougees = 0;
for (const table of tables) {
  const [{ n }] = await sql.query(`SELECT COUNT(*)::int AS n FROM "${table}"`);
  if (n !== comptes[table]) {
    dire(`  ⚠️ ${table} : ${comptes[table].toLocaleString("fr-CA")} lignes à la lecture, ${n.toLocaleString("fr-CA")} maintenant`);
    bougees++;
  }
}
if (bougees > 0) {
  dire(`  ⛔ ${bougees} table(s) ont changé pendant l'export. Le fichier est déposé quand même —`);
  dire("     mieux vaut une sauvegarde douteuse que pas de sauvegarde — mais il peut contenir une");
  dire("     commande sans ses lignes. À rejouer avec verifier-sauvegarde.mjs avant de s'y fier.");
  process.exitCode = 1;
} else {
  dire("  ✔ aucune table n'a changé pendant l'export — le fichier est cohérent");
}

/* Ouvrir une archive et la lire jusqu'au bout, en flux. Le seul contrôle dont la sortie dépend
   de ce qu'il y a DANS le fichier : les trois archives du 18 sept. 2026 pesaient exactement
   5 518 753 octets, corrompue comprise — aucun contrôle de taille ne pouvait les distinguer.
   ⭐ L'empreinte est calculée AU PASSAGE, sur le flux comprimé, pendant la décompression : le
   fichier est déjà lu, la comparaison entre les deux destinations ne coûte donc rien de plus. */
/* ⛔ INDEX DES EMPREINTES DE NAISSANCE, écrit PAR CE SCRIPT, à côté des archives.
   Relevé par Scotty le 18 sept. 2026 : l'empreinte du dépôt n'était journalisée que par le
   lanceur, qui capture notre sortie standard. Un appel direct au `.mjs` déposait donc une
   archive ORPHELINE — saine, mais dont plus rien ne dira jamais si elle a bougé depuis.
   ⭐ Et l'arbitre vivait sur le poste d'André : si le poste disparaît, les archives survivent
   et leur seule référence d'intégrité meurt avec lui. L'index doit vivre AVEC elles.
   Format volontairement compatible `sha256sum -c` : la référence reste vérifiable à la main
   le jour où plus aucun de nos scripts ne tourne. */
const INDEX = "_EMPREINTES-CORMAC.txt";

function lireIndex(dossier) {
  const carte = new Map();
  try {
    for (const ligne of readFileSync(join(dossier, INDEX), "utf8").split("\n")) {
      const m = ligne.match(/^([0-9a-f]{64}) \*(.+?)\r?$/);
      if (m) carte.set(m[2], m[1]);
    }
  } catch { /* absent au premier passage : ce n'est pas une anomalie */ }
  return carte;
}

function ecrireIndex(dossier, carte) {
  /* ⛔ La troisième ligne n'est pas décorative. Sans elle, qui trouvera ce fichier dans six
     mois lira « conforme » et comprendra « utilisable » — or une archive née corrompue est
     parfaitement conforme à son empreinte de naissance. C'était le cas de celle du 18 sept.
     2026 à 15 h 36. Les lignes « # » sont ignorées par `sha256sum -c`. */
  const lignes = ["# Empreintes SHA-256 relevées au dépôt, par sauvegarde-base.mjs.",
    "# Vérifiable sans nous : sha256sum -c " + INDEX,
    "# ⚠️ conforme à sa naissance N'EST PAS utilisable : l'enveloppe se teste au `gzip -t`.",
    ...[...carte.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([f, s]) => `${s} *${f}`)];
  writeFileSync(join(dossier, INDEX), lignes.join("\n") + "\n", "utf8");
}

async function controler(chemin) {
  const h = createHash("sha256");
  try {
    await pipeline(
      createReadStream(chemin),
      async function* (flux) { for await (const bloc of flux) { h.update(bloc); yield bloc; } },
      createGunzip(),
      async function* (flux) { for await (const bloc of flux) void bloc; },
    );
    return { lisible: true, empreinte: h.digest("hex") };
  } catch {
    /* ⛔ Une archive illisible reste COMPARABLE. Relevé par Emma le 18 sept. 2026 : elle était
       écartée du recoupement et de l'index, donc ses deux copies ne se contrôlaient plus l'une
       l'autre et rien ne disait si elle était née corrompue ou abîmée depuis. Or l'empreinte
       s'obtient sans décompresser. On relit — le flux précédent a pu être coupé en route, son
       empreinte partielle ne vaut rien — et ce second passage ne concerne que les illisibles. */
    try {
      const h2 = createHash("sha256");
      await pipeline(createReadStream(chemin), async function* (flux) { for await (const bloc of flux) h2.update(bloc); });
      return { lisible: false, empreinte: h2.digest("hex") };
    } catch { return { lisible: false, empreinte: null }; }
  }
}

/* Garde-fou : une sauvegarde anormalement petite est le signe d'un export interrompu. Mieux
   vaut refuser de la déposer que d'écraser la rotation avec un fichier inutilisable.
   ⛔ RECALIBRÉ POUR CORMAC le 18 octobre 2026. Recopier ce programme sans toucher ce nombre,
   c'est neutraliser le garde-fou — c'est exactement le piège documenté chez Filon, où le seuil
   hérité d'ABG (1 000 000 octets) refusait une archive parfaitement saine de 28 Ko.
   ⚠️ VALEUR POSÉE APRÈS MESURE, pas devinée : le premier export réel du 18 octobre 2026 a
   produit 590 520 octets comprimés pour 7 455 enregistrements. Le plancher est fixé à
   190 000 octets, soit un tiers de ce volume — même proportion que chez Filon.
   ⚠️ Un plancher ABSOLU ne verra jamais une base qui FOND : une base vidée de moitié produirait
   une archive encore au-dessus du seuil. C'est le lanceur PowerShell qui porte le second
   contrôle — la chute relative d'une archive à l'autre ($CHUTE_RATIO), comme chez ABG.
   ⚠️ À revoir si la base grossit d'un ordre de grandeur, et à reporter dans le lanceur. */
if (taille < 190_000) {
  console.error(`⛔ ${taille} octets seulement — export manifestement incomplet, rien n'est copié.`);
  process.exitCode = 1;
} else if (ESSAI) {
  dire("\nESSAI — le fichier n'est copié nulle part et rien n'est purgé.");
  dire(`(fichier laissé dans ${temporaire})`);
} else {
  /* ---------- 3. Dépôt dans les deux destinations ---------- */
  let echecs = 0;
  const inventaire = new Map();   // destination → { fichiers, empreintes } pour le recoupement final
  for (const d of DESTINATIONS) {
    try {
      /* ⛔ On ne CRÉE pas une destination absente : sur un partage hors ligne ou un chemin
         devenu faux, mkdir fabriquerait un dossier local d'aspect plausible et les
         sauvegardes y tomberaient sans que personne aille les chercher là. Absent = échec. */
      if (!existsSync(d.chemin)) throw new Error(`dossier introuvable : ${d.chemin}`);
      const cible = join(d.chemin, nomFichier);
      copyFileSync(temporaire, cible);
      /* Relire la copie et comparer l'empreinte : sur un lecteur réseau ou un dossier
         synchronisé, une écriture peut se terminer sans que le fichier soit complet. */
      const h = createHash("sha256");
      await pipeline(createReadStream(cible), async function* (flux) { for await (const d of flux) h.update(d); });
      const verif = h.digest("hex");
      if (verif !== empreinte) { dire(`  ❌ ${d.nom} : empreinte différente — copie corrompue`); echecs++; continue; }
      dire(`  ✔ ${d.nom} : ${cible} (empreinte vérifiée)`);
      const index = lireIndex(d.chemin);
      index.set(nomFichier, empreinte);

      /* ---------- 4. Rotation ---------- */
      const limite = Date.now() - JOURS_CONSERVATION * 24 * 3600 * 1000;
      let purges = 0;
      for (const f of readdirSync(d.chemin)) {
        /* Uniquement NOS fichiers : un dossier de sauvegarde peut contenir autre chose. */
        if (!f.startsWith(PREFIXE) || !f.endsWith(".sql.gz")) continue;
        const chemin = join(d.chemin, f);
        if (statSync(chemin).mtimeMs < limite) { unlinkSync(chemin); purges++; }
      }
      const conservees = readdirSync(d.chemin).filter((f) => f.startsWith(PREFIXE) && f.endsWith(".sql.gz"));
      dire(`    rotation : ${purges} purgée(s) au-delà de ${JOURS_CONSERVATION} jours, ${conservees.length} conservée(s)`);

      /* ---------- 5. Intégrité de TOUT le dossier ----------
         ⛔ Trou relevé par Scotty le 18 sept. 2026 : la relecture faite plus haut protège
         l'ÉCRITURE, pas la CONSERVATION. La vérification par rechargement ne passe qu'une fois
         par semaine ET ne porte que sur la plus récente — les autres archives ne rencontraient
         donc plus jamais un contrôle de leur vie. Coût mesuré : ~4 s pour 33 archives.
         Lecture seule : rien n'est supprimé ni renommé, on nomme et on laisse décider. */
      for (const f of [...index.keys()]) if (!conservees.includes(f)) index.delete(f);   // suit la rotation
      ecrireIndex(d.chemin, index);

      const illisibles = [], alterees = [], sansReference = [];
      const empreintes = new Map();
      let sansEmpreinte = 0;
      for (const f of conservees) {
        const r = await controler(join(d.chemin, f));
        if (!r.lisible) illisibles.push(f);
        /* L'empreinte est retenue même pour une illisible : c'est ce qui permet de dire si elle
           est née corrompue (conforme) ou abîmée depuis son dépôt (altérée), et de recouper ses
           deux copies entre elles. Lisibilité et conformité sont deux questions distinctes. */
        if (r.empreinte === null) { sansEmpreinte++; continue; }
        empreintes.set(f, r.empreinte);
        const naissance = index.get(f);
        if (!naissance) sansReference.push(f);
        else if (naissance !== r.empreinte) alterees.push(f);
      }
      if (sansEmpreinte > 0) dire(`    ⚠️ ${sansEmpreinte} archive(s) même pas relisible(s) en octets — écartée(s) de tout recoupement`);
      inventaire.set(d.nom, { fichiers: new Set(conservees), empreintes });
      if (alterees.length > 0) {
        dire(`    ⛔ ALTÉRÉES depuis leur dépôt : ${alterees.length} archive(s) dont les octets ne correspondent plus à leur empreinte de naissance :`);
        for (const f of alterees) dire(`         ${f}`);
      }
      if (sansReference.length > 0) {
        /* Sans empreinte de naissance, une archive est saine ou altérée sans qu'on puisse
           jamais trancher. Ce n'est pas une panne : c'est un angle mort, et il se nomme. */
        dire(`    ⚠️ sans empreinte de naissance : ${sansReference.length} archive(s) — antérieure(s) à l'index ou déposée(s) hors de ce script`);
      }
      if (illisibles.length === 0) {
        dire(`    intégrité : ${conservees.length} archive(s) relue(s), toutes lisibles`);
      } else {
        /* Le verdict de CETTE sauvegarde ne bascule pas : elle a bien été déposée, et une
           archive ancienne abîmée crierait sinon toutes les nuits jusqu'à sa purge — un voyant
           qui crie tous les jours cesse d'être lu. On le dit fort, on ne le maquille pas. */
        dire(`    ⛔ INTÉGRITÉ : ${illisibles.length} archive(s) ILLISIBLE(S) sur ${conservees.length} — NE PAS S'EN SERVIR :`);
        for (const f of illisibles) dire(`         ${f}`);
      }
    } catch (e) {
      dire(`  ❌ ${d.nom} : ${e instanceof Error ? e.message : String(e)}`);
      echecs++;
    }
  }
  /* ---------- 6. Les deux copies portent-elles la MÊME chose ? ----------
     ⛔ Trou relevé par Scotty le 18 sept. 2026, symétrique de notre incident : le 15 h 36, les
     deux copies étaient identiques ET corrompues. Le cas inverse — deux copies parfaitement
     LISIBLES et DIVERGENTES — passait entre toutes les mailles : `gzip -t` dit oui des deux
     côtés, le balayage dit « 0 illisible », le voyant dit OK, et l'une des deux n'est pas la
     sauvegarde qu'on croit. L'empreinte n'était comparée qu'au moment du dépôt, jamais après. */
  if (inventaire.size === DESTINATIONS.length && DESTINATIONS.length === 2) {
    const [[nomA, A], [nomB, B]] = [...inventaire];
    const divergentes = [], absentes = [];
    for (const [f, sha] of A.empreintes) {
      if (!B.fichiers.has(f)) absentes.push(`${f} — sur ${nomA}, absente de ${nomB}`);
      else if (B.empreintes.has(f) && B.empreintes.get(f) !== sha) divergentes.push(f);
    }
    for (const f of B.empreintes.keys()) if (!A.fichiers.has(f)) absentes.push(`${f} — sur ${nomB}, absente de ${nomA}`);
    const paires = [...A.empreintes.keys()].filter((f) => B.empreintes.has(f)).length;
    if (divergentes.length === 0 && absentes.length === 0) {
      /* ⛔ Un contrôle qui réduit sa couverture doit le dire DANS son verdict (règle d'Emma,
         18 sept. 2026) : « 37 paires » sous « 38 archives » se lit « tout est recoupé ». */
      const ecartees = [...new Set([...A.fichiers, ...B.fichiers])].length - paires;
      dire(`  ✔ recoupement ${nomA} ↔ ${nomB} : ${paires} paire(s) comparée(s)${ecartees > 0 ? ` (${ecartees} écartée(s), illisible(s) en octets)` : ""}, les deux copies portent la même chose`);
    } else {
      if (divergentes.length > 0) {
        dire(`  ⛔ RECOUPEMENT : ${divergentes.length} archive(s) LISIBLES des deux côtés mais DIFFÉRENTES — une des deux copies a été altérée depuis son dépôt :`);
        for (const f of divergentes) dire(`       ${f}`);
      }
      for (const m of absentes) dire(`  ⚠️ recoupement : ${m}`);
    }
  }

  unlinkSync(temporaire);
  if (echecs === DESTINATIONS.length) {
    console.error("⛔ AUCUNE destination n'a reçu la sauvegarde.");
    process.exitCode = 1;
  } else if (echecs > 0) {
    console.error(`⚠️ ${echecs} destination(s) en échec — la sauvegarde n'existe qu'en un exemplaire.`);
    process.exitCode = 1;
  } else {
    dire("\n✅ Sauvegarde déposée aux deux emplacements.");
  }
}

/* Le verdict et l'écriture du journal sont posés par conclure(), branché sur l'événement
   « exit » : ils s'exécutent après un succès comme après une erreur fatale. */
