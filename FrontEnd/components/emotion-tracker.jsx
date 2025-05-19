"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { AlertCircle, Check, X, History } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"

// Define the emotions in the Plutchik Wheel with point values
const emotions = [
  // Calculate positions evenly around the circle
  { id: 1, name: "Joy", actualValue: "joy", color: "bg-yellow-400", angle: 0, value: 10 },
  { id: 2, name: "Trust", actualValue: "trust", color: "bg-green-400", angle: 45, value: 9 },
  { id: 3, name: "Fear", actualValue: "fear", color: "bg-green-600", angle: 90, value: 4 },
  { id: 4, name: "Surprise", actualValue: "surprise", color: "bg-blue-400", angle: 135, value: 6 },
  { id: 5, name: "Sadness", actualValue: "sadness", color: "bg-blue-600", angle: 180, value: 3 },
  { id: 6, name: "Disgust", actualValue: "disgust", color: "bg-purple-400", angle: 225, value: 1 },
  { id: 7, name: "Anger", actualValue: "anger", color: "bg-red-500", angle: 270, value: 2 },
  { id: 8, name: "Anticipation", actualValue: "anticipation", color: "bg-orange-400", angle: 315, value: 7 },
  // Neutral in the center
  {
    id: 9,
    name: "Neutral",
    actualValue: "neutral",
    color: "bg-gray-400",
    position: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
    value: 0,
  },
]

const emotionColors = {
  Joy: "bg-yellow-400 text-white",
  Trust: "bg-green-400 text-white",
  Fear: "bg-green-600 text-white",
  Surprise: "bg-blue-400 text-white",
  Sadness: "bg-blue-600 text-white",
  Disgust: "bg-purple-400 text-white",
  Anger: "bg-red-500 text-white",
  Anticipation: "bg-orange-400 text-white",
  Neutral: "bg-gray-400 text-white",
}

