"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, PieChart } from "@/components/ui/chart"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import MoodHistory from "./mood-history"
import DoughnutChart from "./ui/donut-chart"

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("week")
  const [emotionData, setEmotionData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isAuthenticated } = useAuth()
  const supabase = getSupabaseBrowserClient()

  // Fetch emotion data for the pie chart
  useEffect(() => {
    const fetchEmotionData = async () => {
      if (!isAuthenticated) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        // Calculate date range based on selected time range
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

        // Format dates for Supabase query
        const formattedStartDate = startDate.toISOString()
        const formattedEndDate = today.toISOString()

        // Fetch emotion data from Supabase
        const { data, error } = await supabase
          .from("moods")
          .select("selected_emotion")
          .eq("user_id", user.id)
          .gte("created_at", formattedStartDate)
          .lte("created_at", formattedEndDate)

        if (error) throw error

        // Process data for chart
        if (data && data.length > 0) {
          // Count occurrences of each emotion
          const emotionCounts = {}
          data.forEach((item) => {
            const emotion = item.selected_emotion
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
          })

          // Convert to array format for chart
          const chartData = Object.entries(emotionCounts).map(([name, count]) => {
            // Get the emotion value (0-10) or default to 5 if not found
            const emotionValue =
              {
                Joy: 10,
                Trust: 9,
                Anticipation: 7,
                Surprise: 6,
                Fear: 4,
                Sadness: 3,
                Anger: 2,
                Disgust: 1,
                Neutral: 0,
              }[name] || 5

            return {
              name,
              value: count,
              score: emotionValue,
            }
          })

          setEmotionData(chartData)
        } else {
          setEmotionData([])
        }
      } catch (err) {
        console.error("Error fetching emotion data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmotionData()
  }, [timeRange, isAuthenticated, user, supabase])

  return (
    <section id="dashboard" className="space-y-6 bg-[#e9ebfd] dark:bg-[#1a1a24] p-6 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard☀️</h2>
          <p className="text-muted-foreground">Look in your data to find insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] dark:bg-[#141420] dark:border-[#2a2a3c]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent className="dark:bg-[#141420] dark:border-[#2a2a3c]">
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="dark:bg-[#141420]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emotions">Emotions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MoodHistory />

            <Card className="shadow-md dark:bg-[#141420] dark:border-[#2a2a3c]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emotion Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {/* {isLoading ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : emotionData.length > 0 ? ( */}
                  <div>
                    <DoughnutChart labels={['Sadness', 'Fear', 'Neutral', 'Joy', 'Anger']} dataPoints={[300, 150, 100, 75, 50]} />
                  </div>
                {/* ) : (
                  <div className="h-[200px] flex items-center justify-center text-center text-muted-foreground">
                    <p>No emotion data available for this time period</p>
                  </div>
                )} */}
              </CardContent>
            </Card>

            <Card className="shadow-md dark:bg-[#141420] dark:border-[#2a2a3c]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">DASS-21 Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Depression</div>
                      <div className="text-sm font-medium">Mild</div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-[#0c0c14] mt-1 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[35%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Anxiety</div>
                      <div className="text-sm font-medium">Normal</div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-[#0c0c14] mt-1 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[20%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Stress</div>
                      <div className="text-sm font-medium">Moderate</div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-[#0c0c14] mt-1 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 w-[55%] rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-4">Last test taken: 3 days ago</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="emotions" className="space-y-4">
          <Card className="shadow-md dark:bg-[#141420] dark:border-[#2a2a3c]">
            <CardHeader>
              <CardTitle>Emotion Trends</CardTitle>
              <CardDescription>Track how your emotions have changed over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <LineChart
                  data={[
                    {
                      date: "Jan",
                      joy: 10,
                      trust: 9,
                      anticipation: 7,
                      surprise: 6,
                      fear: 4,
                      sadness: 3,
                      anger: 2,
                      disgust: 1,
                      neutral: 0,
                    },
                    {
                      date: "Feb",
                      joy: 10,
                      trust: 9,
                      anticipation: 7,
                      surprise: 6,
                      fear: 4,
                      sadness: 3,
                      anger: 2,
                      disgust: 1,
                      neutral: 0,
                    },
                    {
                      date: "Mar",
                      joy: 10,
                      trust: 9,
                      anticipation: 7,
                      surprise: 6,
                      fear: 4,
                      sadness: 3,
                      anger: 2,
                      disgust: 1,
                      neutral: 0,
                    },
                    {
                      date: "Apr",
                      joy: 10,
                      trust: 9,
                      anticipation: 7,
                      surprise: 6,
                      fear: 4,
                      sadness: 3,
                      anger: 2,
                      disgust: 1,
                      neutral: 0,
                    },
                    {
                      date: "May",
                      joy: 10,
                      trust: 9,
                      anticipation: 7,
                      surprise: 6,
                      fear: 4,
                      sadness: 3,
                      anger: 2,
                      disgust: 1,
                      neutral: 0,
                    },
                    {
                      date: "Jun",
                      joy: 10,
                      trust: 9,
                      anticipation: 7,
                      surprise: 6,
                      fear: 4,
                      sadness: 3,
                      anger: 2,
                      disgust: 1,
                      neutral: 0,
                    },
                  ]}
                  index="date"
                  categories={[
                    "joy",
                    "trust",
                    "anticipation",
                    "surprise",
                    "fear",
                    "sadness",
                    "anger",
                    "disgust",
                    "neutral",
                  ]}
                  colors={["yellow", "green", "orange", "blue", "purple", "indigo", "red", "pink", "gray"]}
                  valueFormatter={(value) => `${value}/10`}
                  className="h-[300px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  )
}
