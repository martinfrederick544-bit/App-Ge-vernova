import { createServiceClient } from '@/lib/supabase/server'

interface AuditParams {
  userId: string
  action: string
  drawingId?: string
  revisionId?: string
  metadata?: Record<string, unknown>
}

export async function logAudit(params: AuditParams): Promise<void> {
  const supabase = createServiceClient()

  await supabase.from('audit_log').insert({
    user_id: params.userId,
    action: params.action,
    drawing_id: params.drawingId ?? null,
    revision_id: params.revisionId ?? null,
    metadata: params.metadata ?? null,
  })
}
