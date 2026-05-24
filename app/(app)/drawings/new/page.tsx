'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isValidBoxUrl } from '@/lib/validate-box-url'
import BoxLinkInput from '@/components/BoxLinkInput'
import Link from 'next/link'
import type { Project } from '@/types/database'

export default function NewDrawingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultProject = searchParams.get('project') ?? ''

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState(defaultProject)
  const [drawingNumber, setDrawingNumber] = useState('')
  const [title, setTitle] = useState('')
  const [boxUrl, setBoxUrl] = useState('')
  const [checklistBoxUrl, setChecklistBoxUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProjects() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('project_members')
        .select('project_id, projects(*)')
        .eq('user_id', user.id)

      setProjects((data ?? []).map((m: any) => m.projects).filter(Boolean))
    }
    loadProjects()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isValidBoxUrl(boxUrl)) {
      setError('Le lien Box du dessin est invalide. Il doit commencer par https://gehealthcare.box.com/ ou https://app.box.com/')
      return
    }

    if (!isValidBoxUrl(checklistBoxUrl)) {
      setError('Le lien Box de la checklist est invalide. Il doit commencer par https://gehealthcare.box.com/ ou https://app.box.com/')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non authentifié.'); setLoading(false); return }

    // Create drawing with checklist
    const { data: drawing, error: drawingError } = await supabase
      .from('drawings')
      .insert({
        project_id: projectId,
        drawing_number: drawingNumber.trim(),
        title: title.trim(),
        created_by: user.id,
        current_revision_id: null,
        checklist_box_url: checklistBoxUrl.trim(),
      })
      .select()
      .single()

    if (drawingError || !drawing) {
      setError("Erreur lors de la création du dessin.")
      setLoading(false)
      return
    }

    // Create initial revision at version "-" (émission initiale)
    const { data: revision, error: revError } = await supabase
      .from('revisions')
      .insert({
        drawing_id: drawing.id,
        revision_number: '-',
        box_url: boxUrl.trim(),
        uploaded_by: user.id,
        status: 'pending_review',
      })
      .select()
      .single()

    if (revError || !revision) {
      setError("Erreur lors de la création de la révision.")
      setLoading(false)
      return
    }

    // Update drawing's current revision
    await supabase
      .from('drawings')
      .update({ current_revision_id: revision.id })
      .eq('id', drawing.id)

    router.push(`/drawings/${drawing.id}`)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">Tableau de bord</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">Nouveau dessin</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Nouveau dessin</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project */}
          <div>
            <label className="form-label">Projet *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="form-input mt-1"
              required
            >
              <option value="">— Sélectionner un projet —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Drawing number */}
          <div>
            <label className="form-label">Numéro de dessin *</label>
            <input
              type="text"
              value={drawingNumber}
              onChange={(e) => setDrawingNumber(e.target.value)}
              className="form-input mt-1 font-mono"
              placeholder="ex: GEV-2024-001"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="form-label">Titre *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input mt-1"
              placeholder="ex: Vue de face — Turbine T12"
              required
            />
          </div>

          {/* Initial revision — locked to "-" (émission initiale) */}
          <div>
            <label className="form-label">Version</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="text"
                value="—"
                disabled
                className="form-input font-mono w-20 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500">
                Émission initiale — la version &ldquo;—&rdquo; est attribuée automatiquement.
              </p>
            </div>
          </div>

          {/* Box URL */}
          <div>
            <label className="form-label">Lien Box — Dessin (PDF) *</label>
            <div className="mt-1">
              <BoxLinkInput value={boxUrl} onChange={setBoxUrl} required />
            </div>
          </div>

          {/* Checklist PDF */}
          <div>
            <label className="form-label">
              Lien Box — Checklist de vérification (PDF) *
            </label>
            <div className="mt-1">
              <BoxLinkInput
                id="checklist_box_url"
                value={checklistBoxUrl}
                onChange={setChecklistBoxUrl}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Checklist de vérification complétée pour l&apos;émission initiale de ce dessin.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Création…' : 'Créer le dessin'}
            </button>
            <Link href="/" className="btn-secondary">Annuler</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
