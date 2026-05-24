import Link from 'next/link'
import DrawingStatusBadge from './DrawingStatusBadge'
import type { Revision, Drawing, Project, Profile } from '@/types/database'

type PendingRevision = Revision & {
  drawing: Drawing & { project: Pick<Project, 'id' | 'name'> | null }
  uploaded_by_profile: Pick<Profile, 'id' | 'full_name'> | null
}

type RecentRevision = Revision & {
  drawing: Drawing & { project: Pick<Project, 'id' | 'name'> | null }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function EngineerDashboard({
  pending,
  recent,
}: {
  pending: PendingRevision[]
  recent: RecentRevision[]
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>

      {/* Queue */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            File de révisions à examiner
          </h2>
          {pending.length > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-10">
            <svg className="mx-auto w-10 h-10 text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">Aucune révision en attente. Tout est à jour !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((rev) => (
              <Link
                key={rev.id}
                href={`/drawings/${rev.drawing_id}`}
                className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 hover:bg-yellow-100 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {rev.drawing?.drawing_number}
                    </span>
                    <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded px-1.5 py-0.5">
                      Rév. {rev.revision_number}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{rev.drawing?.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {rev.drawing?.project?.name} · Soumis par {rev.uploaded_by_profile?.full_name} le {formatDate(rev.uploaded_at)}
                  </p>
                </div>
                <svg className="w-4 h-4 text-yellow-500 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent */}
      {recent.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Récemment traité</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dessin</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rév.</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recent.map((rev) => (
                <tr key={rev.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <Link href={`/drawings/${rev.drawing_id}`} className="text-gev-500 hover:underline font-mono text-sm font-medium">
                      {rev.drawing?.drawing_number}
                    </Link>
                    <p className="text-xs text-gray-400">{rev.drawing?.title}</p>
                  </td>
                  <td className="px-3 py-3 font-mono text-sm">{rev.revision_number}</td>
                  <td className="px-3 py-3">
                    <DrawingStatusBadge status={rev.status} />
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500">
                    {rev.reviewed_at ? formatDate(rev.reviewed_at) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
