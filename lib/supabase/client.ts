import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    "https://iyzyrvnwjepsoyhzwane.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5enlydm53amVwc295aHp3YW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjA2MzIsImV4cCI6MjA3NjM5NjYzMn0.PSjsAgVQz4KLXCZrYQweVO13KqaMBooZw0A2GpJzqwA",
  )
}
