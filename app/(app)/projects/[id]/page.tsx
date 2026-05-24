import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DrawingStatusBadge from '@/components/DrawingStatusBadge'
import ManageMembersForm from './ManageMembersForm'
import type { Drawing, Revision } from '@/types/database'

type DrawingRow = Drawing & { current_revision: Revision | null }

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { status?: string }
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

  let query = supabase
    .from('drawings')
    .select(`*, current_revision:revisions!drawings_current_revision_id_fkey(*)`)
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  const drawings: DrawingRow[] = (await query).data ?? []

  const filtered =
    searchParams.status
      ? drawings.filter((d) => d.current_revision?.status === searchParams.status)
      : drawings

  const { data: members } = await supabase
    .from('project_members')
    .select('user_id, profiles(id, full_name, email, role)')
    .eq('project_id', params.id)

  const isCreator = project.created_by === user.id

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/projects" className="hover:text-gray-700">Projets</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">{project.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
        {profile?.role === 'drafter' && (
          <Link href={`/drawings/new?project=${params.id}`} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau dessin
          </Link>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'Tous', value: undefined },
          { label: 'En attente', value: 'pending_review' },
          { label: 'Approuvés', value: 'approved' },
          { label: 'Retournés', value: 'returned' },
        ].map((filter) => (
          <Link
            key={filter.label}
            href={filter.value ? `/projects/${params.id}?status=${filter.value}` : `/projects/${params.id}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              searchParams.status === filter.value || (!searchParams.status && !filter.value)
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {/* Drawings table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Dessins ({filtered.length})
        </h2>
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun dessin pour ce filtre.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rév.</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map((drawing) => (
                <tr key={drawing.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <Link href={`/drawings/${drawing.id}`} className="text-blue-700 hover:underline font-mono text-sm font-medium">
                      {drawing.drawing_number}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">{drawing.title}</td>
                  <td className="px-3 py-3 font-mono text-sm text-gray-700">
                    {drawing.current_revision?.revision_number ?? '—'}
                  </td>
                  <td className="px-3 py-3">
                    <DrawingStatusBadge status={drawing.current_revision?.status ?? null} />
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500">
                    {new Date(drawing.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Members */}
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
