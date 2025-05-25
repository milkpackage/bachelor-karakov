"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import MoodHistory from "./mood-history"
import { Chart, ArcElement, Tooltip, Legend } from "chart.js"
Chart.register(ArcElement, Tooltip, Legend)

// Emotion Distribution Chart Component
function EmotionDistributionChart({ data }) {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  // Define emotion colors based on the provided hex values
  const emotionColors = {
    joy: { bg: "#facc15cc", border: "#facc15" }, // yellow-400
    trust: { bg: "#4ade80cc", border: "#4ade80" }, // green-400
    fear: { bg: "#16a34acc", border: "#16a34a" }, // green-600
    surprise: { bg: "#60a5facc", border: "#60a5fa" }, // blue-400
    sadness: { bg: "#2563ebcc", border: "#2563eb" }, // blue-600
    disgust: { bg: "#c084fccc", border: "#c084fc" }, // purple-400
    anger: { bg: "#ef4444cc", border: "#ef4444" }, // red-500
    anticipation: { bg: "#fb923ccc", border: "#fb923c" }, // orange-400
    neutral: { bg: "#9ca3afcc", border: "#9ca3af" }, // gray-400
  }

  // Get colors based on emotion name
  const getEmotionColor = (emotionName, type) => {
    if (!emotionName || !emotionColors[emotionName]) {
      console.warn(`Color not found for emotion: ${emotionName}`)
      return type === "bg" ? "rgba(156, 163, 175, 0.8)" : "rgb(156, 163, 175)" // Default to gray
    }
    return emotionColors[emotionName][type]
  }

  useEffect(() => {
    // Clean up previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    if (!chartRef.current || !data || data.length === 0) {
      console.log("No data available for chart rendering")
      return
    }

    try {
      // Validate data format
      const validData = data.filter((item) => item && item.name && typeof item.value === "number")

      if (validData.length === 0) {
        console.warn("No valid data entries for chart")
        return
      }

      // Prepare data for Chart.js
      const chartData = {
        labels: validData.map((item) => item.name),
        datasets: [
          {
            data: validData.map((item) => item.value),
            backgroundColor: validData.map((item) => getEmotionColor(item.name, "bg")),
            borderColor: validData.map((item) => getEmotionColor(item.name, "border")),
            borderWidth: 1,
            hoverOffset: 10,
          },
        ],
      }

      // Create chart
      const ctx = chartRef.current.getContext("2d")
      chartInstance.current = new Chart(ctx, {
        type: "doughnut",
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "60%",
          plugins: {
            legend: {
              position: "right",
              labels: {
                boxWidth: 12,
                padding: 15,
                font: {
                  size: 11,
                },
                color: document.documentElement.classList.contains("dark") ? "#e5e7eb" : "#374151",
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || ""
                  const value = context.raw || 0
                  const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
                  const percentage = Math.round((value / total) * 100)
                  return `${label}: ${value} (${percentage}%)`
                },
              },
            },
          },
          animation: {
            animateScale: true,
            animateRotate: true,
          },
        },
      })

      // Update chart when theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.attributeName === "class" &&
            chartInstance.current &&
            chartInstance.current.options &&
            chartInstance.current.options.plugins &&
            chartInstance.current.options.plugins.legend
          ) {
            chartInstance.current.options.plugins.legend.labels.color = document.documentElement.classList.contains(
              "dark",
            )
              ? "#e5e7eb"
              : "#374151"

            chartInstance.current.update()
          }
        })
      })

      observer.observe(document.documentElement, { attributes: true })

      return () => {
        if (chartInstance.current) {
          chartInstance.current.destroy()
        }
        observer.disconnect()
      }
    } catch (error) {
      console.error("Error rendering emotion chart:", error)
    }
  }, [data])

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas ref={chartRef}></canvas>
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("week")
  const [emotionData, setEmotionData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isAuthenticated } = useAuth()
  const supabase = getSupabaseBrowserClient()
  const [testResults, setTestResults] = useState(null)

  // Helper functions for determining levels
  const getDepressionLevel = (score) => {
    if (score <= 4) return { level: "Normal", color: "bg-emerald-500" }
    if (score <= 6) return { level: "Mild", color: "bg-amber-500" }
    if (score <= 10) return { level: "Moderate", color: "bg-orange-500" }
    if (score <= 13) return { level: "Severe", color: "bg-red-500" }
    return { level: "Extremely Severe", color: "bg-red-700" }
  }

  const getAnxietyLevel = (score) => {
    if (score <= 3) return { level: "Normal", color: "bg-emerald-500" }
    if (score <= 5) return { level: "Mild", color: "bg-amber-500" }
    if (score <= 7) return { level: "Moderate", color: "bg-orange-500" }
    if (score <= 9) return { level: "Severe", color: "bg-red-500" }
    return { level: "Extremely Severe", color: "bg-red-700" }
  }

  const getStressLevel = (score) => {
    if (score <= 7) return { level: "Normal", color: "bg-emerald-500" }
    if (score <= 9) return { level: "Mild", color: "bg-amber-500" }
    if (score <= 12) return { level: "Moderate", color: "bg-orange-500" }
    if (score <= 16) return { level: "Severe", color: "bg-red-500" }
    return { level: "Extremely Severe", color: "bg-red-700" }
  }

  // Fetch emotion data for the pie chart
  useEffect(() => {
    const fetchEmotionData = async () => {
      if (!isAuthenticated || !user?.id) {
        setIsLoading(false)
        setEmotionData([])
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
            if (item && item.selected_emotion) {
              const emotion = item.selected_emotion
              emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
            }
          })

          // Convert to array format for chart
          const chartData = Object.entries(emotionCounts)
            .filter(([name]) => name) // Ensure emotion name exists
            .map(([name, count]) => {
              return {
                name,
                value: count,
              }
            })

          setEmotionData(chartData)
          console.log("Emotion data for chart:", chartData)
        } else {
          setEmotionData([])
        }
      } catch (err) {
        console.error("Error fetching emotion data:", err)
        setEmotionData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmotionData()
  }, [timeRange, isAuthenticated, user, supabase])

  // Fetch test results data
  useEffect(() => {
    const fetchTestResults = async () => {
      if (!isAuthenticated) return

      try {
        const { data, error } = await supabase
          .from("test_results")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          setTestResults(data[0])
        }
      } catch (err) {
        console.error("Error fetching test results:", err)
      }
    }

    fetchTestResults()
  }, [isAuthenticated, user, supabase])

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
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MoodHistory />

            <Card className="shadow-md dark:bg-[#141420] dark:border-[#2a2a3c]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emotion Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : emotionData && emotionData.length > 0 ? (
                  <div className="h-[250px] relative">
                    <EmotionDistributionChart data={emotionData} />
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-center text-muted-foreground">
                    <p>No emotion data available for this time period</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md dark:bg-[#141420] dark:border-[#2a2a3c]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">DASS-21 Score</CardTitle>
              </CardHeader>
              <CardContent>
                {testResults ? (
                  <>
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Depression</div>
                          <div className="text-sm font-medium">
                            {getDepressionLevel(testResults.depression_score).level}
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-[#0c0c14] mt-1 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getDepressionLevel(testResults.depression_score).color} rounded-full`}
                            style={{ width: `${(testResults.depression_score / 21) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Score: {testResults.depression_score}/21</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Anxiety</div>
                          <div className="text-sm font-medium">{getAnxietyLevel(testResults.anxiety_score).level}</div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-[#0c0c14] mt-1 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getAnxietyLevel(testResults.anxiety_score).color} rounded-full`}
                            style={{ width: `${(testResults.anxiety_score / 21) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Score: {testResults.anxiety_score}/21</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Stress</div>
                          <div className="text-sm font-medium">{getStressLevel(testResults.stress_score).level}</div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-[#0c0c14] mt-1 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getStressLevel(testResults.stress_score).color} rounded-full`}
                            style={{ width: `${(testResults.stress_score / 21) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Score: {testResults.stress_score}/21</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-4">
                      Last test taken: {new Date(testResults.created_at).toLocaleDateString()}
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    <p>No test results available.</p>
                    <p className="text-xs mt-2">Take the DASS-21 assessment to see your results here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}
