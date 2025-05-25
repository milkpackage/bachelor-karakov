"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"

// DASS-21 questions
const dassQuestions = [
  { id: 1, text: "I found it hard to wind down", category: "stress" },
  { id: 2, text: "I was aware of dryness of my mouth", category: "anxiety" },
  { id: 3, text: "I couldn't seem to experience any positive feeling at all", category: "depression" },
  { id: 4, text: "I experienced breathing difficulty", category: "anxiety" },
  { id: 5, text: "I found it difficult to work up the initiative to do things", category: "depression" },
  { id: 6, text: "I tended to over-react to situations", category: "stress" },
  { id: 7, text: "I experienced trembling (e.g., in the hands)", category: "anxiety" },
  { id: 8, text: "I felt that I was using a lot of nervous energy", category: "stress" },
  {
    id: 9,
    text: "I was worried about situations in which I might panic and make a fool of myself",
    category: "anxiety",
  },
  { id: 10, text: "I felt that I had nothing to look forward to", category: "depression" },
  { id: 11, text: "I found myself getting agitated", category: "stress" },
  { id: 12, text: "I found it difficult to relax", category: "stress" },
  { id: 13, text: "I felt down-hearted and blue", category: "depression" },
  {
    id: 14,
    text: "I was intolerant of anything that kept me from getting on with what I was doing",
    category: "stress",
  },
  { id: 15, text: "I felt I was close to panic", category: "anxiety" },
  { id: 16, text: "I was unable to become enthusiastic about anything", category: "depression" },
  { id: 17, text: "I felt I wasn't worth much as a person", category: "depression" },
  { id: 18, text: "I felt that I was rather touchy", category: "stress" },
  { id: 19, text: "I was aware of the action of my heart in the absence of physical exertion", category: "anxiety" },
  { id: 20, text: "I felt scared without any good reason", category: "anxiety" },
  { id: 21, text: "I felt that life was meaningless", category: "depression" },
]

// DASS-21 answer options
const dassOptions = [
  { value: "0", label: "Did not apply to me at all" },
  { value: "1", label: "Applied to me to some degree, or some of the time" },
  { value: "2", label: "Applied to me to a considerable degree, or a good part of time" },
  { value: "3", label: "Applied to me very much, or most of the time" },
]

