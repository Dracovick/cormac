/* ÉPREUVE DE RESTAURATION À FROID — la sauvegarde se restaure-t-elle sur une base VIDE ?
   Usage : node scripts/restauration-a-froid.mjs [fichier.sql.gz]
           node scripts/restauration-a-froid.mjs --avec-schema [fichier.sql.gz]
             → archive de l'ANCIEN format (données seules) : applique d'abord
               scripts/schema.sql, comme l'annonçait la consigne de restauration
               d'avant le 26 septembre 2026. Les 51 archives déposées avant cette
               date sont dans ce cas, et la rotation mettra 30 jours à les remplacer.

   ⛔ Pourquoi ce script existe. Jusqu'au 26 septembre 2026, la seule épreuve était
   `verifier-sauvegarde.mjs`, qui recharge les données dans des tables bâties par
   `LIKE public.<table>` — donc à partir du schéma VIVANT. Elle prouve que les données se
   réinjectent là où elles viennent de sortir. Elle ne prouve RIEN sur le scénario qui compte :
   la base a disparu, on repart d'un serveur nu. Ce scénario-là n'avait jamais été éprouvé, et
   il aurait échoué — le fichier ne portait aucun schéma et renvoyait à `scripts/schema.sql`,
   qui avait dérivé et n'était plus exécutable.

   ---- Ce que l'épreuve fait ----
   Elle ouvre une VRAIE session (le pilote HTTP est sans état, il ne peut pas tenir un
   `search_path`), crée un schéma jetable, l'y place, et exécute LE TEXTE DU FICHIER. Pas une
   réécriture : les instructions sont découpées puis renvoyées telles quelles. Leçon du
   4 septembre 2026 — un test qui recompose la requête éprouve une version saine qui n'est pas
   celle qui part en production.

   ---- Les deux seules libertés prises, et pourquoi ----
   1. Le `BEGIN;` et le `COMMIT;` du fichier sont SAUTÉS. L'épreuve tient déjà sa propre
      transaction, et le `COMMIT` du fichier validerait la nôtre — on perdrait le filet.
   2. Tout se termine par un ROLLBACK. ⛔ C'est le garde-fou central : `search_path` vaut
      « schéma jetable, public », donc si une table n'était pas créée là où on croit, les
      INSERT tomberaient dans `public` — c'est-à-dire dans la base vivante de dracovick.com.
      Avec le
      ROLLBACK, même ce cas-là ne laisse rien.

   ---- Ce que l'épreuve NE prouve PAS ----
   ⚠️ Faute de clé d'API Neon sur le poste, le schéma jetable vit dans la MÊME instance.
   L'épreuve prouve que le DDL est complet et se suffit à lui-même; elle ne prouve pas le
   transport vers un autre serveur. Dit le 26 septembre 2026 à André, avant de commencer. */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { Client, neonConfig } from "@neondatabase/serverless";
import { decouperSql } from "./ddl-public.mjs";

/* Verdict normalisé, même vocabulaire que l'export et la vérification : le lanceur applique
   la même règle aux trois, et l'ABSENCE de cette ligne est elle-même un échec. */
let verdictEcrit = false;
let motifEchec = null;
function conclure() {
  if (verdictEcrit) return;
  verdictEcrit = true;
  if (motifEchec) console.log(`MOTIF=${motifEchec}`);
  console.log(process.exitCode ? "RESULTAT=ECHEC" : "RESULTAT=OK");
}
process.on("exit", conclure);
for (const evenement of ["unhandledRejection", "uncaughtException"]) {
  process.on(evenement, (e) => {
    const message = e instanceof Error ? e.message : String(e);
    const reseau = /fetch failed|ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|socket hang up|network|getaddrinfo/i.test(message);
    motifEchec = reseau ? `base injoignable — ${message}` : message;
    console.error(`⛔ ARRÊT SUR ERREUR : ${e instanceof Error ? (e.stack || e.message) : String(e)}`);
    process.exitCode = 1;
    conclure();
    process.exit(1);
  });
}

