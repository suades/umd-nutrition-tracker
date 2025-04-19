"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

type WeightEntry = {
  id: string
  weight: number
  date: string
}

export default function LogWeightPage() {
  const router = useRouter()
  const [weight, setWeight] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]) // Default to today
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchWeightEntries = async () => {
      try {
        const supabase = getSupabaseBrowserClient()

        // Check if user is authenticated
        const { data: authData } = await supabase.auth.getUser()

        if (!authData.user) {
          router.push("/")
          return
        }

        // Get weight entries
        const { data: entries, error: entriesError } = await supabase
          .from("diary_entries")
          .select("id, date, weight")
          .eq("user_id", authData.user.id)
          .not("weight", "is", null)
          .order("date", { ascending: false })

        if (entriesError) {
          throw entriesError
        }

        setWeightHistory(entries || [])
      } catch (error: any) {
        setError(error.message || "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeightEntries()
  }, [router])

  const handleLogWeight = async () => {
    if (!weight || !date) return

    setError("")
    setSuccess("")
    setIsSaving(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: authData } = await supabase.auth.getUser()

      if (!authData.user) {
        router.push("/")
        return
      }

      // Check if diary entry exists for the selected date
      const { data: existingEntry, error: existingError } = await supabase
        .from("diary_entries")
        .select("id")
        .eq("user_id", authData.user.id)
        .eq("date", date)
        .single()

      if (existingError && existingError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        throw existingError
      }

      let entryId

      if (existingEntry) {
        // Update existing entry
        const { error: updateError } = await supabase
          .from("diary_entries")
          .update({ weight: Number.parseFloat(weight) })
          .eq("id", existingEntry.id)

        if (updateError) {
          throw updateError
        }

        entryId = existingEntry.id
      } else {
        // Create new entry
        const { data: newEntry, error: insertError } = await supabase
          .from("diary_entries")
          .insert({
            user_id: authData.user.id,
            date,
            weight: Number.parseFloat(weight),
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        entryId = newEntry.id
      }

      // Refresh weight history
      const { data: updatedEntries, error: refreshError } = await supabase
        .from("diary_entries")
        .select("id, date, weight")
        .eq("user_id", authData.user.id)
        .not("weight", "is", null)
        .order("date", { ascending: false })

      if (refreshError) {
        throw refreshError
      }

      setWeightHistory(updatedEntries || [])
      setSuccess("Weight logged successfully!")
      setWeight("")

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (error: any) {
      setError(error.message || "Failed to log weight")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-primary">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <AppHeader />

      <main className="flex-1 container py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Log Your Weight</h1>
        </div>

        {error && <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}
        {success && <div className="mb-6 p-4 bg-green-500/10 text-green-500 rounded-md">{success}</div>}

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Enter Weight</CardTitle>
              <CardDescription>Keep track of your progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="Enter your weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Enter weight to the nearest tenth (e.g., 165.5)</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]} // Can't log future dates
                    required
                  />
                </div>
                <Button onClick={handleLogWeight} disabled={isSaving || !weight || !date}>
                  {isSaving ? "Saving..." : "Log Weight"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Weight History</CardTitle>
              <CardDescription>Your recent weight entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weightHistory.length > 0 ? (
                  weightHistory.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0"
                    >
                      <span>
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="font-medium">{entry.weight.toFixed(1)} lbs</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No weight entries yet</p>
                  </div>
                )}
              </div>
            </CardContent>
            {weightHistory.length > 0 && (
              <CardFooter>
                <div className="w-full flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {weightHistory.length > 1 &&
                      `${(weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight).toFixed(1)} lbs change`}
                  </span>
                  <span className="text-sm text-primary">
                    {weightHistory.length > 1 &&
                      (weightHistory[0].weight < weightHistory[weightHistory.length - 1].weight
                        ? "Losing weight!"
                        : "Gaining weight")}
                  </span>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
