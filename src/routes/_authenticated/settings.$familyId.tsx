
import {
  useFamilyJoinRequests,
  useAcceptJoinRequest,
  useDeclineJoinRequest,
  useCreateFamilyInvite,
  useFamilies,
  useFamilyMembers,
  useUpdateFamily,
} from '#/hooks/api/familyos/use-families'
import { CopyIcon, CheckIcon, ClockIcon, UserCheckIcon, UserXIcon } from 'lucide-react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2Icon, UserPlusIcon, SettingsIcon, UsersIcon, ChevronLeftIcon, LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '#/components/layout/app-shell'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Skeleton } from '#/components/ui/skeleton'
import {
  useAcceptRelationship,
  useConnectByCode,
  useRejectRelationship,
  useRelationships,
  useRemoveRelationship,
} from '#/hooks/api/familyos/use-relationships'
import { ApiError } from '#/lib/api'
import { CURRENCIES } from '#/lib/currencies'

export const Route = createFileRoute('/_authenticated/settings/$familyId')({
  component: FamilySettingsPage,
})

function isHead(family: { is_manager?: boolean; isManager?: boolean } | undefined) {
  return Boolean(family?.is_manager ?? family?.isManager)
}

function FamilySettingsPage() {
  const { familyId } = Route.useParams()
  const { data: familiesData, isLoading: loadingFamilies } = useFamilies()
  const navigate = useNavigate()

  const family = familiesData?.items.find((f) => f.id === familyId)
  const isFamilyHead = isHead(family)

  useEffect(() => {
    if (!loadingFamilies && familiesData && !family) {
      toast.error('Family not found')
      navigate({ to: '/families' })
    }
  }, [familiesData, family, loadingFamilies, navigate])

  if (loadingFamilies) {
    return (
      <AppShell familyId={familyId}>
        <div className="w-full space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell familyId={familyId}>
      <div className="w-full space-y-6">
        <div>
          <Link
            to="/families"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground no-underline hover:text-brand"
          >
            <ChevronLeftIcon className="size-3.5" />
            All families
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {family?.name} Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your household name, currency preference, members, and linked families.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {family && (
            <>
              <FamilyDetailsSection family={family} isFamilyHead={isFamilyHead} />
              <FamilyCodesSection family={family} />
              <JoinRequestsInboxSection familyId={familyId} isFamilyHead={isFamilyHead} />
              <FamilyMembersSection familyId={familyId} familyName={family.name} />
              <FamilyInviteSection familyId={familyId} familyName={family.name} isFamilyHead={isFamilyHead} />
              <FamilyRelationshipsSection
                familyId={familyId}
                familyName={family.name}
                isFamilyHead={isFamilyHead}
                linkCode={family.linkCode || ''}
              />
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}

const familyDetailsSchema = z.object({
  name: z.string().min(1, 'Family name is required'),
  currency: z.string().length(3, 'Currency must be exactly 3 characters'),
})

function FamilyDetailsSection({
  family,
  isFamilyHead,
}: {
  family: any
  isFamilyHead: boolean
}) {
  const updateFamily = useUpdateFamily()
  const form = useForm<z.infer<typeof familyDetailsSchema>>({
    resolver: zodResolver(familyDetailsSchema),
    defaultValues: {
      name: family.name,
      currency: family.currency,
    },
  })

  useEffect(() => {
    form.reset({
      name: family.name,
      currency: family.currency,
    })
  }, [family, form])

  const onSubmit = form.handleSubmit((values) => {
    updateFamily.mutate(
      {
        familyId: family.id,
        body: {
          name: values.name,
          currency: values.currency,
        },
      },
      {
        onSuccess: () => {
          toast.success('Family settings updated successfully')
        },
        onError: (err: any) => {
          toast.error(err instanceof ApiError ? err.message : 'Failed to update family details')
        },
      }
    )
  })

  return (
    <Card className="glass xl:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="size-5 text-brand" />
          Household Details
        </CardTitle>
        <CardDescription>
          {isFamilyHead
            ? 'Update the family name and selected currency used for dashboards.'
            : 'View family details. Only the Family Head can modify these.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Family Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!isFamilyHead} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Currency</FormLabel>
                  <Select
                    disabled={!isFamilyHead}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isFamilyHead && (
              <Button type="submit" disabled={updateFamily.isPending}>
                {updateFamily.isPending && (
                  <Loader2Icon className="size-4 animate-spin mr-2" />
                )}
                Save changes
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function FamilyMembersSection({
  familyId,
  familyName,
}: {
  familyId: string
  familyName: string
}) {
  const { data: membersData, isLoading: loadingMembers, isError, error } = useFamilyMembers(familyId)
  const members = membersData?.items ?? []

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="size-5 text-brand" />
          Household Members
        </CardTitle>
        <CardDescription>
          View all members registered under {familyName}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingMembers ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-[#f87171]">
            {error instanceof ApiError ? error.message : 'Could not load members.'}
          </p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members found for this household.</p>
        ) : (
          <div className="divide-y divide-border rounded-xl border bg-background/30 p-4">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={m.isFamilyManager ? 'default' : 'secondary'}>
                    {m.isFamilyManager ? 'Family Head' : 'Member'}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    Joined {new Date(m.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

function FamilyInviteSection({
  familyId,
  familyName,
  isFamilyHead,
}: {
  familyId: string
  familyName: string
  isFamilyHead: boolean
}) {
  const invite = useCreateFamilyInvite(familyId)
  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    invite.mutate(values.email, {
      onSuccess: (res: any) => {
        toast.success(res.message ?? 'Invitation created')
        form.reset()
      },
      onError: (err: any) => {
        toast.error(err instanceof ApiError ? err.message : 'Invite failed')
      },
    })
  })

  if (!isFamilyHead) {
    return (
      <div className="rounded-xl border border-border bg-background/30 p-4 text-sm text-muted-foreground xl:col-span-2">
        Only the Family Head (manager) can invite or add new members to this family.
      </div>
    )
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlusIcon className="size-5 text-brand" />
          Invite Household Member
        </CardTitle>
        <CardDescription>
          As Family Head, you can send an invitation link to new users to join {familyName}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="member@family.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="gap-2" disabled={invite.isPending}>
              {invite.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <UserPlusIcon className="size-4" />
              )}
              Send invite
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function FamilyRelationshipsSection({
  familyId,
  familyName,
  isFamilyHead,
  linkCode,
}: {
  familyId: string
  familyName: string
  isFamilyHead: boolean
  linkCode: string
}) {
  const { data, isLoading } = useRelationships(familyId)
  const connectByCode = useConnectByCode(familyId)
  const acceptRelationship = useAcceptRelationship(familyId)
  const rejectRelationship = useRejectRelationship(familyId)
  const removeRelationship = useRemoveRelationship(familyId)

  const items = data?.items ?? []
  const [otherFamilyCode, setOtherFamilyCode] = useState('')

  const isPendingAny =
    acceptRelationship.isPending ||
    rejectRelationship.isPending ||
    removeRelationship.isPending ||
    connectByCode.isPending

  return (
    <Card className="glass xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="size-5 text-brand" />
          Family Relationships
        </CardTitle>
        <CardDescription>
          Link {familyName} with another family using their 8-digit link code to enable cross-family transfers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFamilyHead ? (
          <div className="rounded-xl border border-border p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Your family link code</p>
                <p className="text-xs text-muted-foreground">
                  Share this code with the other family head to connect instantly.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-base">
                  {linkCode || '—'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!linkCode) return
                    try {
                      await navigator.clipboard.writeText(linkCode)
                      toast.success('Code copied')
                    } catch {
                      toast.error('Failed to copy code')
                    }
                  }}
                  disabled={!linkCode}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px] space-y-1">
                <p className="text-xs text-muted-foreground">Other family link code</p>
                <Input
                  value={otherFamilyCode}
                  onChange={(e) => setOtherFamilyCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="12345678"
                  inputMode="numeric"
                />
              </div>
              <Button
                disabled={isPendingAny || otherFamilyCode.length !== 8}
                onClick={() => {
                  connectByCode.mutate(
                    { joinCode: otherFamilyCode },
                    {
                      onSuccess: () => {
                        toast.success('Families connected')
                        setOtherFamilyCode('')
                      },
                      onError: (err: any) =>
                        toast.error(err instanceof ApiError ? err.message : 'Failed to connect'),
                    },
                  )
                }}
              >
                {connectByCode.isPending ? (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                ) : null}
                Connect families
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Only the Family Head can link another household.
          </p>
        )}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No relationships yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const isInitiator = item.initiatedByFamilyId === familyId
              const canRespond = isFamilyHead && item.status === 'PENDING' && !isInitiator
              const canRemove = isFamilyHead && item.status === 'ACTIVE'
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.label || item.relationshipType || 'Family relationship'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.status === 'ACTIVE'
                        ? 'Connected'
                        : isInitiator
                          ? 'Requested by your family'
                          : 'Requested by other family'} · {item.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canRespond && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPendingAny}
                          onClick={() =>
                            acceptRelationship.mutate(item.id, {
                              onSuccess: () => toast.success('Relationship accepted'),
                              onError: (err: any) =>
                                toast.error(err instanceof ApiError ? err.message : 'Failed to accept'),
                            })
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPendingAny}
                          onClick={() =>
                            rejectRelationship.mutate(item.id, {
                              onSuccess: () => toast.success('Relationship rejected'),
                              onError: (err: any) =>
                                toast.error(err instanceof ApiError ? err.message : 'Failed to reject'),
                            })
                          }
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {canRemove && (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPendingAny}
                        onClick={() =>
                          removeRelationship.mutate(item.id, {
                            onSuccess: () => toast.success('Relationship removed'),
                            onError: (err: any) =>
                              toast.error(err instanceof ApiError ? err.message : 'Failed to remove'),
                          })
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


function FamilyCodesSection({ family }: { family: any; isFamilyHead?: boolean }) {
  const [copiedMember, setCopiedMember] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const copyCode = (code: string, type: 'member' | 'link') => {
    navigator.clipboard.writeText(code)
    if (type === 'member') {
      setCopiedMember(true)
      setTimeout(() => setCopiedMember(false), 2000)
    } else {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
    toast.success('Code copied to clipboard')
  }

  return (
    <Card className="border-navy-800 bg-navy-900/60">
      <CardHeader>
        <CardTitle className="text-lg text-slate-100">Household Codes</CardTitle>
        <CardDescription className="text-slate-400">
          Distinct codes for member enrollment and cross-household transfers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-navy-800 bg-navy-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Family Join Code</span>
              <Badge variant="outline" className="border-mint-500/30 text-mint-400 bg-mint-500/10 text-xs">Membership</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Share with individuals who should become members of this family.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-mint-400 tracking-wider">
              {family.membership_code || family.membershipCode || '—'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyCode(family.membership_code || family.membershipCode, 'member')}
              className="border-navy-700 hover:border-mint-500/40"
            >
              {copiedMember ? <CheckIcon className="size-4 text-mint-400" /> : <CopyIcon className="size-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-navy-800 bg-navy-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Family Link Code</span>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-xs">Transfers</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Used to connect two households for cross-family money transfers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-cyan-400 tracking-wider">
              {family.link_code || family.linkCode || family.join_code || '—'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyCode(family.link_code || family.linkCode || family.join_code, 'link')}
              className="border-navy-700 hover:border-cyan-500/40"
            >
              {copiedLink ? <CheckIcon className="size-4 text-cyan-400" /> : <CopyIcon className="size-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function JoinRequestsInboxSection({ familyId, isFamilyHead }: { familyId: string; isFamilyHead: boolean }) {
  const { data, isLoading } = useFamilyJoinRequests(familyId, isFamilyHead)
  const acceptReq = useAcceptJoinRequest(familyId)
  const declineReq = useDeclineJoinRequest(familyId)

  if (!isFamilyHead) return null

  const items = data?.items ?? []

  return (
    <Card className="border-navy-800 bg-navy-900/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
              Join Requests Inbox
              {items.length > 0 && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">{items.length} pending</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-400">
              Review and approve member applications submitted with your family join code.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-20 w-full bg-navy-950" />}
        {!isLoading && items.length === 0 && (
          <div className="py-6 text-center text-sm text-slate-500">
            No pending join requests at this time.
          </div>
        )}
        {!isLoading && items.length > 0 && (
          <div className="space-y-3">
            {items.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-navy-800 bg-navy-950/70"
              >
                <div>
                  <h4 className="font-semibold text-slate-200">{req.userName}</h4>
                  <p className="text-xs text-slate-400">{req.userEmail}</p>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                    <ClockIcon className="size-3" /> Requested on {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-mint-500 text-navy-950 hover:bg-mint-400 font-semibold"
                    disabled={acceptReq.isPending}
                    onClick={() => {
                      acceptReq.mutate(req.id, {
                        onSuccess: () => toast.success(`Accepted ${req.userName}`),
                        onError: (err: any) => toast.error(err?.message || 'Could not accept request'),
                      })
                    }}
                  >
                    <UserCheckIcon className="mr-1.5 size-4" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-navy-700 text-slate-300 hover:text-red-400 hover:border-red-500/30"
                    disabled={declineReq.isPending}
                    onClick={() => {
                      declineReq.mutate(req.id, {
                        onSuccess: () => toast.success(`Declined ${req.userName}`),
                        onError: (err: any) => toast.error(err?.message || 'Could not decline request'),
                      })
                    }}
                  >
                    <UserXIcon className="mr-1.5 size-4" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
