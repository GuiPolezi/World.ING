import { supabase } from '@/lib/supabase'
import type { Project } from '@/types/database'

export async function createProject(userId: string, name: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: userId, name: name.trim() })
    .select()
    .single()
  if (error) throw error
  return data
}

// Remove o projeto. Os designs não são apagados: project_id vira null
// (ON DELETE SET NULL no schema), então eles caem em "Sem projeto".
export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) throw error
}
