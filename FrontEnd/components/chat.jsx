"use client"
import MarkdownRenderer from "@/components/markdown-renderer"
import { useEffect, useRef, useState } from "react"
import { Send, Loader2, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, User } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ChatUI({
  messages,
  onSendMessage,
  isLoading = false,
  expandable = false,
  preventInitialFocus = false,
  skipInitialScroll = true, // Add this new prop
}) {
  const [input, setInput] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollRef = useRef(null)
  const textareaRef = useRef(null)
  const isInitialMount = useRef(true)
  // Track if a message was just sent by the user
  const [userJustSentMessage, setUserJustSentMessage] = useState(false)

  // Handle sending messages
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSendMessage(input.trim())
    setInput("")
    // Flag that user just sent a message, so we can scroll
    setUserJustSentMessage(true)
  }

  const toggleExpand = (e) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  // Auto-resize textarea based on content
  const handleTextareaChange = (e) => {
    setInput(e.target.value)

    // Reset height to auto to get the correct scrollHeight
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  // Handle Enter key to submit (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    } else if (e.key === "Escape" && isExpanded) {
      setIsExpanded(false)
    }
  }

  useEffect(() => {
    // Only scroll in these cases:
    // 1. User just sent a message (and we have the flag set)
    // 2. Not the initial load
    // 3. User explicitly requested scroll
    if (userJustSentMessage && messages.length > 0) {
      // Use a small delay to ensure DOM is ready
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
        // Reset the flag
        setUserJustSentMessage(false)
      }, 100)
    }
  }, [messages, userJustSentMessage])

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (input === "" && textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [input])

  // Add event listener for Escape key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false)
      }
    }

    window.addEventListener("keydown", handleEscKey)
    return () => window.removeEventListener("keydown", handleEscKey)
  }, [isExpanded])

  return (
    <Card
      className={`flex flex-col border shadow-md dark:bg-[#141420] dark:border-[#2a2a3c] relative ${
        isExpanded ? "fixed inset-0 z-50 h-screen rounded-none" : "h-full"
      }`}
    >
      {expandable && (
        <button
          onClick={toggleExpand}
          className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-muted z-10 text-muted-foreground hover:text-foreground"
          aria-label={isExpanded ? "Minimize" : "Expand"}
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      )}

      <CardHeader className="py-3 px-4 border-b dark:border-[#2a2a3c]">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="relative">
            <Avatar className="h-8 w-8 border">
              <AvatarImage src="/abstract-ai-network.png" alt="AI Assistant" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></span>
          </div>
          Mental Health Assistant
          {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Start a conversation with the mental health assistant</p>
              <p className="text-sm mt-2">
                Ask about coping strategies, mindfulness techniques, or share how you're feeling today
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.role !== "user" && <Heart className="h-8 w-8 mt-1 text-rose-500" />}

                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted dark:bg-[#1a1a24] rounded-tl-none"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    
                    <MarkdownRenderer content={msg.message || msg.content} />
                  </div>
                  <div className="text-xs opacity-70 mt-1 text-right">
                    {new Date(msg.createdAt || msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {msg.role === "user" && <User className="h-8 w-8 mt-1 text-blue-500" />}
              </div>
            ))
          )}
          <div ref={scrollRef} className="h-1 w-1" />
        </div>
      </ScrollArea>

      <CardFooter className="p-3 border-t dark:border-[#2a2a3c]">
        <form onSubmit={handleSubmit} className="flex w-full gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[40px] max-h-[120px] resize-none dark:bg-[#0c0c14] dark:border-[#2a2a3c] focus-visible:ring-ring"
            placeholder="Type a message..."
            rows={1}
            disabled={isLoading}
            autoFocus={!preventInitialFocus}
          />
          <Button type="submit" size="icon" className="h-10 w-10" disabled={!input.trim() || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
