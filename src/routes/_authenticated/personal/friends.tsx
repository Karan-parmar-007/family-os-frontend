import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { CopyIcon, Loader2Icon, UserPlusIcon, UsersIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '#/components/layout/app-shell'
import { BentoCard, BentoGrid } from '#/components/bento/bento'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import {
  useCancelFriend,
  useConfirmFriend,
  useFriendCode,
  useFriends,
  useRejectFriend,
  useRequestFriend,
} from '#/hooks/api/use-friends'
import { useCurrentUser } from '#/hooks/api/use-current-user'
import { ApiError } from '#/lib/api'

export const Route = createFileRoute('/_authenticated/personal/friends')({
  component: FriendsPage,
})

function FriendsPage() {
  const { data: user } = useCurrentUser()
  const { data: codeData, isLoading: codeLoading } = useFriendCode()
  const { data, isLoading, isError } = useFriends()
  const requestFriend = useRequestFriend()
  const confirmFriend = useConfirmFriend()
  const rejectFriend = useRejectFriend()
  const cancelFriend = useCancelFriend()
  const [friendCodeInput, setFriendCodeInput] = useState('')

  const friendCode = codeData?.friendCode ?? user?.friend_code ?? ''

  const { incoming, outgoing, active } = useMemo(() => {
    const items = data?.items ?? []
    return {
      incoming: items.filter((f) => f.direction === 'INCOMING'),
      outgoing: items.filter((f) => f.direction === 'OUTGOING'),
      active: items.filter((f) => f.direction === 'ACTIVE' || f.status === 'ACTIVE'),
    }
  }, [data?.items])

  const copyCode = async () => {
    if (!friendCode) return
    try {
      await navigator.clipboard.writeText(friendCode)
      toast.success('Friend code copied')
    } catch {
      toast.error('Failed to copy code')
    }
  }

  const submitRequest = () => {
    const code = friendCodeInput.trim()
    if (code.length !== 8) {
      toast.error('Enter an 8-character friend code')
      return
    }
    requestFriend.mutate(
      { friendCode: code },
      {
        onSuccess: () => {
          toast.success('Friend request sent')
          setFriendCodeInput('')
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : 'Failed to send request'),
      },
    )
  }

  return (
    <AppShell>
      <BentoGrid>
        <BentoCard className="col-span-full">
          <div className="flex items-center gap-2">
            <UsersIcon className="size-5 text-brand" />
            <h1 className="text-xl font-semibold">Friends</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect with people outside your families to split personal amounts or send personal transfers.
          </p>
        </BentoCard>

        <BentoCard className="col-span-full lg:col-span-2">
          <h2 className="text-sm font-semibold">Your friend code</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Share this code so others can send you a friend request.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {codeLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <>
                <Badge variant="secondary" className="font-mono text-base px-3 py-1.5">
                  {friendCode || '--------'}
                </Badge>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={copyCode} disabled={!friendCode}>
                  <CopyIcon className="size-3.5" />
                  Copy
                </Button>
              </>
            )}
          </div>
        </BentoCard>

        <BentoCard className="col-span-full lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <UserPlusIcon className="size-4 text-brand" />
            Add a friend
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter their 8-character friend code to send a request.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <Input
              value={friendCodeInput}
              onChange={(e) => setFriendCodeInput(e.target.value.replace(/\s/g, '').slice(0, 8))}
              placeholder="ABCD1234"
              className="max-w-xs font-mono uppercase"
              autoCapitalize="characters"
            />
            <Button
              onClick={submitRequest}
              disabled={requestFriend.isPending || friendCodeInput.length !== 8}
            >
              {requestFriend.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              Send request
            </Button>
          </div>
        </BentoCard>

        {isError && (
          <BentoCard className="col-span-full">
            <p className="text-sm text-muted-foreground">Friends are not enabled on this server.</p>
          </BentoCard>
        )}

        {isLoading ? (
          <BentoCard className="col-span-full">
            <Skeleton className="h-24 w-full" />
          </BentoCard>
        ) : (
          <>
            <FriendListSection
              title="Pending — requests to you"
              empty="No incoming requests."
              items={incoming}
              actions={(item) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      confirmFriend.mutate(item.id, {
                        onSuccess: () => toast.success('Friend request accepted'),
                        onError: (err) =>
                          toast.error(err instanceof ApiError ? err.message : 'Failed to confirm'),
                      })
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      rejectFriend.mutate(item.id, {
                        onSuccess: () => toast.success('Request rejected'),
                        onError: (err) =>
                          toast.error(err instanceof ApiError ? err.message : 'Failed to reject'),
                      })
                    }
                  >
                    Reject
                  </Button>
                </div>
              )}
            />
            <FriendListSection
              title="Pending — requests you sent"
              empty="No outgoing requests."
              items={outgoing}
              actions={(item) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    cancelFriend.mutate(item.id, {
                      onSuccess: () => toast.success('Request cancelled'),
                      onError: (err) =>
                        toast.error(err instanceof ApiError ? err.message : 'Failed to cancel'),
                    })
                  }
                >
                  Cancel
                </Button>
              )}
            />
            <FriendListSection
              title="Active friends"
              empty="No friends yet — share your code or send a request."
              items={active}
            />
          </>
        )}
      </BentoGrid>
    </AppShell>
  )
}

function FriendListSection({
  title,
  empty,
  items,
  actions,
}: {
  title: string
  empty: string
  items: Array<{ id: string; otherUserName?: string | null; status: string }>
  actions?: (item: { id: string }) => React.ReactNode
}) {
  return (
    <BentoCard className="col-span-full">
      <h2 className="text-sm font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
            >
              <span className="font-medium">{item.otherUserName ?? 'User'}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{item.status}</Badge>
                {actions?.(item)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </BentoCard>
  )
}
