'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const PASSWORD = process.env.AUTH_PASSWORD ?? 'Mystara'
const COOKIE = 'cormac_auth'
const TOKEN = 'granted'

export async function login(password: string): Promise<boolean> {
  if (password !== PASSWORD) return false

  const jar = await cookies()
  jar.set(COOKIE, TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    path: '/',
  })

  redirect('/')
}

export async function logout() {
  const jar = await cookies()
  jar.delete(COOKIE)
  redirect('/login')
}
