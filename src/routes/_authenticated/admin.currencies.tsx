import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAdminCreateCurrency,
  useAdminCurrencies,
  useAdminDeleteCurrency,
  useAdminUpdateCurrency,
} from '#/hooks/api/use-admin'

export const Route = createFileRoute('/_authenticated/admin/currencies')({
  component: AdminCurrenciesPage,
})

function AdminCurrenciesPage() {
  const { data, isLoading } = useAdminCurrencies()
  const createCurrency = useAdminCreateCurrency()
  const updateCurrency = useAdminUpdateCurrency()
  const deleteCurrency = useAdminDeleteCurrency()

  const [showAddModal, setShowAddModal] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [rateToUsd, setRateToUsd] = useState('1.0')

  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [editRate, setEditRate] = useState<string>('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCurrency.mutateAsync({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        symbol: symbol.trim(),
        rateToUsd: parseFloat(rateToUsd),
        isActive: true,
      })
      toast.success('Currency created successfully')
      setShowAddModal(false)
      setCode('')
      setName('')
      setSymbol('')
      setRateToUsd('1.0')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create currency')
    }
  }

  const handleSaveEdit = async (currencyCode: string) => {
    try {
      await updateCurrency.mutateAsync({
        code: currencyCode,
        body: { rateToUsd: parseFloat(editRate) },
      })
      toast.success('Currency rate updated')
      setEditingCode(null)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update currency')
    }
  }

  const handleDelete = async (currencyCode: string) => {
    if (!window.confirm(`Delete currency ${currencyCode}?`)) return
    try {
      await deleteCurrency.mutateAsync(currencyCode)
      toast.success(`Currency ${currencyCode} deleted`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete currency')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-xs text-[#8892b0] font-sans">
          Currencies catalog: Rates are defined as <code className="font-mono text-[#64ffda]">rate_to_usd</code> (1 unit in this currency = X USD). USD is canonical base (1.0).
        </p>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#64ffda] text-[#0a192f] text-xs font-semibold hover:bg-[#64ffda]/90 transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add Currency</span>
        </button>
      </div>

      {showAddModal && (
        <div className="mb-6 p-6 rounded-2xl bg-[#112240] border border-[#233554] shadow-lg">
          <h3 className="text-sm font-bold text-white mb-4">Add New Currency</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8892b0] mb-1">Code (e.g. SEK)</label>
              <input
                type="text"
                maxLength={3}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SEK"
                className="w-full px-3 py-2 bg-[#0a192f] border border-[#233554] rounded-lg text-white font-mono text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8892b0] mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Swedish Krona"
                className="w-full px-3 py-2 bg-[#0a192f] border border-[#233554] rounded-lg text-white text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8892b0] mb-1">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="kr"
                className="w-full px-3 py-2 bg-[#0a192f] border border-[#233554] rounded-lg text-white text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8892b0] mb-1">Rate to USD</label>
              <input
                type="number"
                step="any"
                min="0"
                value={rateToUsd}
                onChange={(e) => setRateToUsd(e.target.value)}
                placeholder="0.095"
                className="w-full px-3 py-2 bg-[#0a192f] border border-[#233554] rounded-lg text-white font-mono text-xs"
                required
              />
            </div>
            <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg border border-[#233554] text-xs font-mono text-[#8892b0] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createCurrency.isPending}
                className="px-4 py-1.5 rounded-lg bg-[#64ffda] text-[#0a192f] text-xs font-semibold hover:bg-[#64ffda]/90"
              >
                Create Currency
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-[#8892b0] font-mono text-sm">Loading currencies...</div>
      ) : (
        <div className="bg-[#112240] border border-[#172a45] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#ccd6f6]">
              <thead className="bg-[#0a192f]/80 text-[11px] font-mono uppercase text-[#8892b0] border-b border-[#172a45]">
                <tr>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Symbol</th>
                  <th className="px-6 py-3.5">Rate to USD</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#172a45]/60 font-sans">
                {data?.items.map((c) => (
                  <tr key={c.code} className="hover:bg-[#172a45]/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#64ffda]">
                      {c.code}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-white">
                      {c.symbol}
                    </td>
                    <td className="px-6 py-4">
                      {editingCode === c.code ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            className="w-24 px-2 py-1 bg-[#0a192f] border border-[#64ffda] rounded text-white text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(c.code)}
                            className="text-[#64ffda] hover:underline text-xs font-mono"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCode(null)}
                            className="text-[#8892b0] hover:underline text-xs font-mono"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white">{c.rateToUsd}</span>
                          {c.code !== 'USD' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCode(c.code)
                                setEditRate(String(c.rateToUsd))
                              }}
                              className="text-[#8892b0] hover:text-[#64ffda]"
                              title="Edit rate"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          c.isActive
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-[#172a45] border-[#233554] text-[#8892b0]'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.code !== 'USD' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c.code)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete currency"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
