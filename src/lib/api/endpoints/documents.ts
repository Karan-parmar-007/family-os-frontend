import { apiFetch } from '../client'
import { API_BASE_URL } from '../config'
import type { GetDocumentResponse } from '../types'

export const documentsApi = {
  /** Upload a document file to family storage. */
  uploadFamily(familyId: string, file: File): Promise<GetDocumentResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return apiFetch<GetDocumentResponse>(`/api/familyos/families/${familyId}/documents`, {
      method: 'POST',
      body: formData,
    })
  },

  /** Upload a document file to current user's personal storage. */
  uploadUser(file: File): Promise<GetDocumentResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return apiFetch<GetDocumentResponse>('/api/familyos/user/documents', {
      method: 'POST',
      body: formData,
    })
  },

  /** Fetch document metadata (id, filename, file_path). */
  getMetadata(familyId: string, documentId: string) {
    return apiFetch<GetDocumentResponse>(
      `/api/familyos/families/${familyId}/documents/${documentId}`,
    )
  },

  getUserMetadata(documentId: string) {
    return apiFetch<GetDocumentResponse>(`/api/familyos/user/documents/${documentId}`)
  },

  /**
   * Returns the full URL for the document binary content endpoint.
   * Because auth is cookie-based the browser will include credentials
   * automatically, so this URL can be used directly in `window.open`
   * or as an `<a href>` for viewing/downloading.
   */
  contentUrl(familyId: string, documentId: string): string {
    const base = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${base}/api/familyos/families/${familyId}/documents/${documentId}/content`
  },

  userContentUrl(documentId: string): string {
    const base = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${base}/api/familyos/user/documents/${documentId}/content`
  },
}
