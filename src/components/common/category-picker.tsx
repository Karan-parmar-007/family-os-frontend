import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { cn } from '#/lib/utils'
import {
  useCategories,
  useCategoryMutations,
  type CategoryScope,
  type CategoryType,
} from '#/hooks/api/use-categories'

export type { CategoryItem } from '#/hooks/api/use-categories'

interface CategoryPickerProps {
  scope: CategoryScope
  categoryType: CategoryType
  familyId?: string
  /** Category id (a name is accepted for older rows). */
  value?: string | null
  onSelect: (category: { id: string; name: string } | null) => void
  label?: string
  placeholder?: string
  className?: string
  allowClear?: boolean
}

export function CategoryPicker({
  scope,
  categoryType,
  familyId,
  value,
  onSelect,
  label = 'Category',
  placeholder = 'New category name',
  className = '',
  allowClear = true,
}: CategoryPickerProps) {
  const [draft, setDraft] = useState('')
  const { data, isLoading, isError, error } = useCategories({ scope, categoryType, familyId, pageSize: 100 })
  const { create } = useCategoryMutations()
  const categories = data?.items ?? []
  const selected = categories.find(
    (c) => c.id === value || c.name.toLowerCase() === (value || '').toLowerCase(),
  )

  const add = async () => {
    const name = draft.trim()
    if (!name || create.isPending) return
    const existing = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      onSelect({ id: existing.id, name: existing.name })
      setDraft('')
      return
    }
    try {
      const created = await create.mutateAsync({ scope, familyId, categoryType, name })
      toast.success(`Category "${created.name}" added`)
      onSelect({ id: created.id, name: created.name })
      setDraft('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add the category')
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label className="text-xs text-[#8892b0]">{label}</Label>}

      <select
        value={selected?.id ?? ''}
        disabled={isLoading}
        onChange={(e) => {
          const id = e.target.value
          if (!id) {
            onSelect(null)
            return
          }
          const cat = categories.find((c) => c.id === id)
          if (cat) onSelect({ id: cat.id, name: cat.name })
        }}
        className="h-10 w-full min-w-0 max-w-full rounded-xl border border-[#233554] bg-[#0a192f] px-3 text-base text-[#ccd6f6] outline-none focus:border-[#64ffda] sm:text-sm"
      >
        {allowClear && <option value="">{isLoading ? 'Loading categories…' : 'None'}</option>}
        {!allowClear && !selected && <option value="">Select a category</option>}
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {isError && (
        <p className="text-xs text-[#f87171]">{error instanceof Error ? error.message : 'Could not load categories'}</p>
      )}
      {!isLoading && !isError && categories.length === 0 && (
        <p className="text-xs text-[#8892b0]">No categories yet. Add one below.</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={draft}
          maxLength={64}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              void add()
            }
          }}
          className="h-10 min-w-0 rounded-xl border-[#233554] bg-[#0a192f] text-[#ccd6f6]"
        />
        <Button
          type="button"
          disabled={!draft.trim() || create.isPending}
          onClick={() => void add()}
          className="h-10 w-full shrink-0 bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 sm:w-auto"
        >
          <PlusIcon className="mr-1 size-3.5" />
          {create.isPending ? 'Adding…' : 'Add'}
        </Button>
      </div>
    </div>
  )
}
