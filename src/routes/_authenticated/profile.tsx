import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2Icon, KeyIcon, MailIcon, UserIcon, CoinsIcon, ShieldIcon, CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '#/components/layout/app-shell'
import { Button } from '#/components/ui/button'
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
import { useCurrentUser } from '#/hooks/api/use-current-user'
import { useUpdateProfile } from '#/hooks/api/use-me'
import { ApiError } from '#/lib/api'
import { CURRENCIES } from '#/lib/currencies'
import { ssoLoginUrl } from '#/lib/sso'

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { data: user } = useCurrentUser()

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profile Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Display name, currency, and personal code. Email and password live in SSO.
          </p>
        </div>

        <div className="space-y-6">
          <ProfileSection />
          <FriendCodeSection />
          <CurrencySection />
          <SsoAccountSection />
          {user?.is_super_admin && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldIcon className="size-5 text-brand" />
                  Super Admin
                </CardTitle>
                <CardDescription>
                  Cron, users, families, and currencies live on the platform admin hub.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link to="/admin">Open platform admin</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function FriendCodeSection() {
  const { data: user, isLoading } = useCurrentUser()
  const code = user?.friend_code ?? ''

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CopyIcon className="size-5 text-brand" />
          Friend code
        </CardTitle>
        <CardDescription>
          Share this code so others can send you a friend request.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-muted px-3 py-2 font-mono text-base tracking-widest">
            {code || '--------'}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!code}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code)
                toast.success('Friend code copied')
              } catch {
                toast.error('Failed to copy code')
              }
            }}
          >
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CurrencySection() {
  const { data: user, isLoading } = useCurrentUser()
  const update = useUpdateProfile()
  const [personalCurrency, setPersonalCurrency] = useState('USD')

  useEffect(() => {
    if (user) {
      setPersonalCurrency(user.personal_currency)
    }
  }, [user])

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  const handleSave = () => {
    update.mutate(
      { currencyCode: personalCurrency },
      {
        onSuccess: () => toast.success('Currency updated'),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : 'Update failed'),
      },
    )
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CoinsIcon className="size-5 text-brand" />
          Currency Preferences
        </CardTitle>
        <CardDescription>
          Amounts are shown in your personal currency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Personal currency</label>
          <Select value={personalCurrency} onValueChange={setPersonalCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending && <Loader2Icon className="size-4 animate-spin mr-2" />}
          Save currency
        </Button>
      </CardContent>
    </Card>
  )
}

const profileSchema = z.object({
  name: z.string().min(2, 'Enter your name'),
})

function ProfileSection() {
  const { data: user, isLoading } = useCurrentUser()
  const update = useUpdateProfile()
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (user) form.reset({ name: user.name })
  }, [user, form])

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  const onSubmit = form.handleSubmit((values) => {
    update.mutate(
      { displayName: values.name },
      {
        onSuccess: () => toast.success('Profile updated'),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : 'Update failed'),
      },
    )
  })

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="size-5 text-brand" />
          User Details
        </CardTitle>
        <CardDescription>Update your display name.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && (
                <Loader2Icon className="size-4 animate-spin mr-2" />
              )}
              Save display name
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function SsoAccountSection() {
  const { data: user } = useCurrentUser()
  const sso = import.meta.env.VITE_SSO_URL || 'http://localhost:5173'

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyIcon className="size-5 text-brand" />
          Email and password
        </CardTitle>
        <CardDescription>
          Sign-in credentials are owned by SSO. Family OS only stores your workspace profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MailIcon className="size-4" />
          {user?.email || 'Signed in via SSO'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={sso}>Open SSO account</a>
          </Button>
          <Button asChild variant="ghost">
            <a href={ssoLoginUrl('/profile')}>Re-authenticate</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
