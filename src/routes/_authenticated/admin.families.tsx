import { createFileRoute } from '@tanstack/react-router'
import { Home, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminDeleteFamily, useAdminFamilies } from '#/hooks/api/use-admin'

export const Route = createFileRoute('/_authenticated/admin/families')({
  component: AdminFamiliesPage,
})

function AdminFamiliesPage() {
  const { data, isLoading } = useAdminFamilies()
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
      {isLoading ? (
        <div className="text-center py-12 text-[#8892b0] font-mono text-sm">Loading families...</div>
      ) : (
        <div className="bg-[#112240] border border-[#172a45] rounded-2xl overflow-hidden shadow-xl">
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
      )}
    </div>
  )
}
