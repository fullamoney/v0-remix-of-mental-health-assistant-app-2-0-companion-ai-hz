"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoodSelector } from "@/components/mood-selector"
import { calculateAverageMood, MOOD_EMOJIS } from "@/lib/mood-utils"
import { isNotificationSupported, enableNotifications, disableNotifications } from "@/lib/notifications"
import type { MoodEntry } from "@/lib/types"
import { MessageSquare, TrendingUp, Heart, Bell, BellOff, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const [todaysMood, setTodaysMood] = useState<MoodEntry | null>(null)
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUserId(user.id)

      // Load profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profile) {
        setUserName(profile.name)
      }

      // Load today's mood
      const today = new Date().toISOString().split("T")[0]
      const { data: todayMood } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .single()

      if (todayMood) {
        setTodaysMood({
          id: todayMood.id,
          userId: todayMood.user_id,
          mood: Number.parseInt(todayMood.mood),
          note: todayMood.note || undefined,
          date: new Date(todayMood.created_at).toISOString().split("T")[0],
          timestamp: new Date(todayMood.created_at).getTime(),
        })
      }

      // Load recent moods (last 7 days)
      const { data: moods } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(7)

      if (moods) {
        setRecentMoods(
          moods.map((m) => ({
            id: m.id,
            userId: m.user_id,
            mood: Number.parseInt(m.mood),
            note: m.note || undefined,
            date: new Date(m.created_at).toISOString().split("T")[0],
            timestamp: new Date(m.created_at).getTime(),
          })),
        )
      }

      // Check notification settings
      if (isNotificationSupported()) {
        setShowNotificationPrompt(true)
      }

      setIsLoading(false)
    }

    loadUserData()
  }, [router])

  const handleMoodSaved = async () => {
    const supabase = createClient()
    const today = new Date().toISOString().split("T")[0]
    const { data: todayMood } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)
      .single()

    if (todayMood) {
      setTodaysMood({
        id: todayMood.id,
        userId: todayMood.user_id,
        mood: Number.parseInt(todayMood.mood),
        note: todayMood.note || undefined,
        date: new Date(todayMood.created_at).toISOString().split("T")[0],
        timestamp: new Date(todayMood.created_at).getTime(),
      })
    }

    const { data: moods } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(7)

    if (moods) {
      setRecentMoods(
        moods.map((m) => ({
          id: m.id,
          userId: m.user_id,
          mood: Number.parseInt(m.mood),
          note: m.note || undefined,
          date: new Date(m.created_at).toISOString().split("T")[0],
          timestamp: new Date(m.created_at).getTime(),
        })),
      )
    }
  }

  const handleEnableNotifications = async () => {
    const success = await enableNotifications("09:00")
    if (success) {
      setNotificationsEnabled(true)
      setShowNotificationPrompt(false)
    }
  }

  const handleDisableNotifications = () => {
    disableNotifications()
    setNotificationsEnabled(false)
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
              <h1 className="text-4xl font-bold text-balance">Welcome back, {userName}</h1>
              <p className="text-muted-foreground text-pretty">
                Your safe space for mental wellness and emotional support
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isNotificationSupported() && (
              <Button
                variant={notificationsEnabled ? "default" : "outline"}
                size="icon"
                onClick={notificationsEnabled ? handleDisableNotifications : handleEnableNotifications}
                title={notificationsEnabled ? "Disable daily reminders" : "Enable daily reminders"}
              >
                {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {showNotificationPrompt && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-primary" />
                <CardTitle>Stay on track with daily reminders</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-pretty">
                Get a gentle daily reminder at 9:00 AM to check in with Buddy AI and log your mood. Consistent tracking
                helps you understand your mental wellness journey better.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleEnableNotifications}>Enable Reminders</Button>
                <Button variant="outline" onClick={() => setShowNotificationPrompt(false)}>
                  Maybe Later
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mood Tracking */}
        <MoodSelector onMoodSaved={handleMoodSaved} todaysMood={todaysMood} userId={userId} />

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
                {recentMoods.map((mood) => (
                  <div
                    key={mood.id}
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
