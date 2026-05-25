'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isValidBoxUrl } from '@/lib/validate-box-url'
import BoxLinkInput from '@/components/BoxLinkInput'
import PdfUpload from '@/components/PdfUpload'
import Link from 'next/link'
import type { Project, WorkPackage } from '@/types/database'

const REVISIONS = ['-', 'A', 'B', 'C', 'D', 'E', 'F', 'G']

export default function EditDrawingPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState('')
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([])
  const [workPackageId, setWorkPackageId] = useState('')
  const [newWpName, setNewWpName] = useState('')
  const [creatingWp, setCreatingWp] = useState(false)
  const [drawingNumber, setDrawingNumber] = useState('')
  const [revisionNumber, setRevisionNumber] = useState('-')
  const [boxUrl, setBoxUrl] = useState('')
  const [checklistUrl, setChecklistUrl] = useState<string | null>(null)
  const [checklistFile, setChecklistFile] = useState<File | null>(null)
  const [revisionId, setRevisionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadWorkPackages(pid: string) {
    if (!pid) { setWorkPackages([]); return }
    const { data } = await supabase
      .from('work_packages')
      .select('*')
      .eq('project_id', pid)
      .order('created_at', { ascending: true })
    setWorkPackages(data ?? [])
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load projects (member projects for drafter)
      const { data: memberships } = await supabase
        .from('project_members')
        .select('project_id, projects(*)')
        .eq('user_id', user.id)
      setProjects((memberships ?? []).map((m: any) => m.projects).filter(Boolean))

      // Load drawing + current revision
      const { data: drawing } = await supabase
        .from('drawings')
        .select('*, current_revision:revisions!drawings_current_revision_id_fkey(*)')
        .eq('id', id)
        .single()

      if (!drawing) return
      setProjectId(drawing.project_id)
      setDrawingNumber(drawing.drawing_number)
      setChecklistUrl(drawing.checklist_url ?? null)
      setWorkPackageId(drawing.work_package_id ?? '')

      await loadWorkPackages(drawing.project_id)

      const rev = (drawing as any).current_revision
      if (rev) {
        setRevisionId(rev.id)
        setRevisionNumber(rev.revision_number)
        setBoxUrl(rev.box_url)
      }
      setLoadingData(false)
    }
    load()
  }, [id])

  async function handleProjectChange(pid: string) {
    setProjectId(pid)
    setWorkPackageId('')
    await loadWorkPackages(pid)
  }

  async function handleCreateWp() {
    if (!newWpName.trim() || !projectId) return
    setCreatingWp(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreatingWp(false); return }

    const { data: wp, error: wpErr } = await supabase
      .from('work_packages')
      .insert({ project_id: projectId, name: newWpName.trim(), created_by: user.id })
      .select()
      .single()

    if (!wpErr && wp) {
      setWorkPackages((prev) => [...prev, wp])
      setWorkPackageId(wp.id)
      setNewWpName('')
    }
    setCreatingWp(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isValidBoxUrl(boxUrl)) {
      setError('Le lien Box est invalide.')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non authentifié.'); setLoading(false); return }

    // Upload new checklist if provided
    let newChecklistUrl = checklistUrl
    if (checklistFile) {
      const fileName = `${user.id}/${Date.now()}_${checklistFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('checklists')
        .upload(fileName, checklistFile, { contentType: 'application/pdf' })
      if (uploadError || !uploadData) {
        setError("Erreur lors de l'envoi de la checklist.")
        setLoading(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('checklists').getPublicUrl(uploadData.path)
      newChecklistUrl = publicUrl
    }

    // Update drawing
    const { error: drawingError } = await supabase
      .from('drawings')
      .update({
        drawing_number: drawingNumber.trim(),
        title: drawingNumber.trim(),
        project_id: projectId,
        work_package_id: workPackageId || null,
        checklist_url: newChecklistUrl,
      })
      .eq('id', id)

    if (drawingError) { setError("Erreur lors de la mise à jour du dessin."); setLoading(false); return }

    // Update revision via API
    if (revisionId) {
      const res = await fetch(`/api/revisions/${revisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionNumber: revisionNumber.trim(), boxUrl: boxUrl.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erreur lors de la mise à jour de la révision.')
        setLoading(false)
        return
      }
    }

    router.push(`/drawings/${id}`)
  }

  if (loadingData) {
    return <div className="flex items-center justify-center h-48 text-gray-400">Chargement…</div>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/drawings/${id}`} className="hover:text-gray-700">← Retour au dessin</Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Modifier le dessin</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project */}
          <div>
            <label className="form-label">Projet *</label>
            <select
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="form-input mt-1"
              required
            >
              <option value="">— Sélectionner —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Work package */}
          {projectId && (
            <div>
              <label className="form-label">Work package</label>
              <select
                value={workPackageId}
                onChange={(e) => setWorkPackageId(e.target.value)}
                className="form-input mt-1"
              >
                <option value="">— Aucun —</option>
                {workPackages.map((wp) => (
                  <option key={wp.id} value={wp.id}>{wp.name}</option>
                ))}
              </select>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={newWpName}
                  onChange={(e) => setNewWpName(e.target.value.toUpperCase())}
                  className="form-input text-sm py-1.5 flex-1 uppercase"
                  placeholder="Ou créer un nouveau : ex. MKB28"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateWp() } }}
                />
                <button
                  type="button"
                  onClick={handleCreateWp}
                  disabled={!newWpName.trim() || creatingWp}
                  className="btn-secondary py-1.5 text-sm shrink-0"
                >
                  {creatingWp ? '…' : 'Créer WP'}
                </button>
              </div>
            </div>
          )}

          {/* Drawing number */}
          <div>
            <label className="form-label">Numéro de dessin *</label>
            <input
              type="text"
              value={drawingNumber}
              onChange={(e) => setDrawingNumber(e.target.value.toUpperCase())}
              className="form-input mt-1 font-mono"
              placeholder="ex. 25881000MKB29-216FTB"
              required
            />
          </div>

          {/* Revision */}
          <div>
            <label className="form-label">Révision *</label>
            <select
              value={revisionNumber}
              onChange={(e) => setRevisionNumber(e.target.value)}
              className="form-input mt-1 font-mono w-28"
              required
            >
              {REVISIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Box URL */}
          <div>
            <label className="form-label">Lien Box — Dessin (PDF) *</label>
            <div className="mt-1">
              <BoxLinkInput value={boxUrl} onChange={setBoxUrl} required />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="form-label">Checklist de vérification (PDF)</label>
            {checklistUrl && !checklistFile && (
              <div className="mt-1 mb-2 flex items-center gap-2">
                <a
                  href={checklistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gev-500 hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Checklist actuelle
                </a>
                <span className="text-gray-400 text-xs">(remplacer ci-dessous)</span>
              </div>
            )}
            <div className="mt-1">
              <PdfUpload value={checklistFile} onChange={setChecklistFile} />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
            <Link href={`/drawings/${id}`} className="btn-secondary">Annuler</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
