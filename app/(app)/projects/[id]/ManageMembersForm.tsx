'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

const ROLE_LABELS: Record<string, string> = {
  drafter: 'Dessinateur',
  engineer: 'Ingénieur',
  project_manager: 'Chef de Projet',
}

export default function ManageMembersForm({
  projectId,
  members,
  currentUserId,
}: {
  projectId: string
  members: Pick<Profile, 'id' | 'full_name' | 'email' | 'role'>[]
  currentUserId: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const supabase = createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (!profile) {
      setError('Aucun utilisateur trouvé avec cet email.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: profile.id })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Cet utilisateur est déjà membre du projet.')
      } else {
        setError("Erreur lors de l'ajout.")
      }
      setLoading(false)
      return
    }

    setSuccess(`${profile.full_name} ajouté(e) au projet.`)
    setEmail('')
    setLoading(false)
    router.refresh()
  }

  async function handleRemove(userId: string) {
    if (userId === currentUserId) return
    const supabase = createClient()
    await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)
    router.refresh()
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Membres du projet</h2>

      <div className="space-y-2 mb-6">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5"
          >
            <div>
              <span className="text-sm font-medium text-gray-900">{member.full_name}</span>
              <span className="text-xs text-gray-400 ml-2">{member.email}</span>
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                {ROLE_LABELS[member.role] ?? member.role}
              </span>
            </div>
            {member.id !== currentUserId && (
              <button
                onClick={() => handleRemove(member.id)}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Retirer
              </button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email du membre à ajouter"
          className="form-input flex-1"
          required
        />
        <button type="submit" disabled={loading} className="btn-primary shrink-0">
          {loading ? 'Ajout…' : 'Ajouter'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
    </div>
  )
}
