import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'drafter') {
    return NextResponse.json({ error: 'Seul un dessinateur peut retirer une révision.' }, { status: 403 })
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
  if (revision.status !== 'pending_review') {
    return NextResponse.json({ error: 'Seules les révisions en attente peuvent être retirées.' }, { status: 409 })
  }
  if (revision.reviewed_by !== null) {
    return NextResponse.json({ error: 'Cette révision a déjà été traitée par un ingénieur.' }, { status: 409 })
  }
  if (revision.uploaded_by !== user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez retirer que vos propres révisions.' }, { status: 403 })
  }

  const { error: updateError } = await supabase
    .from('revisions')
    .update({ status: 'draft' })
    .eq('id', revisionId)

  if (updateError) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
  }

  await logAudit({
    userId: user.id,
    action: 'retract_revision',
    drawingId,
    revisionId,
    metadata: { revision_number: revision.revision_number },
  })

  return NextResponse.json({ success: true })
}
