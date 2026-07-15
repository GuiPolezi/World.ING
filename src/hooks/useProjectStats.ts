import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/types/database'

export interface Totals {
  projects: number
  designs: number
  screens: number
  bytes: number
}

export interface ProjectStats {
  projects: Project[]
  countByProject: Record<string, number>
  noProjectCount: number
  totals: Totals
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useProjectStats(userId: string | undefined): ProjectStats {
  const [projects, setProjects] = useState<Project[]>([])
  const [countByProject, setCountByProject] = useState<Record<string, number>>({})
  const [noProjectCount, setNoProjectCount] = useState(0)
  const [totals, setTotals] = useState<Totals>({ projects: 0, designs: 0, screens: 0, bytes: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    const [projectsRes, designsRes, screensRes] = await Promise.all([
      supabase.from('projects').select('*').order('name', { ascending: true }),
      supabase.from('designs').select('id, project_id'),
      supabase.from('design_screens').select('design_id, file_size'),
    ])

    const err = projectsRes.error || designsRes.error || screensRes.error
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    const projs = projectsRes.data ?? []
    const designs = designsRes.data ?? []
    const screens = screensRes.data ?? []

    const count: Record<string, number> = {}
    let noProj = 0
    for (const d of designs) {
      if (d.project_id) count[d.project_id] = (count[d.project_id] ?? 0) + 1
      else noProj++
    }

    let bytes = 0
    for (const s of screens) bytes += s.file_size ?? 0

    setProjects(projs)
    setCountByProject(count)
    setNoProjectCount(noProj)
    setTotals({
      projects: projs.length,
      designs: designs.length,
      screens: screens.length,
      bytes,
    })
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return { projects, countByProject, noProjectCount, totals, loading, error, reload: load }
}
