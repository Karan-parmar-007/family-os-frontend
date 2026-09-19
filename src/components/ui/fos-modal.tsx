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
        'fixed inset-0 z-[100] flex items-center justify-center bg-[#0a192f]/85 p-4 sm:p-6 md:p-8 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto',
        className,
      )}
      {...props}
    >
      {children}
    </div>,
    document.body,
  )
}