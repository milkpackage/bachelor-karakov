"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function DailyMoodTracker() {
  const [moodScore, setMoodScore] = useState(5)
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [todaysMood, setTodaysMood] = useState(null)
  const { user, isAuthenticated } = useAuth()
  const supabase = getSupabaseBrowserClient()

  // Check if user has already submitted a mood for today
  useEffect(() => {
    const checkTodaysMood = async () => {
      if (!isAuthenticated) return

      try {
        const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

        const { data, error } = await supabase
          .from("daily_moods")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .single()

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "no rows returned" error
          throw error
        }

        if (data) {
          setTodaysMood(data)
          setMoodScore(data.mood_score)
        }
      } catch (err) {
        console.error("Error checking today's mood:", err)
      }
    }

    checkTodaysMood()
  }, [isAuthenticated, user, supabase])

  const getMoodLabel = (score) => {
    if (score <= 2) return "Very Poor"
    if (score <= 4) return "Poor"
    if (score <= 6) return "Neutral"
    if (score <= 8) return "Good"
    return "Excellent"
  }

  const getMoodColor = (score) => {
    if (score <= 2) return "text-red-500"
    if (score <= 4) return "text-orange-500"
    if (score <= 6) return "text-yellow-500"
    if (score <= 8) return "text-emerald-500"
    return "text-green-500"
  }

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setError("You must be logged in to save your mood")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

      if (todaysMood) {
        // Update existing mood
        const { error } = await supabase.from("daily_moods").update({ mood_score: moodScore }).eq("id", todaysMood.id)

        if (error) throw error
      } else {
        // Insert new mood
        const { error } = await supabase.from("daily_moods").insert({
          user_id: user.id,
          date: today,
          mood_score: moodScore,
        })

        if (error) throw error
      }

      setSubmitted(true)

      // Reset submitted state after 3 seconds
      setTimeout(() => {
        setSubmitted(false)
      }, 3000)
    } catch (err) {
      console.error("Error saving mood:", err)
      setError("Failed to save your mood. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-md dark:bg-[#141420] dark:border-[#2a2a3c]">
      <CardHeader>
        <CardTitle>Daily Mood Check-in</CardTitle>
        <CardDescription>How are you feeling today? Rate your mood on a scale from 1 to 10.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {submitted ? (
          <Alert className="bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300">
            <Check className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>Your mood has been recorded for today.</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Poor</span>
                <span className={`text-lg font-bold ${getMoodColor(moodScore)}`}>{getMoodLabel(moodScore)}</span>
                <span className="text-sm">Excellent</span>
              </div>
              <Slider
                value={[moodScore]}
                min={1}
                max={10}
                step={1}
                onValueChange={(value) => setMoodScore(value[0])}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
                <span>8</span>
                <span>9</span>
                <span>10</span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isAuthenticated && (
              <Alert
                variant="warning"
                className="bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Not logged in</AlertTitle>
                <AlertDescription>
                  You need to be logged in to save your mood. Your data will not be saved.
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
              {isLoading ? "Saving..." : todaysMood ? "Update Today's Mood" : "Save Today's Mood"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
