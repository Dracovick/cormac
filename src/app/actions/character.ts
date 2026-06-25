'use server'

import { getDb } from '@/db'
import { characters } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function updatePhotoUrl(personnageId: number, photoUrl: string) {
  const url = photoUrl.trim()
  await getDb()
    .update(characters)
    .set({ photoUrl: url || null })
    .where(eq(characters.id, personnageId))
  revalidatePath(`/personnage/${personnageId}`)
}
