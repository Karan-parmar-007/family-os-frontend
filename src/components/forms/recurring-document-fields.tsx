import { FileTextIcon } from 'lucide-react'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'

type Member = { id?: string; name?: string }

export type RecurringDocumentFormState = {
  show_docs_to_all: boolean
  repeat_doc_with_logs: boolean
  doc_viewer_user_ids: string[]
}

type Props = {
  file: File | null
  onFileChange: (file: File | null) => void
  existingDocumentId?: string | null
  form: RecurringDocumentFormState
  onFormChange: (patch: Partial<RecurringDocumentFormState>) => void
  members?: Member[]
  entryNoun: 'income' | 'expense'
  helperText?: string
}

export function RecurringDocumentFields({
  file,
  onFileChange,
  existingDocumentId,
  form,
  onFormChange,
  members = [],
  entryNoun,
  helperText = 'Optional — e.g. payslip, offer letter, or invoice template.',
}: Props) {
  const hasDocument = Boolean(file || existingDocumentId)

  return (
    <>
      <div className="space-y-1">
        <Label>Supporting document</Label>
        <Input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        {existingDocumentId && !file && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileTextIcon className="size-3" />
            Existing document attached. Upload a new file to replace it.
          </p>
        )}
        {!existingDocumentId && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>

      {hasDocument && (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Document settings
          </p>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Show document to all members</p>
              <p className="text-xs text-muted-foreground">
                When on, everyone in the linked families can view the attached document.
              </p>
            </div>
            <Switch
              checked={form.show_docs_to_all}
              onCheckedChange={(show_docs_to_all) => onFormChange({ show_docs_to_all })}
            />
          </div>

          {!form.show_docs_to_all && members.length > 0 && (
            <div className="space-y-2 border-t border-border/50 pt-2">
              <Label className="text-xs text-muted-foreground">
                Or limit access to specific members
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {members.map((m) => {
                  const memberId = m?.id || ''
                  const checked = form.doc_viewer_user_ids.includes(memberId)
                  return (
                    <label key={memberId} className="flex cursor-pointer select-none items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          let next = [...form.doc_viewer_user_ids]
                          if (e.target.checked) {
                            if (!next.includes(memberId)) next.push(memberId)
                          } else {
                            next = next.filter((id) => id !== memberId)
                          }
                          onFormChange({ doc_viewer_user_ids: next })
                        }}
                        className="size-4 rounded border-border bg-background text-brand focus:ring-brand"
                      />
                      <span>{m?.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-2">
            <div>
              <p className="text-sm font-medium">Attach to future {entryNoun === 'income' ? 'payments' : 'charges'}</p>
              <p className="text-xs text-muted-foreground">
                When enabled, the same file is added to each automatic {entryNoun} entry.
              </p>
            </div>
            <Switch
              checked={form.repeat_doc_with_logs}
              onCheckedChange={(repeat_doc_with_logs) => onFormChange({ repeat_doc_with_logs })}
            />
          </div>
          {form.repeat_doc_with_logs && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileTextIcon className="size-3" />
              This document will be linked to this recurring {entryNoun} and reused on future entries.
            </p>
          )}
        </div>
      )}
    </>
  )
}

export function appendRecurringDocumentToFormData(
  fd: FormData,
  opts: {
    file: File | null
    showDocsToAll: boolean
    repeatDocWithLogs: boolean
    docViewerUserIds: string[]
  },
): void {
  fd.append('show_docs_to_all', String(opts.showDocsToAll))
  fd.append('repeat_doc_with_logs', String(opts.repeatDocWithLogs))
  if (!opts.showDocsToAll && opts.docViewerUserIds.length > 0) {
    fd.append('doc_viewer_user_ids', opts.docViewerUserIds.join(','))
  }
  if (opts.file) fd.append('document', opts.file)
}
