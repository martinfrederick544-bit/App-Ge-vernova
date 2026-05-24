export type UserRole = 'drafter' | 'engineer' | 'project_manager'
export type RevisionStatus = 'pending_review' | 'approved' | 'returned'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  email: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  archived: boolean
}

export interface ProjectMember {
  project_id: string
  user_id: string
  added_at: string
}

export interface Drawing {
  id: string
  project_id: string
  drawing_number: string
  title: string
  created_by: string
  created_at: string
  current_revision_id: string | null
  checklist_box_url: string | null
}

export interface Revision {
  id: string
  drawing_id: string
  revision_number: string
  box_url: string
  uploaded_by: string
  uploaded_at: string
  status: RevisionStatus
  reviewed_by: string | null
  reviewed_at: string | null
  review_comment: string | null
  review_box_url: string | null
}

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  drawing_id: string | null
  read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  drawing_id: string | null
  revision_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// Extended types with joins
export interface DrawingWithDetails extends Drawing {
  current_revision: Revision | null
  project: Pick<Project, 'id' | 'name'>
}

export interface RevisionWithDetails extends Revision {
  drawing: DrawingWithDetails
  uploaded_by_profile: Pick<Profile, 'id' | 'full_name' | 'email'>
  reviewed_by_profile: Pick<Profile, 'id' | 'full_name'> | null
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at'>>
      }
      project_members: {
        Row: ProjectMember
        Insert: Omit<ProjectMember, 'added_at'>
        Update: never
      }
      drawings: {
        Row: Drawing
        Insert: Omit<Drawing, 'id' | 'created_at'>
        Update: Partial<Omit<Drawing, 'id' | 'created_at'>>
      }
      revisions: {
        Row: Revision
        Insert: Omit<Revision, 'id' | 'uploaded_at'>
        Update: Partial<Omit<Revision, 'id' | 'uploaded_at' | 'drawing_id'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Pick<Notification, 'read'>>
      }
      audit_log: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
      }
    }
    Enums: {
      user_role: UserRole
      revision_status: RevisionStatus
    }
  }
}
