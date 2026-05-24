import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DrawingStatusBadge from '@/components/DrawingStatusBadge'
import ReviewActions from './ReviewActions'
import NewRevisionForm from './NewRevisionForm'
import type { Profile, Drawing, Revision, Project } from '@/types/database'

type DrawingWithProject = Drawing & { project: Pick<Project, 'id' | 'name'> | null }
type RevisionWithProfiles = Revision & {
  uploaded_by_profile: Pick<Profile, 'id' | 'full_name'> | null
  reviewed_by_profile: Pick<Profile, 'id' | 'full_name'> | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function DrawingPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profileData) redirect('/login')
  const profile = profileData as Profile

  const { data: drawingData } = await supabase
    .from('drawings')
    .select(`*, project:projects(id, name)`)
    .eq('id', params.id)
    .single()

  if (!drawingData) notFound()
  const drawing = drawingData as DrawingWithProject

  const { data: revisionsData } = await supabase
    .from('revisions')
    .select(`
      *,
      uploaded_by_profile:profiles!revisions_uploaded_by_fkey(id, full_name),
      reviewed_by_profile:profiles!revisions_reviewed_by_fkey(id, full_name)
    `)
    .eq('drawing_id', params.id)
    .order('uploaded_at', { ascending: false })

  const revisions = (revisionsData ?? []) as RevisionWithProfiles[]
  const latestRevision = revisions[0] ?? null
  const canReview =
    profile.role === 'engineer' && latestRevision?.status === 'pending_review'
  const canSubmitNewRevision =
    profile.role === 'drafter' &&
    drawing.created_by === user.id &&
    latestRevision?.status === 'returned'

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <Link href="/projects" className="hover:text-gray-700">Projets</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/projects/${drawing.project?.id}`} className="hover:text-gray-700">
          {drawing.project?.name}
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-mono font-medium">{drawing.drawing_number}</span>
      </div>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 font-mono">{drawing.drawing_number}</h1>
              {latestRevision && (
                <span className="text-sm font-medium text-gray-500 bg-gray-100 rounded px-2 py-0.5 font-mono">
                  Rév. {latestRevision.revision_number}
                </span>
              )}
            </div>
            <p className="text-lg text-gray-700 mt-1">{drawing.title}</p>
            <p className="text-sm text-gray-400 mt-1">Projet : {drawing.project?.name}</p>
          </div>
          <DrawingStatusBadge status={latestRevision?.status ?? null} size="md" />
        </div>
      </div>

      {/* Latest revision returned — highlight comment */}
      {latestRevision?.status === 'returned' && latestRevision.review_comment && (
        <div className="rounded-lg bg-red-50 border-l-4 border-red-500 p-5">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <p className="font-semibold text-red-800">
              Révision retournée par {latestRevision.reviewed_by_profile?.full_name ?? 'un ingénieur'}
            </p>
          </div>
          <p className="text-red-900 mt-1">{latestRevision.review_comment}</p>
          <p className="text-xs text-red-500 mt-2">
            {latestRevision.reviewed_at ? formatDate(latestRevision.reviewed_at) : ''}
          </p>
        </div>
      )}

      {/* Review actions for engineer */}
      {canReview && latestRevision && (
        <ReviewActions
          revisionId={latestRevision.id}
          drawingId={params.id}
          reviewerId={user.id}
        />
      )}

      {/* New revision form for drafter */}
      {canSubmitNewRevision && (
        <NewRevisionForm drawingId={params.id} userId={user.id} />
      )}

      {/* Revision history */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des révisions</h2>
        {!revisions || revisions.length === 0 ? (
          <p className="text-gray-500 text-center py-6">Aucune révision.</p>
        ) : (
          <div className="space-y-4">
            {revisions.map((rev, idx) => (
              <div
                key={rev.id}
                className={`rounded-lg border p-4 ${idx === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-gray-900">
                        Révision {rev.revision_number}
                      </span>
                      {idx === 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 font-medium">
                          Dernière
                        </span>
                      )}
                      <DrawingStatusBadge status={rev.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Soumis par <span className="font-medium text-gray-700">{rev.uploaded_by_profile?.full_name ?? '—'}</span>
                      {' · '}
                      {formatDate(rev.uploaded_at)}
                    </p>
                    {rev.reviewed_by && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        Examiné par <span className="font-medium text-gray-700">{rev.reviewed_by_profile?.full_name ?? '—'}</span>
                        {rev.reviewed_at && ` · ${formatDate(rev.reviewed_at)}`}
                      </p>
                    )}
                    {rev.review_comment && (
                      <div className="mt-2 rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                        <span className="font-medium">Commentaire :</span> {rev.review_comment}
                      </div>
                    )}
                  </div>
                  <a
                    href={rev.box_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary shrink-0 text-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ouvrir dans Box
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
