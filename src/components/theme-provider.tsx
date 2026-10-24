"use client"
import { useEffect, useState } from "react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light"|"dark">("dark")
  useEffect(()=>{
    const mql = window.matchMedia("(prefers-color-scheme: light)")
    const update = () => setTheme(mql.matches ? "light" : "dark")
    update()
    mql.addEventListener("change", update)
    return ()=> mql.removeEventListener("change", update)
  },[])
  useEffect(()=>{
    document.documentElement.classList.toggle("light", theme==="light")
    document.documentElement.classList.toggle("dark", theme==="dark")
    document.documentElement.style.colorScheme = theme
  },[theme])
  return <>{children}</>
}

export function useThemeToggle() {
  const [theme,setTheme]=useState<"light"|"dark">("dark")
  useEffect(()=>{
    const saved = localStorage.getItem("sucuk:theme") as any
    if(saved) setTheme(saved)
    else if(window.matchMedia("(prefers-color-scheme: light)").matches) setTheme("light")
  },[])
  const toggle = (t:"light"|"dark") => {
    setTheme(t)
    localStorage.setItem("sucuk:theme", t)
    document.documentElement.classList.toggle("light", t==="light")
    document.documentElement.classList.toggle("dark", t==="dark")
  }
  return { theme, toggle }
}
