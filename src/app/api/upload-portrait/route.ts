import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file || !file.size) {
    return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image trop volumineuse (max 5 Mo)' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `portraits/${Date.now()}.${ext}`

  const blob = await put(filename, file, { access: 'public' })

  return NextResponse.json({ url: blob.url })
}
