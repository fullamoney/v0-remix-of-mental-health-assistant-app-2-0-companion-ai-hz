"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoodSelector } from "@/components/mood-selector"
import { getUserProfile, getMoodEntries } from "@/lib/supabase-storage"
import { calculateAverageMood, MOOD_EMOJIS } from "@/lib/mood-utils"
import { createClient } from "@/lib/supabase/client"
import type { UserProfile, MoodEntry } from "@/lib/types"
import { MessageSquare, TrendingUp, Heart, LogOut } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const userProfile = await getUserProfile()

      if (!userProfile) {
        router.push("/auth/login")
        return
      }

      setProfile(userProfile)

      const moods = await getMoodEntries()
      setRecentMoods(moods.slice(0, 7))
      setIsLoading(false)
    }

    loadData()
  }, [router])

  const handleMoodSaved = async () => {
    const moods = await getMoodEntries()
    setRecentMoods(moods.slice(0, 7))
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const averageMood = calculateAverageMood(recentMoods)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image src="/buddy-logo.png" alt="Buddy AI" width={64} height={64} className="w-16 h-auto" />
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-balance">Welcome back, {profile?.name}</h1>
              <p className="text-muted-foreground text-pretty">
                Your safe space for mental wellness and emotional support
              </p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Mood Tracking */}
        <MoodSelector onMoodSaved={handleMoodSaved} />

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/chat" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Talk to Buddy</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Chat with your AI companion for support, guidance, and a listening ear
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/progress" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">View Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Track your mood trends and celebrate your journey to wellness</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Your Wellness</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {recentMoods.length > 0 ? (
                  <>
                    <span className="block text-foreground font-semibold mb-1">
                      7-day average: {averageMood.toFixed(1)}{" "}
                      {MOOD_EMOJIS[Math.round(averageMood) as 1 | 2 | 3 | 4 | 5]}
                    </span>
                    Keep tracking your mood daily to see your progress
                  </>
                ) : (
                  "Start tracking your mood to see insights about your wellness journey"
                )}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Recent Moods */}
        {recentMoods.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Mood History</CardTitle>
              <CardDescription>Your mood entries from the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {recentMoods.map((mood, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <span className="text-3xl">{MOOD_EMOJIS[mood.mood]}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(mood.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crisis Resources */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Need Immediate Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-pretty">
              If you're experiencing a mental health crisis or having thoughts of self-harm, please reach out to
              professional help immediately:
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Suicide Prevention Helpline (Jamaica):</strong> 1-888-429-KARE (5273)
              </p>
              <p>
                <strong>Bellevue Hospital Crisis Line:</strong> 1-876-977-0033
              </p>
              <p>
                <strong>International:</strong> Find your local crisis line at findahelpline.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
