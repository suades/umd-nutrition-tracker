import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = auth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const mealType = searchParams.get("mealType") as "breakfast" | "lunch" | "dinner" | null
    const dateParam = searchParams.get("date")

    let date: Date | undefined
    if (dateParam) {
      date = new Date(dateParam)
    }

    let foodEntries
    if (mealType) {
      foodEntries = db.getFoodEntriesByMeal(user.id, mealType, date)
    } else {
      foodEntries = db.getFoodEntries(user.id, date)
    }

    return NextResponse.json({ foodEntries })
  } catch (error) {
    console.error("Get food entries error:", error)
    return NextResponse.json({ error: "An error occurred while fetching food entries" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = auth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const foodData = await request.json()

    if (!foodData.name || !foodData.mealType) {
      return NextResponse.json({ error: "Food name and meal type are required" }, { status: 400 })
    }

    const newFoodEntry = db.createFoodEntry({
      ...foodData,
      userId: user.id,
      date: new Date(),
    })

    return NextResponse.json({ foodEntry: newFoodEntry })
  } catch (error) {
    console.error("Create food entry error:", error)
    return NextResponse.json({ error: "An error occurred while creating food entry" }, { status: 500 })
  }
}
