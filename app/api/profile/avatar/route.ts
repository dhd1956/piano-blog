import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/get-db'
import { supabaseAdmin } from '@/lib/supabase-storage'

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const BUCKET = 'avatars'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const requesterAddress = formData.get('requesterAddress') as string | null

    if (!requesterAddress) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, or GIF images are allowed' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image must be under 2 MB' }, { status: 400 })
    }

    // Verify requester exists
    const db = await getDb()
    const requester = await db.user.findFirst({
      where: {
        OR: [
          { walletAddress: { equals: requesterAddress, mode: 'insensitive' } },
          { username: { equals: requesterAddress, mode: 'insensitive' } },
        ],
      },
      select: { id: true, walletAddress: true },
    })

    if (!requester) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Build a stable path: avatars/{userId}/{timestamp}.{ext}
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const path = `${requester.id}/${Date.now()}.${ext}`

    console.log('🪣 Uploading to bucket:', BUCKET, 'at URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        {
          error: `Upload failed: ${uploadError.message} (url: ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'NOT SET'})`,
        },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    // Save the URL to the user record
    await db.user.update({
      where: { id: requester.id },
      data: { avatar: urlData.publicUrl },
    })

    return NextResponse.json({ success: true, url: urlData.publicUrl })
  } catch (error: any) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
