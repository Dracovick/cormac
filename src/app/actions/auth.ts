'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { destinationApresConnexion } from '@/lib/partage'

const PASSWORD = process.env.AUTH_PASSWORD ?? 'Mystara'
const COOKIE = 'cormac_auth'
const TOKEN = 'granted'

/**
 * ⚠ `suite` arrive du navigateur : c'est le `?suite=` que le middleware a posé
 * sur `/login`, et donc une valeur que n'importe qui peut écrire. Elle est
 * vérifiée par `destinationApresConnexion()`, qui n'accepte qu'un chemin
 * interne — voir `lib/partage.ts` pour les cinq refus et leur raison.
 */
export async function login(password: string, suite?: string | null): Promise<boolean> {
  if (password !== PASSWORD) return false

  const jar = await cookies()
  jar.set(COOKIE, TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    path: '/',
  })

  // ⛔ Était `redirect('/')` EN DUR jusqu'au 2026-11-16 : c'est ce qui faisait
  // dire à André « lorsque je copie le lien de la page, ce lien amène à
  // l'accueil du site ». Le mot de passe était bon, la page demandée était
  // simplement jetée en route.
  redirect(destinationApresConnexion(suite))
}

export async function logout() {
  const jar = await cookies()
  jar.delete(COOKIE)
  redirect('/login')
}
