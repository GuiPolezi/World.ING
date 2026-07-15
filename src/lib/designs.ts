import { supabase } from '@/lib/supabase'
import type { Design, FileType } from '@/types/database'
import { generateThumbnail } from '@/lib/thumbnails'
import {
  originalPath,
  thumbPath,
  uploadFile,
  removeDesignFiles,
  TYPE_TO_MIME,
} from '@/lib/storage'

export interface NewDesignInput {
  userId: string
  file: File
  fileType: FileType
  title: string
  description?: string
  tags?: string[]
}

export async function uploadDesign(input: NewDesignInput): Promise<Design> {
  const { userId, file, fileType } = input
  const designId = crypto.randomUUID()

  // 1. Miniatura + dimensões do original (feito no navegador).
  const thumb = await generateThumbnail(file, fileType)

  // 2. Arquivos no Storage: original + miniatura.
  const origPath = originalPath(userId, designId, fileType)
  const tPath = thumbPath(userId, designId)

  await uploadFile(origPath, file, TYPE_TO_MIME[fileType])
  try {
    await uploadFile(tPath, thumb.blob, 'image/png')
  } catch (e) {
    // Se a miniatura falhar, não deixa o original órfão no Storage.
    await removeDesignFiles(userId, designId).catch(() => {})
    throw e
  }

  // 3. Linha de metadados no banco.
  const { data, error } = await supabase
    .from('designs')
    .insert({
      id: designId,
      user_id: userId,
      title: input.title.trim() || file.name,
      description: input.description?.trim() || null,
      storage_path: origPath,
      thumbnail_path: tPath,
      file_type: fileType,
      file_size: file.size,
      width: thumb.width,
      height: thumb.height,
      tags: input.tags ?? [],
    })
    .select()
    .single()

  if (error) {
    // Desfaz os uploads se o insert falhar.
    await removeDesignFiles(userId, designId).catch(() => {})
    throw error
  }

  return data
}

export async function deleteDesign(design: Design): Promise<void> {
  const { error } = await supabase.from('designs').delete().eq('id', design.id)
  if (error) throw error
  // Só remove os arquivos depois que a linha saiu do banco.
  await removeDesignFiles(design.user_id, design.id).catch(() => {})
}