export default function TestsSection() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [testCompleted, setTestCompleted] = useState(false)
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previousResults, setPreviousResults] = useState(null)
  const { user, isAuthenticated } = useAuth()
  const supabase = getSupabaseBrowserClient()

  // Fetch previous test results
  useEffect(() => {
    const fetchPreviousResults = async () => {
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
          setPreviousResults(data[0])
        }
      } catch (err) {
        console.error("Error fetching previous test results:", err)
      }
    }

    fetchPreviousResults()
  }, [isAuthenticated, user, supabase])

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [currentQuestion]: value })

    if (currentQuestion < dassQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateResults()
    }
  }

  const calculateResults = async () => {
    // Calculate scores for each category
    const scores = {
      depression: 0,
      anxiety: 0,
      stress: 0,
    }

    Object.entries(answers).forEach(([questionIndex, value]) => {
      const question = dassQuestions[Number.parseInt(questionIndex)]
      scores[question.category] += Number.parseInt(value)
    })

    // Calculate total score
    const totalScore = scores.depression + scores.anxiety + scores.stress

    // Set results
    const resultsData = {
      depression_score: scores.depression,
      anxiety_score: scores.anxiety,
      stress_score: scores.stress,
      total_score: totalScore,
    }

    setResults(resultsData)
    setTestCompleted(true)

    // Save results to Supabase if user is authenticated
    if (isAuthenticated) {
      setIsLoading(true)
      try {
        const { error } = await supabase.from("test_results").insert({
          user_id: user.id,
          ...resultsData,
        })

        if (error) throw error
      } catch (err) {
        console.error("Error saving test results:", err)
        setError(
          "Failed to save your test results. Your results are displayed below but may not be saved to your account.",
        )
      } finally {
        setIsLoading(false)
      }
    }
  }

  const resetTest = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setTestCompleted(false)
    setResults(null)
    setError(null)
  }

  const getDepressionLevel = (score) => {
    if (score <= 4) return { level: "Normal", color: "bg-emerald-500" }
    if (score <= 6) return { level: "Mild", color: "bg-yellow-500" }
    if (score <= 10) return { level: "Moderate", color: "bg-amber-500" }
    if (score <= 13) return { level: "Severe", color: "bg-orange-500" }
    return { level: "Extremely Severe", color: "bg-red-600" }
  }

  const getAnxietyLevel = (score) => {
    if (score <= 3) return { level: "Normal", color: "bg-emerald-500" }
    if (score <= 5) return { level: "Mild", color: "bg-yellow-500" }
    if (score <= 7) return { level: "Moderate", color: "bg-amber-500" }
    if (score <= 9) return { level: "Severe", color: "bg-orange-500" }
    return { level: "Extremely Severe", color: "bg-red-600" }
  }

  const getStressLevel = (score) => {
    if (score <= 7) return { level: "Normal", color: "bg-emerald-500" }
    if (score <= 9) return { level: "Mild", color: "bg-yellow-500" }
    if (score <= 12) return { level: "Moderate", color: "bg-amber-500" }
    if (score <= 16) return { level: "Severe", color: "bg-orange-500" }
    return { level: "Extremely Severe", color: "bg-red-600" }
  }

  return (
    <section id="tests" className="space-y-6 bg-[#bdc4f6] dark:bg-[#1a1a24] p-6 rounded-lg shadow-md">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mental Health Tests</h2>
        <p className="text-muted-foreground">Take standardized tests to assess your mental health status.</p>
      </div>

      <Card className="shadow-md dark:bg-[#141420] dark:border-[#2a2a3c]">
        <CardHeader>
          <CardTitle>DASS-21 Assessment</CardTitle>
          <CardDescription>
            The Depression, Anxiety and Stress Scale (DASS-21) is a set of three self-report scales designed to measure
            the emotional states of depression, anxiety and stress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testCompleted ? (
            <div className="space-y-6">
              <Alert className="bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300">
                <Check className="h-4 w-4" />
                <AlertTitle>Test Completed</AlertTitle>
                <AlertDescription>
                  Thank you for completing the DASS-21 assessment. Your results are below.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Depression</span>
                    <span className="text-sm font-medium">{getDepressionLevel(results.depression_score).level}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getDepressionLevel(results.depression_score).color} transition-all duration-300`}
                      style={{ width: `${(results.depression_score / 21) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Score: {results.depression_score}/21</p>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Anxiety</span>
                    <span className="text-sm font-medium">{getAnxietyLevel(results.anxiety_score).level}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getAnxietyLevel(results.anxiety_score).color} transition-all duration-300`}
                      style={{ width: `${(results.anxiety_score / 21) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Score: {results.anxiety_score}/21</p>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Stress</span>
                    <span className="text-sm font-medium">{getStressLevel(results.stress_score).level}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStressLevel(results.stress_score).color} transition-all duration-300`}
                      style={{ width: `${(results.stress_score / 21) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Score: {results.stress_score}/21</p>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Total Score</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        results.total_score <= 20
                          ? "bg-emerald-500"
                          : results.total_score <= 30
                            ? "bg-yellow-500"
                            : results.total_score <= 40
                              ? "bg-amber-500"
                              : results.total_score <= 50
                                ? "bg-orange-500"
                                : "bg-red-600"
                      }`}
                      style={{ width: `${(results.total_score / 63) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Score: {results.total_score}/63</p>
                </div>
              </div>

              {previousResults && previousResults.id !== results.id && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-[#0c0c14] rounded-md">
                  <h4 className="font-medium mb-2">Previous Test Results</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Depression:</span>{" "}
                      <span className="font-medium">{previousResults.depression_score}/21</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Anxiety:</span>{" "}
                      <span className="font-medium">{previousResults.anxiety_score}/21</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stress:</span>{" "}
                      <span className="font-medium">{previousResults.stress_score}/21</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>{" "}
                      <span className="font-medium">{previousResults.total_score}/63</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Date: {new Date(previousResults.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-[#0c0c14] p-4 rounded-md">
                <h4 className="font-medium mb-2">Disclaimer</h4>
                <p className="text-sm text-muted-foreground">
                  This assessment is not a diagnostic tool. It is designed to help you understand your current emotional
                  state. If you are concerned about your mental health, please consult with a healthcare professional.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Question {currentQuestion + 1} of {dassQuestions.length}
                </span>
                <Progress value={((currentQuestion + 1) / dassQuestions.length) * 100} className="w-1/2" />
              </div>

              <div className="p-4 border rounded-md dark:border-[#2a2a3c] dark:bg-[#0c0c14]">
                <p className="font-medium mb-4">{dassQuestions[currentQuestion].text}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Please indicate how much this statement applied to you over the past week.
                </p>

                <RadioGroup
                  key={`question-${currentQuestion}`}
                  value={answers[currentQuestion] || ""}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {dassOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`option-${currentQuestion}-${option.value}`} />
                      <Label htmlFor={`option-${currentQuestion}-${option.value}`} className="flex-1">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="dark:bg-[#141420] dark:border-[#2a2a3c] dark:hover:bg-[#1a1a24]"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(Math.min(dassQuestions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === dassQuestions.length - 1 || !answers[currentQuestion]}
                  className="dark:bg-[#141420] dark:border-[#2a2a3c] dark:hover:bg-[#1a1a24]"
                >
                  Skip
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {testCompleted ? (
            <Button onClick={resetTest} className="w-full">
              Take Test Again
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </section>
  )
}
