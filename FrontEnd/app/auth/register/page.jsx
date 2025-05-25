"use client"

import { useEffect } from "react"
import Header from "@/components/header"
import Dashboard from "@/components/dashboard"
import EmotionTracker from "@/components/emotion-tracker"
import TestsSection from "@/components/tests-section"
import ChatbotSection from "@/components/chatbot-section"

export default function Home() {
  useEffect(() => {
    // Function to force the page to the top
    const forceScrollToTop = () => {
      // Try multiple methods to ensure we're at the top
      const topAnchor = document.getElementById("top")
      if (topAnchor) {
        topAnchor.scrollIntoView({ behavior: "instant", block: "start" })
      }

      // Also use window.scrollTo as fallback with multiple approaches
      window.scrollTo(0, 0)
      window.scrollTo({ top: 0, behavior: "instant" })

      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        window.scrollTo(0, 0)
      })

      // Try again after a short delay to override any other scripts
      setTimeout(() => {
        window.scrollTo(0, 0)
      }, 50)
    }

    // Disable scroll restoration
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual"
    }

    // Run immediately
    forceScrollToTop()

    // Remove hash from URL if present
    if (window.location.hash) {
      const cleanUrl = window.location.href.split("#")[0]
      window.history.replaceState({}, document.title, cleanUrl)
    }

    // Handle visibility change (for when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        forceScrollToTop()
      }
    }

    // Prevent default scroll behavior for hash links
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

    // Add event listeners
    document.addEventListener("click", preventHashScroll)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Force scroll on various events that might cause unwanted scrolling
    window.addEventListener("pageshow", forceScrollToTop)
    window.addEventListener("focus", forceScrollToTop)
    window.addEventListener("DOMContentLoaded", forceScrollToTop)
    window.addEventListener("load", forceScrollToTop)

    // Prevent scroll on message updates
    const preventScrollOnChatUpdate = () => {
      const chatSections = document.querySelectorAll("#chat")
      if (chatSections.length > 0) {
        // MutationObserver to detect changes in the chat section
        const observer = new MutationObserver(() => {
          // Don't allow scrolling to bottom when chat content changes
          window.scrollTo(0, 0)
        })

        // Observe all chat sections
        chatSections.forEach((section) => {
          observer.observe(section, { childList: true, subtree: true })
        })

        return () => observer.disconnect()
      }
    }

    // Set up the chat observer after a short delay
    const chatObserverTimeout = setTimeout(preventScrollOnChatUpdate, 500)

    // Clean up
    return () => {
      document.removeEventListener("click", preventHashScroll)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("pageshow", forceScrollToTop)
      window.removeEventListener("focus", forceScrollToTop)
      window.removeEventListener("DOMContentLoaded", forceScrollToTop)
      window.removeEventListener("load", forceScrollToTop)
      clearTimeout(chatObserverTimeout)
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
