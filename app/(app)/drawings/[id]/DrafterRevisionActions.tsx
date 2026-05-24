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
  mode: 'submit' | 'retract'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAction() {
    setLoading(true)
    setError(null)

    const endpoint = mode === 'submit'
      ? '/api/revisions/submit'
      : '/api/revisions/retract'

    const res = await fetch(endpoint, {
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

  if (mode === 'submit') {
    return (
      <div className="card border-gev-200 bg-gev-50">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-gev-700">Dessin prêt à être envoyé ?</p>
            <p className="text-sm text-gev-600 mt-0.5">
              L&apos;ingénieur sera notifié dès l&apos;envoi.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={handleAction}
              disabled={loading}
              className="btn-primary"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {loading ? 'Envoi…' : 'Envoyer à l\'ingénieur'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleAction}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        {loading ? 'Annulation…' : 'Annuler l\'envoi'}
      </button>
    </div>
  )
}
