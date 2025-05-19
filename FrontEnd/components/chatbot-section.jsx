"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Heart, Info, ExternalLink, Sparkles } from "lucide-react"
import ChatUI from "@/components/chat"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"


export default function ChatbotSection() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const supabase = getSupabaseBrowserClient()
  const chatContainerRef = useRef(null)

  // Sample conversation starters
  const conversationStarters = [
    "I'm feeling anxious today",
    "How can I practice mindfulness?",
    "I'm having trouble sleeping",
    "What are some stress management techniques?",
    "I feel overwhelmed with work",
  ]

  useEffect(() => {
    // Initialize with a welcome message
    setMessages([
      {
        message: "Hello! I'm your mental health assistant. How are you feeling today?",
        role: "assistant",
        createdAt: new Date(),
      },
    ])

    // If authenticated, fetch chat history
    if (isAuthenticated && user) {
      fetchChatHistory()
    }
  }, [isAuthenticated, user])

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error

      if (data && data.length > 0) {
        // Transform and reverse to show in chronological order
        const formattedMessages = data
          .map((msg) => ({
            message: msg.message,
            role: msg.role,
            createdAt: new Date(msg.created_at),
          }))
          .reverse()

        setMessages(formattedMessages)
      }
    } catch (err) {
      console.error("Error fetching chat history:", err)
    }
  }

  const handleSendMessage = async (message) => {
    if (!message.trim()) return

    // Add user message to chat
    const userMessage = { message, role: "user", createdAt: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Save message to database if authenticated
      if (!(isAuthenticated && user)) { return }

      // Get the user's access token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const queryParams = new URLSearchParams({
        message: message.trim()
      });

      // Send request to chat API
      const baseUrl = "http://127.0.0.1:8000/chat"
      const urlWithParams = `${baseUrl}?${queryParams.toString()}`
      const response = await fetch(urlWithParams, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken || ""}`, // Include token if available
        },
        body: JSON.stringify({
          message: message,
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const data = await response.json()

      // Add assistant response to chat
      const assistantMessage = {
        message: data.message,
        role: "assistant",
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)

      // Add error message to chat
      const errorMessage = {
        message: "Sorry, I'm having trouble connecting right now. Please try again later.",
        role: "assistant",
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleStarterClick = (starter) => {
    handleSendMessage(starter)
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

              <div className="bg-white dark:bg-[#141420] rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-amber-500" />
                  <h3 className="font-medium">Important Note</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your conversations are private and designed to provide helpful guidance. Remember that this is a
                  supportive tool and not a replacement for professional mental health care.
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
            </TabsContent>

            <TabsContent value="tips" className="space-y-4 mt-4">
              <div className="bg-white dark:bg-[#141420] rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <h3 className="font-medium">Conversation Starters</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Not sure what to talk about? Try one of these conversation starters:
                </p>
                <div className="flex flex-wrap gap-2">
                  {conversationStarters.map((starter, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleStarterClick(starter)}
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
                  <strong>Note:</strong> Sign in to save your conversation history and receive more personalized
                  support.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 h-[500px]" ref={chatContainerRef}>
          <ChatUI messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </section>
  )
}
