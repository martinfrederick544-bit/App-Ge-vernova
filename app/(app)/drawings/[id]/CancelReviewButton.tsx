'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelReviewButton({
  revisionId,
  drawingId,
}: {
  revisionId: string
  drawingId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/revisions/cancel-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionId, drawingId }),
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
    <div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <button
        onClick={handleCancel}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {loading ? 'Annulation…' : 'Annuler / Modifier ma révision'}
      </button>
    </div>
  )
}
