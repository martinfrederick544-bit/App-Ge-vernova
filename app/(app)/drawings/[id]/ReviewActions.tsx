'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isValidBoxUrl } from '@/lib/validate-box-url'
import BoxLinkInput from '@/components/BoxLinkInput'

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
  const [reviewBoxUrl, setReviewBoxUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAction(action: 'approve' | 'return') {
    if (action === 'return' && !comment.trim()) {
      setError('Un commentaire est obligatoire pour retourner une révision.')
      return
    }

    if (action === 'return' && !reviewBoxUrl.trim()) {
      setError('Le lien Box du PDF annoté est obligatoire pour retourner une révision.')
      return
    }

    if (action === 'return' && !isValidBoxUrl(reviewBoxUrl.trim())) {
      setError('Le lien Box est invalide. Il doit commencer par https://gevernova.box.com/, https://gehealthcare.box.com/ ou https://app.box.com/')
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
        reviewBoxUrl: action === 'return' ? reviewBoxUrl.trim() : null,
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
        <div className="space-y-4">
          <div>
            <label className="form-label">
              Lien Box — PDF annoté avec commentaires <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <BoxLinkInput
                id="review_box_url"
                value={reviewBoxUrl}
                onChange={setReviewBoxUrl}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Partagez le PDF du dessin avec vos annotations directement dans Box.
            </p>
          </div>
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
              onClick={() => { setMode('idle'); setComment(''); setReviewBoxUrl(''); setError(null) }}
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
