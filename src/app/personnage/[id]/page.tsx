import { notFound } from 'next/navigation'
import { getCharacter } from '@/lib/queries/character'

export const dynamic = 'force-dynamic'
import { Section } from '@/components/fiche/Section'
import { CaracteristiqueBadge } from '@/components/fiche/CaracteristiqueBadge'
import { StatBlock } from '@/components/fiche/StatBlock'

function modif(score: number) {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function signedNum(n: number) {
  return n >= 0 ? `+${n}` : `${n}`
}

export default async function FichePersonnage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getCharacter(Number(id))
  if (!data) notFound()

  const { character, race, clan, classes, abilityScores, combatStats, savingThrows, skills, feats, weapons, armor, magicItems, potions, currency, languages, creatures, companions } = data

  const dex = abilityScores ? ((abilityScores.dexBase ?? 10) + (abilityScores.dexMagique ?? 0)) : 10
  const dexMod = Math.floor((dex - 10) / 2)
  const caTotal = combatStats
    ? (combatStats.caBase ?? 10) + (combatStats.caArme ?? 0) + (combatStats.caBouclier ?? 0) + (combatStats.caNaturelle ?? 0) + (combatStats.caDeflexion ?? 0) + (combatStats.caDivers ?? 0) + dexMod
    : 10
  const initiativeTotal = combatStats ? dexMod + (combatStats.initiativeBonus ?? 0) + 4 : 0

  const classeLabel = classes.map(c => `${c.classe.nom} ${c.characterClass.niveau}`).join(' / ')
  const xpProchain = 21000

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* ── EN-TÊTE ── */}
      <header className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-900/40 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-5xl font-bold text-amber-300 tracking-wide">{character.nom}</h1>
              {character.surnom && (
                <p className="text-amber-600 text-lg italic mt-1">« {character.surnom} »</p>
              )}
              <p className="text-stone-300 mt-2 text-lg">
                {race?.nom ?? '—'} · {classeLabel} · {character.alignement ?? 'Alignement non précisé'}
              </p>
              {clan && (
                <p className="text-stone-400 text-sm mt-1">Clan : {clan.nom}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-amber-400 text-2xl font-bold">{character.xp?.toLocaleString('fr-FR')} XP</div>
              <div className="text-stone-500 text-sm">Prochain niveau : {xpProchain.toLocaleString('fr-FR')} XP</div>
              <div className="mt-2 w-48 bg-stone-800 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, ((character.xp ?? 0) / xpProchain) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid gap-4">

        {/* ── IDENTITÉ + CARACTÉRISTIQUES ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section titre="Identité">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                ['Race', race?.nom],
                ['Sexe', character.sexe],
                ['Âge', character.age ? `${character.age} ans` : null],
                ['Taille', character.taille],
                ['Poids', character.poids ? `${character.poids} lbs` : null],
                ['Yeux', character.yeux],
                ['Cheveux', character.cheveux],
                ['Dieu', '—'],
              ].map(([label, val]) => val ? (
                <div key={label as string} className="contents">
                  <dt className="text-stone-400">{label}</dt>
                  <dd className="text-stone-100 font-medium">{val}</dd>
                </div>
              ) : null)}
            </dl>
            {languages.length > 0 && (
              <p className="text-stone-400 text-xs mt-3">
                Langues : {languages.map(l => l.language.nom).join(', ')}
              </p>
            )}
          </Section>

          <Section titre="Caractéristiques">
            {abilityScores && (
              <div className="grid grid-cols-3 gap-2">
                <CaracteristiqueBadge label="FOR" base={abilityScores.forBase ?? 10} magic={abilityScores.forMagique ?? 0} />
                <CaracteristiqueBadge label="DEX" base={abilityScores.dexBase ?? 10} magic={abilityScores.dexMagique ?? 0} />
                <CaracteristiqueBadge label="CON" base={abilityScores.conBase ?? 10} magic={abilityScores.conMagique ?? 0} />
                <CaracteristiqueBadge label="INT" base={abilityScores.intBase ?? 10} magic={abilityScores.intMagique ?? 0} />
                <CaracteristiqueBadge label="SAG" base={abilityScores.sagBase ?? 10} magic={abilityScores.sagMagique ?? 0} />
                <CaracteristiqueBadge label="CHA" base={abilityScores.chaBase ?? 10} magic={abilityScores.chaMagique ?? 0} />
              </div>
            )}
          </Section>
        </div>

        {/* ── COMBAT ── */}
        <Section titre="Combat">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
            <StatBlock label="PV" value={`${combatStats?.pvActuels ?? 0} / ${combatStats?.pvMax ?? 0}`} />
            <StatBlock label="CA" value={caTotal} sub={`(armure +${combatStats?.caArme ?? 0})`} />
            <StatBlock label="Initiative" value={signedNum(initiativeTotal)} sub="DEX + divers + Science" />
            <StatBlock label="Déplacement" value={`${combatStats?.deplacement ?? 9}m`} />
            <StatBlock label="Karma" value={combatStats?.karma ?? 0} />
            <StatBlock label="Dé de vie" value={classes[0]?.classe.deVie ?? '—'} />
          </div>

          {/* Jets de sauvegarde */}
          {savingThrows && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Réflexes', base: savingThrows.reflexesBase, mod: dexMod, mag: savingThrows.reflexesMagique },
                { label: 'Vigueur', base: savingThrows.vigueurBase, mod: Math.floor(((abilityScores?.conBase ?? 10) + (abilityScores?.conMagique ?? 0) - 10) / 2), mag: savingThrows.vigueurMagique },
                { label: 'Volonté', base: savingThrows.volonteBase, mod: Math.floor(((abilityScores?.sagBase ?? 10) + (abilityScores?.sagMagique ?? 0) - 10) / 2), mag: savingThrows.volonteMagique },
              ].map(({ label, base, mod, mag }) => (
                <div key={label} className="bg-stone-800/60 rounded p-3 text-center">
                  <div className="text-amber-500 text-xs uppercase tracking-wide">{label}</div>
                  <div className="text-white text-2xl font-bold">{signedNum((base ?? 0) + mod + (mag ?? 0))}</div>
                  <div className="text-stone-500 text-xs">base {signedNum(base ?? 0)} · car. {signedNum(mod)}{(mag ?? 0) > 0 ? ` · mag. ${signedNum(mag ?? 0)}` : ''}</div>
                </div>
              ))}
            </div>
          )}

          {/* Attaques */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-800/60 rounded p-3">
              <div className="text-amber-500 text-xs uppercase tracking-wide mb-1">Corps à corps</div>
              <div className="text-white font-medium">
                BBA {signedNum(combatStats?.bbaCorpsACorps ?? 0)} / {signedNum((combatStats?.bbaCorpsACorps ?? 0) - 5)}
              </div>
            </div>
            <div className="bg-stone-800/60 rounded p-3">
              <div className="text-amber-500 text-xs uppercase tracking-wide mb-1">Projectiles</div>
              <div className="text-white font-medium">
                BBA {signedNum(combatStats?.bbaProjectiles ?? 0)} / {signedNum((combatStats?.bbaProjectiles ?? 0) - 5)}
              </div>
            </div>
          </div>
        </Section>

        {/* ── ARMES ── */}
        {weapons.length > 0 && (
          <Section titre="Armes">
            <div className="space-y-3">
              {weapons.map(({ weapon, charWeapon }) => (
                <div key={charWeapon.id} className="bg-stone-800/60 rounded p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-white font-semibold">
                        {weapon.nom}{charWeapon.bonusMagique ? ` +${charWeapon.bonusMagique}` : ''}
                      </span>
                      <div className="text-stone-400 text-xs mt-1 space-x-3">
                        <span>Dégâts : <span className="text-amber-300">{weapon.degats}</span></span>
                        <span>Critique : <span className="text-amber-300">{weapon.critiqueMin}-20 ×{weapon.critiqueMult}</span></span>
                        {weapon.portee && <span>Portée : <span className="text-amber-300">{weapon.portee}m</span></span>}
                        <span>Type : {weapon.typeDegats}</span>
                      </div>
                    </div>
                  </div>
                  {charWeapon.proprietesSpeciales && (
                    <p className="text-purple-300 text-xs mt-2 italic">{charWeapon.proprietesSpeciales}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── COMPÉTENCES + DONS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.length > 0 && (
            <Section titre="Compétences">
              <div className="space-y-1">
                {skills.map(({ skill, charSkill }) => {
                  const carac = abilityScores
                    ? { FOR: Math.floor((((abilityScores.forBase ?? 10) + (abilityScores.forMagique ?? 0)) - 10) / 2),
                        DEX: Math.floor((((abilityScores.dexBase ?? 10) + (abilityScores.dexMagique ?? 0)) - 10) / 2),
                        CON: Math.floor((((abilityScores.conBase ?? 10) + (abilityScores.conMagique ?? 0)) - 10) / 2),
                        INT: Math.floor((((abilityScores.intBase ?? 10) + (abilityScores.intMagique ?? 0)) - 10) / 2),
                        SAG: Math.floor((((abilityScores.sagBase ?? 10) + (abilityScores.sagMagique ?? 0)) - 10) / 2),
                        CHA: Math.floor((((abilityScores.chaBase ?? 10) + (abilityScores.chaMagique ?? 0)) - 10) / 2) }
                    : { FOR: 0, DEX: 0, CON: 0, INT: 0, SAG: 0, CHA: 0 }
                  const caracMod = carac[skill.caracteristique as keyof typeof carac] ?? 0
                  const total = (charSkill.rangsInvestis ?? 0) + caracMod + (charSkill.modifDivers ?? 0)
                  return (
                    <div key={skill.id} className="flex items-center justify-between py-1 border-b border-stone-800 last:border-0">
                      <div>
                        <span className="text-stone-200 text-sm">{skill.nom}</span>
                        <span className="text-stone-500 text-xs ml-2">({skill.caracteristique})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 text-xs">{charSkill.rangsInvestis} rangs</span>
                        <span className="text-amber-300 font-bold w-8 text-right">{signedNum(total)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {feats.length > 0 && (
            <Section titre="Dons">
              <div className="space-y-2">
                {feats.map(({ feat }) => (
                  <div key={feat.id} className="bg-stone-800/40 rounded p-2">
                    <div className="text-stone-200 text-sm font-medium">{feat.nom}</div>
                    {feat.effetMecanique && (
                      <div className="text-amber-400 text-xs mt-0.5">{feat.effetMecanique}</div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── ARMURE + OBJETS MAGIQUES ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {armor.length > 0 && (
            <Section titre="Armure portée">
              {armor.map(({ armor: a, charArmor }) => (
                <div key={charArmor.id} className="bg-stone-800/60 rounded p-3">
                  <div className="text-white font-semibold">
                    {a.nom}{charArmor.bonusMagique ? ` +${charArmor.bonusMagique}` : ''}
                  </div>
                  <div className="text-stone-400 text-xs mt-1 space-x-3">
                    <span>Bonus : <span className="text-amber-300">+{(a.bonusArmure ?? 0) + (charArmor.bonusMagique ?? 0)}</span></span>
                    {a.maxDex !== null && <span>Max DEX : <span className="text-amber-300">+{a.maxDex}</span></span>}
                    <span>Échec magique : <span className="text-amber-300">{a.risqueEchecMagique}%</span></span>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {magicItems.length > 0 && (
            <Section titre="Équipement magique">
              <div className="space-y-1.5">
                {magicItems.map(({ item, charItem }) => (
                  <div key={charItem.id} className="flex items-start gap-2 py-1 border-b border-stone-800 last:border-0">
                    <div className="flex-1">
                      <span className="text-purple-300 text-sm font-medium">{item.nom}</span>
                      {item.description && (
                        <p className="text-stone-500 text-xs mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <span className="text-stone-500 text-xs shrink-0">{charItem.emplacement}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── POTIONS + MONNAIE ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {potions.length > 0 && (
            <Section titre="Potions">
              <div className="space-y-2">
                {potions.map(({ potion, charPotion }) => (
                  <div key={charPotion.id} className="flex items-start justify-between bg-stone-800/40 rounded p-2">
                    <div>
                      <span className="text-green-300 text-sm">{potion.nom}</span>
                      {potion.description && (
                        <p className="text-stone-500 text-xs mt-0.5">{potion.description}</p>
                      )}
                      {charPotion.notes && (
                        <p className="text-amber-600 text-xs italic mt-0.5">{charPotion.notes}</p>
                      )}
                    </div>
                    <div className="text-center ml-3 shrink-0">
                      <div className="text-white font-bold text-lg">{charPotion.chargesRestantes}</div>
                      <div className="text-stone-500 text-xs">gorgée{(charPotion.chargesRestantes ?? 1) > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section titre="Trésor & Compagnons">
            {currency && (
              <div className="mb-4">
                <div className="text-amber-500 text-xs uppercase tracking-wide mb-2">Monnaie</div>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: 'PO', val: currency.po },
                    { label: 'PA', val: currency.pa },
                    { label: 'PC', val: currency.pc },
                    { label: 'PE', val: currency.pe },
                    { label: 'PM', val: currency.pm },
                  ].filter(c => Number(c.val) > 0).map(({ label, val }) => (
                    <div key={label} className="bg-stone-800/60 rounded px-3 py-2 text-center">
                      <div className="text-amber-300 text-sm font-bold">{Number(val).toLocaleString('fr-FR')}</div>
                      <div className="text-stone-500 text-xs">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {creatures.length > 0 && (
              <div className="mb-3">
                <div className="text-amber-500 text-xs uppercase tracking-wide mb-2">Monture</div>
                {creatures.map(({ creature, charCreature }) => (
                  <div key={charCreature.id} className="bg-stone-800/40 rounded p-2">
                    <span className="text-white font-medium">{charCreature.nomPersonnalise}</span>
                    <span className="text-stone-400 text-sm ml-2">({creature.nom})</span>
                    <span className="text-stone-500 text-xs ml-2">· {charCreature.role}</span>
                  </div>
                ))}
              </div>
            )}

            {companions.length > 0 && (
              <div>
                <div className="text-amber-500 text-xs uppercase tracking-wide mb-2">Compagnons</div>
                <div className="space-y-1">
                  {companions.map(c => (
                    <div key={c.id} className="bg-stone-800/40 rounded p-2 text-sm">
                      <span className="text-white font-medium">{c.nom}</span>
                      {c.race && <span className="text-stone-400 ml-2">{c.race}</span>}
                      {c.joueur && <span className="text-stone-500 ml-2 text-xs">(joué par {c.joueur})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* ── NOTES ── */}
        {character.notes && (
          <Section titre="Notes du joueur">
            <p className="text-stone-400 text-sm italic">{character.notes}</p>
          </Section>
        )}
      </main>
    </div>
  )
}
