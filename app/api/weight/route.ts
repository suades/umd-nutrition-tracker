import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const user = auth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const weightEntries = db.getWeightEntries(user.id)

    return NextResponse.json({ weightEntries })
  } catch (error) {
    console.error("Get weight entries error:", error)
    return NextResponse.json({ error: "An error occurred while fetching weight entries" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = auth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { weight } = await request.json()

    if (!weight) {
      return NextResponse.json({ error: "Weight is required" }, { status: 400 })
    }

    const newWeightEntry = db.createWeightEntry({
      userId: user.id,
      weight: Number(weight),
      date: new Date(),
    })

    return NextResponse.json({ weightEntry: newWeightEntry })
  } catch (error) {
    console.error("Create weight entry error:", error)
    return NextResponse.json({ error: "An error occurred while creating weight entry" }, { status: 500 })
  }
}
