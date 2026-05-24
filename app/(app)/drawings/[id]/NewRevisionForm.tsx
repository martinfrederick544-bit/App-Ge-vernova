'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isValidBoxUrl } from '@/lib/validate-box-url'
import BoxLinkInput from '@/components/BoxLinkInput'

export default function NewRevisionForm({
  drawingId,
  userId,
}: {
  drawingId: string
  userId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [revisionNumber, setRevisionNumber] = useState('')
  const [boxUrl, setBoxUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isValidBoxUrl(boxUrl)) {
      setError('Lien Box invalide.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/revisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drawingId,
        revisionNumber: revisionNumber.trim(),
        boxUrl: boxUrl.trim(),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Erreur inconnue.')
      setLoading(false)
      return
    }

    setOpen(false)
    setRevisionNumber('')
    setBoxUrl('')
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <div className="card border-orange-200 bg-orange-50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-orange-800 font-medium">
            Cette révision a été retournée. Vous pouvez soumettre une correction.
          </p>
          <button onClick={() => setOpen(true)} className="btn-primary shrink-0 ml-4">
            Nouvelle révision
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card border-orange-200 bg-orange-50">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Soumettre une nouvelle révision</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Numéro de révision *</label>
          <input
            type="text"
            value={revisionNumber}
            onChange={(e) => setRevisionNumber(e.target.value)}
            className="form-input mt-1 font-mono w-28"
            placeholder="B"
            required
          />
        </div>
        <div>
          <label className="form-label">Lien Box (PDF corrigé) *</label>
          <div className="mt-1">
            <BoxLinkInput value={boxUrl} onChange={setBoxUrl} required />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Envoi…' : 'Soumettre'}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null) }}
            className="btn-secondary"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
