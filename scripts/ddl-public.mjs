/* Le DDL du schéma `public`, lu des catalogues PostgreSQL.
   ⛔ Écrit le 26 septembre 2026 après ce constat : la sauvegarde ne contenait AUCUN DDL et
   renvoyait à `scripts/schema.sql`, qui avait dérivé (2 tables et 3 colonnes de retard) ET
   n'était plus exécutable par son seul consommateur. Une sauvegarde faite de deux pièces se
   juge sur la plus faible. Désormais le fichier de la nuit porte son propre schéma.

   Deux temps, et l'ordre n'est pas négociable — c'est celui de pg_dump :
     AVANT les données : extension, fonctions, séquences, CREATE TABLE
     APRÈS les données : clés primaires, uniques, étrangères, CHECK, index
   ⭐ Les contraintes viennent après parce qu'un CHECK posé `NOT VALID` tolère l'historique
   déjà en place mais REFUSE toute écriture neuve : les poser avant le chargement rendrait la
   sauvegarde irrestaurable. Mesuré le 26 septembre 2026 sur `commandes_annulation_datee`.

   ⚠️ Rien n'est qualifié par un nom de schéma — ni les tables, ni la fonction, ni les index.
   C'est délibéré : le `search_path` de la session décide où tout atterrit, ce qui permet
   d'éprouver la restauration dans un schéma jetable sans réécrire une ligne du fichier. */

/* ---------------------------------------------------------------------------
   Découpage d'un script SQL en instructions.
   ⛔ Le découpage naïf `texte.split(";")` est FAUX et il l'était déjà : `creerSchema()`
   dans importer.mjs coupait la fonction `sa()` en deux moitiés à dollar-quote déséquilibré
   (mesuré le 26 sept. 2026 : 2 instructions bancales sur 47). Un analyseur qui ignore les
   chaînes, les dollar-quotes et les commentaires finit toujours par couper au mauvais
   endroit — d'autant plus que 385 commandes portent des remarques sur plusieurs lignes.
   --------------------------------------------------------------------------- */
export function decouperSql(texte) {
  const sorties = [];
  let debut = 0, i = 0;
  const n = texte.length;
  while (i < n) {
    const c = texte[i];
    if (c === "'") {                                   // chaîne : '' est une apostrophe littérale
      i++;
      while (i < n) {
        if (texte[i] === "'") { if (texte[i + 1] === "'") i += 2; else { i++; break; } }
        else i++;
      }
    } else if (c === '"') {                            // identifiant entre guillemets
      i++;
      while (i < n) {
        if (texte[i] === '"') { if (texte[i + 1] === '"') i += 2; else { i++; break; } }
        else i++;
      }
    } else if (c === "-" && texte[i + 1] === "-") {     // commentaire de ligne
      const saut = texte.indexOf("\n", i);
      i = saut === -1 ? n : saut + 1;
    } else if (c === "/" && texte[i + 1] === "*") {     // commentaire de bloc
      const fin = texte.indexOf("*/", i + 2);
      i = fin === -1 ? n : fin + 2;
    } else if (c === "$") {                            // dollar-quote : $$…$$ ou $tag$…$tag$
      const m = /^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/.exec(texte.slice(i));
      if (m) {
        const balise = m[0];
        const fin = texte.indexOf(balise, i + balise.length);
        i = fin === -1 ? n : fin + balise.length;
      } else i++;
    } else if (c === ";") {
      const brut = texte.slice(debut, i).trim();
      if (brut) sorties.push(brut);
      i++;
      debut = i;
    } else i++;
  }
  const reste = texte.slice(debut).trim();
  if (reste) sorties.push(reste);
  return sorties;
}

/* --------------------------------------------------------------------------- */

const guillemets = (x) => `"${String(x).replace(/"/g, '""')}"`;