const DESTINATIONS = [
  (process.env.CORMAC_SAUVEGARDE_NAS || "").trim() ||
    "\\\\AS5404T-EBEF\\Web\\Claude-Tools\\Cormac-Sauvegardes",
  (process.env.CORMAC_SAUVEGARDE_ONEDRIVE || "").trim() ||
    "C:\\Users\\draco\\OneDrive\\Documents\\Cormac-Sauvegardes",
];
function plusRecente() {
  for (const dossier of DESTINATIONS) {
    if (!existsSync(dossier)) continue;
    const trouvees = readdirSync(dossier)
      .filter((f) => f.startsWith("cormac-base-") && f.endsWith(".sql.gz"))
      .map((f) => join(dossier, f))
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
    if (trouvees.length > 0) return trouvees[0];
  }
  return null;
}

const avecSchema = process.argv.includes("--avec-schema");
const fichier = process.argv.slice(2).find((a) => !a.startsWith("--")) || plusRecente();
if (!fichier || !existsSync(fichier)) {
  console.error(`Sauvegarde introuvable : ${fichier ?? "(aucune dans les destinations connues)"}`);
  process.exitCode = 1;
  process.exit(1);
}

let echecs = 0;
const ok = (c, m) => { console.log((c ? "  OK   " : "  ECHEC ") + m); if (!c) { echecs++; if (!motifEchec) motifEchec = m; } };
const info = (m) => console.log("  INFO  " + m);

const contenu = gunzipSync(readFileSync(fichier)).toString("utf8");
const ecrit = new Intl.DateTimeFormat("fr-CA", { timeZone: "America/Montreal", dateStyle: "short", timeStyle: "short" })
  .format(statSync(fichier).mtime);
console.log(`Fichier : ${fichier}`);
console.log(`Écrit le ${ecrit} (heure de Montréal)`);
console.log(`Décompressé : ${(contenu.length / 1024 / 1024).toFixed(1)} Mo, ${contenu.split("\n").length.toLocaleString("fr-CA")} lignes\n`);

/* ---------- Le fichier porte-t-il seulement un schéma ? ---------- */
const autoportant = contenu.includes("-- >>> SCHEMA");
let prefixeSchema = "";
let suffixeSchema = "";
if (avecSchema) {
  /* Voie de repli pour les archives d'avant le 26 septembre 2026 : le schéma vient de
     scripts/schema.sql, exactement comme l'annonçait l'en-tête de ces fichiers-là. Cette
     voie était écrite depuis le début et n'avait jamais été éprouvée — c'est ce qui a
     permis à schema.sql de dériver puis de devenir inexécutable sans que rien ne crie. */
  if (autoportant) {
    info("le fichier porte déjà son schéma — --avec-schema est sans objet ici, on l'ignore");
  } else {
    const schemaEntier = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
    /* ⛔ On ne peut PAS appliquer schema.sql en bloc avant les données : il porte ses
       contraintes, donc `commandes_annulation_datee` se poserait avant le chargement et
       refuserait les 787 commandes annulées sans date. C'est le même piège qu'au départ,
       une couche plus bas. Le fichier engendré porte un marqueur : on coupe dessus pour
       poser les contraintes APRÈS, comme le fait un fichier autoportant.
       ⚠️ Donc la procédure écrite « appliquer scripts/schema.sql puis le fichier » est
       FAUSSE pour les archives de données seules. Elle l'était depuis le 24 septembre, et
       personne ne l'avait éprouvée. Voir SCHEMA-CONCEPTION.md.
       ⭐ Une voie de restauration écrite et jamais rejouée n'est pas une voie. */
    const MARQUEUR = "-- ---------- Après les données ----------";
    const coupe = schemaEntier.indexOf(MARQUEUR);
    if (coupe < 0) throw new Error(`marqueur absent de schema.sql — le régénérer par ecrire-schema.mjs`);
    prefixeSchema = schemaEntier.slice(0, coupe);
    suffixeSchema = schemaEntier.slice(coupe);
    info(`ancien format : schéma de scripts/schema.sql, coupé au marqueur — ${prefixeSchema.length.toLocaleString("fr-CA")} caractères avant les données, ${suffixeSchema.length.toLocaleString("fr-CA")} après`);
  }
} else {
  ok(autoportant, "le fichier annonce porter son schéma");
  if (!autoportant) {
    console.log("\n⛔ Fichier de données seules — il n'y a rien à restaurer à froid.");
    console.log("   Pour éprouver la voie de repli : --avec-schema");
    process.exitCode = 1;
    process.exit(1);
  }
  ok(!/après avoir appliqué scripts\/schema\.sql/.test(contenu),
     "l'en-tête ne renvoie plus à un second fichier");
}

