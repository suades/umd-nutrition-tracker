"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { format, addDays, subDays } from "date-fns"

type FoodEntry = {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: "breakfast" | "lunch" | "dinner"
  serving_size: string
}

export default function DiaryPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [mealData, setMealData] = useState<{
    breakfast: FoodEntry[]
    lunch: FoodEntry[]
    dinner: FoodEntry[]
  }>({
    breakfast: [],
    lunch: [],
    dinner: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [diaryId, setDiaryId] = useState<string | null>(null)

  const fetchFoodEntries = async (date: Date) => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()

      // Check if user is authenticated
      const { data: authData } = await supabase.auth.getUser()

      if (!authData.user) {
        router.push("/")
        return
      }

      // Format date as ISO string (YYYY-MM-DD)
      const formattedDate = format(date, "yyyy-MM-dd")

      // Check if diary entry exists for the selected date
      const { data: diaryData, error: diaryError } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("user_id", authData.user.id)
        .eq("date", formattedDate)
        .single()

      if (diaryError && diaryError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        throw diaryError
      }

      let currentDiaryId = null

      if (!diaryData) {
        // Create diary entry for the selected date
        const { data: newDiary, error: newDiaryError } = await supabase
          .from("diary_entries")
          .insert({
            user_id: authData.user.id,
            date: formattedDate,
          })
          .select()
          .single()

        if (newDiaryError) {
          throw newDiaryError
        }

        currentDiaryId = newDiary.id
      } else {
        currentDiaryId = diaryData.id
      }

      setDiaryId(currentDiaryId)

      // Get food entries for the diary
      const { data: foodEntries, error: foodError } = await supabase
        .from("food_entries")
        .select("*")
        .eq("diary_id", currentDiaryId)

      if (foodError) {
        throw foodError
      }

      // Organize entries by meal type
      const breakfast = foodEntries?.filter((entry) => entry.meal_type === "breakfast") || []
      const lunch = foodEntries?.filter((entry) => entry.meal_type === "lunch") || []
      const dinner = foodEntries?.filter((entry) => entry.meal_type === "dinner") || []

      setMealData({ breakfast, lunch, dinner })
    } catch (error: any) {
      setError(error.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFoodEntries(selectedDate)
  }, [router, selectedDate])

  const removeFood = async (foodId: string) => {
    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.from("food_entries").delete().eq("id", foodId)

      if (error) {
        throw error
      }

      // Update local state after successful deletion
      setMealData({
        breakfast: mealData.breakfast.filter((food) => food.id !== foodId),
        lunch: mealData.lunch.filter((food) => food.id !== foodId),
        dinner: mealData.dinner.filter((food) => food.id !== foodId),
      })
    } catch (error: any) {
      setError(error.message || "Failed to delete food entry")
    }
  }

  const calculateTotals = (mealType: "breakfast" | "lunch" | "dinner") => {
    return mealData[mealType].reduce(
      (acc, food) => {
        return {
          calories: acc.calories + food.calories,
          protein: acc.protein + (food.protein || 0),
          carbs: acc.carbs + (food.carbs || 0),
          fat: acc.fat + (food.fat || 0),
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }

  const calculateDailyTotals = () => {
    const breakfast = calculateTotals("breakfast")
    const lunch = calculateTotals("lunch")
    const dinner = calculateTotals("dinner")

    return {
      calories: breakfast.calories + lunch.calories + dinner.calories,
      protein: breakfast.protein + lunch.protein + dinner.protein,
      carbs: breakfast.carbs + lunch.carbs + dinner.carbs,
      fat: breakfast.fat + lunch.fat + dinner.fat,
    }
  }

  const dailyTotals = calculateDailyTotals()

  const handlePreviousDay = () => {
    setSelectedDate((current) => subDays(current, 1))
  }

  const handleNextDay = () => {
    const tomorrow = addDays(new Date(), 1)
    // Don't allow selecting future dates
    if (selectedDate < tomorrow) {
      setSelectedDate((current) => addDays(current, 1))
    }
  }

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

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
          <h1 className="text-2xl font-bold">My Daily Diary</h1>
        </div>

        {error && <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
            {isToday && " (Today)"}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextDay} disabled={isToday}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="breakfast">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
            <TabsTrigger value="lunch">Lunch</TabsTrigger>
            <TabsTrigger value="dinner">Dinner</TabsTrigger>
          </TabsList>

          <TabsContent value="breakfast" className="mt-4">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Breakfast</CardTitle>
                <CardDescription>Morning meal items</CardDescription>
              </CardHeader>
              <CardContent>
                {mealData.breakfast.length > 0 ? (
                  <div className="space-y-4">
                    {mealData.breakfast.map((food) => (
                      <div key={food.id} className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div>
                          <p className="font-medium">{food.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {food.calories} cal • {Math.round(food.protein)}g protein • {Math.round(food.carbs)}g carbs
                            • {Math.round(food.fat)}g fat
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFood(food.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))}

                    <div className="mt-4 pt-2 border-t border-border/40">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>{Math.round(calculateTotals("breakfast").calories)} calories</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Macros</span>
                        <span>
                          {Math.round(calculateTotals("breakfast").protein)}g protein •{" "}
                          {Math.round(calculateTotals("breakfast").carbs)}g carbs •{" "}
                          {Math.round(calculateTotals("breakfast").fat)}g fat
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No breakfast items logged yet</p>
                    <Button className="mt-4" asChild>
                      <Link href={`/log-food?meal=breakfast`}>Log Breakfast</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
              {mealData.breakfast.length > 0 && (
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/log-food?meal=breakfast`}>Add More to Breakfast</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="lunch" className="mt-4">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Lunch</CardTitle>
                <CardDescription>Midday meal items</CardDescription>
              </CardHeader>
              <CardContent>
                {mealData.lunch.length > 0 ? (
                  <div className="space-y-4">
                    {mealData.lunch.map((food) => (
                      <div key={food.id} className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div>
                          <p className="font-medium">{food.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {food.calories} cal • {Math.round(food.protein)}g protein • {Math.round(food.carbs)}g carbs
                            • {Math.round(food.fat)}g fat
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFood(food.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))}

                    <div className="mt-4 pt-2 border-t border-border/40">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>{Math.round(calculateTotals("lunch").calories)} calories</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Macros</span>
                        <span>
                          {Math.round(calculateTotals("lunch").protein)}g protein •{" "}
                          {Math.round(calculateTotals("lunch").carbs)}g carbs •
                          {Math.round(calculateTotals("lunch").fat)}g fat
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No lunch items logged yet</p>
                    <Button className="mt-4" asChild>
                      <Link href={`/log-food?meal=lunch`}>Log Lunch</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
              {mealData.lunch.length > 0 && (
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/log-food?meal=lunch`}>Add More to Lunch</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="dinner" className="mt-4">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Dinner</CardTitle>
                <CardDescription>Evening meal items</CardDescription>
              </CardHeader>
              <CardContent>
                {mealData.dinner.length > 0 ? (
                  <div className="space-y-4">
                    {mealData.dinner.map((food) => (
                      <div key={food.id} className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div>
                          <p className="font-medium">{food.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {food.calories} cal • {Math.round(food.protein)}g protein • {Math.round(food.carbs)}g carbs
                            • {Math.round(food.fat)}g fat
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFood(food.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))}

                    <div className="mt-4 pt-2 border-t border-border/40">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>{Math.round(calculateTotals("dinner").calories)} calories</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Macros</span>
                        <span>
                          {Math.round(calculateTotals("dinner").protein)}g protein •{" "}
                          {Math.round(calculateTotals("dinner").carbs)}g carbs •
                          {Math.round(calculateTotals("dinner").fat)}g fat
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No dinner items logged yet</p>
                    <Button className="mt-4" asChild>
                      <Link href={`/log-food?meal=dinner`}>Log Dinner</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
              {mealData.dinner.length > 0 && (
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/log-food?meal=dinner`}>Add More to Dinner</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6 border-primary/20">
          <CardHeader>
            <CardTitle>Daily Totals</CardTitle>
            <CardDescription>Your nutrition summary for {format(selectedDate, "MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">{Math.round(dailyTotals.calories)}</p>
                <p className="text-sm text-muted-foreground">Calories</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{Math.round(dailyTotals.protein)}g</p>
                <p className="text-sm text-muted-foreground">Protein</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{Math.round(dailyTotals.carbs)}g</p>
                <p className="text-sm text-muted-foreground">Carbs</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{Math.round(dailyTotals.fat)}g</p>
                <p className="text-sm text-muted-foreground">Fat</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