export async function ddlPublic(sql) {
  const avant = [];
  const apres = [];

  /* ---- extensions ----
     Sans pg_trgm, les six index `gin_trgm_ops` échouent — et ils échouent APRÈS le
     chargement des données, donc au pire moment. plpgsql est là d'office, on ne l'émet pas. */
  const extensions = await sql`
    SELECT extname FROM pg_extension WHERE extname <> 'plpgsql' ORDER BY extname`;
  for (const e of extensions) {
    avant.push(`CREATE EXTENSION IF NOT EXISTS ${guillemets(e.extname)}`);
  }

  /* ---- fonctions maison ----
     ⭐ `sa()` n'est pas un ornement : cinq colonnes GENERATED ALWAYS … STORED en dépendent.
     Un DDL qui l'oublierait produirait des CREATE TABLE qui échouent.
     ⚠️ `pg_get_functiondef` qualifie le nom (`FUNCTION public.sa`) — on retire la
     qualification pour que le `search_path` décide, sinon l'épreuve à froid dans un schéma
     jetable irait écrire la fonction dans `public`. */
  for (const f of await sql`
    SELECT pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
    ORDER BY p.proname`) {
    const def = f.def.replace(/^CREATE OR REPLACE FUNCTION public\./, "CREATE OR REPLACE FUNCTION ");
    if (/^CREATE OR REPLACE FUNCTION public\./.test(def)) throw new Error("déqualification de fonction ratée");
    avant.push(def.trimEnd().replace(/;$/, ""));
  }

  /* ---- séquences ----
     Créées avant les tables : le DEFAULT `nextval('x_id_seq'::regclass)` d'une colonne
     `serial` résout la séquence au moment du CREATE TABLE. Le lien de propriété se pose
     après, quand la colonne existe. */
  const sequences = await sql`
    SELECT s.sequencename AS nom, s.data_type AS type, s.start_value AS debut,
           s.increment_by AS pas, s.min_value AS mini, s.max_value AS maxi,
           s.cache_size AS cache, s.cycle,
           t.relname AS table_proprietaire, a.attname AS colonne_proprietaire
    FROM pg_sequences s
    JOIN pg_class c ON c.relname = s.sequencename
    JOIN pg_namespace ns ON ns.oid = c.relnamespace AND ns.nspname = s.schemaname
    LEFT JOIN pg_depend d ON d.objid = c.oid AND d.classid = 'pg_class'::regclass AND d.deptype = 'a'
    LEFT JOIN pg_class t ON t.oid = d.refobjid
    LEFT JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
    WHERE s.schemaname = 'public'
    ORDER BY s.sequencename`;
  for (const s of sequences) {
    avant.push(
      `CREATE SEQUENCE IF NOT EXISTS ${guillemets(s.nom)} AS ${s.type}` +
      ` INCREMENT BY ${s.pas} MINVALUE ${s.mini} MAXVALUE ${s.maxi}` +
      ` START WITH ${s.debut} CACHE ${s.cache}${s.cycle ? " CYCLE" : " NO CYCLE"}`
    );
  }

  /* ---- tables et colonnes ----
     pg_attribute plutôt qu'information_schema : `format_type` rend le type EXACT, y compris
     `numeric(7,4)` (élargi le 4 sept. pour accueillir un escompte de 100 %) et `text[]`. */
  const colonnes = await sql`
    SELECT c.relname AS tbl, a.attname AS col, a.attnum,
           format_type(a.atttypid, a.atttypmod) AS type,
           a.attnotnull AS non_nul,
           a.attgenerated AS generee,
           a.attidentity AS identite,
           pg_get_expr(d.adbin, d.adrelid) AS defaut
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped
    ORDER BY c.relname, a.attnum`;

  const parTable = new Map();
  for (const c of colonnes) {
    if (!parTable.has(c.tbl)) parTable.set(c.tbl, []);
    parTable.get(c.tbl).push(c);
  }

  for (const [table, cols] of [...parTable.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const lignes = cols.map((c) => {
      let l = `  ${guillemets(c.col)} ${c.type}`;
      if (c.generee === "s") {
        /* Colonne générée : l'expression vit dans pg_attrdef comme un défaut ordinaire. */
        l += ` GENERATED ALWAYS AS (${c.defaut}) STORED`;
      } else if (c.identite === "a" || c.identite === "d") {
        l += ` GENERATED ${c.identite === "a" ? "ALWAYS" : "BY DEFAULT"} AS IDENTITY`;
      } else if (c.defaut != null) {
        l += ` DEFAULT ${c.defaut}`;
      }
      if (c.non_nul) l += " NOT NULL";
      return l;
    });
    avant.push(`CREATE TABLE IF NOT EXISTS ${guillemets(table)} (\n${lignes.join(",\n")}\n)`);
  }

  /* Le lien de propriété se pose une fois la colonne créée : il fait tomber la séquence
     avec sa table, et c'est lui qui rend `setval` cohérent après une restauration. */
  for (const s of sequences) {
    if (s.table_proprietaire && s.colonne_proprietaire) {
      avant.push(
        `ALTER SEQUENCE ${guillemets(s.nom)} OWNED BY ${guillemets(s.table_proprietaire)}.${guillemets(s.colonne_proprietaire)}`
      );
    }
  }

  /* ---- contraintes, dans l'ordre où elles se posent ----
     Primaires d'abord (les étrangères en dépendent), puis uniques, étrangères, CHECK.
     ⭐ `pg_get_constraintdef` rend le `NOT VALID` quand il y en a un : c'est ce qui fait
     revenir `commandes_annulation_datee` exactement comme elle était, tolérante à
     l'historique et mordante sur les écritures neuves. */
  const contraintes = await sql`
    SELECT c.relname AS tbl, con.conname AS nom, con.contype AS genre,
           pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND con.contype IN ('p','u','f','c')
    ORDER BY CASE con.contype WHEN 'p' THEN 1 WHEN 'u' THEN 2 WHEN 'f' THEN 3 ELSE 4 END,
             c.relname, con.conname`;
  for (const k of contraintes) {
    apres.push(`ALTER TABLE ${guillemets(k.tbl)} ADD CONSTRAINT ${guillemets(k.nom)} ${k.def}`);
  }

  /* ---- index ----
     Ceux qui servent une contrainte sont déjà créés par le ADD CONSTRAINT ci-dessus : les
     réémettre ferait échouer la restauration sur un doublon.
     ⚠️ `indexdef` qualifie la table (`ON public.clients`) — on déqualifie, même raison que
     pour la fonction. L'opérateur `gin_trgm_ops`, lui, reste non qualifié et se résout par
     le search_path : l'épreuve à froid doit donc garder `public` dans son chemin. */
  const index = await sql`
    SELECT i.indexname AS nom, i.indexdef AS def
    FROM pg_indexes i
    WHERE i.schemaname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_class ic ON ic.oid = con.conindid
        JOIN pg_class ct ON ct.oid = con.conrelid
        JOIN pg_namespace cn ON cn.oid = ct.relnamespace
        WHERE cn.nspname = 'public' AND ic.relname = i.indexname)
    ORDER BY i.indexname`;
  for (const x of index) {
    const def = x.def.replace(/^CREATE (UNIQUE )?INDEX (\S+) ON public\./, "CREATE $1INDEX IF NOT EXISTS $2 ON ");
    if (/ ON public\./.test(def)) throw new Error(`déqualification d'index ratée : ${x.nom}`);
    apres.push(def);
  }

  /* ---- garde-fou : le texte produit doit se redécouper exactement ----
     ⛔ Un générateur qui produit un texte que notre propre analyseur recoupe de travers
     fabriquerait une sauvegarde irrestaurable sans que rien ne le dise. On le vérifie ici,
     à la source, pendant qu'il est encore temps d'échouer bruyamment. */
  for (const [nom, liste] of [["avant", avant], ["après", apres]]) {
    const texte = liste.map((s) => s + ";\n").join("");
    const redecoupe = decouperSql(texte);
    if (redecoupe.length !== liste.length) {
      throw new Error(`le DDL « ${nom} » ne se redécoupe pas : ${liste.length} instructions émises, ${redecoupe.length} relues`);
    }
  }

  return { avant, apres, compte: { extensions: extensions.length, sequences: sequences.length, tables: parTable.size, contraintes: contraintes.length, index: index.length } };
}
