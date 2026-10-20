import { useState } from 'react'
import { CheckIcon, PencilIcon, PlusIcon, TagIcon, Trash2Icon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { FosModalOverlay } from '#/components/ui/fos-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import { PageBar } from '#/components/ui/list-pagination'
import { usePagination } from '#/lib/api/pagination'
import { useDebounced } from '#/hooks/use-debounced'
import {
  CATEGORY_TYPE_LABELS,
  useCategories,
  useCategoryMutations,
  type CategoryItem,
  type CategoryScope,
  type CategoryType,
} from '#/hooks/api/use-categories'
import { cn } from '#/lib/utils'

const TYPES = Object.keys(CATEGORY_TYPE_LABELS) as CategoryType[]

function errorText(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export function CategoryManager({
  scope,
  familyId,
  types,
  className,
}: {
  scope: CategoryScope
  familyId?: string
  /** Only these types. One type hides the tabs and manages that page's categories. */
  types?: CategoryType[]
  className?: string
}) {
  const available = types?.length ? types : TYPES
  const [type, setType] = useState<CategoryType>(available[0])
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const q = useDebounced(search.trim())
  const pagination = usePagination([type, q, scope, familyId])
  const { data, isLoading, isError, error } = useCategories({
    scope,
    categoryType: type,
    familyId,
    q,
    page: pagination.page,
    pageSize: pagination.pageSize,
  })
  const { create } = useCategoryMutations()

  const add = async () => {
    const name = newName.trim()
    if (!name || create.isPending) return
    try {
      await create.mutateAsync({ scope, familyId, categoryType: type, name })
      toast.success(`Category "${name}" added`)
      setNewName('')
    } catch (err) {
      toast.error(errorText(err, 'Could not add the category'))
    }
  }

  const single = available.length === 1
  const heading = single ? `${CATEGORY_TYPE_LABELS[available[0]]} categories` : 'Categories'

  return (
    <Card className={cn('border-[#233554] bg-[#112240] text-[#ccd6f6]', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#e6f1ff]">
          <TagIcon className="size-5 text-[#64ffda]" />
          {heading}
        </CardTitle>
        <CardDescription className="text-[#8892b0]">
          {scope === 'FAMILY'
            ? 'Shared with everyone in this family. They do not appear in your other families.'
            : 'Private to you.'}{' '}
          Add one here, or type a new name inside the form.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!single && (
        <div className="flex flex-wrap gap-1.5">
          {available.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition',
                t === type
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {CATEGORY_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 gap-2">
            <Input
              value={newName}
              maxLength={64}
              placeholder={`New ${CATEGORY_TYPE_LABELS[type].toLowerCase()} category`}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void add()
                }
              }}
            />
            <Button type="button" onClick={() => void add()} disabled={!newName.trim() || create.isPending}>
              <PlusIcon className="mr-1 size-4" />
              Add
            </Button>
          </div>
          <Input
            className="sm:w-56"
            value={search}
            placeholder="Search"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-[#f87171]">{errorText(error, 'Could not load categories')}</p>
        ) : !data || data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {q ? 'No category matches your search.' : 'No categories yet. Add the first one above.'}
          </p>
        ) : (
          <div className="divide-y divide-border rounded-xl border bg-background/30">
            {data.items.map((cat) => (
              <CategoryRow key={cat.id} category={cat} />
            ))}
          </div>
        )}
        <PageBar state={pagination} data={data} />
      </CardContent>
    </Card>
  )
}

/** Opens this page's categories in a dialog so the list stays the first thing on the page. */
export function CategoryManageButton({
  scope,
  familyId,
  types,
  className,
}: {
  scope: CategoryScope
  familyId?: string
  types?: CategoryType[]
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn('border-[#233554] bg-transparent text-[#ccd6f6] hover:bg-[#172a45]', className)}
      >
        <TagIcon className="mr-1.5 size-4 text-[#64ffda]" />
        Categories
      </Button>
      {open && (
        <FosModalOverlay>
          <div className="my-auto w-full min-w-0 max-w-xl">
            <div className="mb-3 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-[#233554] text-[#ccd6f6]"
              >
                Close
              </Button>
            </div>
            <CategoryManager scope={scope} familyId={familyId} types={types} />
          </div>
        </FosModalOverlay>
      )}
    </>
  )
}

function CategoryRow({ category }: { category: CategoryItem }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const { rename, remove } = useCategoryMutations()

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === category.name) return setEditing(false)
    try {
      await rename.mutateAsync({ id: category.id, name: trimmed })
      toast.success('Category renamed')
      setEditing(false)
    } catch (err) {
      toast.error(errorText(err, 'Could not rename the category'))
    }
  }

  const destroy = async () => {
    if (!window.confirm(`Delete "${category.name}"? Items using it keep their current label.`)) return
    try {
      await remove.mutateAsync(category.id)
      toast.success('Category deleted')
    } catch (err) {
      toast.error(errorText(err, 'Could not delete the category'))
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      {editing ? (
        <Input
          autoFocus
          className="h-8"
          value={name}
          maxLength={64}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void save()
            } else if (e.key === 'Escape') {
              setName(category.name)
              setEditing(false)
            }
          }}
        />
      ) : (
        <span className="truncate text-sm font-medium">{category.name}</span>
      )}
      {category.canEdit && (
        <div className="flex shrink-0 items-center gap-1">
          {editing ? (
            <>
              <Button type="button" size="icon" variant="ghost" onClick={() => void save()} aria-label="Save">
                <CheckIcon className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Cancel"
                onClick={() => {
                  setName(category.name)
                  setEditing(false)
                }}
              >
                <XIcon className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button type="button" size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="Rename">
                <PencilIcon className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => void destroy()}
                disabled={remove.isPending}
                aria-label="Delete"
              >
                <Trash2Icon className="size-4 text-[#f87171]" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
