"use client"
import { useEffect } from "react"

function patchFetch() {
  if (typeof window === "undefined") return
  if ((window as any).__sucukPatched) return
  const origFetch = window.fetch.bind(window)
  const patchedFetch: typeof window.fetch = (input, init) => {
    try {
      // sadece sessionStorage — sekme kapatilinca oturum kapanir, yeni sekme yeni oturum
      const token = sessionStorage.getItem("sucuk_session_tab") || ""
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
    // per-tab oturum: yeni sekme her zaman login'e atsin, refresh haric
    // sessionStorage refresh'te korunur, yeni sekmede bos olur
    try {
      const path = window.location.pathname
      const isLogin = path === "/login" || path.startsWith("/login/")
      const isPublic = path === "/" || path.startsWith("/_next") || path.includes(".")
      const token = sessionStorage.getItem("sucuk_session_tab")
      const protectedPaths = ["/dashboard", "/chat", "/settings", "/admin", "/editor", "/workspace"]
      const isProtected = protectedPaths.some(p => path === p || path.startsWith(p + "/"))
      if (!token && isProtected) {
        window.location.href = "/login"
        return
      }
      if (token && isLogin) {
        // zaten girisliyse dashboard'a at (refresh degil, yeni login degil)
        // ama login sayfasinda kalmak isteyebilir, bu yuzden sadece token varsa ve login'deysek yonlendir
        // bunu hemen yapma, kullanici login'de baska hesaba gecmek isteyebilir
      }
    } catch {}
  }, [])
  return <>{children}</>
}

export function storeSessionToken(token: string) {
  try {
    // sadece sessionStorage — sekme kapaninca silinsin, yeni sekme temiz baslasin (IP ayni olsa bile ayri hesap)
    sessionStorage.setItem("sucuk_session_tab", token)
  } catch {}
}

export function clearSessionToken() {
  try {
    sessionStorage.removeItem("sucuk_session_tab")
    sessionStorage.removeItem("sucuk_user_tab")
  } catch {}
}
