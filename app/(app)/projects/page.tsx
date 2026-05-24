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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Drafters: only their member projects. Engineers & PMs: all projects.
  let projects: any[] = []

  if (profile?.role === 'drafter') {
    const { data: memberships } = await supabase
      .from('project_members')
      .select('project_id, projects(*)')
      .eq('user_id', user.id)
    projects = (memberships ?? []).map((m: any) => m.projects).filter(Boolean)
  } else {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: false })
    projects = data ?? []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
      </div>

      {/* Only drafters can create projects */}
      {profile?.role === 'drafter' && <NewProjectForm userId={user.id} />}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {profile?.role === 'drafter' ? 'Mes projets' : 'Tous les projets'}
        </h2>
        {!projects || projects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {profile?.role === 'drafter'
              ? "Vous n'êtes membre d'aucun projet."
              : 'Aucun projet actif.'}
          </p>
        ) : (
          <div className="space-y-2">
            {projects.map((project: any) => (
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
