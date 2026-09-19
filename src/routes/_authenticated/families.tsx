import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRightIcon,
  CrownIcon,
  Loader2Icon,
  PlusIcon,
  UsersIcon,
  LogInIcon,
  Building2Icon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '#/components/brand/logo'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import { useCreateFamily, useFamilies, useSubmitJoinRequest } from '#/hooks/api/familyos/use-families'
import { useCurrentUser } from '#/hooks/api/familyos/use-current-user'
import { useLogout } from '#/hooks/api/familyos/use-auth'
import { currenciesApi } from '#/lib/api/familyos/endpoints/currencies'
import { ApiError } from '#/lib/api'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_authenticated/families')({
  component: FamiliesPage,
})

interface CreateFamilyFormValues {
  name: string
  currency: string
  originAmount: number
}

interface JoinFamilyFormValues {
  membershipCode: string
}

const createSchema = z.object({
  name: z.string().trim().min(2, 'Give your family a name'),
  currency: z.string().min(3).max(3),
  originAmount: z.coerce.number().min(1, 'Initial opening balance must be at least 1.0'),
})

const joinSchema = z.object({
  membershipCode: z.string().trim().length(8, 'Family membership code must be exactly 8 digits'),
})

const FALLBACK_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
]

function FamiliesPage() {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const { data, isLoading, isError } = useFamilies()
  const createFamily = useCreateFamily()
  const submitJoin = useSubmitJoinRequest()
  const logout = useLogout()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  const { data: currenciesData } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => currenciesApi.list(),
    staleTime: 5 * 60 * 1000,
  })

  const currencyOptions = useMemo(() => {
    if (currenciesData?.items && currenciesData.items.length > 0) {
      return currenciesData.items.filter((c) => c.isActive !== false)
    }
    return FALLBACK_CURRENCIES
  }, [currenciesData])

  const membershipCount = data?.membershipCount ?? data?.items.length ?? 0
  const maxMemberships = data?.maxFamilyMemberships ?? 2
  const isAtCap = membershipCount >= maxMemberships

  const defaultCurrency = user?.preferred_currency || 'USD'

  const createForm = useForm<CreateFamilyFormValues>({
    resolver: zodResolver(createSchema) as any,
    defaultValues: { name: '', currency: defaultCurrency, originAmount: 100 },
  })

  useEffect(() => {
    if (user?.preferred_currency && !createForm.getValues('name')) {
      createForm.setValue('currency', user.preferred_currency)
    }
  }, [user?.preferred_currency, createForm])

  const joinForm = useForm<JoinFamilyFormValues>({
    resolver: zodResolver(joinSchema) as any,
    defaultValues: { membershipCode: '' },
  })

  const onCreate = createForm.handleSubmit((values) => {
    createFamily.mutate(
      {
        name: values.name,
        currency: values.currency,
        timezone: 'Asia/Kolkata',
        originAmount: values.originAmount,
      },
      {
        onSuccess: (res) => {
          toast.success(`"${res.name}" created`)
          setCreateOpen(false)
          createForm.reset({ name: '', currency: defaultCurrency, originAmount: 100 })
          navigate({ to: '/dashboard/$familyId', params: { familyId: res.id } })
        },
        onError: (error) =>
          toast.error(
            error instanceof ApiError
              ? error.message
              : 'Could not create family',
          ),
      },
    )
  })

  const onJoin = joinForm.handleSubmit((values) => {
    submitJoin.mutate(values.membershipCode, {
      onSuccess: () => {
        toast.success('Join request sent! Awaiting family head approval.')
        setJoinOpen(false)
        joinForm.reset()
      },
      onError: (error) =>
        toast.error(
          error instanceof ApiError
            ? error.message
            : 'Could not submit join request',
        ),
    })
  })

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => navigate({ to: '/' }),
    })
  }

  const families = data?.items ?? []

  return (
    <div className="min-h-screen bg-[#0a192f] text-[#ccd6f6]">
      <header className="sticky top-0 z-40 border-b border-[#172a45]/80 bg-[#0a192f]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-[#64ffda]/30 text-[#64ffda] bg-[#64ffda]/10 font-mono text-xs">
              {membershipCount} of {maxMemberships} families
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#8892b0] hover:text-[#e6f1ff] hover:bg-[#112240]">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-[#64ffda] uppercase tracking-wider mb-1">Choose a household</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-[#e6f1ff]">
              Hi {user?.name?.split(' ')[0] ?? 'there'}, which family today?
            </h1>
            <p className="mt-1 text-sm text-[#8892b0]">
              Open an existing family dashboard, enter a family code, or start a new household.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#172a45] bg-[#112240]/80 text-[#ccd6f6] hover:border-[#64ffda]/50 hover:text-[#64ffda] cursor-pointer"
                >
                  <LogInIcon className="mr-2 size-4 text-[#64ffda]" />
                  Join by Code
                </Button>
              </DialogTrigger>
              <DialogContent className="border-[#172a45] bg-[#112240] text-[#e6f1ff] sm:max-w-md shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-[#e6f1ff] flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#64ffda]/10 text-[#64ffda]">
                      <LogInIcon className="size-4" />
                    </span>
                    Join a Family
                  </DialogTitle>
                  <DialogDescription className="text-[#8892b0]">
                    Enter the 8-digit membership code provided by the family head.
                  </DialogDescription>
                </DialogHeader>
                <Form {...joinForm}>
                  <form onSubmit={onJoin} className="space-y-4 pt-2">
                    <FormField
                      control={joinForm.control}
                      name="membershipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-mono uppercase tracking-wider text-[#8892b0]">
                            8-Digit Membership Code
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="12345678"
                              maxLength={8}
                              className="font-mono tracking-widest text-center text-lg border-[#172a45] bg-[#0a192f] text-[#e6f1ff] focus-visible:border-[#64ffda] focus-visible:ring-[#64ffda]/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-400 font-mono" />
                        </FormItem>
                      )}
                    />
                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold h-10 shadow-lg shadow-[#64ffda]/10 cursor-pointer disabled:opacity-50"
                        disabled={submitJoin.isPending}
                      >
                        {submitJoin.isPending && (
                          <Loader2Icon className="mr-2 size-4 animate-spin" />
                        )}
                        Submit Join Request
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {!isAtCap && (
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold shadow-[0_0_15px_rgba(100,255,218,0.2)] cursor-pointer"
              >
                <PlusIcon className="mr-1.5 size-4" />
                Create Family
              </Button>
            )}
          </div>
        </div>

        {/* Global Create Family Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="border-[#172a45] bg-[#112240] text-[#e6f1ff] sm:max-w-md shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#e6f1ff] flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#64ffda]/10 text-[#64ffda]">
                  <UsersIcon className="size-4" />
                </span>
                Create a Household
              </DialogTitle>
              <DialogDescription className="text-[#8892b0]">
                Start a new family workspace. You will be assigned as the Family Head.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={onCreate} className="space-y-4 pt-2">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase tracking-wider text-[#8892b0]">
                        Family Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. The Wayne Household"
                          className="border-[#172a45] bg-[#0a192f] text-[#e6f1ff] placeholder:text-[#495670] focus-visible:border-[#64ffda] focus-visible:ring-[#64ffda]/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-rose-400 font-mono" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase tracking-wider text-[#8892b0]">
                        Family Currency
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full border-[#172a45] bg-[#0a192f] text-[#e6f1ff] h-10 focus:border-[#64ffda] focus:ring-[#64ffda]/20 cursor-pointer">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-[#172a45] bg-[#112240] text-[#ccd6f6] max-h-60 z-[80]">
                          {currencyOptions.map((c) => (
                            <SelectItem
                              key={c.code}
                              value={c.code}
                              className="focus:bg-[#172a45] focus:text-[#64ffda] cursor-pointer py-2"
                            >
                              <span className="flex items-center gap-2.5 w-full">
                                <span className="font-mono font-bold text-[#64ffda] w-12">{c.code}</span>
                                <span className="text-[#ccd6f6]">{c.name}</span>
                                {c.symbol && (
                                  <span className="ml-auto font-mono text-xs text-[#8892b0]">{c.symbol}</span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs text-rose-400 font-mono" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="originAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-mono uppercase tracking-wider text-[#8892b0]">
                        Initial Opening Pool Balance (≥ 1.0)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="any"
                            min={1}
                            placeholder="100.00"
                            className="border-[#172a45] bg-[#0a192f] text-[#e6f1ff] font-mono pl-3 pr-14 focus-visible:border-[#64ffda] focus-visible:ring-[#64ffda]/20"
                            {...field}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#8892b0] pointer-events-none">
                            {createForm.watch('currency') || 'USD'}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-rose-400 font-mono" />
                    </FormItem>
                  )}
                />
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold h-10 shadow-lg shadow-[#64ffda]/10 cursor-pointer transition-all disabled:opacity-50"
                    disabled={createFamily.isPending}
                  >
                    {createFamily.isPending ? (
                      <>
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                        Creating Household...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="mr-2 size-4" />
                        Create & Open Dashboard
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {isLoading && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl bg-[#112240]" />
            ))}
          </div>
        )}

        {isError && (
          <p className="mt-8 text-sm text-red-400">
            Could not load your families. Check that the backend is running.
          </p>
        )}

        {!isLoading && !isError && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => {
              const isHead = family.is_manager || family.isManager
              return (
                <button
                  key={family.id}
                  type="button"
                  onClick={() =>
                    navigate({
                      to: '/dashboard/$familyId',
                      params: { familyId: family.id },
                    })
                  }
                  className={cn(
                    'group flex flex-col rounded-2xl p-5 text-left border border-[#172a45] bg-[#112240]/60 transition-all hover:border-[#64ffda]/50 hover:bg-[#112240]/90 shadow-lg',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64ffda] cursor-pointer',
                  )}
                >
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#64ffda]/10 text-[#64ffda]">
                      <UsersIcon className="size-5" />
                    </span>
                    {isHead && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300 border border-amber-500/20">
                        <CrownIcon className="size-3" />
                        Family Head
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-[#e6f1ff]">{family.name}</h2>
                  <p className="mt-1 font-mono text-xs text-[#8892b0]">
                    {family.currency} · {family.timezone ?? 'Asia/Kolkata'}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#64ffda] opacity-0 transition group-hover:opacity-100">
                    Open dashboard
                    <ArrowRightIcon className="size-4" />
                  </span>
                </button>
              )
            })}

            {isAtCap ? (
              <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-[#172a45] bg-[#112240]/30 p-5 text-center text-[#495670]">
                <Building2Icon className="mb-2 size-8 text-[#495670]" />
                <span className="text-sm font-medium text-[#8892b0]">Membership Cap Reached</span>
                <p className="mt-1 text-xs text-[#495670] max-w-[220px]">
                  You are in {membershipCount} of {maxMemberships} families. Ask a platform operator to increase your limit.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className={cn(
                  'flex min-h-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#172a45] p-5 bg-[#112240]/20',
                  'text-[#8892b0] transition hover:border-[#64ffda]/50 hover:text-[#e6f1ff] hover:bg-[#112240]/40 cursor-pointer',
                )}
              >
                <span className="mb-2 flex size-11 items-center justify-center rounded-xl border border-dashed border-[#172a45] text-[#64ffda]">
                  <PlusIcon className="size-5" />
                </span>
                <span className="font-medium text-[#e6f1ff]">Create new family</span>
                <span className="mt-1 text-xs text-[#8892b0] font-mono">({membershipCount}/{maxMemberships} used)</span>
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}