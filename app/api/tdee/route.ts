import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = auth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { age, sex, heightFt, heightIn, weight, activityLevel } = await request.json()

    if (!age || !sex || !heightFt || !heightIn || !weight || !activityLevel) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Calculate TDEE
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

    const tdee = Math.round(bmr * activityMultiplier)

    // Update user with new TDEE and physical information
    const updatedUser = db.updateUser(user.id, {
      tdee,
      weight: Number(weight),
      height: { feet: Number(heightFt), inches: Number(heightIn) },
      activityLevel,
    })

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ tdee })
  } catch (error) {
    console.error("Calculate TDEE error:", error)
    return NextResponse.json({ error: "An error occurred while calculating TDEE" }, { status: 500 })
  }
}
