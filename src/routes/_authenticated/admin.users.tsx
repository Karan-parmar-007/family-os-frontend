import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { PageBar } from '#/components/ui/list-pagination'
import { Input } from '#/components/ui/input'
import { useDebounced } from '#/hooks/use-debounced'
import { usePagination } from '#/lib/api/pagination'
import { Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAdminDeleteUser,
  useAdminUpdateUserCap,
  useAdminUsers,
} from '#/hooks/api/use-admin'

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const [q, setQ] = useState('')
  const search = useDebounced(q.trim())
  const paging = usePagination(search)
  const { data, isLoading } = useAdminUsers(paging.page, paging.pageSize, search)
  const updateCap = useAdminUpdateUserCap()
  const deleteUser = useAdminDeleteUser()

  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingCap, setEditingCap] = useState<number>(2)

  const handleSaveCap = async (userId: string) => {
    try {
      await updateCap.mutateAsync({ userId, cap: editingCap })
      toast.success('Family membership cap updated')
      setEditingUserId(null)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update cap')
    }
  }

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This will permanently wipe their personal Family OS data.`)) {
      return
    }
    try {
      await deleteUser.mutateAsync(userId)
      toast.success('User deleted successfully')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user')
    }
  }

  return (
    <div>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search name or email"
        className="mb-3 w-full border-[#233554] bg-[#0a192f] text-[#ccd6f6] sm:max-w-sm"
      />
      {isLoading ? (
        <div className="text-center py-12 text-[#8892b0] font-mono text-sm">Loading users...</div>
      ) : (
        <>
        <div className="space-y-3 lg:hidden">
          {data?.items.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#233554] p-8 text-center text-sm text-[#8892b0]">No users match.</p>
          )}
          {data?.items.map((u) => (
            <article key={u.id} className="rounded-2xl border border-[#172a45] bg-[#112240] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{u.displayName}</p>
                  <p className="break-all font-mono text-xs text-[#8892b0]">{u.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteUser(u.id, u.displayName)}
                  className="shrink-0 rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                  title="Delete user"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <dt className="text-[#8892b0]">Code</dt>
                  <dd className="font-mono text-[#64ffda]">{u.personalCode}</dd>
                </div>
                <div>
                  <dt className="text-[#8892b0]">Currency</dt>
                  <dd className="font-mono text-white">{u.personalCurrency}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[#8892b0]">Timezone</dt>
                  <dd className="break-all text-white">{u.timezone}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-1">
                {u.families.map((f) => (
                  <span
                    key={f.id}
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                      f.isFamilyManager
                        ? 'border-[#64ffda]/30 bg-[#64ffda]/10 text-[#64ffda]'
                        : 'border-[#233554] bg-[#172a45]/40 text-[#8892b0]'
                    }`}
                  >
                    {f.name} {f.isFamilyManager ? '(Head)' : ''}
                  </span>
                ))}
              </div>
              <div className="mt-3 border-t border-[#172a45] pt-3">
                {editingUserId === u.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={editingCap}
                      onChange={(e) => setEditingCap(parseInt(e.target.value) || 1)}
                      className="h-10 w-24 rounded border border-[#64ffda] bg-[#0a192f] px-2 font-mono text-sm text-white"
                    />
                    <button type="button" onClick={() => handleSaveCap(u.id)} className="font-mono text-xs text-[#64ffda]">Save</button>
                    <button type="button" onClick={() => setEditingUserId(null)} className="font-mono text-xs text-[#8892b0]">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#8892b0]">
                      Families <span className="font-semibold text-white">{u.familyCount}</span> / cap{' '}
                      <span className="font-mono font-semibold text-white">{u.maxFamilyMemberships}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUserId(u.id)
                        setEditingCap(u.maxFamilyMemberships)
                      }}
                      className="inline-flex items-center gap-1 text-[#8892b0] hover:text-[#64ffda]"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit cap
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
        <div className="hidden bg-[#112240] border border-[#172a45] rounded-2xl overflow-hidden shadow-xl lg:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#ccd6f6]">
              <thead className="bg-[#0a192f]/80 text-[11px] font-mono uppercase text-[#8892b0] border-b border-[#172a45]">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Currency / TZ</th>
                  <th className="px-6 py-3.5">Families</th>
                  <th className="px-6 py-3.5">Membership Cap</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#172a45]/60 font-sans">
                {data?.items.map((u) => (
                  <tr key={u.id} className="hover:bg-[#172a45]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{u.displayName}</div>
                      <div className="text-xs text-[#8892b0] font-mono">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[#64ffda]">
                      {u.personalCode}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-mono text-white">{u.personalCurrency}</span>
                      <span className="text-[#8892b0] ml-2">({u.timezone})</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <span className="font-semibold text-white">{u.familyCount}</span>
                        <span className="text-[#8892b0]"> / {u.maxFamilyMemberships} families</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {u.families.map((f) => (
                          <span
                            key={f.id}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                              f.isFamilyManager
                                ? 'bg-[#64ffda]/10 border-[#64ffda]/30 text-[#64ffda]'
                                : 'bg-[#172a45]/40 border-[#233554] text-[#8892b0]'
                            }`}
                          >
                            {f.name} {f.isFamilyManager ? '(Head)' : ''}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUserId === u.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={editingCap}
                            onChange={(e) => setEditingCap(parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 bg-[#0a192f] border border-[#64ffda] rounded text-white text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCap(u.id)}
                            className="text-xs font-mono text-[#64ffda] hover:underline"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="text-xs font-mono text-[#8892b0] hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-white">{u.maxFamilyMemberships}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(u.id)
                              setEditingCap(u.maxFamilyMemberships)
                            }}
                            className="text-[#8892b0] hover:text-[#64ffda] transition-colors"
                            title="Edit family membership cap"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id, u.displayName)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete user"
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
