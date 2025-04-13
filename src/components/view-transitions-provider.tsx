import type React from "react"

import { useRouter } from "next/navigation"
import { useEffect, useState, createContext, useContext } from "react"
import { flushSync } from "react-dom"

type ViewTransitionsContextType = {
  isTransitioning: boolean
}

const ViewTransitionsContext = createContext<ViewTransitionsContextType>({
  isTransitioning: false,
})

export const useViewTransitions = () => useContext(ViewTransitionsContext)

export function ViewTransitionsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    // Check if the View Transitions API is supported
    if (!(document as any).startViewTransition) {
      return
    }

    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const anchor = target.closest("a")

      // Only handle internal links
      if (!anchor || !anchor.href || anchor.target === "_blank" || anchor.getAttribute("rel") === "external") {
        return
      }

      const href = anchor.href
      const currentUrl = window.location.href

      // Skip if it's the same URL or external
      if (href === currentUrl || !href.startsWith(window.location.origin)) {
        return
      }

      // Prevent default navigation
      event.preventDefault()

      // Start view transition
      setIsTransitioning(true)

      // Use the View Transitions API
      const transition = (document as any).startViewTransition(async () => {
        flushSync(() => {
          const path = new URL(href).pathname
          router.push(path)
        })
      })

      transition.finished.then(() => {
        setIsTransitioning(false)
      })
    }

    // Add event listener for anchor clicks
    document.addEventListener("click", handleAnchorClick)

    return () => {
      document.removeEventListener("click", handleAnchorClick)
    }
  }, [router])

  return <ViewTransitionsContext.Provider value={{ isTransitioning }}>{children}</ViewTransitionsContext.Provider>
}
