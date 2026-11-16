import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getHistoire } from '@/lib/queries/histoire'
import { PrintButton } from '@/components/fiche/PrintButton'
import { RecitRendu } from '@/components/histoire/RecitRendu'
import { dateCourte } from '@/lib/histoire'

export const dynamic = 'force-dynamic'

/**
 * L'HISTOIRE SUR PAPIER — un document à elle, séparé de la feuille de personnage.
 *
 * ⛔ Pourquoi pas une page de plus sur la feuille de personnage : cette feuille
 * est un ÉTAT AU REPOS de trois pages, calibré au millimètre (André l'a tranché
 * le 2026-10-10, et une ligne de 9 px y a déjà fait passer une fiche de 4 à
 * 5 pages). Vingt mille caractères de récit la feraient exploser, et on
 * n'apporte pas le même papier à la table pour jouer et pour lire.
 *
 * ⭐ Aucun nombre de pages imposé ici, au contraire de la fiche : un récit coule
 * sur autant de pages qu'il en faut. On ne protège qu'une chose, le fait qu'un
 * chapitre ne se coupe pas juste après son titre (`breakAfter: avoid`).
 */
export default async function ImprimerHistoire({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const numero = Number(id)
  if (!Number.isInteger(numero) || numero <= 0) notFound()

  const histoire = await getHistoire(numero)
  if (!histoire) notFound()

  const sousTitre = [histoire.race, histoire.classes].filter(Boolean).join(' · ')

  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#000', background: '#fff', maxWidth: '216mm', margin: '0 auto', padding: '0 10px' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          @page { size: letter; margin: 0.9in; }
        }
        @media screen {
          body { background: #888; }
        }
      `}</style>

      <div className="no-print" style={{ background: '#1c1917', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px', borderRadius: '8px', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href={`/personnage/${histoire.id}/histoire`} style={{ color: '#a8a29e', fontSize: '14px', textDecoration: 'none' }}>← Retour à l’histoire</Link>
        <span style={{ color: '#57534e' }}>|</span>
        <PrintButton nomFichier={`histoire-${histoire.nom}`} />
        <span style={{ color: '#78716c', fontSize: '13px', marginLeft: 'auto' }}>
          Document distinct de la feuille de personnage
        </span>
      </div>

      <div style={{ padding: '0 0 24px' }}>
        <header style={{ textAlign: 'center', marginBottom: '28px', paddingBottom: '14px', borderBottom: '2px solid #000' }}>
          <div style={{ fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#555' }}>Histoire</div>
          <h1 style={{ fontSize: '24pt', margin: '6px 0 2px', fontWeight: 'bold' }}>{histoire.nom}</h1>
          {histoire.surnom && <div style={{ fontSize: '12pt', fontStyle: 'italic', color: '#444' }}>« {histoire.surnom} »</div>}
          {sousTitre && <div style={{ fontSize: '10pt', color: '#555', marginTop: '4px' }}>{sousTitre}</div>}
        </header>

        {histoire.chapitres.length === 0 && (
          <p style={{ fontSize: '11pt', fontStyle: 'italic', color: '#555', textAlign: 'center' }}>
            Cette histoire n’est pas encore écrite.
          </p>
        )}

        {histoire.chapitres.map((c, i) => (
          <section key={c.id} style={{ marginBottom: '26px' }}>
            {/* breakAfter: 'avoid' — un titre de chapitre seul en bas de page,
                son texte commençant à la page suivante, est la faute classique
                d'un document imprimé. */}
            <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0 0 2px', breakAfter: 'avoid', pageBreakAfter: 'avoid' }}>
              <span style={{ color: '#666', fontSize: '10pt', fontWeight: 'normal' }}>{i + 1}. </span>
              {c.titre}
            </h2>
            {(c.signature || c.updatedAt) && (
              <div style={{ fontSize: '8pt', color: '#777', marginBottom: '8px', breakAfter: 'avoid', pageBreakAfter: 'avoid' }}>
                {c.signature && <span>écrit par {c.signature}</span>}
                {c.signature && c.updatedAt && <span> · </span>}
                {c.updatedAt && <span>revu le {dateCourte(c.updatedAt)}</span>}
              </div>
            )}
            <div style={{ fontSize: '11pt', lineHeight: 1.55, textAlign: 'justify' }}>
              <RecitRendu contenu={c.contenu} pourImpression />
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
