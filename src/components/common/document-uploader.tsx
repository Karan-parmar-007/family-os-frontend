import { useState, useRef } from 'react'
import { documentsApi } from '#/lib/api/endpoints/documents'
import { Label } from '#/components/ui/label'
import { toast } from 'sonner'
import {
  FileTextIcon,
  UploadCloudIcon,
  XIcon,
  ExternalLinkIcon,
  Loader2Icon,
  CheckCircle2Icon,
} from 'lucide-react'

export interface DocumentUploaderProps {
  documentId?: string | null
  documentName?: string | null
  onDocumentChange: (documentId: string | null, filename?: string | null) => void
  familyId?: string
  isPersonal?: boolean
  label?: string
  hint?: string
  className?: string
}

export function DocumentUploader({
  documentId,
  documentName,
  onDocumentChange,
  familyId,
  isPersonal = false,
  label = 'Document Attachment',
  hint = 'Attach receipt, bill, contract, or policy (PDF, Images up to 25MB)',
  className = '',
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [attachedName, setAttachedName] = useState<string | null>(documentName || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File exceeds maximum allowed size of 25MB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      let res
      if (isPersonal || !familyId) {
        res = await documentsApi.uploadUser(file)
      } else {
        res = await documentsApi.uploadFamily(familyId, file)
      }

      const doc = res.document
      setAttachedName(doc.filename || file.name)
      onDocumentChange(doc.id, doc.filename || file.name)
      toast.success('Document attached successfully')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload document')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    setAttachedName(null)
    onDocumentChange(null, null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getDocumentViewUrl = () => {
    if (!documentId) return null
    if (isPersonal || !familyId) {
      return documentsApi.userContentUrl(documentId)
    }
    return documentsApi.contentUrl(familyId, documentId)
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-[#8892b0]">
          {label}
        </Label>
        {hint && <span className="text-[10px] text-[#8892b0]/70">{hint}</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
        className="hidden"
      />

      {documentId ? (
        <div className="mt-1.5 flex items-center justify-between rounded-xl border border-[#64ffda]/30 bg-[#64ffda]/5 p-2.5 transition">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="rounded-lg bg-[#64ffda]/10 p-1.5 text-[#64ffda]">
              <FileTextIcon className="h-4 w-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-[#ccd6f6] truncate">
                {attachedName || 'Attached Document'}
              </p>
              <span className="flex items-center gap-1 text-[10px] text-[#64ffda]">
                <CheckCircle2Icon className="h-3 w-3" /> Attached & Encrypted
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {getDocumentViewUrl() && (
              <a
                href={getDocumentViewUrl()!}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-[#233554] p-1.5 text-[#8892b0] hover:bg-[#112240] hover:text-[#64ffda] transition"
                title="View / Download Document"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-md border border-[#233554] p-1.5 text-[#8892b0] hover:bg-[#112240] hover:text-[#f87171] transition"
              title="Remove Attachment"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-1.5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-[#233554] bg-[#0a192f]/50 px-4 py-3 text-xs text-[#8892b0] transition hover:border-[#64ffda]/60 hover:bg-[#0a192f] hover:text-[#ccd6f6] disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2Icon className="h-4 w-4 animate-spin text-[#64ffda]" />
              <span>Uploading document...</span>
            </>
          ) : (
            <>
              <UploadCloudIcon className="h-4 w-4 text-[#64ffda]" />
              <span>Click to attach document or receipt</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}