/* ---------- Découpage ---------- */
const toutes = decouperSql(prefixeSchema ? prefixeSchema + "\n" + contenu + "\n" + suffixeSchema : contenu);
/* Une instruction peut traîner les commentaires qui la précèdent : on les retire pour
   reconnaître BEGIN et COMMIT, mais c'est bien le texte D'ORIGINE qui sera exécuté. */
const nu = (i) => i.replace(/^(\s*(--[^\n]*\n|\/\*[\s\S]*?\*\/))*\s*/, "").trim().toUpperCase();
const instructions = toutes.filter((i) => nu(i) !== "BEGIN" && nu(i) !== "COMMIT");
const sautees = toutes.length - instructions.length;
console.log(`\n${toutes.length.toLocaleString("fr-CA")} instructions dans le fichier, ${sautees} sautée(s) — le BEGIN et le COMMIT du fichier.`);
ok(sautees === 2, "exactement le BEGIN et le COMMIT du fichier sont sautés");

const premierInsert = instructions.findIndex((i) => nu(i).startsWith("INSERT INTO"));
ok(premierInsert > 0, "le schéma précède les données dans le fichier");

const SCHEMA = `restau_froid_${process.pid}`;
if (!neonConfig.webSocketConstructor) neonConfig.webSocketConstructor = globalThis.WebSocket;
const client = new Client(readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .match(/DATABASE_URL="?([^"\r\n]+)"?/)[1].trim());

/* Le texte part par paquets d'instructions entières, séparées par « ; » — c'est le protocole
   simple, exactement ce que fait psql avec un fichier. Une requête par instruction mettrait
   des heures sur 173 706 INSERT. */
async function jouer(liste, etiquette) {
  const debut = Date.now();
  const PAQUET = 400;
  for (let i = 0; i < liste.length; i += PAQUET) {
    await client.query(liste.slice(i, i + PAQUET).join(";\n") + ";");
  }
  info(`${etiquette} : ${liste.length.toLocaleString("fr-CA")} instructions en ${((Date.now() - debut) / 1000).toFixed(1)} s`);
}

