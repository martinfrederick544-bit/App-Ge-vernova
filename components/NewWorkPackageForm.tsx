'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewWorkPackageForm({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non authentifié.'); setLoading(false); return }

    const { error: insertError } = await supabase
      .from('work_packages')
      .insert({ project_id: projectId, name: name.trim(), created_by: user.id })

    if (insertError) {
      setError('Erreur lors de la création du work package.')
      setLoading(false)
      return
    }

    setOpen(false)
    setName('')
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gev-600 hover:text-gev-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nouveau work package
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value.toUpperCase())}
        className="form-input text-sm py-1.5 uppercase"
        placeholder="ex. MKB28"
        autoFocus
        required
      />
      <button type="submit" disabled={loading} className="btn-primary py-1.5 text-sm">
        {loading ? '…' : 'Créer'}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setError(null) }}
        className="btn-secondary py-1.5 text-sm"
      >
        Annuler
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}
