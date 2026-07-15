// Tipos que espelham o schema criado em worlding_schema.sql.
// Usados para tipar o cliente do Supabase (createClient<Database>).

export type FileType = 'png' | 'jpg' | 'svg' | 'pdf'

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Design {
  id: string
  user_id: string
  project_id: string | null
  title: string
  description: string | null
  storage_path: string
  thumbnail_path: string | null
  file_type: FileType
  file_size: number | null
  width: number | null
  height: number | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
      }
      designs: {
        Row: Design
        Insert: Omit<Design, 'id' | 'created_at' | 'updated_at' | 'tags'> & {
          id?: string
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Design, 'id' | 'user_id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
