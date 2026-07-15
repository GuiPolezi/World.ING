import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Design } from '@/types/database'
import { signedUrls } from '@/lib/storage'

export interface DesignWithThumb extends Design {
  thumbUrl: string | null
}

export function useDesigns(userId: string | undefined) {
  const [designs, setDesigns] = useState<DesignWithThumb[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const rows = data ?? []
    const paths = rows
      .map((d) => d.thumbnail_path)
      .filter((p): p is string => Boolean(p))

    let urlMap: Record<string, string> = {}
    try {
      urlMap = await signedUrls(paths)
    } catch {
      urlMap = {}
    }

    setDesigns(
      rows.map((d) => ({
        ...d,
        thumbUrl: d.thumbnail_path ? (urlMap[d.thumbnail_path] ?? null) : null,
      })),
    )
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return { designs, loading, error, reload: load, setDesigns }
}
