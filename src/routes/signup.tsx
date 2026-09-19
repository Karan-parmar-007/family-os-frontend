import { redirectIfAuthenticated } from '#/lib/auth/guards'
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { ssoLoginUrl } from "#/lib/sso"

export const Route = createFileRoute("/signup")({
  beforeLoad: redirectIfAuthenticated,
  component: SignupRedirect,
})

function SignupRedirect() {
  useEffect(() => {
    window.location.replace(ssoLoginUrl("/"))
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a192f] text-[#ccd6f6]">
      <div className="text-center">
        <p className="text-sm font-mono text-[#64ffda]">Redirecting to SSO registration...</p>
        <a href={ssoLoginUrl("/")} className="mt-4 inline-block text-xs underline text-[#8892b0]">
          Click here if not redirected automatically
        </a>
      </div>
    </div>
  )
}
