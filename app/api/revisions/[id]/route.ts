import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertValidBoxUrl } from '@/lib/validate-box-url'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'drafter') {
    return NextResponse.json({ error: 'Seul un dessinateur peut modifier une révision.' }, { status: 403 })
  }

  // Verify the revision belongs to a drawing created by this user
  const { data: revision } = await supabase
    .from('revisions')
    .select('id, status, drawing:drawings!revisions_drawing_id_fkey(created_by)')
    .eq('id', params.id)
    .single()

  if (!revision) return NextResponse.json({ error: 'Révision introuvable.' }, { status: 404 })

  const drawing = revision.drawing as any
  if (drawing?.created_by !== user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez modifier que vos propres révisions.' }, { status: 403 })
  }

  if (revision.status !== 'draft') {
    return NextResponse.json({ error: 'Seules les révisions en brouillon peuvent être modifiées.' }, { status: 409 })
  }

  const body = await request.json()
  const { revisionNumber, boxUrl } = body

  if (!revisionNumber || !boxUrl) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  try {
    assertValidBoxUrl(boxUrl.trim())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  const { error: updateError } = await serviceClient
    .from('revisions')
    .update({
      revision_number: revisionNumber.trim(),
      box_url: boxUrl.trim(),
    })
    .eq('id', params.id)

  if (updateError) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
