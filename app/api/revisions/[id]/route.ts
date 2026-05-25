import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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

  const body = await request.json()
  const { revisionNumber, boxUrl } = body

  if (!revisionNumber || !boxUrl) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  // Verify revision belongs to a drawing owned by this user (via serviceClient to avoid RLS issues)
  const { data: revision } = await serviceClient
    .from('revisions')
    .select('id, drawing:drawings!revisions_drawing_id_fkey(created_by)')
    .eq('id', params.id)
    .single()

  if (!revision) return NextResponse.json({ error: 'Révision introuvable.' }, { status: 404 })

  const drawing = revision.drawing as any
  if (drawing?.created_by !== user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez modifier que vos propres révisions.' }, { status: 403 })
  }

  // Update using serviceClient — bypasses RLS entirely
  const { error: updateError } = await serviceClient
    .from('revisions')
    .update({
      revision_number: revisionNumber.trim(),
      box_url: boxUrl.trim(),
    })
    .eq('id', params.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
