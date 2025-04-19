"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Utensils, Weight, Settings } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

type UserProfile = {
  id: string
  name: string
  tdee: number
  weight: number
  height_feet: number
  height_inches: number
  activity_level: string
}

type NutritionData = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

type WeightEntry = {
  weight: number
  date: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [todayEntries, setTodayEntries] = useState<any[]>([])
  const [nutrition, setNutrition] = useState<NutritionData>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  })
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([])
  const [streakData, setStreakData] = useState<{ date: string; logged: boolean }[]>([])

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Calculate macro targets based on TDEE
  const calculateMacroTargets = (tdee: number, weight: number) => {
    const protein = weight * 1.0;         // 1g per lb
    const fat = weight * 0.4;             // 0.4g per lb
    const proteinCal = protein * 4;
    const fatCal = fat * 9;
    const remainingCal = tdee - (proteinCal + fatCal);
    const carbs = remainingCal / 4;       // 4 cal per gram

    return {
        protein: Math.round(protein),
        fat: Math.round(fat),
        carbs: Math.round(carbs)
    };
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = getSupabaseBrowserClient()

        // Check if user is authenticated
        const { data: authData } = await supabase.auth.getUser()

        if (!authData.user) {
          router.push("/")
          return
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        setUserProfile(profile)

        // Get today's date in ISO format (YYYY-MM-DD)
        const todayDate = new Date().toISOString().split("T")[0]

        // Check if diary entry exists for today
        let diaryId
        const { data: diaryData, error: diaryError } = await supabase
          .from("diary_entries")
          .select("*")
          .eq("user_id", authData.user.id)
          .eq("date", todayDate)
          .single()

        if (diaryError && diaryError.code !== "PGRST116") {
          // PGRST116 is "no rows returned"
          throw diaryError
        }

        if (!diaryData) {
          // Create diary entry for today
          const { data: newDiary, error: newDiaryError } = await supabase
            .from("diary_entries")
            .insert({
              user_id: authData.user.id,
              date: todayDate,
            })
            .select()
            .single()

          if (newDiaryError) {
            throw newDiaryError
          }

          diaryId = newDiary.id
        } else {
          diaryId = diaryData.id
        }

        // Get food entries for today
        const { data: foodEntries, error: foodError } = await supabase
          .from("food_entries")
          .select("*")
          .eq("diary_id", diaryId)

        if (foodError) {
          throw foodError
        }

        setTodayEntries(foodEntries || [])

        // Calculate nutrition totals
        if (foodEntries && foodEntries.length > 0) {
          const totals = foodEntries.reduce(
            (acc, entry) => {
              return {
                calories: acc.calories + entry.calories,
                protein: acc.protein + (entry.protein || 0),
                carbs: acc.carbs + (entry.carbs || 0),
                fat: acc.fat + (entry.fat || 0),
              }
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
          )

          setNutrition(totals)
        }

        // Get weight history
        const { data: weightEntries, error: weightError } = await supabase
          .from("diary_entries")
          .select("date, weight")
          .eq("user_id", authData.user.id)
          .not("weight", "is", null)
          .order("date", { ascending: true })

        if (weightError) {
          throw weightError
        }

        setWeightHistory(weightEntries || [])

        // Calculate streak data (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - i)
          return date.toISOString().split("T")[0]
        }).reverse()

        // Get diary entries for the last 7 days
        const { data: diaryEntries, error: streakError } = await supabase
          .from("diary_entries")
          .select("date, id")
          .eq("user_id", authData.user.id)
          .in("date", last7Days)

        if (streakError) {
          throw streakError
        }

        // Get food entries for these diary entries
        const diaryIds = diaryEntries?.map((entry) => entry.id) || []

        const { data: streakFoodEntries, error: streakFoodError } = await supabase
          .from("food_entries")
          .select("diary_id")
          .in("diary_id", diaryIds)

        if (streakFoodError) {
          throw streakFoodError
        }

        // Create a set of diary IDs that have food entries
        const diaryIdsWithFood = new Set(streakFoodEntries?.map((entry) => entry.diary_id))

        // Map diary entries to dates with food
        const diaryDatesWithFood = new Set(
          diaryEntries?.filter((entry) => diaryIdsWithFood.has(entry.id)).map((entry) => entry.date),
        )

        // Create streak data
        const streak = last7Days.map((date) => ({
          date,
          logged: diaryDatesWithFood.has(date),
        }))

        setStreakData(streak)
      } catch (error: any) {
        console.error("Error fetching data:", error)
        setError(error.message || "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-primary">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button asChild>
            <Link href="/">Return to Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-destructive mb-4">User profile not found</p>
          <Button asChild>
            <Link href="/tdee-quiz">Complete Your Profile</Link>
          </Button>
        </div>
      </div>
    )
  }

  const macroTargets = calculateMacroTargets(userProfile.tdee, userProfile.weight)
  const caloriesRemaining = userProfile.tdee - nutrition.calories
  const caloriesPercentage = Math.min(100, Math.round((nutrition.calories / userProfile.tdee) * 100))
  const proteinPercentage = Math.min(100, Math.round((nutrition.protein / macroTargets.protein) * 100))
  const carbsPercentage = Math.min(100, Math.round((nutrition.carbs / macroTargets.carbs) * 100))
  const fatPercentage = Math.min(100, Math.round((nutrition.fat / macroTargets.fat) * 100))

  // Prepare weight chart data
  const weightChartData = {
    labels: weightHistory.map((entry) => {
      const date = new Date(entry.date)
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }),
    datasets: [
      {
        label: "Weight (lbs)",
        data: weightHistory.map((entry) => entry.weight),
        borderColor: "#FFD200",
        backgroundColor: "rgba(255, 210, 0, 0.2)",
        tension: 0.3,
      },
    ],
  }

  // Prepare streak chart data
  const streakChartData = {
    labels: streakData.map((day) => {
      const date = new Date(day.date)
      return date.toLocaleDateString("en-US", { weekday: "short" })
    }),
    datasets: [
      {
        label: "Food Logged",
        data: streakData.map((day) => (day.logged ? 1 : 0)),
        backgroundColor: streakData.map((day) => (day.logged ? "#4CAF50" : "#E53935")),
        borderColor: streakData.map((day) => (day.logged ? "#4CAF50" : "#E53935")),
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <AppHeader />

      <main className="flex-1 container py-6">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Welcome, {userProfile.name}</h1>
            <p className="text-muted-foreground">{today}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {/* Calories Progress Circle */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-center">Calories</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 mb-2">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold">{caloriesRemaining}</div>
                  </div>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className={`${
                        caloriesPercentage > 90
                          ? "text-green-500"
                          : caloriesPercentage > 50
                            ? "text-primary"
                            : "text-red-600"
                      } stroke-current`}
                      strokeWidth="10"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${(caloriesPercentage * 251.2) / 100} 251.2`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {nutrition.calories} / {userProfile.tdee}
                  </p>
                  <p className="text-xs text-muted-foreground">remaining</p>
                </div>
              </CardContent>
            </Card>

            {/* Protein Progress Circle */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-center">Protein</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 mb-2">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold">{proteinPercentage}%</div>
                  </div>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-blue-500 stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${(proteinPercentage * 251.2) / 100} 251.2`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {Math.round(nutrition.protein)}g / {macroTargets.protein}g
                  </p>
                  <p className="text-xs text-muted-foreground">35% of calories</p>
                </div>
              </CardContent>
            </Card>

            {/* Carbs Progress Circle */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-center">Carbs</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 mb-2">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold">{carbsPercentage}%</div>
                  </div>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-yellow-500 stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${(carbsPercentage * 251.2) / 100} 251.2`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {Math.round(nutrition.carbs)}g / {macroTargets.carbs}g
                  </p>
                  <p className="text-xs text-muted-foreground">40% of calories</p>
                </div>
              </CardContent>
            </Card>

            {/* Fat Progress Circle */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-center">Fat</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 mb-2">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold">{fatPercentage}%</div>
                  </div>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="10"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-purple-500 stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${(fatPercentage * 251.2) / 100} 251.2`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {Math.round(nutrition.fat)}g / {macroTargets.fat}g
                  </p>
                  <p className="text-xs text-muted-foreground">25% of calories</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="h-auto py-4 flex flex-col gap-2">
              <Link href="/diary">
                <CalendarDays className="h-8 w-8 mb-1" />
                <span className="text-lg font-medium">View Diary</span>
              </Link>
            </Button>

            <Button asChild className="h-auto py-4 flex flex-col gap-2">
              <Link href="/log-food">
                <Utensils className="h-8 w-8 mb-1" />
                <span className="text-lg font-medium">Log Food</span>
              </Link>
            </Button>

            <Button asChild className="h-auto py-4 flex flex-col gap-2">
              <Link href="/log-weight">
                <Weight className="h-8 w-8 mb-1" />
                <span className="text-lg font-medium">Log Weight</span>
              </Link>
            </Button>

            <Button asChild className="h-auto py-4 flex flex-col gap-2">
              <Link href="/settings">
                <Settings className="h-8 w-8 mb-1" />
                <span className="text-lg font-medium">Settings</span>
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Streak Chart */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Weekly Logging Streak</CardTitle>
                <CardDescription>Your food logging activity for the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {streakData.length > 0 ? (
                    <div className="h-full">
                      <div className="flex justify-between mb-2">
                        {streakData.map((day, index) => (
                          <div key={index} className="text-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                                day.logged ? "bg-green-500" : "bg-red-600"
                              }`}
                            >
                              {day.logged ? "✓" : "✗"}
                            </div>
                            <div className="text-xs">
                              {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <p className="text-center text-sm mb-2">
                          You've logged food on {streakData.filter((day) => day.logged).length} of the last 7 days
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No streak data available yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Weight Chart */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Weight Progress</CardTitle>
                <CardDescription>Your weight tracking over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {weightHistory.length > 0 ? (
                    <Line
                      data={weightChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: false,
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No weight data available yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest nutrition tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {todayEntries.length > 0 ? (
                <div className="space-y-4">
                  {todayEntries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                        <span>
                          Logged {entry.meal_type}: {entry.name}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No activity logged today</p>
                  <Button className="mt-4" asChild>
                    <Link href="/log-food">Log Your First Meal</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
