'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isValidBoxUrl } from '@/lib/validate-box-url'
import BoxLinkInput from '@/components/BoxLinkInput'
import PdfUpload from '@/components/PdfUpload'
import Link from 'next/link'
import type { Project, WorkPackage } from '@/types/database'

export default function NewDrawingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultProject = searchParams.get('project') ?? ''
  const defaultWp = searchParams.get('wp') ?? ''

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState(defaultProject)
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([])
  const [workPackageId, setWorkPackageId] = useState(defaultWp)
  const [newWpName, setNewWpName] = useState('')
  const [creatingWp, setCreatingWp] = useState(false)
  const [drawingNumber, setDrawingNumber] = useState('')
  const [revisionNumber, setRevisionNumber] = useState('-')
  const [boxUrl, setBoxUrl] = useState('')
  const [checklistFile, setChecklistFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadWorkPackages(pid: string) {
    if (!pid) { setWorkPackages([]); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('work_packages')
      .select('*')
      .eq('project_id', pid)
      .order('created_at', { ascending: true })
    setWorkPackages(data ?? [])
  }

  function handleProjectChange(id: string) {
    setProjectId(id)
    setWorkPackageId('')
    const project = projects.find((p) => p.id === id)
    if (project) {
      const prefix = project.name.split(' — ')[0].trim()
      setDrawingNumber(prefix)
    } else {
      setDrawingNumber('')
    }
    loadWorkPackages(id)
  }

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Drafters see only their member projects
      const { data } = await supabase
        .from('project_members')
        .select('project_id, projects(*)')
        .eq('user_id', user.id)

      const list: Project[] = (data ?? []).map((m: any) => m.projects).filter(Boolean)
      setProjects(list)

      if (defaultProject) {
        const project = list.find((p) => p.id === defaultProject)
        if (project) {
          const prefix = project.name.split(' — ')[0].trim()
          setDrawingNumber(prefix)
        }
        await loadWorkPackages(defaultProject)
        if (defaultWp) setWorkPackageId(defaultWp)
      }
    }
    init()
  }, [])

  async function handleCreateWp() {
    if (!newWpName.trim() || !projectId) return
    setCreatingWp(true)
    const supabase = createClient()
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
      setError('Le lien Box est invalide. Il doit commencer par https://gevernova.box.com/')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Non authentifié.'); setLoading(false); return }

    // Upload checklist PDF (optional)
    let checklistPublicUrl: string | null = null
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
      checklistPublicUrl = publicUrl
    }

    // Create drawing
    const { data: drawing, error: drawingError } = await supabase
      .from('drawings')
      .insert({
        project_id: projectId,
        work_package_id: workPackageId || null,
        drawing_number: drawingNumber.trim(),
        title: drawingNumber.trim(),
        created_by: user.id,
        current_revision_id: null,
        checklist_url: checklistPublicUrl,
      })
      .select()
      .single()

    if (drawingError || !drawing) {
      setError("Erreur lors de la création du dessin.")
      setLoading(false)
      return
    }

    // Create initial revision
    const { data: revision, error: revError } = await supabase
      .from('revisions')
      .insert({
        drawing_id: drawing.id,
        revision_number: revisionNumber.trim() || '-',
        box_url: boxUrl.trim(),
        uploaded_by: user.id,
        status: 'draft',
      })
      .select()
      .single()

    if (revError || !revision) {
      setError("Erreur lors de la création de la révision.")
      setLoading(false)
      return
    }

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
              onChange={(e) => handleProjectChange(e.target.value)}
              className="form-input mt-1"
              required
            >
              <option value="">— Sélectionner un projet —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Work package */}
          {projectId && (
            <div>
              <label className="form-label">Work package *</label>
              <select
                value={workPackageId}
                onChange={(e) => setWorkPackageId(e.target.value)}
                className="form-input mt-1"
                required
              >
                <option value="">— Sélectionner un work package —</option>
                {workPackages.map((wp) => (
                  <option key={wp.id} value={wp.id}>{wp.name}</option>
                ))}
              </select>

              {/* Create new WP inline */}
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

          {/* Revision number */}
          <div>
            <label className="form-label">Révision *</label>
            <select
              value={revisionNumber}
              onChange={(e) => setRevisionNumber(e.target.value)}
              className="form-input mt-1 font-mono w-28"
              required
            >
              {['-', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map((r) => (
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

          {/* Checklist PDF (optional) */}
          <div>
            <label className="form-label">Checklist de vérification (PDF)</label>
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
              {loading ? 'Création…' : 'Créer le dessin'}
            </button>
            <Link href="/" className="btn-secondary">Annuler</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
