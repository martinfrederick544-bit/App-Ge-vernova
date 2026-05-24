'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DrafterRevisionActions({
  revisionId,
  drawingId,
  mode,
}: {
  revisionId: string
  drawingId: string
  /** 'submit' = draft ready to send | 'retract' = sent but not yet reviewed */
  mode: 'submit' | 'retract'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<'submit' | 'retract' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSubmit() {
    setLoading('submit')
    setError(null)
    const res = await fetch('/api/revisions/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionId, drawingId }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erreur inconnue.'); setLoading(null); return }
    router.refresh()
  }

  async function handleRetract() {
    setLoading('retract')
    setError(null)
    const res = await fetch('/api/revisions/retract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionId, drawingId }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erreur inconnue.'); setLoading(null); return }
    router.refresh()
  }

  async function handleDelete() {
    setLoading('delete')
    setError(null)
    const res = await fetch(`/api/drawings/${drawingId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erreur inconnue.'); setLoading(null); return }
    router.push('/')
  }

  return (
    <div className="space-y-3">
      {/* Submit banner */}
      {mode === 'submit' && (
        <div className="card border-gev-200 bg-gev-50">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-gev-700">Dessin prêt à être envoyé ?</p>
              <p className="text-sm text-gev-600 mt-0.5">L&apos;ingénieur sera notifié dès l&apos;envoi.</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading !== null}
              className="btn-primary shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {loading === 'submit' ? 'Envoi…' : "Envoyer à l'ingénieur"}
            </button>
          </div>
        </div>
      )}

      {/* Modifier / Supprimer */}
      <div className="flex items-center gap-2 justify-end flex-wrap">
        {error && <p className="text-sm text-red-600 w-full text-right">{error}</p>}

        {/* Modifier = retract back to draft */}
        {mode === 'retract' && (
          <button
            onClick={handleRetract}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {loading === 'retract' ? 'Modification…' : 'Modifier'}
          </button>
        )}

        {/* Supprimer */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-700 font-medium">Confirmer la suppression ?</span>
            <button
              onClick={handleDelete}
              disabled={loading !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading === 'delete' ? 'Suppression…' : 'Oui, supprimer'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Non
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
