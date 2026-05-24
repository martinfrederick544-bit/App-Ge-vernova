'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewActions({
  revisionId,
  drawingId,
  reviewerId,
}: {
  revisionId: string
  drawingId: string
  reviewerId: string
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'returning'>('idle')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAction(action: 'approve' | 'return') {
    if (action === 'return' && !comment.trim()) {
      setError('Un commentaire est obligatoire pour retourner une révision.')
      return
    }

    setError(null)
    setLoading(true)

    const res = await fetch('/api/revisions/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        revisionId,
        drawingId,
        action,
        comment: comment.trim() || null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erreur inconnue.')
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="card border-yellow-200 bg-yellow-50">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Examiner cette révision
      </h2>

      {mode === 'returning' ? (
        <div className="space-y-3">
          <div>
            <label className="form-label">
              Commentaire de retour <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="form-input mt-1"
              rows={3}
              placeholder="Décrivez les corrections nécessaires…"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => handleAction('return')}
              disabled={loading}
              className="btn-danger"
            >
              {loading ? 'Envoi…' : 'Confirmer le retour'}
            </button>
            <button
              onClick={() => { setMode('idle'); setComment(''); setError(null) }}
              className="btn-secondary"
              disabled={loading}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 flex-wrap">
          {error && <p className="w-full text-sm text-red-600">{error}</p>}
          <button
            onClick={() => handleAction('approve')}
            disabled={loading}
            className="btn-success"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {loading ? 'Traitement…' : 'Approuver'}
          </button>
          <button
            onClick={() => setMode('returning')}
            disabled={loading}
            className="btn-danger"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Retourner avec commentaires
          </button>
        </div>
      )}
    </div>
  )
}
