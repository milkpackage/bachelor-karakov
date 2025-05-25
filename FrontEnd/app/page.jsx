"use client"

import { useEffect } from "react"
import Header from "@/components/header"
import Dashboard from "@/components/dashboard"
import EmotionTracker from "@/components/emotion-tracker"
import TestsSection from "@/components/tests-section"
import ChatbotSection from "@/components/chatbot-section"

export default function Home() {
  useEffect(() => {
    const forceScrollToTop = () => {
      const topAnchor = document.getElementById("top")
      if (topAnchor) {
        topAnchor.scrollIntoView({ behavior: "instant", block: "start" })
      }

      window.scrollTo(0, 0)

      requestAnimationFrame(() => {
        window.scrollTo(0, 0)
      })
    }

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual"
    }

    forceScrollToTop()

    if (window.location.hash) {
      const cleanUrl = window.location.href.split("#")[0]
      window.history.replaceState({}, document.title, cleanUrl)
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        forceScrollToTop()
      }
    }

    const preventHashScroll = (event) => {
      const target = event.target.closest("a")
      if (target && target.hash && target.pathname === window.location.pathname) {
        event.preventDefault()

        // Custom scroll behavior
        const id = target.hash.substring(1)
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }
    }

    document.addEventListener("click", preventHashScroll)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    window.addEventListener("pageshow", forceScrollToTop)
    window.addEventListener("focus", forceScrollToTop)

    // Clean up
    return () => {
      document.removeEventListener("click", preventHashScroll)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("pageshow", forceScrollToTop)
      window.removeEventListener("focus", forceScrollToTop)
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#0c0c10]">
      <a id="top" className="absolute top-0" aria-hidden="true"></a>
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-12">
        <Dashboard />
        <EmotionTracker />
        <TestsSection />
        <ChatbotSection />
      </div>
    </main>
  )
}
