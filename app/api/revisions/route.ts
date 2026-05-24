import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertValidBoxUrl } from '@/lib/validate-box-url'
import { logAudit } from '@/lib/audit'
import { sendNewRevisionEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'drafter') {
    return NextResponse.json({ error: 'Seul un dessinateur peut soumettre une révision.' }, { status: 403 })
  }

  const body = await request.json()
  const { drawingId, revisionNumber, boxUrl } = body

  if (!drawingId || !revisionNumber || !boxUrl) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  // Server-side Box URL validation
  try {
    assertValidBoxUrl(boxUrl)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  // Verify drawing belongs to a project the user is a member of
  const { data: drawing } = await supabase
    .from('drawings')
    .select('id, project_id, drawing_number, title, created_by')
    .eq('id', drawingId)
    .single()

  if (!drawing) return NextResponse.json({ error: 'Dessin introuvable.' }, { status: 404 })

  const { data: revision, error: revError } = await supabase
    .from('revisions')
    .insert({
      drawing_id: drawingId,
      revision_number: revisionNumber,
      box_url: boxUrl,
      uploaded_by: user.id,
      status: 'draft',
    })
    .select()
    .single()

  if (revError || !revision) {
    return NextResponse.json({ error: 'Erreur lors de la création de la révision.' }, { status: 500 })
  }

  // Update drawing's current revision
  await supabase
    .from('drawings')
    .update({ current_revision_id: revision.id })
    .eq('id', drawingId)

  // Audit log
  await logAudit({
    userId: user.id,
    action: 'submit_revision',
    drawingId,
    revisionId: revision.id,
    metadata: { revision_number: revisionNumber, box_url: boxUrl },
  })

  // Notify all engineers in the project
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
      message: `Nouvelle révision ${revisionNumber} soumise pour ${drawing.drawing_number} — ${drawing.title}`,
      drawing_id: drawingId,
    })
  }

  // Email notifications
  const engineerEmails = engineers.map((e: any) => e.email).filter(Boolean)
  if (engineerEmails.length > 0) {
    try {
      await sendNewRevisionEmail({
        engineerEmails,
        drawingNumber: drawing.drawing_number,
        drawingTitle: drawing.title,
        drawingId,
        revisionNumber,
        submittedBy: profile.full_name,
      })
    } catch {
      // Email failure is non-blocking
    }
  }

  return NextResponse.json({ revision }, { status: 201 })
}
