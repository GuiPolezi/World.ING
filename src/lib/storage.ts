import { supabase } from '@/lib/supabase'
import type { FileType } from '@/types/database'

const BUCKET = 'designs'

const EXT_TO_TYPE: Record<string, FileType> = {
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpg',
  svg: 'svg',
  pdf: 'pdf',
}

export const TYPE_TO_MIME: Record<FileType, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
}

export function fileTypeFromName(name: string): FileType | null {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_TO_TYPE[ext] ?? null
}

// Caminhos: {userId}/{designId}/{screenId}/original.<ext> e thumb.png
export function screenOriginalPath(
  userId: string,
  designId: string,
  screenId: string,
  fileType: FileType,
) {
  return `${userId}/${designId}/${screenId}/original.${fileType}`
}

export function screenThumbPath(userId: string, designId: string, screenId: string) {
  return `${userId}/${designId}/${screenId}/thumb.png`
}

export async function uploadFile(path: string, body: Blob | File, contentType: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType,
    upsert: false,
  })
  if (error) throw error
}

export async function signedUrl(path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

// Gera várias signed URLs de uma vez (uma chamada só).
export async function signedUrls(paths: string[], expiresIn = 3600) {
  const map: Record<string, string> = {}
  if (paths.length === 0) return map
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, expiresIn)
  if (error) throw error
  for (const item of data) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl
  }
  return map
}

export async function removeFiles(paths: string[]) {
  if (paths.length === 0) return
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) throw error
}
