import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Home, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageBar } from '#/components/ui/list-pagination'
import { Input } from '#/components/ui/input'
import { useDebounced } from '#/hooks/use-debounced'
import { usePagination } from '#/lib/api/pagination'
import { useAdminDeleteFamily, useAdminFamilies } from '#/hooks/api/use-admin'

export const Route = createFileRoute('/_authenticated/admin/families')({
  component: AdminFamiliesPage,
})

function AdminFamiliesPage() {
  const [q, setQ] = useState('')
  const search = useDebounced(q.trim())
  const paging = usePagination(search)
  const { data, isLoading } = useAdminFamilies(paging.page, paging.pageSize, search)
  const deleteFamily = useAdminDeleteFamily()

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete family "${name}"? This cascades to all family ledger entries, rules, and memberships.`)) {
      return
    }
    try {
      await deleteFamily.mutateAsync(id)
      toast.success('Family deleted successfully')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete family')
    }
  }

  return (
    <div>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search families"
        className="mb-3 w-full border-[#233554] bg-[#0a192f] text-[#ccd6f6] sm:max-w-sm"
      />
      {isLoading ? (
        <div className="text-center py-12 text-[#8892b0] font-mono text-sm">Loading families...</div>
      ) : (
        <>
        <div className="space-y-3 lg:hidden">
          {data?.items.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#233554] p-8 text-center text-sm text-[#8892b0]">No families match.</p>
          )}
          {data?.items.map((f) => (
            <article key={f.id} className="rounded-2xl border border-[#172a45] bg-[#112240] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Home className="h-4 w-4 shrink-0 text-[#64ffda]" />
                  <p className="truncate font-medium text-white">{f.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(f.id, f.name)}
                  className="shrink-0 rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                  title="Delete family"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <dt className="text-[#8892b0]">Head</dt>
                  <dd className="truncate text-[#ccd6f6]">{f.headName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#8892b0]">Members</dt>
                  <dd className="font-mono text-white">{f.memberCount}</dd>
                </div>
                <div>
                  <dt className="text-[#8892b0]">Currency</dt>
                  <dd className="font-mono text-white">{f.currency}</dd>
                </div>
                <div>
                  <dt className="text-[#8892b0]">Created</dt>
                  <dd className="text-[#ccd6f6]">{new Date(f.createdAt).toLocaleDateString()}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[#8892b0]">Timezone</dt>
                  <dd className="break-all text-white">{f.timezone}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="hidden bg-[#112240] border border-[#172a45] rounded-2xl overflow-hidden shadow-xl lg:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#ccd6f6]">
              <thead className="bg-[#0a192f]/80 text-[11px] font-mono uppercase text-[#8892b0] border-b border-[#172a45]">
                <tr>
                  <th className="px-6 py-3.5">Family</th>
                  <th className="px-6 py-3.5">Head</th>
                  <th className="px-6 py-3.5">Currency / Timezone</th>
                  <th className="px-6 py-3.5">Members</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#172a45]/60 font-sans">
                {data?.items.map((f) => (
                  <tr key={f.id} className="hover:bg-[#172a45]/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <Home className="w-4 h-4 text-[#64ffda]" />
                      <span>{f.name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#ccd6f6]">
                      {f.headName || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-mono text-white">{f.currency}</span>
                      <span className="text-[#8892b0] ml-2">({f.timezone})</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {f.memberCount} members
                    </td>
                    <td className="px-6 py-4 text-xs text-[#8892b0]">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(f.id, f.name)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete family cascade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
      <PageBar state={paging} data={data} />
    </div>
  )
}