const attendus = {};
for (const m of contenu.matchAll(/^INSERT INTO "([a-z_]+)"/gm)) attendus[m[1]] = (attendus[m[1]] ?? 0) + 1;

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(`CREATE SCHEMA ${SCHEMA}`);
  /* `public` reste dans le chemin pour l'opérateur `gin_trgm_ops` de l'extension, qui n'est
     pas qualifié dans les CREATE INDEX. Le schéma jetable passe DEVANT : tout ce que le
     fichier crée y atterrit. */
  await client.query(`SET LOCAL search_path TO ${SCHEMA}, public`);

  /* ---------- 0. Ce que l'épreuve ne peut PAS prouver, on l'exige par lecture ----------
     ⛔ pg_trgm est installée dans `public`, et `public` reste dans le search_path pour
     l'opérateur gin_trgm_ops. Si le fichier perdait sa ligne `CREATE EXTENSION`, les six
     index se bâtiraient quand même ICI — et échoueraient sur un serveur nu. C'est la seule
     lacune connue de cette épreuve, et elle se comble par une lecture du texte, pas par une
     exécution. Un contrôle statique vaut mieux qu'un trou documenté. */
  const { rows: extensions } = await client.query(
    `SELECT extname FROM pg_extension WHERE extname <> 'plpgsql' ORDER BY extname`);
  const absentes = extensions.map((e) => e.extname)
    .filter((n) => !new RegExp(`CREATE EXTENSION IF NOT EXISTS "?${n}"?`).test(prefixeSchema + contenu + suffixeSchema));
  ok(absentes.length === 0,
     `les ${extensions.length} extension(s) de la base sont déclarées dans le fichier` +
     `${absentes.length ? ` — MANQUE ${absentes.join(", ")}` : ""} (contrôle par lecture, pas par exécution)`);

  /* ---------- 1. Le schéma ---------- */
  await jouer(instructions.slice(0, premierInsert), "schéma");

  /* ⛔ Contrôle AVANT de charger quoi que ce soit : les tables sont-elles bien nées dans le
     schéma jetable ? Si l'une manquait, son INSERT irait dans `public` — le ROLLBACK
     rattraperait, mais on aurait éprouvé la mauvaise table sans le savoir. */
  const { rows: creees } = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY 1`, [SCHEMA]);
  const noms = creees.map((r) => r.table_name);
  /* ⛔ Comparer à `public`, JAMAIS aux tables qui ont des INSERT : `categories_acheteurs` et
     `fournisseurs_contacts` sont vides, donc absentes du fichier de données. Mesurer la
     création d'après les données rendrait leur disparition du DDL parfaitement invisible. */
  const { rows: vivantes } = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY 1`);
  const attenduesTables = vivantes.map((r) => r.table_name);
  const manquantes = attenduesTables.filter((t) => !noms.includes(t));
  const enTrop = noms.filter((t) => !attenduesTables.includes(t));
  ok(manquantes.length === 0 && enTrop.length === 0,
     `${noms.length} tables créées pour ${attenduesTables.length} en base` +
     `${manquantes.length ? ` — MANQUE ${manquantes.join(", ")}` : ""}` +
     `${enTrop.length ? ` — EN TROP ${enTrop.join(", ")}` : ""}`);
  if (manquantes.length) throw new Error(`tables absentes du schéma jetable : ${manquantes.join(", ")}`);

  const { rows: [{ n: fonctions }] } = await client.query(
    `SELECT COUNT(*)::int AS n FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace WHERE ns.nspname = $1`, [SCHEMA]);
  /* ⚠️ ADAPTÉ POUR CORMAC le 18 octobre 2026. Chez ABG ce contrôle attend 1 — la fonction
     sa() que ses colonnes générées appellent. Cette base-ci n'a AUCUNE fonction dans public
     (mesuré avant d'écrire la ligne, pas supposé) : la bonne attente est donc 0, et ce
     contrôle vaut ici « le fichier n'a pas créé de fonction qu'on n'attendait pas ».
     Recopier le `=== 1` d'ABG aurait fabriqué un échec permanent sur une restauration
     parfaitement saine — c'est le même piège que le seuil de taille recopié. */
  ok(fonctions === 0, `aucune fonction inattendue dans le schéma jetable (${fonctions})`);

  /* ---------- 2. Les données, puis les contraintes et les index ---------- */
  await jouer(instructions.slice(premierInsert), "données, contraintes, index et séquences");

  /* ---------- 3. Critères observés ---------- */
  console.log("\nCe que la base restaurée contient :");
  let toutesTables = true;
  for (const [table, attendu] of Object.entries(attendus).sort()) {
    const { rows: [{ n }] } = await client.query(`SELECT COUNT(*)::int AS n FROM ${SCHEMA}."${table}"`);
    if (n !== attendu) { toutesTables = false; ok(false, `${table} : ${n} lignes restaurées pour ${attendu} dans le fichier`); }
  }
  ok(toutesTables, `les ${Object.keys(attendus).length} tables porteuses de données portent exactement le compte du fichier`);
  /* Les tables vides du fichier doivent exister ET rester vides. */
  for (const t of attenduesTables.filter((x) => !(x in attendus))) {
    const { rows: [{ n }] } = await client.query(`SELECT COUNT(*)::int AS n FROM ${SCHEMA}."${t}"`);
    ok(n === 0, `${t} : vide dans la base comme dans le fichier`);
  }

  /* La table pivot de cette base : les personnages. Chez ABG c'est `commandes`. */
  const { rows: [{ n: perso }] } = await client.query(`SELECT COUNT(*)::int AS n FROM ${SCHEMA}.characters`);
  ok(perso === attendus.characters, `personnages : ${perso.toLocaleString("fr-CA")}`);

  /* Les contraintes sont-elles revenues, et la NOT VALID toujours NOT VALID ? */
  const { rows: contraintes } = await client.query(
    `SELECT con.contype AS genre, COUNT(*)::int AS n,
            COUNT(*) FILTER (WHERE NOT con.convalidated)::int AS non_validees
     FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
     JOIN pg_namespace ns ON ns.oid = c.relnamespace
     WHERE ns.nspname = $1 AND con.contype IN ('p','u','f','c') GROUP BY 1 ORDER BY 1`, [SCHEMA]);
  const parGenre = Object.fromEntries(contraintes.map((r) => [r.genre, r]));
  const { rows: refs } = await client.query(
    `SELECT con.contype AS genre, COUNT(*)::int AS n,
            COUNT(*) FILTER (WHERE NOT con.convalidated)::int AS non_validees
     FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
     JOIN pg_namespace ns ON ns.oid = c.relnamespace
     WHERE ns.nspname = 'public' AND con.contype IN ('p','u','f','c') GROUP BY 1 ORDER BY 1`);
  for (const r of refs) {
    const v = parGenre[r.genre];
    ok(v && v.n === r.n, `contraintes « ${r.genre} » : ${v?.n ?? 0} restaurées pour ${r.n} en base`);
    if (r.non_validees > 0) {
      ok(v && v.non_validees === r.non_validees,
         `dont ${v?.non_validees ?? 0} NOT VALID pour ${r.non_validees} en base — la règle revient tolérante à l'historique`);
    }
  }

  /* Index : ceux des contraintes plus les autres. */
  const { rows: [{ n: idxFroid }] } = await client.query(
    `SELECT COUNT(*)::int AS n FROM pg_indexes WHERE schemaname = $1`, [SCHEMA]);
  const { rows: [{ n: idxVif }] } = await client.query(
    `SELECT COUNT(*)::int AS n FROM pg_indexes WHERE schemaname = 'public'`);
  ok(idxFroid === idxVif, `index : ${idxFroid} restaurés pour ${idxVif} en base`);

  /* ⚠️ ADAPTÉ POUR CORMAC. Chez ABG, ce bloc compare les 5 colonnes GÉNÉRÉES. Cette base-ci
     n'en a aucune (mesuré). Un contrôle qui n'a plus d'objet ne se garde pas vide : on le
     remplace par celui qui compte ici — le recoupement CHAMP PAR CHAMP des personnages
     restaurés contre les vivants. Compter 71 lignes des deux côtés ne dit rien du contenu. */
  const { rows: [{ diff }] } = await client.query(
    `SELECT COUNT(*)::int AS diff FROM ${SCHEMA}.characters v JOIN public.characters p ON p.id = v.id
     WHERE v.nom IS DISTINCT FROM p.nom OR v.race_id IS DISTINCT FROM p.race_id
        OR v.xp IS DISTINCT FROM p.xp OR v.notes IS DISTINCT FROM p.notes
        OR v.alignement IS DISTINCT FROM p.alignement`);
  ok(diff === 0, "personnages restaurés : nom, race, expérience, alignement et notes identiques champ par champ");

  /* Et le journal de partie, qui est l'autre chose qui n'existe qu'une fois. */
  const { rows: [{ dj }] } = await client.query(
    `SELECT COUNT(*)::int AS dj FROM ${SCHEMA}.character_journal v JOIN public.character_journal p ON p.id = v.id
     WHERE to_jsonb(v) IS DISTINCT FROM to_jsonb(p)`);
  ok(dj === 0, "journal de partie restauré : les 110 entrées identiques ligne par ligne");

  /* Séquences : sans repositionnement, la première commande saisie après restauration
     entrerait en collision avec un id existant. */
  const { rows: sequences } = await client.query(
    `SELECT s.sequencename AS nom FROM pg_sequences s WHERE s.schemaname = $1 ORDER BY 1`, [SCHEMA]);
  let sequencesJustes = 0, sequencesVues = 0;
  for (const s of sequences) {
    const table = s.nom.replace(/_id_seq$/, "");
    if (!noms.includes(table)) continue;
    sequencesVues++;
    const { rows: [{ v }] } = await client.query(`SELECT last_value AS v FROM ${SCHEMA}."${s.nom}"`);
    const { rows: [{ m }] } = await client.query(`SELECT COALESCE(MAX(id), 1) AS m FROM ${SCHEMA}."${table}"`);
    if (String(v) === String(m)) sequencesJustes++;
    else info(`séquence ${s.nom} à ${v} pour un id maximal de ${m}`);
  }
  ok(sequencesJustes === sequencesVues, `séquences repositionnées : ${sequencesJustes} sur ${sequencesVues}`);

  /* Accents et apostrophes — le passage par un fichier texte est l'endroit où ils meurent.
     Deux témoins plutôt qu'un : un nom de sort porte les deux à la fois (« Sphère glaciale
     d'Otiluke »), un nom de personnage porte l'accent seul (« Élianne »). */
  const { rows: [temoinSort] } = await client.query(
    `SELECT p.id, p.nom FROM public.spells p WHERE p.nom ~ '[À-ÿ]' AND p.nom LIKE '%''%' ORDER BY p.id LIMIT 1`);
  if (temoinSort) {
    const { rows: [v] } = await client.query(`SELECT nom FROM ${SCHEMA}.spells WHERE id = $1`, [temoinSort.id]);
    ok(v?.nom === temoinSort.nom, `accents et apostrophe conservés : « ${temoinSort.nom} »`);
  }
  const { rows: [temoinPerso] } = await client.query(
    `SELECT p.id, p.nom FROM public.characters p WHERE p.nom ~ '[À-ÿ]' ORDER BY p.id LIMIT 1`);
  if (temoinPerso) {
    const { rows: [v] } = await client.query(`SELECT nom FROM ${SCHEMA}.characters WHERE id = $1`, [temoinPerso.id]);
    ok(v?.nom === temoinPerso.nom, `accents conservés sur un personnage : « ${temoinPerso.nom} »`);
  }

  /* ⛔ CE CONTRÔLE VIENT EN DERNIER, ET CE N'EST PAS UN DÉTAIL D'ORDRE. Il était placé juste
     après les contraintes, et il faisait ÉCHOUER le contrôle des séquences : une séquence
     n'est pas transactionnelle, son `nextval` survit au rejet de la ligne. `commandes_id_seq`
     se retrouvait à 25 926 pour un id maximal de 25 925 — un faux défaut, entièrement
     fabriqué par l'épreuve elle-même. ⭐ Un test qui écrit doit passer APRÈS tout ce qui
     mesure, ou il mesure sa propre trace.
     ⭐ Et mord-elle toujours sur une écriture neuve ? Une contrainte revenue « validée »
     aurait l'air identique dans un décompte et ne protégerait plus rien. */
  /* ⚠️ ADAPTÉ POUR CORMAC. Chez ABG l'écriture d'essai éprouve un CHECK posé NOT VALID.
     Cette base-ci n'a AUCUNE contrainte NOT VALID (mesuré) : la règle qui mérite d'être
     éprouvée ici est la clé étrangère characters.race_id -> races.id. Une FK revenue
     « déclarée mais inactive » compterait pareil et ne protégerait plus rien. */
  try {
    await client.query(`SAVEPOINT essai`);
    await client.query(`INSERT INTO ${SCHEMA}.characters (nom, race_id) VALUES ('ZZZ-ESSAI', 999999)`);
    await client.query(`ROLLBACK TO SAVEPOINT essai`);
    ok(false, "un personnage rattaché à une race inexistante a été ACCEPTÉ — la clé étrangère ne mord plus");
  } catch {
    await client.query(`ROLLBACK TO SAVEPOINT essai`).catch(() => {});
    ok(true, "la clé étrangère mord toujours : une race inexistante est refusée");
  }

} finally {
  /* ⛔ ROLLBACK, jamais COMMIT. Rien de ce qui précède ne doit survivre — surtout pas dans
     `public` si une table avait manqué au schéma jetable. */
  try { await client.query("ROLLBACK"); } catch { }
  try {
    const { rows: [{ n }] } = await client.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.schemata WHERE schema_name = $1`, [SCHEMA]);
    ok(n === 0, "aucune trace du schéma jetable après le ROLLBACK");
  } catch (e) { ok(false, `impossible de vérifier la disparition du schéma jetable : ${e.message}`); }
  await client.end().catch(() => {});
}

/* ⭐ Deux verdicts distincts : en mode repli, le fichier NE se suffit PAS — il a fallu
   scripts/schema.sql, coupé au bon endroit. Annoncer l'autosuffisance là serait un verdict
   qui déborde sa mesure. */
console.log(echecs === 0
  ? (prefixeSchema
      ? "\n✅ RESTAURATION ÉPROUVÉE PAR LA VOIE DE REPLI — archive de données seules +"
        + " scripts/schema.sql coupé au marqueur. ⚠️ Le fichier seul ne suffit pas."
      : "\n✅ RESTAURATION À FROID ÉPROUVÉE — le fichier se suffit à lui-même.")
  : `\n⛔ ${echecs} ÉCHEC(S)`);
process.exitCode = echecs === 0 ? 0 : 1;
