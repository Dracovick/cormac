/* ÉPREUVE PAR MUTATION de sauvegarde-blob.mjs.

   ⛔ POURQUOI. Un garde-fou qu'on n'a jamais vu tomber n'est pas un garde-fou, c'est une
   intention. Chaque épreuve ci-dessous casse UNE chose et exige que le programme l'annonce.
   Elle a déjà payé : l'épreuve 8 a trouvé un vrai défaut — le verdict des fichiers refusés
   vivait dans la branche du mode réel, donc « --essai » refusait les 20 fichiers un par un
   et annonçait quand même RESULTAT=OK. L'essai est ce qu'on lance pour se rassurer.

   ⭐ DANS LES DEUX SENS. Les épreuves 1, 2 et 10 doivent passer au VERT, les autres au ROUGE.
   Sans témoin positif, un programme cassé en permanence réussirait toutes les épreuves
   d'échec; sans témoin négatif (épreuve 3), un signal affiché en toutes circonstances
   passerait pour une détection.

   Les mutations tournent sur une COPIE dans .scratch/, jamais sur l'original, avec un
   .env.local jetable — le programme résout ses secrets par rapport à SON propre fichier.

   ⚠️ Chaque épreuve de contenu retélécharge les 20 médias (~39 Mo) : compter quelques minutes.
   Rien n'est jamais écrit dans les destinations réelles (mode essai, sauf l'épreuve 4 qui
   tourne en mode réel vers deux dossiers volontairement inexistants).

   Usage : node scripts/eprouve-sauvegarde-blob.mjs
*/
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const RACINE = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const ORIGINAL = join(RACINE, "scripts", "sauvegarde-blob.mjs");
const BAC = join(RACINE, ".scratch", "eprouve-blob");
const COPIE = join(BAC, "sauvegarde-blob.mjs");
const ENV_JETABLE = join(RACINE, ".scratch", ".env.local");

const source = readFileSync(ORIGINAL, "utf8");
const vraiEnv = readFileSync(join(RACINE, ".env.local"), "utf8");

rmSync(BAC, { recursive: true, force: true });
mkdirSync(BAC, { recursive: true });

let passees = 0, echouees = 0;

/* ⚠️ LEÇON DE CE HARNAIS, payée à sa première exécution : je collais stdout + stderr et je
   lisais « la dernière ligne ». Deux épreuves ont été déclarées en échec alors que le
   programme était juste — son « RESULTAT= » était bien le dernier de STDOUT, mais mon collage
   mettait l'alerte de stderr après. Le contrat d'annonce porte sur stdout, c'est là qu'on le
   lit; stderr est gardé à part, pour le diagnostic seulement. */
