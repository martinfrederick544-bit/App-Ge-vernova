import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DrawingStatusBadge from '@/components/DrawingStatusBadge'
import ManageMembersForm from './ManageMembersForm'
import NewWorkPackageForm from '@/components/NewWorkPackageForm'
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

        {/* Each work package */}
        {wps.length === 0 && drawingsWithoutWp.length === 0 ? (
          <div className="card text-center py-10 text-gray-500">
            <p>Aucun work package. Créez-en un pour commencer à organiser les dessins.</p>
          </div>
        ) : (
          <>
            {wps.map((wp) => {
              const wpDrawings = drawingsByWp[wp.id] ?? []
              return (
                <WorkPackageSection
                  key={wp.id}
                  wp={wp}
                  drawings={wpDrawings}
                  isDrafter={isDrafter}
                  projectId={params.id}
                />
              )
            })}

            {/* Drawings without a work package */}
            {drawingsWithoutWp.length > 0 && (
              <WorkPackageSection
                wp={null}
                drawings={drawingsWithoutWp}
                isDrafter={isDrafter}
                projectId={params.id}
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

function WorkPackageSection({
  wp,
  drawings,
  isDrafter,
  projectId,
}: {
  wp: WorkPackage | null
  drawings: DrawingRow[]
  isDrafter: boolean
  projectId: string
}) {
  const newDrawingHref = wp
    ? `/drawings/new?project=${projectId}&wp=${wp.id}`
    : `/drawings/new?project=${projectId}`

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className="font-semibold text-gray-900">
            {wp ? wp.name : <span className="text-gray-500 italic">Sans work package</span>}
          </h3>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
            {drawings.length} dessin{drawings.length !== 1 ? 's' : ''}
          </span>
        </div>
        {isDrafter && (
          <Link href={newDrawingHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-gev-600 hover:text-gev-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau dessin
          </Link>
        )}
      </div>

      {drawings.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">Aucun dessin dans ce work package.</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Titre</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rév.</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {drawings.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5">
                  <Link href={`/drawings/${d.id}`} className="text-gev-500 hover:underline font-mono text-sm font-medium">
                    {d.drawing_number}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-sm text-gray-600 hidden sm:table-cell truncate max-w-xs">
                  {d.title !== d.drawing_number ? d.title : ''}
                </td>
                <td className="px-3 py-2.5 font-mono text-sm text-gray-700">
                  {d.current_revision?.revision_number ?? '—'}
                </td>
                <td className="px-3 py-2.5">
                  <DrawingStatusBadge status={d.current_revision?.status ?? null} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
