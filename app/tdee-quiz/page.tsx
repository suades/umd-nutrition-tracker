"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function TDEEQuizPage() {
  const router = useRouter()
  const [age, setAge] = useState("")
  const [sex, setSex] = useState("")
  const [heightFt, setHeightFt] = useState("")
  const [heightIn, setHeightIn] = useState("")
  const [weight, setWeight] = useState("")
  const [activityLevel, setActivityLevel] = useState("")
  const [tdee, setTdee] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push("/")
        return
      }

      setUser(data.user)

      // Check if user already has TDEE calculated
      const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", data.user.id).single()

      if (profile && profile.tdee) {
        // User already has TDEE, redirect to dashboard
        router.push("/dashboard")
      }
    }

    checkAuth()
  }, [router])

  const calculateTDEE = () => {
    // Basic TDEE calculation
    const heightInInches = Number(heightFt) * 12 + Number(heightIn)
    const weightInKg = Number(weight) * 0.453592
    const heightInCm = heightInInches * 2.54
    const ageNum = Number(age)

    let bmr = 0
    if (sex === "male") {
      bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * ageNum + 5
    } else {
      bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * ageNum - 161
    }

    let activityMultiplier = 1.2 // Sedentary default
    switch (activityLevel) {
      case "lightly-active":
        activityMultiplier = 1.375
        break
      case "active":
        activityMultiplier = 1.55
        break
      case "very-active":
        activityMultiplier = 1.725
        break
    }

    const calculatedTDEE = Math.round(bmr * activityMultiplier)
    setTdee(calculatedTDEE)
  }

  const handleSaveAndContinue = async () => {
    if (!tdee || !user) return

    setIsLoading(true)
    setError("")

    try {
      const supabase = getSupabaseBrowserClient()

      // Update user profile with TDEE and physical information
      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        height_feet: Number(heightFt),
        height_inches: Number(heightIn),
        weight: Number(weight),
        activity_level: activityLevel,
        tdee: tdee,
      })

      if (error) {
        throw error
      }

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to save TDEE")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-primary">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">TDEE Calculator</h1>
          <p className="text-muted-foreground">Let&apos;s calculate your daily energy needs</p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-center">Calculate Your TDEE</CardTitle>
            <CardDescription className="text-center">
              Total Daily Energy Expenditure (TDEE) is the total number of calories you burn each day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Years"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sex">Sex</Label>
                <Select value={sex} onValueChange={setSex} required>
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Select biological sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="height-ft">Height (ft)</Label>
                  <Input
                    id="height-ft"
                    type="number"
                    placeholder="Feet"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="height-in">Height (in)</Label>
                  <Input
                    id="height-in"
                    type="number"
                    placeholder="Inches"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Pounds"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="activity">Activity Level</Label>
                <Select value={activityLevel} onValueChange={setActivityLevel} required>
                  <SelectTrigger id="activity">
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                    <SelectItem value="lightly-active">Lightly Active (light exercise 1-3 days/week)</SelectItem>
                    <SelectItem value="active">Active (moderate exercise 3-5 days/week)</SelectItem>
                    <SelectItem value="very-active">Very Active (hard exercise 6-7 days/week)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <div className="text-destructive text-sm">{error}</div>}

              <Button
                type="button"
                onClick={calculateTDEE}
                className="w-full"
                disabled={isLoading || !age || !sex || !heightFt || !heightIn || !weight || !activityLevel}
              >
                {isLoading ? "Calculating..." : "Calculate My TDEE"}
              </Button>
            </form>

            {tdee && (
              <div className="mt-6 p-4 bg-secondary rounded-lg text-center">
                <h3 className="text-lg font-semibold mb-2">Your Estimated TDEE</h3>
                <p className="text-3xl font-bold text-primary">{tdee} calories</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This is the estimated number of calories you need daily to maintain your current weight
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleSaveAndContinue} disabled={!tdee || isLoading}>
              {isLoading ? "Saving..." : "Save and Go to Dashboard"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
