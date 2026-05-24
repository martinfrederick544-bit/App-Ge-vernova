import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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

  // Delete via service client (cascades to revisions, notifications, audit_log)
  const { error } = await serviceClient
    .from('drawings')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 })

  return NextResponse.json({ success: true })
}
