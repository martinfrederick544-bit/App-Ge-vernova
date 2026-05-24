import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'engineer') {
    return NextResponse.json({ error: 'Seul un ingénieur peut annuler une révision.' }, { status: 403 })
  }

  const { revisionId, drawingId } = await request.json()
  if (!revisionId || !drawingId) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  const { data: revision } = await supabase
    .from('revisions')
    .select('*')
    .eq('id', revisionId)
    .single()

  if (!revision) return NextResponse.json({ error: 'Révision introuvable.' }, { status: 404 })

  if (revision.status === 'pending_review') {
    return NextResponse.json({ error: 'Cette révision est déjà en attente de révision.' }, { status: 409 })
  }

  if (revision.reviewed_by !== user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez annuler que vos propres révisions.' }, { status: 403 })
  }

  const { error: updateError } = await serviceClient
    .from('revisions')
    .update({
      status: 'pending_review',
      reviewed_by: null,
      reviewed_at: null,
      review_comment: null,
      review_box_url: null,
    })
    .eq('id', revisionId)

  if (updateError) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
  }

  await logAudit({
    userId: user.id,
    action: 'cancel_review',
    drawingId,
    revisionId,
    metadata: { previous_status: revision.status },
  })

  // Notify the drafter that the review was cancelled
  const { data: drawing } = await serviceClient
    .from('drawings')
    .select('created_by, drawing_number')
    .eq('id', drawingId)
    .single()

  if (drawing) {
    await serviceClient.from('notifications').insert({
      user_id: drawing.created_by,
      type: 'info',
      message: `La révision ${revision.revision_number} de ${drawing.drawing_number} a été réouverte par ${profile.full_name}`,
      drawing_id: drawingId,
    })
  }

  return NextResponse.json({ success: true })
}
