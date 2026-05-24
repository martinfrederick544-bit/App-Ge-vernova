import Link from 'next/link'
import DrawingStatusBadge from './DrawingStatusBadge'
import type { Drawing, Revision, Project } from '@/types/database'

type DrawingWithDetails = Drawing & {
  project: Pick<Project, 'id' | 'name'> | null
  current_revision: Revision | null
}

export default function DrafterDashboard({
  drawings,
}: {
  drawings: DrawingWithDetails[]
}) {
  const drafts = drawings.filter((d) => d.current_revision?.status === 'draft')
  const returned = drawings.filter((d) => d.current_revision?.status === 'returned')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <Link href="/drawings/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau dessin
        </Link>
      </div>

      {/* Draft drawings — not yet sent */}
      {drafts.length > 0 && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h2 className="font-semibold text-gray-700">
              {drafts.length} brouillon{drafts.length > 1 ? 's' : ''} — non encore envoyé{drafts.length > 1 ? 's' : ''}
            </h2>
          </div>
          <div className="space-y-2">
            {drafts.map((drawing) => (
              <Link
                key={drawing.id}
                href={`/drawings/${drawing.id}`}
                className="flex items-center justify-between rounded-md bg-white border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{drawing.drawing_number}</p>
                  <p className="text-sm text-gray-500">{drawing.project?.name ?? '—'}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Returned drawings — priority alert */}
      {returned.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="font-semibold text-red-800">
              {returned.length} dessin{returned.length > 1 ? 's' : ''} retourné{returned.length > 1 ? 's' : ''} en attente de correction
            </h2>
          </div>
          <div className="space-y-2">
            {returned.map((drawing) => (
              <Link
                key={drawing.id}
                href={`/drawings/${drawing.id}`}
                className="flex items-center justify-between rounded-md bg-white border border-red-200 px-4 py-3 hover:bg-red-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{drawing.drawing_number}</p>
                  <p className="text-sm text-gray-500">{drawing.title}</p>
                </div>
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All drawings */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mes dessins récents</h2>
        {drawings.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">Aucun dessin pour l&apos;instant.</p>
            <Link href="/drawings/new" className="btn-primary mt-4 inline-flex">
              Créer votre premier dessin
            </Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projet</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Révision</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {drawings.map((drawing) => (
                <tr key={drawing.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <Link href={`/drawings/${drawing.id}`} className="text-gev-500 hover:underline font-mono text-sm font-medium">
                      {drawing.drawing_number}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">{drawing.title}</td>
                  <td className="px-3 py-3 text-sm text-gray-500">{drawing.project?.name ?? '—'}</td>
                  <td className="px-3 py-3 text-sm font-mono text-gray-700">
                    {drawing.current_revision?.revision_number ?? '—'}
                  </td>
                  <td className="px-3 py-3">
                    <DrawingStatusBadge status={drawing.current_revision?.status ?? null} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