function lancer(chemin, env, args) {
  let out = "", err = "";
  try {
    out = execFileSync(process.execPath, [chemin, ...args], {
      cwd: RACINE, encoding: "utf8", timeout: 900000,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    out = String(e.stdout || "");
    err = String(e.stderr || "");
  }
  const lignes = out.split(/\r?\n/).filter((l) => l.trim() !== "");
  return { sortie: out + err, verdict: lignes[lignes.length - 1] || "(aucune sortie)" };
}

function epreuve(nom, attendu, { mutation, env, aussi, args = ["--essai"] } = {}) {
  let chemin = ORIGINAL;
  if (mutation) {
    const mute = mutation(source);
    /* ⛔ Une mutation qui ne change rien fait une épreuve qui ne porte sur rien, et elle
       passerait au vert en silence le jour où le code muté est renommé. */
    if (mute === source) {
      console.log(`  ⛔ ${nom} : LA MUTATION N'A RIEN CHANGÉ — l'épreuve ne porte sur rien.`);
      echouees++;
      return;
    }
    writeFileSync(COPIE, mute, "utf8");
    writeFileSync(ENV_JETABLE, vraiEnv, "utf8");
    chemin = COPIE;
  }
  const { sortie, verdict } = lancer(chemin, env || {}, args);
  const ok = verdict.startsWith(attendu) && (!aussi || aussi(sortie));
  console.log(`  ${ok ? "✔" : "⛔"} ${nom}`);
  console.log(`      attendu « ${attendu}… » · obtenu « ${verdict} »`);
  if (!ok) {
    /* ⚠️ Montrer les lignes QUI PORTENT LE JUGEMENT, pas la queue de la sortie : ma première
       version affichait les 14 dernières lignes, c'est-à-dire le manifeste — du texte qui ne
       dit rien de la décision. Une sortie tronquée au mauvais endroit cache la cause. */
    const cles = sortie.split(/\r?\n/)
      .filter((l) => /rapatrier|refus|⛔|❌|⚠️|verrou|RESULTAT=|absent|ZÉRO/.test(l));
    console.log("      ---- lignes décisives ----");
    console.log((cles.length ? cles : sortie.split(/\r?\n/).slice(-10))
      .slice(-16).map((l) => "      " + l).join("\n"));
    echouees++;
  } else passees++;
}

console.log("ÉPREUVE PAR MUTATION — sauvegarde-blob.mjs\n");

/* ---- 1. TÉMOIN POSITIF : rien de cassé, le programme doit réussir. ---- */
epreuve("1. témoin positif — rien de cassé", "RESULTAT=OK", {
  aussi: (s) => /Blob : \d+ fichier/.test(s),
});

/* ---- 2. TÉMOIN DE PRÉSENCE du signalement « quasi vide » : il doit SORTIR sur la donnée
   réelle. Un contrôle muet sur un cas qui existe est un contrôle mort. ---- */
epreuve("2. le quasi-vide est SIGNALÉ (et n'échoue pas)", "RESULTAT=OK", {
  aussi: (s) => /sous 4096 octets/.test(s) && /1790915608447\.jpg — 762 o/.test(s),
});

/* ---- 3. TÉMOIN NÉGATIF du même signal : seuil à 1 octet → plus aucun fichier signalé.
   Preuve que le signal vient de la DONNÉE, et non d'une ligne qui s'affiche toujours. ---- */
epreuve("3. seuil à 1 o → le signal disparaît (il vient de la donnée)", "RESULTAT=OK", {
  mutation: (s) => s.replace("const SEUIL_QUASI_VIDE = 4096;", "const SEUIL_QUASI_VIDE = 1;"),
  aussi: (s) => !/octets — forme valide/.test(s),
});

/* ---- 4. Les deux destinations absentes → ÉCHEC, et surtout AUCUN mkdir : sur un partage
   hors ligne, créer le dossier fabrique une sauvegarde locale que personne n'ira chercher. ---- */
const FANTOME_A = join(RACINE, ".scratch", "destination-fantome-A");
const FANTOME_B = join(RACINE, ".scratch", "destination-fantome-B");
rmSync(FANTOME_A, { recursive: true, force: true });
rmSync(FANTOME_B, { recursive: true, force: true });
epreuve("4. destinations absentes → ECHEC sans les créer", "RESULTAT=ECHEC", {
  mutation: (s) => s.replace('const ESSAI = process.argv.includes("--essai");', "const ESSAI = false;"),
  env: { CORMAC_SAUVEGARDE_NAS: FANTOME_A, CORMAC_SAUVEGARDE_ONEDRIVE: FANTOME_B },
  args: [],
  aussi: (s) => /AUCUNE destination/.test(s) && !existsSync(FANTOME_A) && !existsSync(FANTOME_B),
});

/* ---- 5. Secret absent → ÉCHEC avant toute opération. ---- */
epreuve("5. BLOB_READ_WRITE_TOKEN absent → ECHEC", "RESULTAT=ECHEC", {
  mutation: (s) => s.replace('const jetonBlob = lireCle("BLOB_READ_WRITE_TOKEN");',
                             'const jetonBlob = lireCle("CLE_QUI_N_EXISTE_PAS");'),
  aussi: (s) => /absent de \.env\.local/.test(s),
});

/* ---- 6. AGRÉGAT NUL : un Blob qui rend 0 fichier accuse le lecteur, pas la source. ---- */
epreuve("6. Blob listé à 0 fichier → ECHEC", "RESULTAT=ECHEC", {
  mutation: (s) => s.replace("const octetsBlob = fichiersBlob.reduce",
                             "fichiersBlob.length = 0;\nconst octetsBlob = fichiersBlob.reduce"),
  aussi: (s) => /ZÉRO fichier/.test(s),
});

/* ---- 7. Une table illisible → le manifeste n'est PAS réécrit, et c'est un échec : un
   manifeste incomplet est pire qu'un manifeste vieux, parce qu'il a l'air à jour. ---- */
epreuve("7. table illisible → manifeste non réécrit + ECHEC", "RESULTAT=ECHEC", {
  mutation: (s) => s.replace("const manifesteFiable =",
    'tablesEnEchec.push({ table: "table-de-controle-inexistante", raison: "mutation d\'epreuve" });\nconst manifesteFiable ='),
  aussi: (s) => /n'aurait PAS été réécrit|NON MESURABLE|NON REECRIT/.test(s),
});

/* ---- 8 et 9 : les contrôles de CONTENU.

   ⛔⛔ LEÇON PAYÉE ICI. Mes deux premières versions de ces épreuves ont rendu RESULTAT=OK et
   j'ai failli conclure « le contrôle ne marche pas ». Faux : les 20 médias étaient déjà
   sauvegardés et inchangés, donc le programme n'a RIEN téléchargé — et un contrôle de contenu
   qui ne reçoit aucun contenu ne peut pas se prononcer. L'épreuve ne portait sur rien.
   D'où `index_vide` : on fait croire au programme que rien n'est encore sauvegardé, ce qui
   l'oblige à retélécharger les 20 fichiers et à les contrôler pour de vrai. Et `aussi` exige
   de lire « refusé(s) : 20 » — le témoin qui prouve que le chemin a bien été exercé. */
const index_vide = (s) => s.replace("function lireIndex(dossier) {",
  "function lireIndex(dossier) {\n  if (process.env.EPREUVE_INDEX_VIDE === '1') return new Map();");

epreuve("8. taille annoncée falsifiée → 20 refusés + ECHEC", "RESULTAT=ECHEC", {
  mutation: (s) => index_vide(s).replace("const octetsBlob = fichiersBlob.reduce",
    "for (const b of fichiersBlob) b.size = (b.size || 0) + 7;\nconst octetsBlob = fichiersBlob.reduce"),
  env: { EPREUVE_INDEX_VIDE: "1" },
  aussi: (s) => /octets reçus pour .* annoncés — refusé/.test(s) && /refusé\(s\) : 20/.test(s),
});

/* Un HTML d'erreur servi en 200 par le CDN ne doit JAMAIS entrer dans la sauvegarde. */
epreuve("9. aucune forme reconnue → 20 refusés + ECHEC", "RESULTAT=ECHEC", {
  mutation: (s) => index_vide(s).replace("function formeReconnue(chemin) {",
    "function formeReconnue(chemin) {\n  if (readFileSync(chemin).length >= 0) return null;"),
  env: { EPREUVE_INDEX_VIDE: "1" },
  aussi: (s) => /contenu non reconnu/.test(s) && /refusé\(s\) : 20/.test(s),
});

/* ---- 10. TÉMOIN NÉGATIF des deux épreuves ci-dessus : l'index vidé SEUL, sans rien
   falsifier, doit retélécharger les 20 médias et les accepter tous. Sans lui, le rouge des
   épreuves 8 et 9 pourrait venir du retéléchargement lui-même et non de la falsification. ---- */
epreuve("10. index vidé seul → 20 retéléchargés, 0 refusé, OK", "RESULTAT=OK", {
  mutation: index_vide,
  env: { EPREUVE_INDEX_VIDE: "1" },
  aussi: (s) => /refusé\(s\) : 0/.test(s) && /À rapatrier : 20/.test(s),
});

rmSync(ENV_JETABLE, { force: true });
rmSync(BAC, { recursive: true, force: true });
rmSync(FANTOME_A, { recursive: true, force: true });
rmSync(FANTOME_B, { recursive: true, force: true });

console.log(`\n${passees + echouees} épreuve(s) · ${passees} passée(s) · ${echouees} échec(s)`);
process.exitCode = echouees ? 1 : 0;
