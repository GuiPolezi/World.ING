import type { FileType } from '@/types/database'

// Largura máxima da miniatura em px. Mantém o grid leve e uniforme.
const MAX_THUMB = 1000

export interface ThumbResult {
  blob: Blob
  width: number // dimensões do arquivo original
  height: number
}

export async function generateThumbnail(file: File, fileType: FileType): Promise<ThumbResult> {
  if (fileType === 'pdf') return thumbFromPdf(file)
  return thumbFromImage(file)
}

async function thumbFromImage(file: File): Promise<ThumbResult> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const w = img.naturalWidth || img.width || MAX_THUMB
    const h = img.naturalHeight || img.height || MAX_THUMB
    const scale = Math.min(MAX_THUMB / w, 1)
    const cw = Math.max(1, Math.round(w * scale))
    const ch = Math.max(1, Math.round(h * scale))
    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponível neste navegador.')
    ctx.drawImage(img, 0, 0, cw, ch)
    const blob = await canvasToBlob(canvas)
    return { blob, width: Math.round(w), height: Math.round(h) }
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function thumbFromPdf(file: File): Promise<ThumbResult> {
  // Carrega o pdf.js só quando há um PDF — mantém o bundle inicial leve.
  const pdfjsLib = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const data = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data }).promise
  const page = await pdf.getPage(1)
  const base = page.getViewport({ scale: 1 })
  const scale = Math.min(MAX_THUMB / base.width, 2)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível neste navegador.')
  await page.render({ canvasContext: ctx, viewport }).promise
  const blob = await canvasToBlob(canvas)
  return { blob, width: Math.round(base.width), height: Math.round(base.height) }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Falha ao gerar a miniatura.'))
    }, 'image/png')
  })
}
