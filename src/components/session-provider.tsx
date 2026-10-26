"use client"
import { useEffect } from "react"

function patchFetch() {
  if (typeof window === "undefined") return
  if ((window as any).__sucukPatched) return
  const origFetch = window.fetch.bind(window)
  const patchedFetch: typeof window.fetch = (input, init) => {
    try {
      const token =
        sessionStorage.getItem("sucuk_session_tab") ||
        localStorage.getItem("sucuk_session_persist") ||
        ""
      if (token) {
        const headers = new Headers((init as any)?.headers || {})
        if (!headers.has("x-sucuk-token")) headers.set("x-sucuk-token", token)
        if (!headers.has("authorization") && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`)
        init = { ...(init as any), headers, credentials: (init as any)?.credentials ?? "include" }
      }
    } catch {}
    return origFetch(input as any, init as any)
  }
  ;(window as any).__sucukPatched = true
  window.fetch = patchedFetch as any
}

// hemen patch — ilk render oncesi bile gecerli olsun
if (typeof window !== "undefined") {
  try { patchFetch() } catch {}
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    patchFetch()
  }, [])
  return <>{children}</>
}

export function storeSessionToken(token: string) {
  try {
    sessionStorage.setItem("sucuk_session_tab", token)
    localStorage.setItem("sucuk_session_persist", token)
  } catch {}
}

export function clearSessionToken() {
  try {
    sessionStorage.removeItem("sucuk_session_tab")
    localStorage.removeItem("sucuk_session_persist")
    sessionStorage.removeItem("sucuk_user_tab")
  } catch {}
}
