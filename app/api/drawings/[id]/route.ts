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
    return NextResponse.json({ error: 'Seul un dessinateur peut modifier un dessin.' }, { status: 403 })
  }

  const { data: drawing } = await serviceClient
    .from('drawings')
    .select('id, created_by')
    .eq('id', params.id)
    .single()

  if (!drawing) return NextResponse.json({ error: 'Dessin introuvable.' }, { status: 404 })
  if (drawing.created_by !== user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez modifier que vos propres dessins.' }, { status: 403 })
  }

  const body = await request.json()
  const { drawingNumber, projectId, workPackageId, checklistUrl } = body

  const { error } = await serviceClient
    .from('drawings')
    .update({
      drawing_number: drawingNumber,
      title: drawingNumber,
      project_id: projectId,
      work_package_id: workPackageId || null,
      checklist_url: checklistUrl ?? undefined,
    })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: 'Erreur lors de la mise à jour du dessin.' }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
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
    return NextResponse.json({ error: 'Seul un dessinateur peut supprimer un dessin.' }, { status: 403 })
  }

  const { data: drawing } = await supabase
    .from('drawings')
    .select('id, created_by')
    .eq('id', params.id)
    .single()

  if (!drawing) return NextResponse.json({ error: 'Dessin introuvable.' }, { status: 404 })
  if (drawing.created_by !== user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez supprimer que vos propres dessins.' }, { status: 403 })
  }

  // Break circular FK: drawings.current_revision_id → revisions
  await serviceClient
    .from('drawings')
    .update({ current_revision_id: null })
    .eq('id', params.id)

  // Delete (cascades to revisions + notifications; audit_log FKs are SET NULL)
  const { error } = await serviceClient
    .from('drawings')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })

  return NextResponse.json({ success: true })
}
