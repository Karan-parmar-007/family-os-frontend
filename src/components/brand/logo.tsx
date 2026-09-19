import { cn } from '#/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-positive text-primary-foreground shadow-[0_8px_24px_-8px_var(--brand)]',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-5"
        aria-hidden="true"
      >
        <path
          d="M3 11.2 12 4l9 7.2"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 10v9h14v-9"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9.2" cy="13.4" r="1.3" fill="currentColor" />
        <circle cx="14.8" cy="13.4" r="1.3" fill="currentColor" />
        <path
          d="M8 19v-1.4a1.6 1.6 0 0 1 3.2 0V19M12.8 19v-1.4a1.6 1.6 0 0 1 3.2 0V19"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

export function Logo({
  className,
  withWordmark = true,
}: {
  className?: string
  withWordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {withWordmark && (
        <span className="text-lg font-bold tracking-tight">
          family<span className="text-brand">os</span>
        </span>
      )}
    </span>
  )
}
