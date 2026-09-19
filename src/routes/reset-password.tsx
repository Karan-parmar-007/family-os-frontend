import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordRedirect,
})

function ResetPasswordRedirect() {
  useEffect(() => {
    const sso = import.meta.env.VITE_SSO_URL || "http://localhost:5173"
    window.location.replace(`${sso}/reset-password`)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a192f] text-[#ccd6f6]">
      <div className="text-center">
        <p className="text-sm font-mono text-[#64ffda]">Redirecting to SSO password reset...</p>
      </div>
    </div>
  )
}
