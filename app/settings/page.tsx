"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, LogOut, Plus, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import debounce from "lodash.debounce"

type UserProfile = {
  id: string
  name: string
  email: string
  height_feet: number
  height_inches: number
  weight: number
  activity_level: string
  tdee: number
}

type Food = {
  id: number
  name: string
  dining_hall: string
  calories_per_serving: number
  protein: number
  total_carbohydrates: number
  total_fat: number
  serving_size: string
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

export default function SettingsPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Custom meal states
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([])
  const [showCreateMeal, setShowCreateMeal] = useState(false)
  const [newMealName, setNewMealName] = useState("")
  const [availableFoods, setAvailableFoods] = useState<Food[]>([])
  const [selectedFoods, setSelectedFoods] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [editingMeal, setEditingMeal] = useState<CustomMeal | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Pagination for food selection
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [displayedFoods, setDisplayedFoods] = useState<Food[]>([])

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

        // Get user email
        const { data: userData } = await supabase.auth.getUser()

        setUserData({
          ...profile,
          email: userData.user?.email || "",
        })

        // Fetch custom meals
        const { data: mealsData, error: mealsError } = await supabase
          .from("custom_meals")
          .select("*")
          .eq("user_id", authData.user.id)

        if (mealsError) {
          throw mealsError
        }

        setCustomMeals(mealsData || [])

        // Fetch available foods
        const { data: foodsData, error: foodsError } = await supabase.from("foods").select("*").order("name")

        if (foodsError) {
          throw foodsError
        }

        setAvailableFoods(foodsData || [])
      } catch (error: any) {
        setError(error.message || "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  // Filter and paginate foods
  useEffect(() => {
    // Filter foods based on search query
    const filteredFoods = availableFoods.filter(
      (food) =>
        food.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (food.dining_hall && food.dining_hall.toLowerCase().includes(debouncedSearchQuery.toLowerCase())),
    )

    // Calculate total pages
    const calculatedTotalPages = Math.ceil(filteredFoods.length / ITEMS_PER_PAGE)
    setTotalPages(calculatedTotalPages || 1)

    // Ensure current page is valid
    const validPage = Math.min(page, calculatedTotalPages || 1)
    if (validPage !== page) {
      setPage(validPage)
    }

    // Get foods for current page
    const startIndex = (validPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    setDisplayedFoods(filteredFoods.slice(startIndex, endIndex))
  }, [availableFoods, debouncedSearchQuery, page])

  const handleUpdateUser = async () => {
    if (!userData) return

    setIsSaving(true)
    setSuccessMessage("")
    setError("")

    try {
      const supabase = getSupabaseBrowserClient()

      // Update user profile
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          name: userData.name,
          height_feet: userData.height_feet,
          height_inches: userData.height_inches,
          weight: userData.weight,
          activity_level: userData.activity_level,
        })
        .eq("id", userData.id)

      if (updateError) {
        throw updateError
      }

      setSuccessMessage("Profile updated successfully")

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    } catch (error: any) {
      setError(error.message || "Failed to update user data")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      router.push("/")
    } catch (error: any) {
      setError(error.message || "Failed to logout")
    }
  }

  const handleCreateMeal = async () => {
    if (!newMealName || selectedFoods.length === 0) return

    setIsSaving(true)
    setError("")

    try {
      const supabase = getSupabaseBrowserClient()

      // Calculate meal totals
      const selectedFoodItems = availableFoods.filter((food) => selectedFoods.includes(food.id))
      const totalCalories = selectedFoodItems.reduce((sum, food) => sum + food.calories_per_serving, 0)
      const totalProtein = selectedFoodItems.reduce((sum, food) => sum + food.protein, 0)
      const totalCarbs = selectedFoodItems.reduce((sum, food) => sum + food.total_carbohydrates, 0)
      const totalFat = selectedFoodItems.reduce((sum, food) => sum + food.total_fat, 0)

      if (editingMeal) {
        // Update existing meal
        const { error: updateError } = await supabase
          .from("custom_meals")
          .update({
            name: newMealName,
            foods: selectedFoods,
            total_calories: totalCalories,
            total_protein: totalProtein,
            total_carbs: totalCarbs,
            total_fat: totalFat,
          })
          .eq("id", editingMeal.id)

        if (updateError) {
          throw updateError
        }

        // Refresh custom meals list
        const { data: updatedMeals, error: refreshError } = await supabase
          .from("custom_meals")
          .select("*")
          .eq("user_id", userData.id)

        if (refreshError) {
          throw refreshError
        }

        setCustomMeals(updatedMeals || [])
      } else {
        // Create new meal
        const { error: createError } = await supabase.from("custom_meals").insert({
          name: newMealName,
          user_id: userData.id,
          foods: selectedFoods,
          total_calories: totalCalories,
          total_protein: totalProtein,
          total_carbs: totalCarbs,
          total_fat: totalFat,
        })

        if (createError) {
          throw createError
        }

        // Refresh custom meals list
        const { data: updatedMeals, error: refreshError } = await supabase
          .from("custom_meals")
          .select("*")
          .eq("user_id", userData.id)

        if (refreshError) {
          throw refreshError
        }

        setCustomMeals(updatedMeals || [])
      }

      // Reset form
      setNewMealName("")
      setSelectedFoods([])
      setShowCreateMeal(false)
      setEditingMeal(null)
    } catch (error: any) {
      setError(error.message || "Failed to create custom meal")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMeal = async (mealId: string) => {
    try {
      const supabase = getSupabaseBrowserClient()

      const { error: deleteError } = await supabase.from("custom_meals").delete().eq("id", mealId)

      if (deleteError) {
        throw deleteError
      }

      // Update local state
      setCustomMeals(customMeals.filter((meal) => meal.id !== mealId))
    } catch (error: any) {
      setError(error.message || "Failed to delete custom meal")
    }
  }

  const handleEditMeal = (meal: CustomMeal) => {
    setEditingMeal(meal)
    setNewMealName(meal.name)
    setSelectedFoods(meal.foods)
    setShowCreateMeal(true)
    setPage(1) // Reset to first page when editing
  }

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-primary">Loading...</p>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-destructive mb-4">User not found</p>
          <Button asChild>
            <Link href="/">Return to Login</Link>
          </Button>
        </div>
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
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {error && <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

        {successMessage && <div className="mb-6 p-4 bg-green-500/10 text-green-500 rounded-md">{successMessage}</div>}

        <div className="grid gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={userData.email} disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <Button onClick={handleUpdateUser} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Physical Information</CardTitle>
              <CardDescription>Update your physical details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="height-ft">Height (ft)</Label>
                    <Input
                      id="height-ft"
                      type="number"
                      value={userData.height_feet}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          height_feet: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="height-in">Height (in)</Label>
                    <Input
                      id="height-in"
                      type="number"
                      value={userData.height_inches}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          height_inches: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={userData.weight}
                    onChange={(e) => setUserData({ ...userData, weight: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="activity">Activity Level</Label>
                  <Select
                    value={userData.activity_level}
                    onValueChange={(value) => setUserData({ ...userData, activity_level: value })}
                  >
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
                <Button onClick={handleUpdateUser} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/tdee-quiz">Recalculate TDEE</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Custom Meals</CardTitle>
                <CardDescription>Create and manage your custom meals</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingMeal(null)
                  setNewMealName("")
                  setSelectedFoods([])
                  setShowCreateMeal(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Meal
              </Button>
            </CardHeader>
            <CardContent>
              {customMeals.length > 0 ? (
                <div className="space-y-4">
                  {customMeals.map((meal) => (
                    <div key={meal.id} className="flex items-start justify-between border-b border-border/40 pb-4">
                      <div>
                        <h3 className="font-medium">{meal.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {meal.total_calories} calories • {Math.round(meal.total_protein)}g protein •
                          {Math.round(meal.total_carbs)}g carbs • {Math.round(meal.total_fat)}g fat
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{meal.foods.length} food items</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditMeal(meal)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMeal(meal.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No custom meals created yet</p>
                  <Button className="mt-4" onClick={() => setShowCreateMeal(true)}>
                    Create Your First Meal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={showCreateMeal} onOpenChange={setShowCreateMeal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingMeal ? "Edit Custom Meal" : "Create Custom Meal"}</DialogTitle>
            <DialogDescription>
              {editingMeal
                ? "Edit your custom meal by selecting foods from the list below."
                : "Create a custom meal by selecting foods from the list below."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="meal-name">Meal Name</Label>
              <Input
                id="meal-name"
                value={newMealName}
                onChange={(e) => setNewMealName(e.target.value)}
                placeholder="Enter a name for your meal"
              />
            </div>

            <div className="grid gap-2">
              <Label>Selected Foods ({selectedFoods.length})</Label>
              {selectedFoods.length > 0 ? (
                <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                  <ul className="space-y-1">
                    {selectedFoods.map((foodId) => {
                      const food = availableFoods.find((f) => f.id === foodId)
                      return food ? (
                        <li key={food.id} className="flex justify-between items-center text-sm">
                          <span>{food.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setSelectedFoods(selectedFoods.filter((id) => id !== foodId))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </li>
                      ) : null
                    })}
                  </ul>
                </div>
              ) : (
                <div className="border rounded-md p-2 text-center text-muted-foreground text-sm">No foods selected</div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Search Foods</Label>
              <Input
                placeholder="Search by name or dining hall..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Available Foods</Label>
              <ScrollArea className="h-60 border rounded-md p-2">
                {isSearching ? (
                  <div className="text-center py-4 text-muted-foreground">Searching...</div>
                ) : displayedFoods.length > 0 ? (
                  <div className="space-y-2">
                    {displayedFoods.map((food) => (
                      <div key={food.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`food-${food.id}`}
                          checked={selectedFoods.includes(food.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFoods([...selectedFoods, food.id])
                            } else {
                              setSelectedFoods(selectedFoods.filter((id) => id !== food.id))
                            }
                          }}
                        />
                        <Label htmlFor={`food-${food.id}`} className="text-sm flex-1">
                          <div>{food.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {food.dining_hall} • {food.calories_per_serving} cal
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No foods found matching your search</div>
                )}
              </ScrollArea>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-2">
                  <Button variant="outline" size="sm" onClick={prevPage} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={nextPage} disabled={page === totalPages}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateMeal(false)
                setEditingMeal(null)
                setNewMealName("")
                setSelectedFoods([])
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateMeal} disabled={!newMealName || selectedFoods.length === 0 || isSaving}>
              {isSaving ? "Saving..." : editingMeal ? "Update Meal" : "Create Meal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
