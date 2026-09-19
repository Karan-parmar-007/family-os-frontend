import * as React from 'react'
import { cn } from '#/lib/utils'

/**
 * Bento layout primitives.
 *
 * `BentoGrid` lays out an asymmetric, modular grid (1 col on mobile, 2 on
 * tablet, 4 on desktop). `BentoCard` is a glassmorphic, rounded tile whose
 * width/height span is controlled via `colSpan` / `rowSpan`.
 */

const colSpanMap: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'sm:col-span-2 lg:col-span-2',
  3: 'sm:col-span-2 lg:col-span-3',
  4: 'sm:col-span-2 lg:col-span-4',
}

const rowSpanMap: Record<number, string> = {
  1: 'lg:row-span-1',
  2: 'lg:row-span-2',
  3: 'lg:row-span-3',
}

export function BentoGrid({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('bento-grid', className)} {...props} />
}

export interface BentoCardProps extends React.ComponentProps<'div'> {
  colSpan?: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2 | 3
  interactive?: boolean
}

export function BentoCard({
  className,
  colSpan = 1,
  rowSpan = 1,
  interactive = false,
  ...props
}: BentoCardProps) {
  const classNameStr = typeof className === 'string' ? className : ''
  const hasExplicitCol = /\b(?:sm:|md:|lg:|xl:)?col-span-/.test(classNameStr)
  const hasExplicitRow = /\b(?:sm:|md:|lg:|xl:)?row-span-/.test(classNameStr)

  return (
    <div
      className={cn(
        'glass relative flex flex-col overflow-hidden rounded-2xl p-5',
        !hasExplicitCol && colSpanMap[colSpan],
        !hasExplicitRow && rowSpanMap[rowSpan],
        interactive && 'glass-hover cursor-pointer',
        className,
      )}
      {...props}
    />
  )
}

export function BentoCardHeader({
  icon,
  title,
  subtitle,
  action,
  accent = 'brand',
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
  accent?: 'brand' | 'positive' | 'negative' | 'warning' | 'info' | 'violet'
}) {
  const accentBg: Record<string, string> = {
    brand: 'bg-brand/15 text-brand',
    positive: 'bg-positive/15 text-positive',
    negative: 'bg-negative/15 text-negative',
    warning: 'bg-warning/15 text-warning',
    info: 'bg-info/15 text-info',
    violet: 'bg-violet/15 text-violet',
  }

  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-xl [&_svg]:size-5',
            accentBg[accent],
          )}
        >
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}
