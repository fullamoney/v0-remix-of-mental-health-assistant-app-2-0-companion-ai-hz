"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isOnboardingComplete } from "@/lib/storage"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkOnboarding = () => {
      if (isOnboardingComplete()) {
        router.push("/dashboard")
      } else {
        router.push("/onboarding")
      }
    }

    checkOnboarding()
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}
