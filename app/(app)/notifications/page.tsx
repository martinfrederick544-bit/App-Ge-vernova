import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MarkReadButtons from './MarkReadButtons'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

const TYPE_ICONS: Record<string, string> = {
  new_revision: '📄',
  approved: '✅',
  returned: '↩️',
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const unread = (notifications ?? []).filter((n) => !n.read)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Notifications
          {unread.length > 0 && (
            <span className="ml-2 text-base font-normal text-gray-500">
              ({unread.length} non lue{unread.length > 1 ? 's' : ''})
            </span>
          )}
        </h1>
        {unread.length > 0 && <MarkReadButtons userId={user.id} />}
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-500">Aucune notification pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden divide-y divide-gray-100">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 px-4 py-4 ${notif.read ? '' : 'bg-gev-50'}`}
            >
              <span className="text-xl shrink-0 mt-0.5">
                {TYPE_ICONS[notif.type] ?? '🔔'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${notif.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                  {notif.message}
                </p>
                {notif.drawing_id && (
                  <Link
                    href={`/drawings/${notif.drawing_id}`}
                    className="text-xs text-gev-500 hover:underline mt-0.5 inline-block"
                  >
                    Voir le dessin →
                  </Link>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-gray-400">{timeAgo(notif.created_at)}</p>
                {!notif.read && (
                  <span className="inline-block w-2 h-2 rounded-full bg-gev-500 mt-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
