import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { sendNewRevisionEmail } from '@/lib/resend'

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

  if (profile?.role !== 'drafter') {
    return NextResponse.json({ error: 'Seul un dessinateur peut soumettre une révision.' }, { status: 403 })
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
  if (revision.status !== 'draft') {
    return NextResponse.json({ error: 'Seules les révisions en brouillon peuvent être soumises.' }, { status: 409 })
  }
  if (revision.uploaded_by !== user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez soumettre que vos propres révisions.' }, { status: 403 })
  }

  const { error: updateError } = await supabase
    .from('revisions')
    .update({ status: 'pending_review' })
    .eq('id', revisionId)

  if (updateError) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
  }

  const { data: drawing } = await supabase
    .from('drawings')
    .select('project_id, drawing_number, title')
    .eq('id', drawingId)
    .single()

  if (!drawing) return NextResponse.json({ success: true })

  await logAudit({
    userId: user.id,
    action: 'submit_revision',
    drawingId,
    revisionId,
    metadata: { revision_number: revision.revision_number },
  })

  // Notify engineers in the project
  const { data: members } = await supabase
    .from('project_members')
    .select('user_id, profiles(id, email, role, full_name)')
    .eq('project_id', drawing.project_id)

  const engineers = (members ?? [])
    .map((m: any) => m.profiles)
    .filter((p: any) => p?.role === 'engineer')

  for (const engineer of engineers) {
    await serviceClient.from('notifications').insert({
      user_id: engineer.id,
      type: 'new_revision',
      message: `Révision ${revision.revision_number} soumise pour révision — ${drawing.drawing_number}`,
      drawing_id: drawingId,
    })
  }

  try {
    const engineerEmails = engineers.map((e: any) => e.email).filter(Boolean)
    if (engineerEmails.length > 0) {
      await sendNewRevisionEmail({
        engineerEmails,
        drawingNumber: drawing.drawing_number,
        drawingTitle: drawing.title,
        drawingId,
        revisionNumber: revision.revision_number,
        submittedBy: profile.full_name,
      })
    }
  } catch { /* non-blocking */ }

  return NextResponse.json({ success: true })
}
