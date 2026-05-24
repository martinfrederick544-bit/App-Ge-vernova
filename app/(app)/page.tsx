import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DrafterDashboard from '@/components/DrafterDashboard'
import EngineerDashboard from '@/components/EngineerDashboard'
import ProjectManagerDashboard from '@/components/ProjectManagerDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  if (profile.role === 'drafter') {
    const { data: drawings } = await supabase
      .from('drawings')
      .select(`
        *,
        project:projects(id, name),
        current_revision:revisions!drawings_current_revision_id_fkey(*)
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return <DrafterDashboard drawings={drawings ?? []} />
  }

  if (profile.role === 'engineer') {
    // Revisions pending review in projects the engineer is a member of
    const { data: pending } = await supabase
      .from('revisions')
      .select(`
        *,
        drawing:drawings!revisions_drawing_id_fkey(*, project:projects(id, name)),
        uploaded_by_profile:profiles!revisions_uploaded_by_fkey(id, full_name)
      `)
      .eq('status', 'pending_review')
      .order('uploaded_at', { ascending: true })
      .limit(50)

    const { data: recent } = await supabase
      .from('revisions')
      .select(`
        *,
        drawing:drawings!revisions_drawing_id_fkey(*, project:projects(id, name))
      `)
      .in('status', ['approved', 'returned'])
      .eq('reviewed_by', user.id)
      .order('reviewed_at', { ascending: false })
      .limit(10)

    return <EngineerDashboard pending={pending ?? []} recent={recent ?? []} />
  }

  if (profile.role === 'project_manager') {
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: false })

    // Stats per project
    const projectIds = (projects ?? []).map((p) => p.id)
    const { data: drawingStats } = await supabase
      .from('drawings')
      .select('project_id, current_revision_id')
      .in('project_id', projectIds.length > 0 ? projectIds : [''])

    return (
      <ProjectManagerDashboard
        projects={projects ?? []}
        drawingStats={drawingStats ?? []}
      />
    )
  }

  redirect('/login')
}
