import { useState, useEffect } from 'react'
import type { HTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '#/lib/utils'

export function FosModalOverlay({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-[#0a192f]/85 backdrop-blur-md animate-in fade-in duration-200',
        className,
      )}
      {...props}
    >
      <div className="flex min-h-full w-full items-start justify-center px-3 py-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:px-6 sm:py-8">
        {children}
      </div>
    </div>,
    document.body,
  )
}