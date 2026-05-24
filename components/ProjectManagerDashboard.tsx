import Link from 'next/link'
import type { Project, Drawing } from '@/types/database'

export default function ProjectManagerDashboard({
  projects,
  drawingStats,
}: {
  projects: Project[]
  drawingStats: Pick<Drawing, 'project_id' | 'current_revision_id'>[]
}) {
  function getStats(projectId: string) {
    const drawings = drawingStats.filter((d) => d.project_id === projectId)
    return { total: drawings.length }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vue d&apos;ensemble</h1>
        <Link href="/projects" className="btn-secondary">
          Gérer les projets
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gev-500">{projects.length}</p>
          <p className="text-sm text-gray-500 mt-1">Projets actifs</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{drawingStats.length}</p>
          <p className="text-sm text-gray-500 mt-1">Dessins total</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-600">
            {drawingStats.filter((d) => d.current_revision_id !== null).length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Avec révision</p>
        </div>
      </div>

      {/* Projects list */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tous les projets</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucun projet actif.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => {
              const stats = getStats(project.id)
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    {project.description && (
                      <p className="text-sm text-gray-500 truncate max-w-md">{project.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="text-sm text-gray-500">{stats.total} dessin{stats.total !== 1 ? 's' : ''}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
