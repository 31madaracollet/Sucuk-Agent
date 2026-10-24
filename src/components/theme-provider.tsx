"use client"
import { useEffect, useState, createContext, useContext } from "react"

type Theme = "light" | "dark"
const ThemeCtx = createContext<{ theme: Theme; toggle: (t: Theme)=>void } | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light") // Claude default = paper light, not dark
  useEffect(()=>{
    const saved = localStorage.getItem("sucuk:theme") as Theme | null
    if(saved==="light"||saved==="dark") setTheme(saved)
    else {
      // system preference, but default to light (Claude editorial)
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(prefersDark ? "dark" : "light")
    }
  },[])
  useEffect(()=>{
    document.documentElement.classList.toggle("light", theme==="light")
    document.documentElement.classList.toggle("dark", theme==="dark")
    document.documentElement.style.colorScheme = theme
    localStorage.setItem("sucuk:theme", theme)
  },[theme])

  const toggle = (t: Theme) => setTheme(t)

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export function useTheme(){
  const ctx = useContext(ThemeCtx)
  if(!ctx) throw new Error("useTheme outside provider")
  return ctx
}

// legacy export for settings page
export function useThemeToggle(){
  const { theme, toggle } = useTheme()
  return { theme, toggle }
}
