import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ManageMembersForm from './ManageMembersForm'
import NewWorkPackageForm from '@/components/NewWorkPackageForm'
import WorkPackageAccordion from '@/components/WorkPackageAccordion'
import type { Drawing, Revision, WorkPackage } from '@/types/database'

type DrawingRow = Drawing & { current_revision: Revision | null }

export default async function ProjectPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!project) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Load drawings with their work_package info
  const { data: drawingsData } = await supabase
    .from('drawings')
    .select(`*, current_revision:revisions!drawings_current_revision_id_fkey(*)`)
    .eq('project_id', params.id)
    .order('created_at', { ascending: true })

  const drawings: DrawingRow[] = drawingsData ?? []

  // Load work packages for this project
  const { data: workPackages } = await supabase
    .from('work_packages')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: true })

  const wps: WorkPackage[] = workPackages ?? []

  // Group drawings by work_package_id
  const drawingsByWp: Record<string, DrawingRow[]> = {}
  const drawingsWithoutWp: DrawingRow[] = []

  for (const d of drawings) {
    if (d.work_package_id) {
      if (!drawingsByWp[d.work_package_id]) drawingsByWp[d.work_package_id] = []
      drawingsByWp[d.work_package_id].push(d)
    } else {
      drawingsWithoutWp.push(d)
    }
  }

  const { data: members } = await supabase
    .from('project_members')
    .select('user_id, profiles(id, full_name, email, role)')
    .eq('project_id', params.id)

  const isCreator = project.created_by === user.id
  const isDrafter = profile?.role === 'drafter'

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/projects" className="hover:text-gray-700">Projets</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{drawings.length} dessin{drawings.length !== 1 ? 's' : ''} · {wps.length} work package{wps.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Work packages */}
      <div className="space-y-4">
        {/* New work package button — visible to all */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Work packages</h2>
          <NewWorkPackageForm projectId={params.id} />
        </div>

        {/* Each work package as accordion */}
        {wps.length === 0 && drawingsWithoutWp.length === 0 ? (
          <div className="card text-center py-10 text-gray-500">
            <p>Aucun work package. Créez-en un pour commencer à organiser les dessins.</p>
          </div>
        ) : (
          <>
            {wps.map((wp, idx) => (
              <WorkPackageAccordion
                key={wp.id}
                wp={wp}
                drawings={drawingsByWp[wp.id] ?? []}
                isDrafter={isDrafter}
                projectId={params.id}
                defaultOpen={idx === 0}
              />
            ))}

            {/* Drawings without a work package */}
            {drawingsWithoutWp.length > 0 && (
              <WorkPackageAccordion
                wp={null}
                drawings={drawingsWithoutWp}
                isDrafter={isDrafter}
                projectId={params.id}
                defaultOpen={wps.length === 0}
              />
            )}
          </>
        )}
      </div>

      {/* Members (creator only) */}
      {isCreator && (
        <ManageMembersForm
          projectId={params.id}
          members={(members ?? []).map((m: any) => m.profiles).filter(Boolean)}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}

