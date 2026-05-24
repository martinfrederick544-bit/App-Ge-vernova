import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { sendApprovedEmail, sendReturnedEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: reviewerProfile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (reviewerProfile?.role !== 'engineer') {
    return NextResponse.json({ error: 'Seul un ingénieur peut réviser.' }, { status: 403 })
  }

  const body = await request.json()
  const { revisionId, drawingId, action, comment, reviewBoxUrl } = body

  if (!revisionId || !drawingId || !action) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  if (action !== 'approve' && action !== 'return') {
    return NextResponse.json({ error: 'Action invalide.' }, { status: 400 })
  }

  if (action === 'return' && !comment?.trim()) {
    return NextResponse.json({ error: 'Un commentaire est obligatoire pour retourner une révision.' }, { status: 400 })
  }

  if (action === 'return' && !reviewBoxUrl?.trim()) {
    return NextResponse.json({ error: 'Un lien Box vers le PDF annoté est obligatoire pour retourner une révision.' }, { status: 400 })
  }

  if (action === 'return' && reviewBoxUrl) {
    const { assertValidBoxUrl } = await import('@/lib/validate-box-url')
    try { assertValidBoxUrl(reviewBoxUrl.trim()) } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
  }

  // Verify revision is pending
  const { data: revision } = await supabase
    .from('revisions')
    .select('*, drawing:drawings!revisions_drawing_id_fkey(drawing_number, title, project_id, created_by)')
    .eq('id', revisionId)
    .single()

  if (!revision) return NextResponse.json({ error: 'Révision introuvable.' }, { status: 404 })
  if (revision.status !== 'pending_review') {
    return NextResponse.json({ error: 'Cette révision a déjà été traitée.' }, { status: 409 })
  }

  const newStatus = action === 'approve' ? 'approved' : 'returned'
  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('revisions')
    .update({
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: now,
      review_comment: action === 'return' ? comment.trim() : null,
      review_box_url: action === 'return' ? reviewBoxUrl.trim() : null,
    })
    .eq('id', revisionId)

  if (updateError) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
  }

  // Audit log
  await logAudit({
    userId: user.id,
    action,
    drawingId,
    revisionId,
    metadata: action === 'return' ? { comment } : {},
  })

  // Get drafter info for notification + email
  const drawing = revision.drawing as any
  const { data: drafterProfile } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', drawing?.created_by)
    .single()

  if (drafterProfile) {
    const message =
      action === 'approve'
        ? `Révision ${revision.revision_number} de ${drawing.drawing_number} approuvée par ${reviewerProfile.full_name}`
        : `Révision ${revision.revision_number} de ${drawing.drawing_number} retournée par ${reviewerProfile.full_name} : ${comment}`

    await serviceClient.from('notifications').insert({
      user_id: drafterProfile.id,
      type: action === 'approve' ? 'approved' : 'returned',
      message,
      drawing_id: drawingId,
    })

    try {
      if (action === 'approve') {
        await sendApprovedEmail({
          drafterEmail: drafterProfile.email,
          drawingNumber: drawing.drawing_number,
          drawingTitle: drawing.title,
          drawingId,
          revisionNumber: revision.revision_number,
          reviewedBy: reviewerProfile.full_name,
        })
      } else {
        await sendReturnedEmail({
          drafterEmail: drafterProfile.email,
          drawingNumber: drawing.drawing_number,
          drawingTitle: drawing.title,
          drawingId,
          revisionNumber: revision.revision_number,
          reviewedBy: reviewerProfile.full_name,
          comment: comment.trim(),
        })
      }
    } catch {
      // Email failure is non-blocking
    }
  }

  return NextResponse.json({ success: true, status: newStatus })
}
