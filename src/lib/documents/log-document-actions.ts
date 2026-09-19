import { documentsApi } from '#/lib/api'
import { toast } from 'sonner'

export function checkLogDocAccess(
  log: {
    document_id?: string | null
    show_doc_to_all?: boolean
    show_docs_to_all?: boolean
    added_by_user_id?: string
    earned_by_user_id?: string | null
    logged_by_user_id?: string | null
    personal_savings_user_id?: string | null
    doc_viewer_user_ids?: string[]
  } | null,
  currentUserId: string,
): boolean {
  if (!log?.document_id) return false
  if (log.show_doc_to_all || log.show_docs_to_all) return true
  if (currentUserId && log.added_by_user_id === currentUserId) return true
  if (currentUserId && log.earned_by_user_id === currentUserId) return true
  if (currentUserId && log.logged_by_user_id === currentUserId) return true
  if (currentUserId && log.personal_savings_user_id === currentUserId) return true
  if (currentUserId && log.doc_viewer_user_ids?.includes(currentUserId)) return true
  return false
}

export async function viewLogDocument(familyId: string | null | undefined, documentId: string) {
  const toastId = toast.loading('Loading document preview...')
  try {
    const { document: meta } = familyId
      ? await documentsApi.getMetadata(familyId, documentId)
      : await documentsApi.getUserMetadata(documentId)
    const url = familyId
      ? documentsApi.contentUrl(familyId, documentId)
      : documentsApi.userContentUrl(documentId)
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) throw new Error('Fetch failed')
    let blob = await res.blob()

    const filename = meta.filename || ''
    let mimeType = blob.type
    if (filename.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf'
    else if (filename.toLowerCase().endsWith('.png')) mimeType = 'image/png'
    else if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) {
      mimeType = 'image/jpeg'
    } else if (filename.toLowerCase().endsWith('.gif')) mimeType = 'image/gif'
    else if (filename.toLowerCase().endsWith('.txt')) mimeType = 'text/plain'

    if (mimeType !== blob.type) blob = new Blob([blob], { type: mimeType })

    const objectUrl = URL.createObjectURL(blob)
    window.open(objectUrl, '_blank', 'noopener,noreferrer')
    toast.dismiss(toastId)
  } catch (error) {
    console.error(error)
    toast.error('Failed to view document.', { id: toastId })
  }
}

export async function downloadLogDocument(familyId: string | null | undefined, documentId: string) {
  const toastId = toast.loading('Downloading document...')
  try {
    const { document: meta } = familyId
      ? await documentsApi.getMetadata(familyId, documentId)
      : await documentsApi.getUserMetadata(documentId)
    const url = familyId
      ? documentsApi.contentUrl(familyId, documentId)
      : documentsApi.userContentUrl(documentId)
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = meta.filename || 'document'
    a.click()
    URL.revokeObjectURL(objectUrl)
    toast.success('Download complete!', { id: toastId })
  } catch (error) {
    console.error(error)
    toast.error('Failed to download document.', { id: toastId })
  }
}
