import { FormulaireConnexion } from '@/components/FormulaireConnexion'
import { PARAM_SUITE, suiteValide } from '@/lib/partage'

export const dynamic = 'force-dynamic'

/**
 * LA CONNEXION — et, depuis le 2026-11-16, la destination retenue.
 *
 * André : « Lorsque je copie le lien de la page ce lien amène à l'accueil du
 * site. » Le middleware pose maintenant `?suite=<chemin>` en renvoyant ici, et
 * la page l'annonce avant d'entrer le mot de passe : savoir où l'on va atterrir
 * est ce qui distingue « le lien est cassé » de « il faut le mot de passe ».
 *
 * ⚠ `suiteValide()` est appliqué DEUX FOIS — ici pour l'affichage, et dans
 * `actions/auth.login()` avant la redirection. Le texte affiché ne protège
 * rien : seule la vérification du côté de l'action compte, et elle ne doit pas
 * dépendre de celle-ci.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const brut = params[PARAM_SUITE]
  const suite = suiteValide(Array.isArray(brut) ? brut[0] : brut)

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#080608' }}
    >
      {/* Lueur ambiante */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(120,20,20,0.18) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Titre */}
        <div className="text-center mb-8">
          <div className="text-amber-600 text-5xl mb-4">⚔️</div>
          <h1 className="text-3xl font-bold text-amber-300 tracking-wide">Grimoire D&amp;D</h1>
          <p className="text-stone-500 text-sm mt-2">3e édition · Accès restreint</p>
        </div>

        {suite && (
          <p className="text-center text-stone-400 text-sm mb-4 px-2">
            Le mot de passe, et vous y êtes.
            <br />
            <span className="text-stone-600 text-xs break-all">{suite}</span>
          </p>
        )}

        <FormulaireConnexion suite={suite} />

        <p className="text-center text-stone-700 text-xs mt-6">
          Donjons &amp; Dragons 3e édition
        </p>
      </div>
    </div>
  )
}
