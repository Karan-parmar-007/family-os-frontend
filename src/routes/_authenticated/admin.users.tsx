import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
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
  const { data, isLoading } = useAdminUsers()
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
      {isLoading ? (
        <div className="text-center py-12 text-[#8892b0] font-mono text-sm">Loading users...</div>
      ) : (
        <div className="bg-[#112240] border border-[#172a45] rounded-2xl overflow-hidden shadow-xl">
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
      )}
    </div>
  )
}
