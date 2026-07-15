// Tipos que espelham o schema (db/schema.sql).
// Project e Design são `type` (não `interface`) de propósito: interfaces não
// são atribuíveis a Record<string, unknown>, o que faz o supabase-js inferir
// os tipos como `never`.

export type FileType = 'png' | 'jpg' | 'svg' | 'pdf'

export type Project = {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type Design = {
  id: string
  user_id: string
  project_id: string | null
  title: string
  description: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export type DesignScreen = {
  id: string
  design_id: string
  user_id: string
  storage_path: string
  thumbnail_path: string | null
  file_type: FileType
  file_size: number | null
  width: number | null
  height: number | null
  position: number
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      designs: {
        Row: Design
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title: string
          description?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Design, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      design_screens: {
        Row: DesignScreen
        Insert: {
          id?: string
          design_id: string
          user_id: string
          storage_path: string
          thumbnail_path?: string | null
          file_type: FileType
          file_size?: number | null
          width?: number | null
          height?: number | null
          position?: number
          created_at?: string
        }
        Update: Partial<Omit<DesignScreen, 'id' | 'user_id' | 'design_id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
