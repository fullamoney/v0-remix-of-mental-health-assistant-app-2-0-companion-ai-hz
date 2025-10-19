"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MOOD_EMOJIS, MOOD_LABELS } from "@/lib/mood-utils"
import { saveMoodEntry } from "@/lib/supabase-storage"
import type { MoodEntry } from "@/lib/types"

interface MoodSelectorProps {
  onMoodSaved?: () => void
}

export function MoodSelector({ onMoodSaved }: MoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasSavedToday, setHasSavedToday] = useState(false)

  const handleSaveMood = async () => {
    if (!selectedMood) return

    setIsSaving(true)

    try {
      const entry: MoodEntry = {
        mood: selectedMood,
        date: new Date().toISOString(),
        note: undefined,
      }

      await saveMoodEntry(entry)
      setHasSavedToday(true)
      onMoodSaved?.()
    } catch (error) {
      console.error("Error saving mood:", error)
      alert("Failed to save mood. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>How are you feeling today?</CardTitle>
        <CardDescription>Select the emoji that best represents your current mood</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between gap-2">
          {([1, 2, 3, 4, 5] as const).map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                selectedMood === mood
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              }`}
              type="button"
            >
              <span className="text-4xl">{MOOD_EMOJIS[mood]}</span>
              <span className="text-xs font-medium text-center">{MOOD_LABELS[mood]}</span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <div className="animate-in fade-in duration-300">
            <Button onClick={handleSaveMood} disabled={isSaving || hasSavedToday} className="w-full">
              {hasSavedToday ? "Mood Recorded Today" : isSaving ? "Saving..." : "Save Mood"}
            </Button>
            {hasSavedToday && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                You've recorded your mood today. Come back tomorrow!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
