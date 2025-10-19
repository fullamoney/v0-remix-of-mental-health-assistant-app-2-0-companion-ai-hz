"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, Mic, MicOff, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

export default function ChatPage() {
  const router = useRouter()
  const [userName, setUserName] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadUserAndMessages = async () => {
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

      setIsLoading(false)
    }

    loadUserAndMessages()
  }, [router])

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    body: () => ({
      userName: userName || "there",
      userId: userId,
    }),
    initialMessages: [],
  })

  useEffect(() => {
    if (!userId) return

    const loadHistory = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("[v0] Error loading messages:", error)
        return
      }

      if (data && data.length > 0) {
        console.log("[v0] Loaded chat messages from Supabase:", data.length)
        const formattedMessages = data.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          parts: [{ type: "text" as const, text: msg.content }],
        }))
        setMessages(formattedMessages)
      }
    }

    loadHistory()

    const supabase = createClient()
    const channel = supabase
      .channel("messages_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[v0] Real-time message received:", payload)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, setMessages])

  useEffect(() => {
    if (messages.length === 0 || !userId) return

    const saveLastMessage = async () => {
      const lastMessage = messages[messages.length - 1]
      const supabase = createClient()

      // Check if message already exists
      const { data: existing } = await supabase.from("messages").select("id").eq("id", lastMessage.id).single()

      if (!existing) {
        const { error } = await supabase.from("messages").insert({
          id: lastMessage.id,
          user_id: userId,
          role: lastMessage.role,
          content: lastMessage.content,
          created_at: new Date().toISOString(),
        })

        if (error) {
          console.error("[v0] Error saving message to Supabase:", error)
        } else {
          console.log("[v0] Message saved to Supabase")
        }
      }
    }

    saveLastMessage()
  }, [messages, userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (inputValue.trim()) {
      sendMessage({ text: inputValue })
      setInputValue("")
    }
  }

  const toggleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input is not supported in your browser. Please use Chrome or Edge.")
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputValue((prev) => prev + " " + transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto p-4 md:p-8 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Image src="/buddy-logo.png" alt="Buddy AI" width={48} height={48} className="w-12 h-auto" />
          <div>
            <h1 className="text-3xl font-bold">Chat with Buddy</h1>
            <p className="text-sm text-muted-foreground">Your safe space to talk and receive support</p>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="h-[calc(100vh-16rem)] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle>Conversation</CardTitle>
            <CardDescription>Share your thoughts and feelings. I'm here to listen and support you.</CardDescription>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="text-pretty">
                  {error.message || "Something went wrong. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2 max-w-md">
                  <p className="text-muted-foreground text-pretty">
                    Hello {userName}, I'm here to support you. How are you feeling today? What's on your mind?
                  </p>
                  <div className="grid grid-cols-1 gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputValue("I'm feeling anxious today")
                      }}
                      className="text-left justify-start"
                    >
                      I'm feeling anxious today
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputValue("I need help managing stress")
                      }}
                      className="text-left justify-start"
                    >
                      I need help managing stress
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputValue("Can we talk about coping strategies?")
                      }}
                      className="text-left justify-start"
                    >
                      Can we talk about coping strategies?
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap text-pretty">{message.content}</p>
                </div>
              </div>
            ))}

            {status === "in_progress" && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleFormSubmit(e as any)
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={toggleVoiceInput}
                  className={isListening ? "bg-destructive text-destructive-foreground" : ""}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button type="submit" size="icon" disabled={!inputValue.trim() || status === "in_progress"}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>

        {/* Disclaimer */}
        <Card className="border-muted">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground text-center text-pretty">
              Buddy AI provides support and guidance but is not a replacement for professional mental health care. If
              you're in crisis, please contact 1-888-429-KARE (5273) (Jamaica) or your local crisis line immediately.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
