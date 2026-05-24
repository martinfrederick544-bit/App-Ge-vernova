'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MarkReadButtons({ userId }: { userId: string }) {
  const router = useRouter()

  async function markAllRead() {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    router.refresh()
  }

  return (
    <button onClick={markAllRead} className="btn-secondary text-sm">
      Tout marquer comme lu
    </button>
  )
}
