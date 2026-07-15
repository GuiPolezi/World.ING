import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Design, DesignScreen, Project } from '@/types/database'
import { signedUrls } from '@/lib/storage'

export interface ScreenWithUrl extends DesignScreen {
  thumbUrl: string | null
}

export interface DesignFull extends Design {
  screens: ScreenWithUrl[]
  coverThumbUrl: string | null
  screenCount: number
}

export function useGallery(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([])
  const [designs, setDesigns] = useState<DesignFull[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    const [projectsRes, designsRes, screensRes] = await Promise.all([
      supabase.from('projects').select('*').order('name', { ascending: true }),
      supabase.from('designs').select('*').order('created_at', { ascending: false }),
      supabase.from('design_screens').select('*').order('position', { ascending: true }),
    ])

    const firstError = projectsRes.error || designsRes.error || screensRes.error
    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    const designRows = designsRes.data ?? []
    const screenRows = screensRes.data ?? []

    // Assina todas as miniaturas de uma vez.
    const thumbPaths = screenRows
      .map((s) => s.thumbnail_path)
      .filter((p): p is string => Boolean(p))
    let urlMap: Record<string, string> = {}
    try {
      urlMap = await signedUrls(thumbPaths)
    } catch {
      urlMap = {}
    }

    // Agrupa as telas por design (já vêm ordenadas por position).
    const byDesign = new Map<string, ScreenWithUrl[]>()
    for (const s of screenRows) {
      const list = byDesign.get(s.design_id) ?? []
      list.push({
        ...s,
        thumbUrl: s.thumbnail_path ? (urlMap[s.thumbnail_path] ?? null) : null,
      })
      byDesign.set(s.design_id, list)
    }

    const full: DesignFull[] = designRows.map((d) => {
      const screens = byDesign.get(d.id) ?? []
      return {
        ...d,
        screens,
        coverThumbUrl: screens[0]?.thumbUrl ?? null,
        screenCount: screens.length,
      }
    })

    setProjects(projectsRes.data ?? [])
    setDesigns(full)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return { projects, designs, loading, error, reload: load, setDesigns, setProjects }
}
