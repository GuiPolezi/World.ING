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

export function originalPath(userId: string, designId: string, fileType: FileType) {
  return `${userId}/${designId}/original.${fileType}`
}

export function thumbPath(userId: string, designId: string) {
  return `${userId}/${designId}/thumb.png`
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

// Gera várias signed URLs de uma vez (uma chamada só para o grid inteiro).
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

// Remove todos os arquivos da pasta de um design ({userId}/{designId}/...).
export async function removeDesignFiles(userId: string, designId: string) {
  const dir = `${userId}/${designId}`
  const { data, error } = await supabase.storage.from(BUCKET).list(dir)
  if (error) throw error
  const paths = (data ?? []).map((f) => `${dir}/${f.name}`)
  if (paths.length > 0) {
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove(paths)
    if (rmErr) throw rmErr
  }
}
