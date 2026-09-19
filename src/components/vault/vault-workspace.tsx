import { useState, useEffect, useCallback } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { CategoryPicker } from '#/components/common/category-picker'
import { FosModalOverlay } from '#/components/ui/fos-modal'
import { DocumentUploader } from '#/components/common/document-uploader'
import { useFamilyMembers } from '#/hooks/api/familyos/use-families'
import { apiFetch } from '#/lib/api/familyos/client'
import { documentsApi } from '#/lib/api/familyos/endpoints/documents'
import { toast } from 'sonner'
import {
  LockKeyholeIcon,
  UnlockIcon,
  KeyRoundIcon,
  FileTextIcon,
  EyeIcon,
  EyeOffIcon,
  CopyIcon,
  PlusIcon,
  Trash2Icon,
  ShieldCheckIcon,
  ExternalLinkIcon,
  UserIcon,
  UsersIcon,
  ShieldIcon,
} from 'lucide-react'

export interface VaultItem {
  id: string
  scope: 'FAMILY' | 'PERSONAL'
  familyId?: string | null
  ownerUserId: string
  kind: 'PASSWORD' | 'FILE' | 'DOCUMENT'
  title: string
  category: string
  forPartyType: 'MEMBER' | 'FAMILY' | 'SELF'
  forUserId?: string | null
  documentId?: string | null
  isProtected: boolean
  secret?: string | null
  fileKey?: string | null
  createdAt: string
  updatedAt: string
}

interface VaultListResponse {
  items: VaultItem[]
  pinConfigured: boolean
  isUnlocked: boolean
}

interface VaultWorkspaceProps {
  scope: 'FAMILY' | 'PERSONAL'
  familyId?: string
}