export default function EmotionTracker() {
  const router = useRouter()
  const [selectedEmotion, setSelectedEmotion] = useState(null)
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aiEvaluation, setAiEvaluation] = useState(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const handleEmotionClick = (emotion) => {
    setSelectedEmotion(emotion)
  }

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setError("You must be logged in to save entries")
      return
    }

    if (!selectedEmotion) {
      setError("Please select an emotion")
      return
    }

    setIsLoading(true)
    setIsEvaluating(true)
    setError(null)

    try {
      // Get the user's access token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      console.log("access_token", accessToken)

      if (!accessToken) {
        throw new Error("Authentication token not available")
      }
      
      const queryParams = new URLSearchParams({
        message: notes.trim(),
        emotion: selectedEmotion.actualValue
      });

      // Send request to AI evaluation endpoint
      // "http://64.176.67.55:8000/rescore"
      
      const baseUrl = "http://127.0.0.1:8000/rescore"
      const urlWithParams = `${baseUrl}?${queryParams.toString()}`
      const aiResponse = await fetch(urlWithParams, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", 
          Authorization: `Bearer ${accessToken}`,
        },
      })
      
      if (!aiResponse.ok) {
        throw new Error(`AI evaluation failed: ${aiResponse.statusText}`)
      }

      const aiResult = await aiResponse.json()
      setAiEvaluation(aiResult)
      setIsEvaluating(false)

      // // Save to Supabase using the moods table structure
      // const selectedEmotionValue = selectedEmotion.value || 5 // Default to 5 if not found

      if (error) throw error

      setSubmitted(true)

      // // Reset form after 5 seconds (increased from 3 to give more time to see AI results)
      // setTimeout(() => {
      //   setSelectedEmotion(null)
      //   setNotes("")
      //   setSubmitted(false)
      //   setAiEvaluation(null)
      // }, 5000)
    } catch (err) {
      console.error("Error processing endpointo /rescore:", err)
      console.error('Помилка:', err.name);
      console.error('Повідомлення:', err.message);
      console.error('Стек:', err.stack);

      setError("Failed to process your entry. Please try again.")
      setIsEvaluating(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section id="emotions" className="space-y-6 bg-[#e7f3f5] dark:bg-[#1a1a24] p-6 rounded-lg">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Emotion Tracker</h2>
        <p className="text-muted-foreground">
          Track your emotions using the Plutchik Wheel to better understand your emotional patterns.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md dark:bg-[#141420] dark:border-[#2a2a3c]">
          <CardHeader>
            <CardTitle>How are you today?</CardTitle>
            <CardDescription>Please tell about your feelings</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Segmented wheel chart */}
              <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-[#2a2a3c] overflow-hidden">
                {emotions
                  .filter((emotion) => emotion.name !== "Neutral")
                  .map((emotion, index) => {
                    const segmentAngle = 360 / 8 // 8 emotions excluding Neutral
                    const startAngle = index * segmentAngle
                    const endAngle = (index + 1) * segmentAngle

                    return (
                      <button
                        key={emotion.id}
                        onClick={() => handleEmotionClick(emotion)}
                        className={`absolute inset-0 origin-bottom-right ${emotion.color} 
                        ${selectedEmotion?.id === emotion.id ? "opacity-100 ring-2 ring-white dark:ring-[#2a2a3c] ring-inset" : "opacity-80 hover:opacity-90"}`}
                        style={{
                          clipPath: `polygon(50% 50%, ${50 + 50 * Math.sin((startAngle * Math.PI) / 180)}% ${50 - 50 * Math.cos((startAngle * Math.PI) / 180)}%, ${50 + 50 * Math.sin((endAngle * Math.PI) / 180)}% ${50 - 50 * Math.cos((endAngle * Math.PI) / 180)}%)`,
                        }}
                        title={emotion.name}
                      >
                        <span className="absolute top-[30%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-white rotate-[${startAngle + segmentAngle/2}deg]">
                          {selectedEmotion?.id === emotion.id && <Check className="h-3 w-3" />}
                        </span>
                      </button>
                    )
                  })}
              </div>

              {/* Center circle for neutral */}
              {(() => {
                const neutralEmotion = emotions.find((e) => e.name === "Neutral")
                return (
                  <button
                    onClick={() => handleEmotionClick(neutralEmotion)}
                    className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                      w-[30%] h-[30%] rounded-full ${neutralEmotion.color} flex items-center justify-center
                      ${selectedEmotion?.id === neutralEmotion.id ? "ring-2 ring-white dark:ring-[#2a2a3c] ring-offset-2 ring-offset-background" : "opacity-80 hover:opacity-100"}`}
                    title="Neutral"
                  >
                    <span className="text-xs font-medium text-white">
                      {selectedEmotion?.id === neutralEmotion.id && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                )
              })()}

              {/* Labels for each segment */}
              {emotions
                .filter((emotion) => emotion.name !== "Neutral")
                .map((emotion, index) => {
                  const segmentAngle = 360 / 8 // 8 emotions excluding Neutral
                  const labelAngle = index * segmentAngle + segmentAngle / 2
                  const radius = 60 // Position labels outside the wheel
                  const x = 50 + radius * Math.sin((labelAngle * Math.PI) / 180)
                  const y = 50 - radius * Math.cos((labelAngle * Math.PI) / 180)

                  return (
                    <div
                      key={`label-${emotion.id}`}
                      className="absolute text-xs font-medium transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        top: `${y}%`,
                        left: `${x}%`,
                      }}
                    >
                      {emotion.name}
                    </div>
                  )
                })}
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            {selectedEmotion && (
              <div
                className={`${selectedEmotion.color} text-white text-xs px-2 py-1 rounded-full flex items-center gap-1`}
              >
                {selectedEmotion.name}
                <button onClick={() => setSelectedEmotion(null)} className="hover:bg-black/10 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {!selectedEmotion && <span className="text-sm text-muted-foreground">No emotion selected</span>}
          </CardFooter>
        </Card>

        <Card className="shadow-md dark:bg-[#141420] dark:border-[#2a2a3c]">
          <CardHeader className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <CardTitle>Journal Entry</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex items-center gap-1 dark:bg-[#0c0c14] dark:hover:bg-[#1a1a24]"
                onClick={() => router.push("/journal-history")}
              >
                <History className="h-3.5 w-3.5" />
                View History
              </Button>
            </div>
            <CardDescription>Add notes about what might be influencing your emotions today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {
            submitted ? (
              <Alert className="bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300">
                <Check className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  <p>Your emotion entry has been recorded.</p>
                  {
                  aiEvaluation && (
                    <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                      <p className="font-medium text-sm">AI Analysis:</p>
                      <p className="text-sm">
                        Detected emotion: <span className="font-medium">{aiEvaluation.emotion_type}</span> with {Math.round(aiEvaluation.confidence * 100)}% confidence
                      </p>
                    </div>
                  )
                  }
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="How are you feeling today? What might be causing these emotions?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    className="dark:bg-[#0c0c14] dark:border-[#2a2a3c]"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {isEvaluating && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm">Analyzing your emotions...</span>
                  </div>
                )}

                {aiEvaluation && !submitted && (
                  <div className="bg-slate-50 dark:bg-[#0c0c14] p-4 rounded-md space-y-2">
                    <h4 className="font-medium text-sm">AI Emotion Analysis</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Detected Emotion:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        emotionColors[aiEvaluation.emotion_type] || "bg-gray-400 text-white"
                      }`}>
                        {aiEvaluation.emotion_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm">Confidence:</span>
                      <div className="mt-1 h-2 w-full bg-gray-200 dark:bg-[#1a1a24] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${Math.round(aiEvaluation.confidence * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-muted-foreground">
                          {Math.round(aiEvaluation.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    {aiEvaluation.emotion_type !== selectedEmotion.name && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        The AI detected a different emotion than what you selected. This might provide additional insight into your feelings.
                      </p>
                    )}
                  </div>
                )}

                {!isAuthenticated && (
                  <Alert
                    variant="warning"
                    className="bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not logged in</AlertTitle>
                  </Alert>
                )}

                <Button onClick={handleSubmit} disabled={!selectedEmotion || isLoading} className="w-full">
                  {isLoading ? "Saving..." : "Save Entry"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
