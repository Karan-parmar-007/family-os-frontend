import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '#/lib/api/familyos/client'
import { PlusIcon, CheckIcon, ChevronDownIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '#/components/ui/label'
import { cn } from '#/lib/utils'

export interface CategoryItem {
  id: string
  scope: 'FAMILY' | 'PERSONAL'
  familyId?: string | null
  ownerUserId?: string | null
  categoryType: string
  name: string
  color?: string | null
  icon?: string | null
  isDefault: boolean
  createdAt: string
}

interface CategoryListResponse {
  items: CategoryItem[]
  total: number
}

interface CategoryPickerProps {
  scope: 'FAMILY' | 'PERSONAL'
  categoryType: 'INCOME' | 'EXPENSE' | 'DEBT' | 'ASSET' | 'VAULT_PASSWORD' | 'VAULT_DOCUMENT'
  familyId?: string
  value?: string // Can be category id or category name
  onSelect: (category: { id: string; name: string }) => void
  label?: string
  placeholder?: string
  className?: string
}

export function CategoryPicker({
  scope,
  categoryType,
  familyId,
  value,
  onSelect,
  label = 'Category',
  placeholder = 'Select category...',
  className = '',
}: CategoryPickerProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const url = `/api/familyos/categories?scope=${scope}&category_type=${categoryType}${familyId ? `&family_id=${familyId}` : ''}`
      const res = await apiFetch<CategoryListResponse>(url)
      setCategories(res.items || [])
    } catch {
      // Fallback silently if offline or initial load
    } finally {
      setLoading(false)
    }
  }, [scope, categoryType, familyId])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCatName.trim()
    if (!trimmed) return

    try {
      setSubmitting(true)
      const created = await apiFetch<CategoryItem>('/api/familyos/categories', {
        method: 'POST',
        json: {
          scope,
          familyId: scope === 'FAMILY' ? familyId : null,
          categoryType,
          name: trimmed,
        },
      })

      toast.success(`Category "${created.name}" created`)
      setNewCatName('')
      setIsCreating(false)
      await fetchCategories()
      onSelect({ id: created.id, name: created.name })
      setIsOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create category'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCategory = categories.find(
    (c) => c.id === value || c.name.toLowerCase() === (value || '').toLowerCase()
  )

  const close = () => {
    setIsOpen(false)
    setIsCreating(false)
  }

  return (
    <div className={cn('relative space-y-1', className)}>
      {label && (
        <Label className="text-xs text-[#8892b0]">
          {label}
        </Label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-xl border border-[#233554] bg-[#0a192f] px-3 py-2 text-sm text-[#ccd6f6] shadow-xs transition hover:border-[#233554]/80 focus:border-[#64ffda] focus:ring-1 focus:ring-[#64ffda]/30 focus:outline-hidden',
            label ? 'mt-1.5' : ''
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedCategory ? (
              <span className="font-medium text-[#ccd6f6]">{selectedCategory.name}</span>
            ) : value ? (
              <span className="font-medium text-[#ccd6f6]">{value}</span>
            ) : (
              <span className="text-[#8892b0]">{loading ? 'Loading...' : placeholder}</span>
            )}
          </span>
          <ChevronDownIcon
            className={cn(
              'size-4 text-[#8892b0] transition-transform duration-200',
              isOpen && 'rotate-180 text-[#64ffda]'
            )}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[75]"
              onClick={close}
            />

            <div className="absolute left-0 right-0 z-[80] mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-[#233554] bg-[#112240] p-1.5 shadow-2xl shadow-[#020c1b]/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
              <div className="space-y-0.5">
                {categories.length === 0 && !loading && (
                  <p className="px-3 py-2 text-xs text-[#8892b0]">No categories yet</p>
                )}
                {categories.map((cat) => {
                  const isSelected = selectedCategory?.id === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onSelect({ id: cat.id, name: cat.name })
                        close()
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition',
                        isSelected
                          ? 'bg-[#64ffda]/10 font-semibold text-[#64ffda]'
                          : 'text-[#ccd6f6] hover:bg-[#172a45] hover:text-[#e6f1ff]'
                      )}
                    >
                      <span className="truncate">{cat.name}</span>
                      {isSelected && <CheckIcon className="size-4 text-[#64ffda]" />}
                    </button>
                  )
                })}
              </div>

              <div className="mt-1.5 border-t border-[#233554] pt-1.5">
                {isCreating ? (
                  <form onSubmit={handleCreate} className="flex items-center gap-1.5 p-1">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Category name..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="h-8 w-full rounded-lg border border-[#233554] bg-[#0a192f] px-2.5 text-xs text-[#ccd6f6] placeholder:text-[#8892b0] focus:border-[#64ffda] focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !newCatName.trim()}
                      className="inline-flex h-8 items-center rounded-lg bg-[#64ffda] px-3 text-xs font-semibold text-[#0a192f] transition hover:bg-[#64ffda]/90 disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="inline-flex h-8 items-center rounded-lg px-2 text-xs text-[#8892b0] hover:text-[#ccd6f6]"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#64ffda] transition hover:bg-[#64ffda]/10"
                  >
                    <PlusIcon className="size-3.5" />
                    <span>Create new category</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}