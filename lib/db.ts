// This is a simple in-memory database for demonstration purposes
// In a real application, you would use a proper database like MongoDB, PostgreSQL, or Supabase

// Types
export type User = {
  id: string
  name: string
  email: string
  password: string // In a real app, this would be hashed
  height: { feet: number; inches: number }
  weight: number
  activityLevel: string
  tdee: number
  createdAt: Date
}

export type FoodEntry = {
  id: string
  userId: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSize: string
  mealType: "breakfast" | "lunch" | "dinner"
  date: Date
}

export type WeightEntry = {
  id: string
  userId: string
  weight: number
  date: Date
}

// In-memory database
const users: User[] = [
  {
    id: "1",
    name: "Testudo Terp",
    email: "testudo@umd.edu",
    password: "password123", // This would be hashed in a real app
    height: { feet: 5, inches: 10 },
    weight: 165,
    activityLevel: "active",
    tdee: 2500,
    createdAt: new Date(),
  },
]

const foodEntries: FoodEntry[] = [
  {
    id: "1",
    userId: "1",
    name: "Oatmeal with berries",
    calories: 320,
    protein: 12,
    carbs: 45,
    fat: 8,
    servingSize: "1 cup",
    mealType: "breakfast",
    date: new Date(),
  },
  {
    id: "2",
    userId: "1",
    name: "Greek yogurt",
    calories: 150,
    protein: 15,
    carbs: 8,
    fat: 5,
    servingSize: "6 oz",
    mealType: "breakfast",
    date: new Date(),
  },
  {
    id: "3",
    userId: "1",
    name: "Grilled chicken sandwich",
    calories: 450,
    protein: 35,
    carbs: 40,
    fat: 15,
    servingSize: "1 sandwich",
    mealType: "lunch",
    date: new Date(),
  },
  {
    id: "4",
    userId: "1",
    name: "Side salad",
    calories: 120,
    protein: 3,
    carbs: 10,
    fat: 7,
    servingSize: "1 bowl",
    mealType: "lunch",
    date: new Date(),
  },
  {
    id: "5",
    userId: "1",
    name: "Salmon fillet",
    calories: 350,
    protein: 40,
    carbs: 0,
    fat: 20,
    servingSize: "6 oz",
    mealType: "dinner",
    date: new Date(),
  },
  {
    id: "6",
    userId: "1",
    name: "Roasted vegetables",
    calories: 180,
    protein: 5,
    carbs: 25,
    fat: 7,
    servingSize: "1 cup",
    mealType: "dinner",
    date: new Date(),
  },
  {
    id: "7",
    userId: "1",
    name: "Brown rice",
    calories: 220,
    protein: 5,
    carbs: 45,
    fat: 2,
    servingSize: "1 cup",
    mealType: "dinner",
    date: new Date(),
  },
]

const weightEntries: WeightEntry[] = [
  {
    id: "1",
    userId: "1",
    weight: 168,
    date: new Date("2025-04-10"),
  },
  {
    id: "2",
    userId: "1",
    weight: 169,
    date: new Date("2025-04-08"),
  },
  {
    id: "3",
    userId: "1",
    weight: 170,
    date: new Date("2025-04-05"),
  },
  {
    id: "4",
    userId: "1",
    weight: 171,
    date: new Date("2025-04-02"),
  },
  {
    id: "5",
    userId: "1",
    weight: 172,
    date: new Date("2025-03-30"),
  },
]

// Database functions
export const db = {
  // User functions
  getUser: (id: string) => {
    return users.find((user) => user.id === id) || null
  },

  getUserByEmail: (email: string) => {
    return users.find((user) => user.email === email) || null
  },

  createUser: (userData: Omit<User, "id" | "createdAt">) => {
    const newUser: User = {
      ...userData,
      id: (users.length + 1).toString(),
      createdAt: new Date(),
    }
    users.push(newUser)
    return newUser
  },

  updateUser: (id: string, userData: Partial<User>) => {
    const userIndex = users.findIndex((user) => user.id === id)
    if (userIndex === -1) return null

    users[userIndex] = { ...users[userIndex], ...userData }
    return users[userIndex]
  },

  // Food entry functions
  getFoodEntries: (userId: string, date?: Date) => {
    let entries = foodEntries.filter((entry) => entry.userId === userId)

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      entries = entries.filter((entry) => entry.date >= startOfDay && entry.date <= endOfDay)
    }

    return entries
  },

  getFoodEntriesByMeal: (userId: string, mealType: "breakfast" | "lunch" | "dinner", date?: Date) => {
    let entries = foodEntries.filter((entry) => entry.userId === userId && entry.mealType === mealType)

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      entries = entries.filter((entry) => entry.date >= startOfDay && entry.date <= endOfDay)
    }

    return entries
  },

  createFoodEntry: (entryData: Omit<FoodEntry, "id">) => {
    const newEntry: FoodEntry = {
      ...entryData,
      id: (foodEntries.length + 1).toString(),
    }
    foodEntries.push(newEntry)
    return newEntry
  },

  deleteFoodEntry: (id: string) => {
    const entryIndex = foodEntries.findIndex((entry) => entry.id === id)
    if (entryIndex === -1) return false

    foodEntries.splice(entryIndex, 1)
    return true
  },

  // Weight entry functions
  getWeightEntries: (userId: string) => {
    return weightEntries.filter((entry) => entry.userId === userId).sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date descending
  },

  createWeightEntry: (entryData: Omit<WeightEntry, "id">) => {
    const newEntry: WeightEntry = {
      ...entryData,
      id: (weightEntries.length + 1).toString(),
    }
    weightEntries.push(newEntry)
    return newEntry
  },
}
