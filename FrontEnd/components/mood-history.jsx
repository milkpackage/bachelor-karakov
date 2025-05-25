"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart } from "@/components/ui/chart"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

const emotionToValue = {
  joy: 10,
  trust: 9,
  anticipation: 7,
  surprise: 6,
  fear: 4,
  sadness: 3,
  anger: 2,
  disgust: 1,
  neutral: 0,
}

export default function MoodHistory() {
  const [timeRange, setTimeRange] = useState("week")
  const [moodData, setMoodData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isAuthenticated } = useAuth()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchMoodData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const today = new Date()
        const startDate = new Date()

        switch (timeRange) {
          case "week":
            startDate.setDate(today.getDate() - 7)
            break
          case "month":
            startDate.setMonth(today.getMonth() - 1)
            break
          case "year":
            startDate.setFullYear(today.getFullYear() - 1)
            break
          default:
            startDate.setDate(today.getDate() - 7)
        }

        const formattedStartDate = startDate.toISOString()
        const formattedEndDate = today.toISOString()

        const { data, error } = await supabase
          .from("moods")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", formattedStartDate)
          .lte("created_at", formattedEndDate)
          .order("created_at", { ascending: true })

        if (error) throw error

        if (data && data.length > 0) {
          const dateMap = new Map()

          data.forEach((item) => {
            const date = new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            const emotionValue = emotionToValue[item.selected_emotion] || 5 

            if (!dateMap.has(date)) {
              dateMap.set(date, {
                total: emotionValue,
                count: 1,
                rawDate: new Date(item.created_at),
              })
            } else {
              const existing = dateMap.get(date)
              dateMap.set(date, {
                total: existing.total + emotionValue,
                count: existing.count + 1,
                rawDate: existing.rawDate,
              })
            }
          })

          const chartData = Array.from(dateMap.entries()).map(([date, data]) => ({
            date,
            value: Math.round((data.total / data.count) * 10) / 10, 
            rawDate: data.rawDate,
          }))

          // Sort by date
          chartData.sort((a, b) => a.rawDate - b.rawDate)

          setMoodData(chartData)
        } else {
          setMoodData([])
        }
      } catch (err) {
        console.error("Error fetching mood data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMoodData()
  }, [timeRange, isAuthenticated, user, supabase])

  return (
    <Card className="shadow-md dark:bg-[#141420] dark:border-[#2a2a3c]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Emotion History</CardTitle>
          <CardDescription>Track how your emotions change over time</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px] dark:bg-[#141420] dark:border-[#2a2a3c]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent className="dark:bg-[#141420] dark:border-[#2a2a3c]">
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !isAuthenticated ? (
          <div className="flex justify-center items-center h-[300px] text-center text-muted-foreground">
            <p>Sign in to view your emotion history</p>
          </div>
        ) : moodData.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-center text-muted-foreground">
            <p>No emotion data available for this time period</p>
          </div>
        ) : (
          <div className="h-[300px]">
            <LineChart
              data={moodData}
              index="date"
              categories={["value"]}
              colors={["emerald"]}
              valueFormatter={(value) => (value ? `${value}` : "No data")}
              className="h-[300px]"
              showLegend={false}
              yAxisWidth={30}
              showAnimation={true}
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
