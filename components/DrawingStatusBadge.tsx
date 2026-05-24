import clsx from 'clsx'
import type { RevisionStatus } from '@/types/database'

const STATUS_CONFIG: Record<
  RevisionStatus,
  { label: string; classes: string }
> = {
  pending_review: {
    label: 'En attente',
    classes: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  },
  approved: {
    label: 'Approuvé',
    classes: 'bg-green-50 text-green-700 ring-green-600/20',
  },
  returned: {
    label: 'Retourné',
    classes: 'bg-red-50 text-red-700 ring-red-600/10',
  },
}

export default function DrawingStatusBadge({
  status,
  size = 'sm',
}: {
  status: RevisionStatus | null
  size?: 'sm' | 'md'
}) {
  if (!status) {
    return (
      <span
        className={clsx(
          'inline-flex items-center rounded-full ring-1 ring-inset font-medium',
          'bg-gray-50 text-gray-600 ring-gray-500/10',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        )}
      >
        Aucune révision
      </span>
    )
  }

  const config = STATUS_CONFIG[status]

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full ring-1 ring-inset font-medium',
        config.classes,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  )
}
