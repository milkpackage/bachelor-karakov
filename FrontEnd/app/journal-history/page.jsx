"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2, Calendar, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Header from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { DateInput } from "@/components/ui/date-picker"

// Emotion color mapping
const emotionColors = {
  Joy: "bg-yellow-400 text-yellow-950",
  Trust: "bg-green-400 text-green-950",
  Fear: "bg-green-600 text-white",
  Surprise: "bg-blue-400 text-blue-950",
  Sadness: "bg-blue-600 text-white",
  Disgust: "bg-purple-400 text-purple-950",
  Anger: "bg-red-500 text-white",
  Anticipation: "bg-orange-400 text-orange-950",
  Neutral: "bg-gray-400 text-white",
}

export default function JournalHistoryPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [entries, setEntries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [view, setView] = useState("list")
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)

  // Fetch journal entries
  useEffect(() => {
    const fetchEntries = async () => {
      console.log("Fetching journal entries...")
      if (!isAuthenticated || authLoading) return
      setIsLoading(true)
      setError(null)

      try {
        // Calculate date range based on selected time range
        let query = supabase.from("moods").select("*").eq("user_id", user.id).order("created_at", { ascending: false })

        // if (timeRange !== "all") {
        //   const today = new Date()
        //   const calculatedStartDate = new Date()

        //   switch (timeRange) {
        //     case "week":
        //       calculatedStartDate.setDate(today.getDate() - 7)
        //       break
        //     case "month":
        //       calculatedStartDate.setMonth(today.getMonth() - 1)
        //       break
        //     case "year":
        //       calculatedStartDate.setFullYear(today.getFullYear() - 1)
        //       break
        //     case "custom":
        //       // Use the custom date range if selected
        //       if (startDate) {
        //         query = query.gte("created_at", startDate.toISOString())
        //       }
        //       if (endDate) {
        //         query = query.lte("created_at", endDate.toISOString())
        //       }
        //       break
        //   }

        //   // Only apply calculated dates if not using custom range
        //   if (timeRange !== "custom") {
        //     query = query.gte("created_at", calculatedStartDate.toISOString())
        //   }
        // }

        const { data, error } = await query

        if (error) throw error

        console.log("Fetched journal entries:", data)
        setEntries(data || [])
      } catch (err) {
        console.error("Error fetching journal entries:", err)
        setError("Failed to load your journal entries. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntries()
  }, [isAuthenticated, authLoading, user, supabase, timeRange, startDate, endDate])

  // Filter entries based on search query
  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery) return true

    const searchLower = searchQuery.toLowerCase()
    return (
      entry.selected_emotion.toLowerCase().includes(searchLower) ||
      (entry.note && entry.note.toLowerCase().includes(searchLower))
    )
  })

  // Group entries by date for calendar view
  const entriesByDate = filteredEntries.reduce((acc, entry) => {
    const date = format(new Date(entry.created_at), "yyyy-MM-dd")
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(entry)
    return acc
  }, {})

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#f8f8f8] dark:bg-[#0c0c10]">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] dark:bg-[#0c0c10]">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Journal History</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px] dark:bg-[#141420] dark:border-[#2a2a3c]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent className="dark:bg-[#141420] dark:border-[#2a2a3c]">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                className="pl-9 w-[200px] dark:bg-[#141420] dark:border-[#2a2a3c]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {timeRange === "custom" && (
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <DateInput
                value={startDate}
                onChange={setStartDate}
                className="w-full md:w-[200px] dark:bg-[#141420] dark:border-[#2a2a3c]"
              />
            </div>
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium mb-1">End Date</label>
              <DateInput
                value={endDate}
                onChange={setEndDate}
                className="w-full md:w-[200px] dark:bg-[#141420] dark:border-[#2a2a3c]"
              />
            </div>
          </div>
        )}

        <div value="calendar" className="space-y-4">
          <Card className="dark:bg-[#141420] dark:border-[#2a2a3c]">
            <CardHeader>
              <CardTitle>Entries by Date</CardTitle>
              <CardDescription>View your journal entries organized by date</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : Object.keys(entriesByDate).length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery ? "No entries match your search." : "No journal entries found."}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(entriesByDate).map(([date, dayEntries]) => (
                    <div key={date} className="border-b pb-4 dark:border-[#2a2a3c] last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">{format(new Date(date), "EEEE, MMMM d, yyyy")}</h3>
                      </div>
                      <div className="space-y-3 pl-7">
                        {dayEntries.map((entry) => (
                          <div key={entry.id} className="border-l-2 border-primary pl-4 py-1">
                            <div className="flex items-center gap-2">
                              
                              <div className="flex gap-2">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-md text-xs ${emotionColors[entry.selected_emotion] || "bg-gray-400 text-white"}`}
                                >
                                  {entry.selected_emotion}
                                </span>

                                <span
                                  className={`inline-block px-2 py-0.5 rounded-md text-xs ${emotionColors[entry.calculated_emotion] || "bg-blue-400 text-white"}`}
                                >
                                  [AI] {entry.calculated_emotion} ({parseInt(entry.calculated_confidence * 100)}%)
                                </span>

                              </div>

                              <span className="text-xs text-muted-foreground">
                                {format(new Date(entry.created_at), "h:mm a")}
                              </span>
                            </div>
                            {entry.note && <p className="mt-1 text-sm whitespace-pre-wrap">{entry.note}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
