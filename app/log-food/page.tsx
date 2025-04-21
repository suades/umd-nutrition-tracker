"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Search, Filter, X, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import debounce from "lodash.debounce"

type Food = {
  id: number
  name: string
  dining_hall: string
  calories_per_serving: number
  protein: number
  total_carbohydrates: number
  total_fat: number
  serving_size: string
  nutrition_url?: string
}

type CustomMeal = {
  id: string
  name: string
  user_id: string
  foods: number[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
}

const ITEMS_PER_PAGE = 10

export default function LogFoodPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mealParam = searchParams.get("meal")

  const [selectedMeal, setSelectedMeal] = useState(mealParam || "breakfast")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [addedFood, setAddedFood] = useState<null | { name: string; meal: string }>(null)
  const [error, setError] = useState("")
  const [foods, setFoods] = useState<Food[]>([])
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [diningHalls, setDiningHalls] = useState<string[]>([])
  const [selectedDiningHall, setSelectedDiningHall] = useState<string | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [displayedItems, setDisplayedItems] = useState<(Food | (CustomMeal & { isCustomMeal: boolean }))[]>([])

  // Filter states
  const [showFilters, setShowFilters] = useState(false)
  const [maxCalories, setMaxCalories] = useState(1000)
  const [maxFat, setMaxFat] = useState(50)
  const [maxCarbs, setMaxCarbs] = useState(100)
  const [showCustomMeals, setShowCustomMeals] = useState(true)

  // Debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedSearchQuery(query)
      setPage(1) // Reset to first page on new search
      setIsSearching(false)
    }, 300),
    [],
  )

  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true)
      debouncedSearch(searchQuery)
    }
  }, [searchQuery, debouncedSearch, debouncedSearchQuery])

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const supabase = getSupabaseBrowserClient()

        // Check if user is authenticated
        const { data: authData } = await supabase.auth.getUser()

        if (!authData.user) {
          router.push("/")
          return
        }

        // Fetch foods from the database
        const { data: foodsData, error: foodsError } = await supabase.from("foods").select("*").order("name")

        if (foodsError) {
          throw foodsError
        }

        setFoods(foodsData || [])

        // Extract unique dining halls
        const uniqueDiningHalls = Array.from(new Set(foodsData?.map((food) => food.dining_hall).filter(Boolean)))
        setDiningHalls(uniqueDiningHalls as string[])

        // Fetch custom meals
        const { data: mealsData, error: mealsError } = await supabase
          .from("custom_meals")
          .select("*")
          .eq("user_id", authData.user.id)

        if (mealsError) {
          throw mealsError
        }

        setCustomMeals(mealsData || [])
      } catch (error: any) {
        setError(error.message || "Failed to fetch foods")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFoods()
  }, [router])

  // Filter and paginate items
  useEffect(() => {
    // Filter foods based on search query and filters
    const filteredFoods = foods.filter((food) => {
      // Apply search query
      const matchesSearch =
        debouncedSearchQuery === "" ||
        food.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (food.dining_hall && food.dining_hall.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))

      // Apply dining hall filter
      const matchesDiningHall =
        !selectedDiningHall ||
        selectedDiningHall === "all" ||
        food.dining_hall?.toLowerCase() === selectedDiningHall?.toLowerCase()

      // Apply numeric filters
      const matchesCalories = food.calories_per_serving <= maxCalories
      const matchesFat = food.total_fat <= maxFat
      const matchesCarbs = food.total_carbohydrates <= maxCarbs

      return matchesSearch && matchesDiningHall && matchesCalories && matchesFat && matchesCarbs
    })

    // Filter custom meals based on search query
    const filteredCustomMeals = customMeals.filter((meal) => {
      if (!showCustomMeals) return false

      // Apply search query
      const matchesSearch =
        debouncedSearchQuery === "" || meal.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())

      // Apply numeric filters
      const matchesCalories = meal.total_calories <= maxCalories
      const matchesFat = meal.total_fat <= maxFat
      const matchesCarbs = meal.total_carbs <= maxCarbs

      return matchesSearch && matchesCalories && matchesFat && matchesCarbs
    })

    // Combine filtered foods and custom meals
    const allFilteredItems = [
      ...filteredCustomMeals.map((meal) => ({ ...meal, isCustomMeal: true })),
      ...filteredFoods.map((food) => ({ ...food, isCustomMeal: false })),
    ]

    // Paginate results
    const paginatedItems = allFilteredItems.slice(0, page * ITEMS_PER_PAGE)
    setDisplayedItems(paginatedItems)
    setHasMore(paginatedItems.length < allFilteredItems.length)
  }, [
    debouncedSearchQuery,
    selectedDiningHall,
    maxCalories,
    maxFat,
    maxCarbs,
    showCustomMeals,
    foods,
    customMeals,
    page,
  ])

  const loadMore = () => {
    setPage((prevPage) => prevPage + 1)
  }

  const handleAddFood = async (food: Food | CustomMeal, isCustomMeal = false) => {
    try {
      const supabase = getSupabaseBrowserClient()

      // Get current user
      const { data: authData } = await supabase.auth.getUser()

      if (!authData.user) {
        router.push("/")
        return
      }

      // Get today's date in ISO format (YYYY-MM-DD)
      const todayDate = new Date().toISOString().split("T")[0]

      // Check if diary entry exists for today
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

      let diaryId

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

      // Add food entry
      const { error: foodError } = await supabase.from("food_entries").insert({
        diary_id: diaryId,
        name: food.name,
        calories: isCustomMeal ? (food as CustomMeal).total_calories : (food as Food).calories_per_serving,
        protein: isCustomMeal ? (food as CustomMeal).total_protein : (food as Food).protein,
        carbs: isCustomMeal ? (food as CustomMeal).total_carbs : (food as Food).total_carbohydrates,
        fat: isCustomMeal ? (food as CustomMeal).total_fat : (food as Food).total_fat,
        serving_size: isCustomMeal ? "1 meal" : (food as Food).serving_size,
        meal_type: selectedMeal,
      })

      if (foodError) {
        throw foodError
      }

      setAddedFood({
        name: food.name,
        meal: selectedMeal === "breakfast" ? "Breakfast" : selectedMeal === "lunch" ? "Lunch" : "Dinner",
      })
      setShowConfirmation(true)

      // Auto-close after 2 seconds
      setTimeout(() => {
        setShowConfirmation(false)
      }, 2000)
    } catch (error: any) {
      setError(error.message || "Failed to add food")
    }
  }

  const openNutritionPage = (url?: string) => {
    if (url) {
      window.open(url, "_blank")
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
          <h1 className="text-2xl font-bold">Log Food to Meal</h1>
        </div>

        {error && <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <CardTitle>Select Meal</CardTitle>
            <CardDescription>Choose which meal you want to add food to</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedMeal} onValueChange={setSelectedMeal}>
              <SelectTrigger>
                <SelectValue placeholder="Select meal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Search Foods</CardTitle>
                <CardDescription>Find foods to add to your {selectedMeal}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={selectedDiningHall || ""} onValueChange={setSelectedDiningHall}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Dining Halls" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dining Halls</SelectItem>
                    {diningHalls.map((hall) => (
                      <SelectItem key={hall} value={hall}>
                        {hall}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Foods</SheetTitle>
                      <SheetDescription>Set maximum values for calories and macronutrients</SheetDescription>
                    </SheetHeader>
                    <div className="py-4 space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Max Calories: {maxCalories}</Label>
                          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setMaxCalories(1000)}>
                            Reset
                          </Button>
                        </div>
                        <Slider
                          value={[maxCalories]}
                          min={0}
                          max={1000}
                          step={50}
                          onValueChange={(value) => setMaxCalories(value[0])}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Max Fat (g): {maxFat}</Label>
                          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setMaxFat(50)}>
                            Reset
                          </Button>
                        </div>
                        <Slider
                          value={[maxFat]}
                          min={0}
                          max={50}
                          step={5}
                          onValueChange={(value) => setMaxFat(value[0])}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Max Carbs (g): {maxCarbs}</Label>
                          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setMaxCarbs(100)}>
                            Reset
                          </Button>
                        </div>
                        <Slider
                          value={[maxCarbs]}
                          min={0}
                          max={100}
                          step={10}
                          onValueChange={(value) => setMaxCarbs(value[0])}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="show-custom-meals"
                          checked={showCustomMeals}
                          onCheckedChange={(checked) => setShowCustomMeals(checked === true)}
                        />
                        <Label htmlFor="show-custom-meals">Show custom meals</Label>
                      </div>
                    </div>
                    <div className="flex justify-between mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setMaxCalories(1000)
                          setMaxFat(50)
                          setMaxCarbs(100)
                          setShowCustomMeals(true)
                        }}
                      >
                        Reset All
                      </Button>
                      <Button onClick={() => setShowFilters(false)}>Apply Filters</Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or dining hall..."
                className="pl-10 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isSearching ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Searching...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedItems.length > 0 ? (
                  <>
                    {displayedItems.map((item) => (
                      <Card
                        key={item.id}
                        className="overflow-hidden cursor-pointer"
                        onClick={() => {
                          if (!item.isCustomMeal && (item as Food).nutrition_url) {
                            openNutritionPage((item as Food).nutrition_url)
                          }
                        }}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium flex items-center">
                                {item.name}
                                {item.isCustomMeal ? (
                                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                    Custom Meal
                                  </span>
                                ) : (
                                  !item.isCustomMeal &&
                                  (item as Food).nutrition_url && (
                                    <ExternalLink className="ml-2 h-3 w-3 text-muted-foreground" />
                                  )
                                )}
                              </h3>
                              {!item.isCustomMeal && (
                                <p className="text-sm text-muted-foreground">
                                  {(item as Food).dining_hall || "Unknown Location"} • {(item as Food).serving_size}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddFood(item, item.isCustomMeal)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          <div className="mt-2 grid grid-cols-4 gap-2 text-center text-sm">
                            <div>
                              <p className="font-medium">
                                {item.isCustomMeal
                                  ? (item as CustomMeal).total_calories
                                  : (item as Food).calories_per_serving}
                              </p>
                              <p className="text-xs text-muted-foreground">calories</p>
                            </div>
                            <div>
                              <p className="font-medium">
                                {item.isCustomMeal
                                  ? (item as CustomMeal).total_protein.toFixed(1)
                                  : (item as Food).protein.toFixed(1)}
                                g
                              </p>
                              <p className="text-xs text-muted-foreground">protein</p>
                            </div>
                            <div>
                              <p className="font-medium">
                                {item.isCustomMeal
                                  ? (item as CustomMeal).total_carbs.toFixed(1)
                                  : (item as Food).total_carbohydrates.toFixed(1)}
                                g
                              </p>
                              <p className="text-xs text-muted-foreground">carbs</p>
                            </div>
                            <div>
                              <p className="font-medium">
                                {item.isCustomMeal
                                  ? (item as CustomMeal).total_fat.toFixed(1)
                                  : (item as Food).total_fat.toFixed(1)}
                                g
                              </p>
                              <p className="text-xs text-muted-foreground">fat</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {hasMore && (
                      <div className="flex justify-center pt-4">
                        <Button onClick={loadMore} variant="outline">
                          Load More
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No foods found matching your search</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/diary">View My Diary</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Food Added!</DialogTitle>
            <DialogDescription>
              {addedFood?.name} has been added to your {addedFood?.meal}.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
