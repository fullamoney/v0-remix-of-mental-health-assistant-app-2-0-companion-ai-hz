"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserProfile, getMoodEntries, getChatMessages, isOnboardingComplete } from "@/lib/storage"
import { calculateProgressSummary, getEntriesForPeriod, MOOD_EMOJIS, MOOD_LABELS } from "@/lib/mood-utils"
import type { UserProfile, MoodEntry, ChatMessage } from "@/lib/types"
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Award, MessageSquare } from "lucide-react"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function ProgressPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<"weekly" | "biweekly" | "monthly">("weekly")

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.push("/onboarding")
      return
    }

    const userProfile = getUserProfile()
    if (!userProfile) {
      router.push("/onboarding")
      return
    }

    setProfile(userProfile)

    const allMoods = getMoodEntries()
    const userMoods = allMoods.filter((m) => m.userId === userProfile.id)
    setMoodEntries(userMoods)

    const allMessages = getChatMessages()
    const userMessages = allMessages.filter((m) => m.userId === userProfile.id)
    setChatMessages(userMessages)

    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    )
  }

  const summary = profile ? calculateProgressSummary(profile.id, moodEntries, selectedPeriod) : null
  const periodEntries = getEntriesForPeriod(moodEntries, selectedPeriod)

  // Prepare chart data
  const chartData = periodEntries
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((entry) => ({
      date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      mood: entry.mood,
      fullDate: entry.date,
    }))

  // Mood distribution data
  const moodDistribution = [1, 2, 3, 4, 5].map((mood) => ({
    mood: MOOD_LABELS[mood as 1 | 2 | 3 | 4 | 5],
    count: periodEntries.filter((e) => e.mood === mood).length,
    emoji: MOOD_EMOJIS[mood as 1 | 2 | 3 | 4 | 5],
  }))

  const getTrendIcon = () => {
    if (!summary) return <Minus className="h-5 w-5" />
    if (summary.moodTrend === "improving") return <TrendingUp className="h-5 w-5 text-green-500" />
    if (summary.moodTrend === "declining") return <TrendingDown className="h-5 w-5 text-red-500" />
    return <Minus className="h-5 w-5 text-yellow-500" />
  }

  const getTrendMessage = () => {
    if (!summary) return ""
    if (summary.moodTrend === "improving")
      return "Your mood has been improving! Keep up the great work with your wellness practices."
    if (summary.moodTrend === "declining")
      return "Your mood has been declining. Remember, it's okay to have difficult periods. Consider reaching out for additional support."
    return "Your mood has been stable. Consistency is important for mental wellness."
  }

  const participationRate = summary ? (summary.participationDays / summary.totalDays) * 100 : 0
  const userChatCount = chatMessages.filter((m) => m.role === "user").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Your Progress</h1>
            <p className="text-sm text-muted-foreground">Track your wellness journey and celebrate your growth</p>
          </div>
        </div>

        {/* Period Selector */}
        <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="biweekly">Bi-weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedPeriod} className="space-y-6 mt-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Average Mood</CardDescription>
                  <CardTitle className="text-4xl flex items-center gap-2">
                    {summary?.averageMood.toFixed(1) || "N/A"}
                    {summary && (
                      <span className="text-3xl">
                        {MOOD_EMOJIS[Math.round(summary.averageMood) as 1 | 2 | 3 | 4 | 5]}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Based on {periodEntries.length} mood {periodEntries.length === 1 ? "entry" : "entries"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Mood Trend</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2 capitalize">
                    {getTrendIcon()}
                    {summary?.moodTrend || "N/A"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground text-pretty">{getTrendMessage()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Participation</CardDescription>
                  <CardTitle className="text-4xl">
                    {summary?.participationDays || 0}/{summary?.totalDays || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${participationRate}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{participationRate.toFixed(0)}% participation rate</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mood Trend Chart */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Mood Over Time</CardTitle>
                  <CardDescription>Your daily mood entries for the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      mood: {
                        label: "Mood",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} className="text-xs" />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => [
                                `${value} ${MOOD_EMOJIS[value as 1 | 2 | 3 | 4 | 5]} - ${MOOD_LABELS[value as 1 | 2 | 3 | 4 | 5]}`,
                                "Mood",
                              ]}
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="mood"
                          stroke="var(--color-mood)"
                          strokeWidth={2}
                          dot={{ fill: "var(--color-mood)", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Mood Distribution */}
            {moodDistribution.some((d) => d.count > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Mood Distribution</CardTitle>
                  <CardDescription>How often you experienced each mood level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: {
                        label: "Days",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={moodDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="mood"
                          className="text-xs"
                          tickFormatter={(value, index) => moodDistribution[index].emoji}
                        />
                        <YAxis className="text-xs" />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name, props) => [
                                `${value} ${value === 1 ? "day" : "days"}`,
                                `${props.payload.emoji} ${props.payload.mood}`,
                              ]}
                            />
                          }
                        />
                        <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Your Achievements
                </CardTitle>
                <CardDescription>Celebrate your progress and consistency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary && summary.moodTrend === "improving" && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Mood Improvement</p>
                      <p className="text-xs text-muted-foreground">
                        Your mood has been trending upward. This is wonderful progress!
                      </p>
                    </div>
                  </div>
                )}

                {participationRate >= 80 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Award className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Consistent Tracker</p>
                      <p className="text-xs text-muted-foreground">
                        You've tracked your mood {participationRate.toFixed(0)}% of the time. Great consistency!
                      </p>
                    </div>
                  </div>
                )}

                {userChatCount >= 5 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Active Communicator</p>
                      <p className="text-xs text-muted-foreground">
                        You've had {userChatCount} conversations with Companion AI. Keep reaching out!
                      </p>
                    </div>
                  </div>
                )}

                {summary && summary.moodTrend === "stable" && participationRate >= 50 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Minus className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Steady Progress</p>
                      <p className="text-xs text-muted-foreground">
                        Your mood has been stable. Consistency is an important part of wellness!
                      </p>
                    </div>
                  </div>
                )}

                {periodEntries.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">
                      Start tracking your mood daily to unlock achievements and see your progress!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Encouragement */}
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm text-center text-pretty">
                  {periodEntries.length > 0
                    ? "Remember, progress isn't always linear. Every day you show up for yourself is a victory. Keep going!"
                    : "Your wellness journey starts with a single step. Begin tracking your mood today to see your progress over time."}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
