'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewProjectForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({ name, description: description || null, created_by: userId })
      .select()
      .single()

    if (projectError || !project) {
      setError('Erreur lors de la création du projet.')
      setLoading(false)
      return
    }

    // Add creator as member
    await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: userId,
    })

    setOpen(false)
    setName('')
    setDescription('')
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nouveau projet
      </button>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouveau projet</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Nom du projet *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input mt-1"
            placeholder="ex: Turbine GEV-2024"
            required
          />
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input mt-1"
            rows={2}
            placeholder="Description optionnelle"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Création…' : 'Créer'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
