"use client"

import { useRef } from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Heart, ExternalLink, Sparkles, Loader2 } from "lucide-react"
import ChatUI from "@/components/chat"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function ChatbotSection() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const supabase = getSupabaseBrowserClient()
  const isInitialLoad = useRef(true)
  const chatContainerRef = useRef(null)

  // Sample conversation starters
  const conversationStarters = [
    "Analyze my mood",
    "How can I practice mindfulness?",
    "I'm having trouble sleeping",
    "What are some stress management techniques?",
    "I feel overwhelmed with work",
  ]

  const fetchChatHistory = async () => {
    setIsLoadingHistory(true)
    try {
      console.log("Fetching chat history for user:", user.id)

      // Directly query Supabase for chat messages
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) {
        console.error("Supabase error fetching chat history:", error)
        throw error
      }

      console.log("Chat history data received:", data)

      if (data && data.length > 0) {
        // Transform the data to match our message format
        const formattedMessages = data.map((msg) => ({
          message: msg.message,
          role: msg.role,
          createdAt: new Date(msg.created_at),
        }))

        console.log("Formatted messages:", formattedMessages)
        setMessages(formattedMessages)
      } else {
        console.log("No chat history found, showing welcome message")
        // No history found, show welcome message
        setMessages([
          {
            message: "Hello! I'm your mental health assistant. How are you feeling today?",
            role: "assistant",
            createdAt: new Date(),
          },
        ])
      }
    } catch (err) {
      console.error("Error fetching chat history:", err)
      // Fallback to welcome message on error
      setMessages([
        {
          message: "Hello! I'm your mental health assistant. How are you feeling today?",
          role: "assistant",
          createdAt: new Date(),
        },
      ])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    // If authenticated, fetch chat history first, otherwise show welcome message
    if (isAuthenticated && user) {
      console.log("User authenticated, fetching chat history")

      // Only fetch history after initial page load to prevent scroll issues
      if (isInitialLoad.current) {
        // Delay the fetch slightly to ensure page has settled
        setTimeout(() => {
          fetchChatHistory()
        }, 200)
        isInitialLoad.current = false
      } else {
        fetchChatHistory()
      }
    } else {
      console.log("User not authenticated, showing welcome message")
      // Initialize with a welcome message for non-authenticated users
      setMessages([
        {
          message: "Hello! I'm your mental health assistant. How are you feeling today?",
          role: "assistant",
          createdAt: new Date(),
        },
      ])
    }
  }, [isAuthenticated, user])

  const handleSendMessage = async (message) => {
    if (!message.trim()) return

    // Add user message to chat immediately
    const userMessage = { message: message.trim(), role: "user", createdAt: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Save user message to database if authenticated
      if (isAuthenticated && user) {
        await supabase.from("chat_messages").insert({
          user_id: user.id,
          content: message.trim(),
          role: "user",
        })
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        throw new Error("Authentication required")
      }

      // Prepare the API request
      const apiUrl = "http://127.0.0.1:8000/chat"

      const url = new URL(apiUrl)
      url.searchParams.append("message", message.trim())

      console.log("Sending request to:", url.toString())

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log("API Response:", responseData)

      // Extract the message from the response
      const assistantMessageContent = responseData.message || "I'm sorry, I couldn't process your request."

      // Add assistant response to chat
      const assistantMessage = {
        message: assistantMessageContent,
        role: "assistant",
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      // Save AI response to database if authenticated
      if (isAuthenticated && user) {
        await supabase.from("chat_messages").insert({
          user_id: user.id,
          content: assistantMessageContent,
          role: "assistant",
        })
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error)

      const errorMessage = {
        message: "Sorry, I'm having trouble connecting right now. Please try again later.",
        role: "assistant",
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])

      // Save error message to database if authenticated
      if (isAuthenticated && user) {
        try {
          await supabase.from("chat_messages").insert({
            user_id: user.id,
            content: errorMessage.message,
            role: "assistant",
          })
        } catch (err) {
          console.error("Error saving error message:", err)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStarterClick = (starter) => {
    handleSendMessage(starter)
  }

  const clearChatHistory = async () => {
    if (!isAuthenticated || !user) return

    try {
      const { error } = await supabase.from("chat_messages").delete().eq("user_id", user.id)

      if (error) throw error

      setMessages([
        {
          message: "Hello! I'm your new assistant. How are you feeling today?",
          role: "assistant",
          createdAt: new Date(),
        },
      ])
    } catch (err) {
      console.error("Error clearing chat history:", err)
    }
  }

  return (
    <section
      id="chat"
      className="space-y-6 bg-gradient-to-br from-[#e0f2fe] to-[#dbeafe] dark:from-[#1a1a24] dark:to-[#141420] p-6 rounded-lg shadow-md"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
              <MessageSquare className="h-7 w-7 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Mental Health Assistant</h2>
              <p className="text-muted-foreground">Talk to our AI assistant about your mental health concerns.</p>
            </div>
          </div>

          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="tips">Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-4 mt-4">
              <div className="bg-white dark:bg-[#141420] rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-rose-500" />
                  <h3 className="font-medium">Supportive Companion</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect with our supportive AI assistant to discuss your feelings, get coping strategies, or simply
                  have someone to talk to about your mental health journey.
                </p>
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <AlertDescription className="text-sm flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                  <span>
                    If you're experiencing a crisis or emergency, please contact a mental health professional or
                    emergency services immediately.
                  </span>
                </AlertDescription>
              </Alert>

              {isAuthenticated && (
                <div className="bg-white dark:bg-[#141420] rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Chat History</h3>
                    <Button variant="outline" size="sm" onClick={clearChatHistory} className="text-xs">
                      Clear History
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your conversation history is automatically saved and will be restored when you return.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tips" className="space-y-4 mt-4">
              <div className="bg-white dark:bg-[#141420] rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <h3 className="font-medium">Conversation Starters</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Not sure what to talk about? Try this:
                </p>
                <div className="flex flex-wrap gap-2">
                  {conversationStarters.map((starter, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleStarterClick(starter)}
                      disabled={isLoading}
                    >
                      {starter}
                    </Button>
                  ))}
                </div>
              </div>

              <Card className="border-dashed">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Best Practices</CardTitle>
                  <CardDescription>For the most helpful responses</CardDescription>
                </CardHeader>
                <CardContent className="py-0">
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Be specific about how you're feeling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Ask direct questions about coping strategies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">•</span>
                      <span>Share what has or hasn't worked for you before</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {!isAuthenticated && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  <strong>Note:</strong> Sign in to use chatbot
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 h-[500px]" ref={chatContainerRef}>
          {isLoadingHistory ? (
            <Card className="flex flex-col h-full border shadow-md dark:bg-[#141420] dark:border-[#2a2a3c]">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Loading chat history...</p>
                </div>
              </div>
            </Card>
          ) : (
            <ChatUI
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              expandable={true}
              preventInitialFocus={true}
              skipInitialScroll={true}
            />
          )}
        </div>
      </div>
    </section>
  )
}
