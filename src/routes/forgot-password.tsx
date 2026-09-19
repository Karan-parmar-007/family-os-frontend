import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordRedirect,
})

function ForgotPasswordRedirect() {
  useEffect(() => {
    const sso = import.meta.env.VITE_SSO_URL || "http://localhost:5173"
    window.location.replace(`${sso}/forgot-password`)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a192f] text-[#ccd6f6]">
      <div className="text-center">
        <p className="text-sm font-mono text-[#64ffda]">Redirecting to SSO password recovery...</p>
      </div>
    </div>
  )
}
