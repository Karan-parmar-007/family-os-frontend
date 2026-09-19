import { Link } from '@tanstack/react-router'
import { ArrowLeft, Home, FileQuestion } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Logo } from '#/components/brand/logo'

export function NotFound() {
  return (
    <div className="flex min-h-[85vh] w-full flex-col items-center justify-center p-4">
      <div className="glass rise-in flex w-full max-w-md flex-col items-center text-center p-8 rounded-2xl gap-6">
        <Logo className="mb-2" />

        <div className="relative flex items-center justify-center size-20 rounded-full bg-brand/10 text-brand">
          <FileQuestion className="size-10 stroke-[1.5]" />
          <div className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-negative text-[10px] font-bold text-white shadow-md">
            404
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We searched the network logs, but the page you are looking for does
            not exist or has been moved to a new address.
          </p>
        </div>

        <div className="flex w-full flex-col sm:flex-row gap-3 mt-2">
          <Button
            variant="outline"
            className="w-full justify-center gap-2 cursor-pointer transition-all duration-200"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="size-4" />
            Go back
          </Button>
          <Button
            asChild
            className="w-full justify-center gap-2 bg-gradient-to-r from-brand to-positive hover:from-brand/90 hover:to-positive/90 border-0 text-white font-medium shadow-[0_4px_14px_rgba(45,212,191,0.25)] hover:shadow-[0_6px_20px_rgba(45,212,191,0.35)] cursor-pointer transition-all duration-200"
          >
            <Link to="/">
              <Home className="size-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
