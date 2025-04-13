"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { flushSync } from "react-dom"
import { useViewTransitions } from "./view-transitions-provider"

interface TransitionLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function TransitionLink({ href, children, className, onClick }: TransitionLinkProps) {
  const router = useRouter()
  const { isTransitioning } = useViewTransitions()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If the View Transitions API is not supported, use normal navigation
    if (!(document as any).startViewTransition) {
      if (onClick) onClick()
      return
    }

    e.preventDefault()

    if (onClick) onClick()

    // Start view transition
    const transition = (document as any).startViewTransition(async () => {
      flushSync(() => {
        router.push(href)
      })
    })
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}
