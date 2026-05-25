'use client'

import { useState } from 'react'
import Link from 'next/link'
import DrawingStatusBadge from './DrawingStatusBadge'
import type { Drawing, Revision, WorkPackage } from '@/types/database'

type DrawingRow = Drawing & { current_revision: Revision | null }

export default function WorkPackageAccordion({
  wp,
  drawings,
  isDrafter,
  projectId,
  defaultOpen = false,
}: {
  wp: WorkPackage | null
  drawings: DrawingRow[]
  isDrafter: boolean
  projectId: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  const newDrawingHref = wp
    ? `/drawings/new?project=${projectId}&wp=${wp.id}`
    : `/drawings/new?project=${projectId}`

  const pendingCount = drawings.filter(
    (d) => d.current_revision?.status === 'pending_review'
  ).length

  return (
    <div className="card overflow-hidden p-0">
      {/* Header — clickable to toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>

          {/* Folder icon */}
          <svg className="w-4 h-4 text-gev-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>

          <span className="font-semibold text-gray-900 truncate">
            {wp ? wp.name : <span className="italic text-gray-400 font-normal">Sans work package</span>}
          </span>

          {/* Counters */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              {drawings.length} dessin{drawings.length !== 1 ? 's' : ''}
            </span>
            {pendingCount > 0 && (
              <span className="text-xs text-yellow-700 bg-yellow-100 rounded-full px-2 py-0.5 font-medium">
                {pendingCount} en attente
              </span>
            )}
          </div>
        </div>

        {/* New drawing button (stops propagation so it doesn't toggle accordion) */}
        {isDrafter && (
          <Link
            href={newDrawingHref}
            onClick={(e) => e.stopPropagation()}
            className="ml-4 shrink-0 inline-flex items-center gap-1 text-xs font-medium text-gev-600 hover:text-gev-700 bg-gev-50 hover:bg-gev-100 rounded-md px-2.5 py-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau dessin
          </Link>
        )}
      </button>

      {/* Content */}
      {open && (
        <div className="border-t border-gray-100">
          {drawings.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-4">Aucun dessin dans ce work package.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Titre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rév.</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {drawings.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/drawings/${d.id}`} className="text-gev-500 hover:underline font-mono text-sm font-medium">
                        {d.drawing_number}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 hidden sm:table-cell truncate max-w-xs">
                      {d.title !== d.drawing_number ? d.title : ''}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-sm text-gray-700">
                      {d.current_revision?.revision_number ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <DrawingStatusBadge status={d.current_revision?.status ?? null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