export function VaultWorkspace({ scope, familyId }: VaultWorkspaceProps) {
  const isPersonal = scope === 'PERSONAL'
  const { data: membersData } = useFamilyMembers(familyId || '')
  const members = membersData?.items || []

  const [vaultToken, setVaultToken] = useState<string | null>(() => {
    return sessionStorage.getItem(`vault_token_${scope}_${familyId || 'self'}`) || null
  })
  const [pinConfigured, setPinConfigured] = useState<boolean>(true)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false)
  const [items, setItems] = useState<VaultItem[]>([])
  const [, setLoading] = useState<boolean>(true)

  // Active vault tab: 'passwords' | 'documents'
  const [activeTab, setActiveTab] = useState<'passwords' | 'documents'>('passwords')

  // Modals & PIN
  const [pinInput, setPinInput] = useState('')
  const [showSetupPin, setShowSetupPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showAddPassword, setShowAddPassword] = useState(false)
  const [showAddDoc, setShowAddDoc] = useState(false)

  // Password revealed map
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({})

  // Form state: Password
  const [pwdTitle, setPwdTitle] = useState('')
  const [pwdCategory, setPwdCategory] = useState('Banking & Finance')
  const [pwdParty, setPwdParty] = useState<'FAMILY' | 'MEMBER' | 'SELF'>(isPersonal ? 'SELF' : 'FAMILY')
  const [pwdPartyUserId, setPwdPartyUserId] = useState('')
  const [pwdSecret, setPwdSecret] = useState('')
  const [pwdUsername, setPwdUsername] = useState('')

  // Form state: Document
  const [docTitle, setDocTitle] = useState('')
  const [docCategory, setDocCategory] = useState('Identity & Passports')
  const [docParty, setDocParty] = useState<'FAMILY' | 'MEMBER' | 'SELF'>(isPersonal ? 'SELF' : 'FAMILY')
  const [docPartyUserId, setDocPartyUserId] = useState('')
  const [docAttachmentId, setDocAttachmentId] = useState<string | null>(null)
  const [docAttachmentName, setDocAttachmentName] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (vaultToken) {
        headers['X-Vault-Token'] = vaultToken
      }
      const url = `/api/familyos/vault/items?scope=${scope}${scope === 'FAMILY' && familyId ? `&family_id=${familyId}` : ''}`
      const res = await apiFetch<VaultListResponse>(url, { headers })
      setItems(res.items || [])
      setPinConfigured(res.pinConfigured)
      setIsUnlocked(res.isUnlocked)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load vault items')
    } finally {
      setLoading(false)
    }
  }, [scope, familyId, vaultToken])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pinInput.trim()) return
    try {
      const res = await apiFetch<{ token: string }>('/api/familyos/vault/unlock', {
        method: 'POST',
        json: {
          scope,
          familyId: scope === 'FAMILY' ? familyId : null,
          pin: pinInput.trim(),
        },
      })
      setVaultToken(res.token)
      sessionStorage.setItem(`vault_token_${scope}_${familyId || 'self'}`, res.token)
      setPinInput('')
      toast.success('Vault unlocked')
    } catch (err: any) {
      toast.error(err?.message || 'Incorrect PIN')
    }
  }

  const handleLock = () => {
    setVaultToken(null)
    sessionStorage.removeItem(`vault_token_${scope}_${familyId || 'self'}`)
    setIsUnlocked(false)
    setRevealedIds({})
    toast.info('Vault locked')
  }

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPin.length < 4) {
      toast.error('PIN must be at least 4 digits or characters')
      return
    }
    if (newPin !== confirmPin) {
      toast.error('PINs do not match')
      return
    }
    try {
      await apiFetch('/api/familyos/vault/setup-pin', {
        method: 'POST',
        json: {
          scope,
          familyId: scope === 'FAMILY' ? familyId : null,
          pin: newPin.trim(),
        },
      })
      toast.success('Vault PIN set successfully. Please unlock your vault.')
      setShowSetupPin(false)
      setNewPin('')
      setConfirmPin('')
      fetchItems()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to set PIN')
    }
  }

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwdTitle.trim() || !pwdSecret.trim()) {
      toast.error('Please enter a title and secret password')
      return
    }
    try {
      const payloadSecret = pwdUsername.trim()
        ? `Username: ${pwdUsername.trim()}\nPassword: ${pwdSecret.trim()}`
        : pwdSecret.trim()

      await apiFetch('/api/familyos/vault/items', {
        method: 'POST',
        headers: vaultToken ? { 'X-Vault-Token': vaultToken } : {},
        json: {
          scope,
          familyId: scope === 'FAMILY' ? familyId : null,
          kind: 'PASSWORD',
          title: pwdTitle.trim(),
          category: pwdCategory.trim(),
          forPartyType: isPersonal ? 'SELF' : pwdParty,
          forUserId: !isPersonal && pwdParty === 'MEMBER' ? pwdPartyUserId : null,
          secret: payloadSecret,
          isProtected: true,
        },
      })
      toast.success('Password securely stored')
      setShowAddPassword(false)
      setPwdTitle('')
      setPwdSecret('')
      setPwdUsername('')
      fetchItems()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to store password')
    }
  }

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docTitle.trim()) {
      toast.error('Please enter a document title')
      return
    }
    try {
      await apiFetch('/api/familyos/vault/items', {
        method: 'POST',
        headers: vaultToken ? { 'X-Vault-Token': vaultToken } : {},
        json: {
          scope,
          familyId: scope === 'FAMILY' ? familyId : null,
          kind: 'FILE',
          title: docTitle.trim(),
          category: docCategory.trim(),
          forPartyType: isPersonal ? 'SELF' : docParty,
          forUserId: !isPersonal && docParty === 'MEMBER' ? docPartyUserId : null,
          documentId: docAttachmentId,
          fileKey: docAttachmentName,
          isProtected: false,
        },
      })
      toast.success('Document securely saved to vault')
      setShowAddDoc(false)
      setDocTitle('')
      setDocAttachmentId(null)
      setDocAttachmentName(null)
      fetchItems()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save document')
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this vault item?')) return
    try {
      await apiFetch(`/api/familyos/vault/items/${id}`, { method: 'DELETE' })
      toast.success('Item deleted')
      fetchItems()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete item')
    }
  }

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  // Filter items into the 2 vaults
  const passwordItems = items.filter((i) => i.kind === 'PASSWORD')
  const documentItems = items.filter((i) => i.kind === 'FILE' || i.kind === 'DOCUMENT')

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
              <ShieldIcon className="h-5 w-5 text-emerald-400" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {isPersonal ? 'Personal Vault' : 'Family Vault'}
            </h1>
            {isUnlocked ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                <UnlockIcon className="h-3 w-3" /> Unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400">
                <LockKeyholeIcon className="h-3 w-3" /> Locked
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Encrypted zero-knowledge storage for account passwords and private household documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isUnlocked && (
            <button
              type="button"
              onClick={handleLock}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              <LockKeyholeIcon className="h-3.5 w-3.5 text-rose-400" />
              Lock Vault
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSetupPin(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
          >
            <KeyRoundIcon className="h-3.5 w-3.5 text-slate-400" />
            {pinConfigured ? 'Change PIN' : 'Set PIN'}
          </button>
        </div>
      </div>

      {/* PIN Gate or Content */}
      {!pinConfigured ? (
        <div className="mx-auto max-w-md rounded-2xl border border-[#233554]/90 bg-[#112240]/90 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#64ffda]/20 bg-[#64ffda]/10 text-[#64ffda]">
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-[#e6f1ff]">Create Your Vault PIN</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-[#8892b0]">
            Protect your passwords and private documents with a secure numerical or text PIN.
          </p>
          <button
            type="button"
            onClick={() => setShowSetupPin(true)}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#64ffda] px-4 py-2 text-xs font-semibold text-[#0a192f] hover:bg-[#64ffda]/90"
          >
            Configure Vault PIN
          </button>
        </div>
      ) : !isUnlocked ? (
        <div className="mx-auto max-w-sm rounded-2xl border border-[#233554]/90 bg-[#112240]/90 p-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-[#233554] bg-[#0a192f] text-[#ccd6f6]">
            <LockKeyholeIcon className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-[#e6f1ff]">Vault is Locked</h2>
          <p className="mt-1 text-xs text-[#8892b0]">
            Enter your PIN to access passwords and encrypted files.
          </p>
          <form onSubmit={handleUnlock} className="mt-5 space-y-3">
            <input
              type="password"
              placeholder="Enter Vault PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#233554] bg-[#0a192f] px-3 text-center text-sm font-mono tracking-widest text-[#ccd6f6] placeholder:text-[#8892b0] focus:border-[#64ffda] focus:outline-hidden"
              autoFocus
            />
            <button
              type="submit"
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#64ffda] px-4 text-xs font-semibold text-[#0a192f] transition hover:bg-[#64ffda]/90"
            >
              <UnlockIcon className="h-3.5 w-3.5" /> Unlock
            </button>
          </form>
        </div>
      ) : (
        /* Unlocked 2-Part Vault View */
        <div className="space-y-6">
          {/* Segmented Control Switcher */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-lg border border-white/10 bg-[#0d1117] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('passwords')}
                className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
                  activeTab === 'passwords'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRoundIcon className="h-3.5 w-3.5 text-emerald-400" />
                <span>1. Password Vault</span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] text-slate-300">
                  {passwordItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
                  activeTab === 'documents'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileTextIcon className="h-3.5 w-3.5 text-cyan-400" />
                <span>2. Document Vault</span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] text-slate-300">
                  {documentItems.length}
                </span>
              </button>
            </div>

            <div>
              {activeTab === 'passwords' ? (
                <button
                  type="button"
                  onClick={() => setShowAddPassword(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                >
                  <PlusIcon className="h-3.5 w-3.5" /> Add Password
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddDoc(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-500"
                >
                  <PlusIcon className="h-3.5 w-3.5" /> Add Document
                </button>
              )}
            </div>
          </div>

          {/* Tab 1: Passwords Grid */}
          {activeTab === 'passwords' && (
            <div>
              {passwordItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-slate-500">
                  <KeyRoundIcon className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                  <p className="text-sm font-medium text-slate-300">No passwords in vault</p>
                  <p className="mt-1 text-xs">Store banking logins, wifi credentials, or subscriptions.</p>
                </div>
              ) : (
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {passwordItems.map((item) => {
                    const isRevealed = revealedIds[item.id]
                    const assignedMember = members.find((m) => m.id === item.forUserId)

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0d1117] p-4 transition-colors hover:border-white/20"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="inline-block rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                                {item.category}
                              </span>
                              <h3 className="mt-2 text-sm font-medium text-white truncate">{item.title}</h3>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-rose-400"
                              title="Delete password"
                            >
                              <Trash2Icon className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Attribution tag */}
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                            {item.forPartyType === 'MEMBER' ? (
                              <>
                                <UserIcon className="h-3 w-3 text-slate-500" />
                                <span>{assignedMember?.name || 'Assigned Member'}</span>
                              </>
                            ) : item.forPartyType === 'SELF' ? (
                              <>
                                <UserIcon className="h-3 w-3 text-slate-500" />
                                <span>Personal</span>
                              </>
                            ) : (
                              <>
                                <UsersIcon className="h-3 w-3 text-slate-500" />
                                <span>Entire Household</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Secret Box */}
                        <div className="mt-4 rounded-lg border border-white/5 bg-black/30 p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-slate-300 truncate">
                              {isRevealed && item.secret
                                ? item.secret
                                : '••••••••••••••••'}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleReveal(item.id)}
                                className="rounded p-1 text-slate-400 hover:text-white"
                                title={isRevealed ? 'Hide' : 'Reveal'}
                              >
                                {isRevealed ? (
                                  <EyeOffIcon className="h-3.5 w-3.5" />
                                ) : (
                                  <EyeIcon className="h-3.5 w-3.5" />
                                )}
                              </button>
                              {item.secret && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.secret!)}
                                  className="rounded p-1 text-slate-400 hover:text-white"
                                  title="Copy password"
                                >
                                  <CopyIcon className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Document Vault Grid */}
          {activeTab === 'documents' && (
            <div>
              {documentItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-slate-500">
                  <FileTextIcon className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                  <p className="text-sm font-medium text-slate-300">No documents in vault</p>
                  <p className="mt-1 text-xs">Store passports, identity cards, tax statements, and property deeds.</p>
                </div>
              ) : (
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {documentItems.map((item) => {
                    const assignedMember = members.find((m) => m.id === item.forUserId)
                    const docUrl = item.documentId
                      ? isPersonal || !familyId
                        ? documentsApi.userContentUrl(item.documentId)
                        : documentsApi.contentUrl(familyId, item.documentId)
                      : null

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0d1117] p-4 transition-colors hover:border-white/20"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="inline-block rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                                {item.category}
                              </span>
                              <h3 className="mt-2 text-sm font-medium text-white truncate">{item.title}</h3>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-rose-400"
                              title="Delete document"
                            >
                              <Trash2Icon className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Attribution tag */}
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                            {item.forPartyType === 'MEMBER' ? (
                              <>
                                <UserIcon className="h-3 w-3 text-slate-500" />
                                <span>{assignedMember?.name || 'Assigned Member'}</span>
                              </>
                            ) : item.forPartyType === 'SELF' ? (
                              <>
                                <UserIcon className="h-3 w-3 text-slate-500" />
                                <span>Personal</span>
                              </>
                            ) : (
                              <>
                                <UsersIcon className="h-3 w-3 text-slate-500" />
                                <span>Entire Household</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* File preview / download box */}
                        <div className="mt-4 rounded-lg border border-white/5 bg-black/30 p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-300 truncate">
                              {item.fileKey || 'Attached Document'}
                            </span>
                            {docUrl ? (
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-1 text-[11px] font-medium text-cyan-400 hover:bg-white/10"
                              >
                                <ExternalLinkIcon className="h-3 w-3" /> View
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-500">Record only</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Setup PIN */}
      {showSetupPin && (
        <FosModalOverlay>
          <div className="w-full max-w-sm rounded-2xl border border-[#233554]/90 bg-[#112240]/95 p-6 text-[#ccd6f6] shadow-[0_25px_60px_rgba(2,12,27,0.85)] ring-1 ring-white/5 max-h-[85vh] overflow-y-auto my-auto">
            <h3 className="text-base font-semibold">
              {pinConfigured ? 'Change Vault PIN' : 'Setup Vault PIN'}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Enter a secure PIN of at least 4 digits or characters.
            </p>
            <form onSubmit={handleSetupPin} className="mt-4 space-y-3">
              <div>
                <Label className="text-xs text-[#8892b0]">New PIN</Label>
                <Input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="At least 4 characters"
                  className="mt-1.5 bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-xs text-[#8892b0]">Confirm PIN</Label>
                <Input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Re-type PIN"
                  className="mt-1.5 bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSetupPin(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold">
                  Save PIN
                </Button>
              </div>
            </form>
          </div>
        </FosModalOverlay>
      )}

      {/* Modal: Add Password */}
      {showAddPassword && (
        <FosModalOverlay>
          <div className="w-full max-w-xl rounded-2xl border border-[#233554]/90 bg-[#112240]/95 p-6 sm:p-7 text-[#ccd6f6] shadow-[0_25px_60px_rgba(2,12,27,0.85)] ring-1 ring-white/5 max-h-[88vh] overflow-y-auto my-auto">
            <h3 className="text-base font-semibold">Add Password Entry</h3>
            <form onSubmit={handleCreatePassword} className="mt-4 space-y-3.5">
              <div>
                <Label className="text-xs text-[#8892b0]">Account / Service Title *</Label>
                <Input
                  value={pwdTitle}
                  onChange={(e) => setPwdTitle(e.target.value)}
                  placeholder="e.g. Netflix, Chase Banking, Home WiFi"
                  className="mt-1.5 bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
                  autoFocus
                />
              </div>

              {/* Universal Category Picker for Vault Passwords */}
              <CategoryPicker
                scope={scope}
                categoryType="VAULT_PASSWORD"
                familyId={familyId}
                value={pwdCategory}
                onSelect={(cat) => setPwdCategory(cat.name)}
                label="Category"
              />

              {/* Attribution: Person or Entire Family */}
              {!isPersonal && (
                <div>
                  <Label className="text-xs text-[#8892b0]">Assigned To</Label>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setPwdParty('FAMILY'); setPwdPartyUserId(''); }}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                        pwdParty === 'FAMILY'
                          ? 'border-[#64ffda] bg-[#64ffda]/10 text-[#64ffda]'
                          : 'border-[#233554] bg-[#0a192f] text-[#8892b0] hover:text-[#ccd6f6]'
                      }`}
                    >
                      Entire Household
                    </button>
                    <button
                      type="button"
                      onClick={() => setPwdParty('MEMBER')}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                        pwdParty === 'MEMBER'
                          ? 'border-[#64ffda] bg-[#64ffda]/10 text-[#64ffda]'
                          : 'border-[#233554] bg-[#0a192f] text-[#8892b0] hover:text-[#ccd6f6]'
                      }`}
                    >
                      Specific Member
                    </button>
                  </div>

                  {pwdParty === 'MEMBER' && (
                    <select
                      value={pwdPartyUserId}
                      onChange={(e) => setPwdPartyUserId(e.target.value)}
                      className="mt-2 h-9 w-full rounded-xl border border-[#233554] bg-[#0a192f] px-3 text-xs text-[#ccd6f6] focus:border-[#64ffda] focus:outline-hidden"
                    >
                      <option value="">Select Member...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <Label className="text-xs text-[#8892b0]">Username / Email (Optional)</Label>
                <Input
                  value={pwdUsername}
                  onChange={(e) => setPwdUsername(e.target.value)}
                  placeholder="admin@family.org"
                  className="mt-1.5 bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
                />
              </div>

              <div>
                <Label className="text-xs text-[#8892b0]">Password / Secret *</Label>
                <Input
                  type="password"
                  value={pwdSecret}
                  onChange={(e) => setPwdSecret(e.target.value)}
                  placeholder="Enter secret to encrypt"
                  className="mt-1.5 bg-[#0a192f] border-[#233554] text-[#ccd6f6] font-mono focus:border-[#64ffda]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddPassword(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold">
                  Save to Vault
                </Button>
              </div>
            </form>
          </div>
        </FosModalOverlay>
      )}

      {/* Modal: Add Document */}
      {showAddDoc && (
        <FosModalOverlay>
          <div className="w-full max-w-xl rounded-2xl border border-[#233554]/90 bg-[#112240]/95 p-6 sm:p-7 text-[#ccd6f6] shadow-[0_25px_60px_rgba(2,12,27,0.85)] ring-1 ring-white/5 max-h-[88vh] overflow-y-auto my-auto">
            <h3 className="text-base font-semibold">Add Document Entry</h3>
            <form onSubmit={handleCreateDoc} className="mt-4 space-y-3.5">
              <div>
                <Label className="text-xs text-[#8892b0]">Document Title *</Label>
                <Input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Passport, Tax Return 2025, House Deed"
                  className="mt-1.5 bg-[#0a192f] border-[#233554] text-[#ccd6f6] focus:border-[#64ffda]"
                  autoFocus
                />
              </div>

              {/* Universal Category Picker for Vault Documents */}
              <CategoryPicker
                scope={scope}
                categoryType="VAULT_DOCUMENT"
                familyId={familyId}
                value={docCategory}
                onSelect={(cat) => setDocCategory(cat.name)}
                label="Category"
              />

              {/* Attribution: Person or Entire Family */}
              {!isPersonal && (
                <div>
                  <Label className="text-xs text-[#8892b0]">Assigned To</Label>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setDocParty('FAMILY'); setDocPartyUserId(''); }}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                        docParty === 'FAMILY'
                          ? 'border-[#64ffda] bg-[#64ffda]/10 text-[#64ffda]'
                          : 'border-[#233554] bg-[#0a192f] text-[#8892b0] hover:text-[#ccd6f6]'
                      }`}
                    >
                      Entire Household
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocParty('MEMBER')}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                        docParty === 'MEMBER'
                          ? 'border-[#64ffda] bg-[#64ffda]/10 text-[#64ffda]'
                          : 'border-[#233554] bg-[#0a192f] text-[#8892b0] hover:text-[#ccd6f6]'
                      }`}
                    >
                      Specific Member
                    </button>
                  </div>

                  {docParty === 'MEMBER' && (
                    <select
                      value={docPartyUserId}
                      onChange={(e) => setDocPartyUserId(e.target.value)}
                      className="mt-2 h-9 w-full rounded-xl border border-[#233554] bg-[#0a192f] px-3 text-xs text-[#ccd6f6] focus:border-[#64ffda] focus:outline-hidden"
                    >
                      <option value="">Select Member...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Document File Attachment */}
              <DocumentUploader
                documentId={docAttachmentId}
                documentName={docAttachmentName}
                onDocumentChange={(id, name) => {
                  setDocAttachmentId(id)
                  setDocAttachmentName(name || null)
                }}
                familyId={familyId}
                isPersonal={isPersonal}
                label="Document File (PDF / Images)"
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddDoc(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold">
                  Save Document
                </Button>
              </div>
            </form>
          </div>
        </FosModalOverlay>
      )}
    </div>
  )
}
