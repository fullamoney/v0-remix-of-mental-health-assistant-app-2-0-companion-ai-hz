"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { saveUserProfile } from "@/lib/storage"
import type { UserProfile } from "@/lib/types"
import Image from "next/image"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    hasMentalIllness: "",
    mentalCondition: "",
    mentalDuration: "",
    mentalFeelings: "",
    hasPhysicalIllness: "",
    physicalCondition: "",
    physicalDuration: "",
    physicalFeelings: "",
    hasTrauma: "",
    traumaDescription: "",
    traumaTimeAgo: "",
    traumaFeelings: "",
  })

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name: formData.name,
      age: Number.parseInt(formData.age),
      gender: formData.gender,
      createdAt: new Date().toISOString(),
    }

    if (formData.hasMentalIllness === "yes") {
      profile.mentalIllness = {
        condition: formData.mentalCondition,
        duration: formData.mentalDuration,
        feelings: formData.mentalFeelings,
      }
    }

    if (formData.hasPhysicalIllness === "yes") {
      profile.physicalIllness = {
        condition: formData.physicalCondition,
        duration: formData.physicalDuration,
        feelings: formData.physicalFeelings,
      }
    }

    if (formData.hasTrauma === "yes") {
      profile.trauma = {
        description: formData.traumaDescription,
        timeAgo: formData.traumaTimeAgo,
        feelings: formData.traumaFeelings,
      }
    }

    saveUserProfile(profile)
    router.push("/dashboard")
  }

  const canProceedStep1 = formData.name && formData.age && formData.gender
  const canProceedStep2 =
    formData.hasMentalIllness &&
    (formData.hasMentalIllness === "no" ||
      (formData.mentalCondition && formData.mentalDuration && formData.mentalFeelings))
  const canProceedStep3 =
    formData.hasPhysicalIllness &&
    (formData.hasPhysicalIllness === "no" ||
      (formData.physicalCondition && formData.physicalDuration && formData.physicalFeelings))
  const canProceedStep4 =
    formData.hasTrauma &&
    (formData.hasTrauma === "no" || (formData.traumaDescription && formData.traumaTimeAgo && formData.traumaFeelings))

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <Image src="/buddy-logo.png" alt="Buddy AI" width={300} height={300} className="w-48 h-auto" />
          </div>
          <CardTitle className="text-3xl font-bold text-balance">Welcome to Buddy AI</CardTitle>
          <CardDescription className="text-base text-pretty">
            Your personal mental health assistant. Let's get to know you better so we can provide personalized support.
          </CardDescription>
          <div className="flex justify-center gap-2 pt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">
                  Age <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  value={formData.age}
                  onChange={(e) => updateField("age", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Gender <span className="text-destructive">*</span>
                </Label>
                <RadioGroup value={formData.gender} onValueChange={(value) => updateField("gender", value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="font-normal cursor-pointer">
                      Male
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="font-normal cursor-pointer">
                      Female
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-binary" id="non-binary" />
                    <Label htmlFor="non-binary" className="font-normal cursor-pointer">
                      Non-binary
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prefer-not-to-say" id="prefer-not-to-say" />
                    <Label htmlFor="prefer-not-to-say" className="font-normal cursor-pointer">
                      Prefer not to say
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label>Do you have any existing mental health conditions?</Label>
                <RadioGroup
                  value={formData.hasMentalIllness}
                  onValueChange={(value) => {
                    updateField("hasMentalIllness", value)
                    if (value === "no") {
                      updateField("mentalCondition", "")
                      updateField("mentalDuration", "")
                      updateField("mentalFeelings", "")
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="mental-yes" />
                    <Label htmlFor="mental-yes" className="font-normal cursor-pointer">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="mental-no" />
                    <Label htmlFor="mental-no" className="font-normal cursor-pointer">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.hasMentalIllness === "yes" && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                  <div className="space-y-2">
                    <Label htmlFor="mental-condition">What condition(s) do you have?</Label>
                    <Input
                      id="mental-condition"
                      placeholder="e.g., Anxiety, Depression, PTSD"
                      value={formData.mentalCondition}
                      onChange={(e) => updateField("mentalCondition", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mental-duration">How long have you had it?</Label>
                    <Input
                      id="mental-duration"
                      placeholder="e.g., 2 years, 6 months"
                      value={formData.mentalDuration}
                      onChange={(e) => updateField("mentalDuration", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mental-feelings">How do you feel about it?</Label>
                    <Textarea
                      id="mental-feelings"
                      placeholder="Share your thoughts and feelings..."
                      value={formData.mentalFeelings}
                      onChange={(e) => updateField("mentalFeelings", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="w-full">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!canProceedStep2} className="w-full">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label>Do you have any existing physical health conditions?</Label>
                <RadioGroup
                  value={formData.hasPhysicalIllness}
                  onValueChange={(value) => {
                    updateField("hasPhysicalIllness", value)
                    if (value === "no") {
                      updateField("physicalCondition", "")
                      updateField("physicalDuration", "")
                      updateField("physicalFeelings", "")
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="physical-yes" />
                    <Label htmlFor="physical-yes" className="font-normal cursor-pointer">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="physical-no" />
                    <Label htmlFor="physical-no" className="font-normal cursor-pointer">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.hasPhysicalIllness === "yes" && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                  <div className="space-y-2">
                    <Label htmlFor="physical-condition">What condition(s) do you have?</Label>
                    <Input
                      id="physical-condition"
                      placeholder="e.g., Chronic pain, Diabetes"
                      value={formData.physicalCondition}
                      onChange={(e) => updateField("physicalCondition", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="physical-duration">How long have you had it?</Label>
                    <Input
                      id="physical-duration"
                      placeholder="e.g., 5 years, 1 year"
                      value={formData.physicalDuration}
                      onChange={(e) => updateField("physicalDuration", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="physical-feelings">How do you feel about it?</Label>
                    <Textarea
                      id="physical-feelings"
                      placeholder="Share your thoughts and feelings..."
                      value={formData.physicalFeelings}
                      onChange={(e) => updateField("physicalFeelings", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="w-full">
                  Back
                </Button>
                <Button onClick={() => setStep(4)} disabled={!canProceedStep3} className="w-full">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label>Have you experienced any past trauma?</Label>
                <RadioGroup
                  value={formData.hasTrauma}
                  onValueChange={(value) => {
                    updateField("hasTrauma", value)
                    if (value === "no") {
                      updateField("traumaDescription", "")
                      updateField("traumaTimeAgo", "")
                      updateField("traumaFeelings", "")
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="trauma-yes" />
                    <Label htmlFor="trauma-yes" className="font-normal cursor-pointer">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="trauma-no" />
                    <Label htmlFor="trauma-no" className="font-normal cursor-pointer">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.hasTrauma === "yes" && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                  <div className="space-y-2">
                    <Label htmlFor="trauma-description">Can you briefly describe it? (optional details)</Label>
                    <Textarea
                      id="trauma-description"
                      placeholder="Share only what you're comfortable with..."
                      value={formData.traumaDescription}
                      onChange={(e) => updateField("traumaDescription", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trauma-time">How long ago did it happen?</Label>
                    <Input
                      id="trauma-time"
                      placeholder="e.g., 3 years ago, Last year"
                      value={formData.traumaTimeAgo}
                      onChange={(e) => updateField("traumaTimeAgo", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trauma-feelings">How do you feel about it now?</Label>
                    <Textarea
                      id="trauma-feelings"
                      placeholder="Share your current feelings..."
                      value={formData.traumaFeelings}
                      onChange={(e) => updateField("traumaFeelings", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setStep(3)} variant="outline" className="w-full">
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={!canProceedStep4} className="w-full">
                  Complete Setup
                </Button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center text-pretty">
              Your information is stored securely and privately on your device. We use it only to personalize your
              experience and provide better support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
