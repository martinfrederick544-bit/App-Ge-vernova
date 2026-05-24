import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import NewProjectForm from './NewProjectForm'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id)

  const projectIds = (memberships ?? []).map((m) => m.project_id)

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .in('id', projectIds.length > 0 ? projectIds : [''])
    .eq('archived', false)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mes projets</h1>
      </div>

      <NewProjectForm userId={user.id} />

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Projets</h2>
        {!projects || projects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Vous n&apos;êtes membre d&apos;aucun projet.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-900">{project.name}</p>
                  {project.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-400 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
