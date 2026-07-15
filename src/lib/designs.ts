import { supabase } from '@/lib/supabase'
import type { Design, FileType } from '@/types/database'
import { generateThumbnail } from '@/lib/thumbnails'
import {
  screenOriginalPath,
  screenThumbPath,
  uploadFile,
  removeFiles,
  TYPE_TO_MIME,
} from '@/lib/storage'

export interface CreateDesignInput {
  userId: string
  projectId: string | null
  title: string
  description?: string
  tags?: string[]
  files: File[]
}

export interface UploadProgress {
  done: number
  total: number
}

// Cria um design e envia cada arquivo como uma tela.
// Faz limpeza de órfãos se qualquer etapa falhar.
export async function createDesign(
  input: CreateDesignInput,
  onProgress?: (p: UploadProgress) => void,
): Promise<Design> {
  const { userId, projectId, title, description, tags, files } = input
  const designId = crypto.randomUUID()
  const uploaded: string[] = []

  try {
    const { data: design, error } = await supabase
      .from('designs')
      .insert({
        id: designId,
        user_id: userId,
        project_id: projectId,
        title: title.trim() || 'Sem título',
        description: description?.trim() || null,
        tags: tags ?? [],
      })
      .select()
      .single()
    if (error) throw error

    let position = 0
    for (const file of files) {
      const fileType = fileTypeOf(file)
      const screenId = crypto.randomUUID()
      const thumb = await generateThumbnail(file, fileType)

      const origPath = screenOriginalPath(userId, designId, screenId, fileType)
      const tPath = screenThumbPath(userId, designId, screenId)

      await uploadFile(origPath, file, TYPE_TO_MIME[fileType])
      uploaded.push(origPath)
      await uploadFile(tPath, thumb.blob, 'image/png')
      uploaded.push(tPath)

      const { error: sErr } = await supabase.from('design_screens').insert({
        id: screenId,
        design_id: designId,
        user_id: userId,
        storage_path: origPath,
        thumbnail_path: tPath,
        file_type: fileType,
        file_size: file.size,
        width: thumb.width,
        height: thumb.height,
        position,
      })
      if (sErr) throw sErr

      position++
      onProgress?.({ done: position, total: files.length })
    }

    return design
  } catch (e) {
    // Desfaz tudo: arquivos + a linha do design (cascade remove telas).
    await removeFiles(uploaded).catch(() => {})
    try {
      await supabase.from('designs').delete().eq('id', designId)
    } catch {
      // ignora
    }
    throw e
  }
}

export async function deleteDesign(designId: string): Promise<void> {
  // 1. Descobrir os arquivos antes de apagar a linha.
  const { data: screens } = await supabase
    .from('design_screens')
    .select('storage_path, thumbnail_path')
    .eq('design_id', designId)

  // 2. Apagar o design (cascade remove as telas do banco).
  const { error } = await supabase.from('designs').delete().eq('id', designId)
  if (error) throw error

  // 3. Remover os arquivos do Storage.
  const paths: string[] = []
  for (const s of screens ?? []) {
    paths.push(s.storage_path)
    if (s.thumbnail_path) paths.push(s.thumbnail_path)
  }
  await removeFiles(paths).catch(() => {})
}

function fileTypeOf(file: File): FileType {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, FileType> = {
    png: 'png',
    jpg: 'jpg',
    jpeg: 'jpg',
    svg: 'svg',
    pdf: 'pdf',
  }
  const t = map[ext]
  if (!t) throw new Error(`Formato não suportado: ${file.name}`)
  return t
}

// Troca apenas o projeto de um design (usado nas Configurações).
export async function updateDesignProject(
  designId: string,
  projectId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('designs')
    .update({ project_id: projectId })
    .eq('id', designId)
  if (error) throw error
}

export type FinalScreen =
  | { type: 'existing'; id: string }
  | { type: 'new'; file: File }

export interface SaveDesignEditsInput {
  userId: string
  designId: string
  title: string
  description?: string
  tags: string[]
  projectId: string | null
  // Telas originais (para resolver os caminhos das que forem removidas).
  originalScreens: { id: string; storage_path: string; thumbnail_path: string | null }[]
  // Ordem final desejada, misturando telas existentes e arquivos novos.
  finalOrder: FinalScreen[]
}

// Aplica a edição completa de um design: campos, ordem, adição e remoção de telas.
export async function saveDesignEdits(input: SaveDesignEditsInput): Promise<void> {
  const { userId, designId, originalScreens, finalOrder } = input

  const keptIds = new Set(
    finalOrder.filter((f) => f.type === 'existing').map((f) => f.id),
  )
  const removed = originalScreens.filter((s) => !keptIds.has(s.id))

  // 1. Enviar as telas novas na posição final (com limpeza em caso de falha).
  const uploaded: string[] = []
  try {
    for (let i = 0; i < finalOrder.length; i++) {
      const item = finalOrder[i]
      if (item.type !== 'new') continue
      const fileType = fileTypeOf(item.file)
      const screenId = crypto.randomUUID()
      const thumb = await generateThumbnail(item.file, fileType)
      const origPath = screenOriginalPath(userId, designId, screenId, fileType)
      const tPath = screenThumbPath(userId, designId, screenId)
      await uploadFile(origPath, item.file, TYPE_TO_MIME[fileType])
      uploaded.push(origPath)
      await uploadFile(tPath, thumb.blob, 'image/png')
      uploaded.push(tPath)
      const { error } = await supabase.from('design_screens').insert({
        id: screenId,
        design_id: designId,
        user_id: userId,
        storage_path: origPath,
        thumbnail_path: tPath,
        file_type: fileType,
        file_size: item.file.size,
        width: thumb.width,
        height: thumb.height,
        position: i,
      })
      if (error) throw error
    }
  } catch (e) {
    await removeFiles(uploaded).catch(() => {})
    throw e
  }

  // 2. Atualizar a posição das telas existentes que permaneceram.
  for (let i = 0; i < finalOrder.length; i++) {
    const item = finalOrder[i]
    if (item.type !== 'existing') continue
    const { error } = await supabase
      .from('design_screens')
      .update({ position: i })
      .eq('id', item.id)
    if (error) throw error
  }

  // 3. Remover as telas excluídas (banco + Storage).
  if (removed.length > 0) {
    const { error } = await supabase
      .from('design_screens')
      .delete()
      .in('id', removed.map((s) => s.id))
    if (error) throw error
    const paths: string[] = []
    for (const s of removed) {
      paths.push(s.storage_path)
      if (s.thumbnail_path) paths.push(s.thumbnail_path)
    }
    await removeFiles(paths).catch(() => {})
  }

  // 4. Atualizar os campos do design.
  const { error } = await supabase
    .from('designs')
    .update({
      title: input.title.trim() || 'Sem título',
      description: input.description?.trim() || null,
      tags: input.tags,
      project_id: input.projectId,
    })
    .eq('id', designId)
  if (error) throw error
}
